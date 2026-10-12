#!/usr/bin/env node
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function main() {
    const args = process.argv.slice(2);
    const email = args[0];
    const password = args[1];

    if (!email) {
        console.log('====================================================');
        console.log('   NEXYVORA CLI: Admin Setup Utility                ');
        console.log('====================================================');
        console.log('Usage:');
        console.log('  Promote existing user to admin:');
        console.log('    node backend/scripts/setup-admin.js <email>');
        console.log('  Create new admin user:');
        console.log('    node backend/scripts/setup-admin.js <email> <password>');
        console.log('====================================================');
        process.exit(1);
    }

    try {
        const cleanEmail = email.trim().toLowerCase();
        const [users] = await db.query('SELECT id, role FROM users WHERE email = ?', [cleanEmail]);

        if (users.length > 0) {
            const user = users[0];
            await db.query("UPDATE users SET role = 'admin', status = 'active' WHERE id = ?", [user.id]);
            await db.query(
                "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin') ON DUPLICATE KEY UPDATE role = 'admin'",
                [crypto.randomUUID(), user.id]
            );
            console.log(`[SUCCESS] User ${cleanEmail} has been promoted to administrator.`);
            process.exit(0);
        } else {
            if (!password || password.length < 8) {
                console.error('[ERROR] User does not exist. To create a new admin, provide a password (minimum 8 characters).');
                process.exit(1);
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const userId = crypto.randomUUID();
            const affiliateCode = 'NV' + crypto.randomInt(100000, 1000000);

            // Create user
            await db.query(
                `INSERT INTO users (id, email, password, role, affiliate_code, status, affiliate_status, affiliate_enabled)
                 VALUES (?, ?, ?, 'admin', ?, 'active', 'active', 1)`,
                [userId, cleanEmail, hashedPassword, affiliateCode]
            );

            // User roles
            await db.query(
                "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')",
                [crypto.randomUUID(), userId]
            );

            // Profile
            await db.query(
                "INSERT INTO profiles (id, email, full_name) VALUES (?, ?, ?)",
                [userId, cleanEmail, 'System Administrator']
            );

            // Wallet
            await db.query(
                "INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn) VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)",
                [crypto.randomUUID(), userId]
            );

            console.log(`[SUCCESS] New admin account created successfully for: ${cleanEmail}`);
            process.exit(0);
        }
    } catch (err) {
        console.error('[FAILED] Could not setup admin:', err.message);
        process.exit(1);
    }
}

main();
