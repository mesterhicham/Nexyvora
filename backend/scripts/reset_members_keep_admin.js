#!/usr/bin/env node
/**
 * Script: reset_members_keep_admin.js
 * Description: Safely deletes all non-admin members and their associated data,
 * freeing up emails so members can register anew. Preserves the admin account
 * and ensures the admin has a valid affiliate code for new referrals.
 */

const db = require('../config/db');

async function resetMembers() {
    console.log('====================================================');
    console.log('   NEXYVORA: Reset Members & Retain Admin Only      ');
    console.log('====================================================');

    const connection = await db.getConnection();
    try {
        // 1. Fetch Admin Accounts
        const [admins] = await connection.query(
            "SELECT id, email, role, affiliate_code FROM users WHERE role = 'admin'"
        );

        if (admins.length === 0) {
            throw new Error('No administrator account found! Aborting deletion for safety.');
        }

        const admin = admins[0];
        const adminId = admin.id;
        const adminEmail = admin.email;
        console.log(`[INFO] Admin account identified: ${adminEmail} (ID: ${adminId})`);

        // 2. Ensure Admin has an Affiliate Code (so new registrations can use it)
        let adminAffiliateCode = admin.affiliate_code;
        if (!adminAffiliateCode || adminAffiliateCode === 'NULL') {
            adminAffiliateCode = 'NV100000';
            await connection.query(
                `UPDATE users 
                 SET affiliate_code = ?, affiliate_status = 'active', affiliate_enabled = 1, referrer_id = NULL 
                 WHERE id = ?`,
                [adminAffiliateCode, adminId]
            );
            console.log(`[INFO] Assigned affiliate code to admin: ${adminAffiliateCode}`);
        } else {
            await connection.query(
                `UPDATE users SET referrer_id = NULL WHERE id = ?`,
                [adminId]
            );
        }

        // Ensure Admin has a profile
        const [adminProfile] = await connection.query(
            "SELECT id FROM profiles WHERE id = ?",
            [adminId]
        );
        if (adminProfile.length === 0) {
            await connection.query(
                `INSERT INTO profiles (id, full_name, city, country, whatsapp_number)
                 VALUES (?, 'Nexyvora Administration', 'Casablanca', 'Morocco', '+212600000000')`,
                [adminId]
            );
            console.log('[INFO] Created default profile for admin.');
        }

        // Ensure Admin has a wallet
        const [adminWallet] = await connection.query(
            "SELECT id FROM user_wallets WHERE user_id = ?",
            [adminId]
        );
        if (adminWallet.length === 0) {
            const crypto = require('crypto');
            await connection.query(
                `INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                 VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)`,
                [crypto.randomUUID(), adminId]
            );
            console.log('[INFO] Initialized admin wallet.');
        }

        // 3. Count non-admin members before deletion
        const [countRes] = await connection.query(
            "SELECT COUNT(*) as total FROM users WHERE role != 'admin' AND id != ?",
            [adminId]
        );
        const membersToDelete = countRes[0].total;
        console.log(`[INFO] Found ${membersToDelete} non-admin members to delete.`);

        if (membersToDelete === 0) {
            console.log('[NOTICE] No non-admin members to delete. Database is already clean!');
        } else {
            // 4. Perform cascade deletion with FOREIGN_KEY_CHECKS disabled
            console.log('[ACTION] Beginning clean deletion of user-related data...');
            await connection.query('SET FOREIGN_KEY_CHECKS = 0');

            const tablesWithUserId = [
                { table: 'user_wallets', col: 'user_id' },
                { table: 'user_packages', col: 'user_id' },
                { table: 'user_payout_settings', col: 'user_id' },
                { table: 'user_kyc', col: 'user_id' },
                { table: 'user_roles', col: 'user_id' },
                { table: 'students', col: 'user_id' },
                { table: 'teachers', col: 'user_id' },
                { table: 'formation_enrollments', col: 'user_id' },
                { table: 'formation_payments', col: 'user_id' },
                { table: 'formation_progress', col: 'user_id' },
                { table: 'formation_quiz_attempts', col: 'user_id' },
                { table: 'payments', col: 'user_id' },
                { table: 'payment_attempts', col: 'user_id' },
                { table: 'transactions', col: 'user_id' },
                { table: 'withdrawal_requests', col: 'user_id' },
                { table: 'community_comments', col: 'user_id' },
                { table: 'community_likes', col: 'user_id' },
                { table: 'community_posts', col: 'author_id' },
                { table: 'notifications', col: 'user_id' },
                { table: 'support_tickets', col: 'user_id' },
                { table: 'support_messages', col: 'user_id' },
                { table: 'meeting_attendance', col: 'user_id' },
                { table: 'student_test_results', col: 'student_id' },
                { table: 'promised_packages', col: 'user_id' },
                { table: 'leader_achievers', col: 'user_id' },
                { table: 'founder_members', col: 'user_id' },
                { table: 'founder_payouts', col: 'user_id' },
                { table: 'conversation_participants', col: 'user_id' },
                { table: 'messages', col: 'sender_id' },
                { table: 'profiles', col: 'id' }
            ];

            for (const item of tablesWithUserId) {
                try {
                    const [delRes] = await connection.query(
                        `DELETE FROM ${item.table} WHERE ${item.col} != ?`,
                        [adminId]
                    );
                    if (delRes.affectedRows > 0) {
                        console.log(`  - Cleaned ${delRes.affectedRows} records from [${item.table}]`);
                    }
                } catch (err) {
                    // If table doesn't exist or column doesn't match, log and proceed
                    console.log(`  - Note on [${item.table}]: ${err.message}`);
                }
            }

            // Clean commissions
            try {
                const [commRes] = await connection.query(
                    `DELETE FROM commissions WHERE user_id != ? OR from_user_id != ?`,
                    [adminId, adminId]
                );
                if (commRes.affectedRows > 0) {
                    console.log(`  - Cleaned ${commRes.affectedRows} records from [commissions]`);
                }
            } catch (err) {
                console.log(`  - Note on [commissions]: ${err.message}`);
            }

            // Clean verification OTPs for non-admin emails
            try {
                const [otpRes] = await connection.query(
                    `DELETE FROM verification_otps WHERE email != ?`,
                    [adminEmail]
                );
                if (otpRes.affectedRows > 0) {
                    console.log(`  - Cleaned ${otpRes.affectedRows} OTPs from [verification_otps]`);
                }
            } catch (err) {
                console.log(`  - Note on [verification_otps]: ${err.message}`);
            }

            // 5. Finally delete users from users table
            const [usersDelRes] = await connection.query(
                `DELETE FROM users WHERE id != ? AND role != 'admin'`,
                [adminId]
            );
            console.log(`  - Successfully deleted ${usersDelRes.affectedRows} non-admin accounts from [users].`);

            await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        }

        // 6. Verification
        const [remainingUsers] = await connection.query(
            "SELECT id, email, role, affiliate_code, status FROM users"
        );
        console.log('====================================================');
        console.log('[SUCCESS] Remaining Users in System:');
        console.table(remainingUsers);
        console.log('====================================================');
        console.log(`All non-admin emails are now completely liberated and ready for fresh registration!`);
        console.log(`Admin Referral Code for new signups: ${adminAffiliateCode}`);

    } catch (error) {
        console.error('[ERROR during reset]:', error);
        throw error;
    } finally {
        connection.release();
        process.exit(0);
    }
}

resetMembers().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
