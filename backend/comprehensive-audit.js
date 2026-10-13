const db = require('./config/db');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5001/api';

async function runAudit() {
    console.log('====================================================');
    console.log('       NEXYVORA FULL SYSTEM AUDIT & API TEST        ');
    console.log('====================================================\n');

    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;

    function assert(condition, testName, details = '') {
        totalTests++;
        if (condition) {
            passedTests++;
            console.log(`  [PASS] ${testName}`);
        } else {
            failedTests++;
            console.error(`  [FAIL] ${testName} -> ${details}`);
        }
    }

    try {
        // ── 1. Database Connection & Table Verification ──
        console.log('\n--- 1. DATABASE & SCHEMA INTEGRITY ---');
        const [dbCheck] = await db.query('SELECT 1 + 1 AS result');
        assert(dbCheck[0].result === 2, 'MySQL connection responsive');

        const [tables] = await db.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log(`  Found ${tableNames.length} tables in nexyvora database.`);

        const requiredTables = [
            'users', 'user_roles', 'profiles', 'user_wallets', 'packages', 'user_packages',
            'commissions', 'transactions', 'withdrawal_requests', 'platform_settings',
            'email_settings', 'email_templates', 'formations', 'formation_enrollments'
        ];

        for (const tbl of requiredTables) {
            assert(tableNames.includes(tbl), `Table '${tbl}' exists in database`);
        }

        // ── 2. Public API Endpoints ──
        console.log('\n--- 2. PUBLIC API ENDPOINTS ---');
        const healthRes = await fetch(`${API_BASE}/health`);
        const healthJson = await healthRes.json();
        assert(healthRes.status === 200 && healthJson.status === 'ok', 'GET /api/health returns 200 OK');

        const settingsRes = await fetch(`${API_BASE}/admin/settings`);
        const settingsJson = await settingsRes.json();
        assert(settingsRes.status === 200 && typeof settingsJson === 'object', 'GET /api/admin/settings returns 200 OK');

        const packagesRes = await fetch(`${API_BASE}/packages`);
        const packagesJson = await packagesRes.json();
        assert(packagesRes.status === 200 && Array.isArray(packagesJson.packages), 'GET /api/packages returns packages array');
        console.log(`  Available packages: ${packagesJson.packages?.length || 0}`);

        // ── 3. Sponsor Setup & Student Registration with Referral ──
        console.log('\n--- 3. AUTHENTICATION & REFERRAL SYSTEM ---');
        // Check or create a sponsor
        let [sponsorRows] = await db.query('SELECT id, affiliate_code FROM users WHERE affiliate_code IS NOT NULL LIMIT 1');
        let sponsorCode = sponsorRows[0]?.affiliate_code;
        let sponsorId = sponsorRows[0]?.id;

        // Ensure sponsor has an active package with unlocked generations
        const [topPack] = await db.query('SELECT id FROM packages ORDER BY level DESC LIMIT 1');
        if (topPack.length > 0 && sponsorId) {
            const [hasPack] = await db.query('SELECT id FROM user_packages WHERE user_id = ? AND status = "active"', [sponsorId]);
            if (hasPack.length === 0) {
                await db.query(`
                    INSERT INTO user_packages (id, user_id, package_id, amount_paid, payment_method, status, is_current)
                    VALUES (UUID(), ?, ?, 100, 'wallet', 'active', 1)
                `, [sponsorId, topPack[0].id]);
            }
        }

        const testEmail = `audit_student_${Date.now()}@example.com`;
        const testPassword = 'Password123!';

        const regRes = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword,
                fullName: 'Audit Test Student',
                role: 'student',
                referralCode: sponsorCode,
            })
        });
        const regJson = await regRes.json();
        assert(regRes.status === 201, 'POST /api/auth/register creates new student', JSON.stringify(regJson));

        // Verify DB insertion for the new user
        const [userInDb] = await db.query('SELECT * FROM users WHERE email = ?', [testEmail]);
        assert(userInDb.length > 0, 'New user inserted into `users` table');
        const studentUserId = userInDb[0]?.id;
        assert(userInDb[0]?.referrer_id === sponsorId, 'Referrer ID correctly linked in `users` table');

        const [profileInDb] = await db.query('SELECT * FROM profiles WHERE id = ?', [studentUserId]);
        assert(profileInDb.length > 0, 'Profile created in `profiles` table');

        const [walletInDb] = await db.query('SELECT * FROM user_wallets WHERE user_id = ?', [studentUserId]);
        assert(walletInDb.length > 0, 'Initial wallet created in `user_wallets` table');

        // Test Login
        const loginRes = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: testPassword })
        });
        const loginJson = await loginRes.json();
        assert(loginRes.status === 200 && !!loginJson.token, 'POST /api/auth/login returns valid JWT token');
        const studentToken = loginJson.token;

        // ── 4. Student Wallet, Deposit & Withdrawal Operations ──
        console.log('\n--- 4. STUDENT WALLET & FINANCIAL OPERATIONS ---');
        const walletRes = await fetch(`${API_BASE}/affiliate/wallet`, {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        const walletJson = await walletRes.json();
        assert(walletRes.status === 200 && typeof walletJson.wallet === 'object', 'GET /api/affiliate/wallet returns 200 OK');

        // Submit a deposit request
        const depositAmount = 100;
        const depositRef = `AUDIT-DEP-${Date.now()}`;
        const depRes = await fetch(`${API_BASE}/affiliate/deposit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${studentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: depositAmount,
                paymentMethod: 'baridimob',
                paymentReference: depositRef,
                receiptUrl: 'https://nexyvora.net/uploads/receipts/audit_test_receipt.jpg',
                notes: 'Automated deposit audit test'
            })
        });
        const depJson = await depRes.json();
        assert(depRes.status === 201, 'POST /api/affiliate/deposit submits deposit request', JSON.stringify(depJson));

        // Verify deposit in DB transactions table
        const [depInDb] = await db.query('SELECT * FROM transactions WHERE reference_id = ? OR JSON_EXTRACT(metadata, "$.paymentReference") = ?', [depositRef, depositRef]);
        assert(depInDb.length > 0 && depInDb[0].status === 'pending', 'Deposit recorded in `transactions` database table with status pending');
        const depositTxId = depInDb[0]?.id;

        // ── 5. Admin Controls & Deposit Approval ──
        console.log('\n--- 5. ADMIN CONTROLS & OPERATIONS ---');
        const [adminRows] = await db.query(`
            SELECT u.id, u.email 
            FROM users u
            JOIN user_roles ur ON u.id = ur.user_id
            WHERE ur.role = 'admin' OR u.role = 'admin'
            LIMIT 1
        `);

        let adminToken = null;
        let adminUser = adminRows[0];
        if (adminUser) {
            adminToken = jwt.sign({ id: adminUser.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
            console.log(`  Identified Admin user: ${adminUser.email}`);
        } else {
            const adminId = require('crypto').randomUUID();
            await db.query(`INSERT INTO users (id, email, password, role) VALUES (?, 'admin_audit@example.com', 'dummy', 'admin')`, [adminId]);
            await db.query(`INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')`, [require('crypto').randomUUID(), adminId]);
            adminToken = jwt.sign({ id: adminId, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        }

        // Admin approves deposit
        const approveDepRes = await fetch(`${API_BASE}/admin/deposits/${depositTxId}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const approveDepJson = await approveDepRes.json();
        assert(approveDepRes.status === 200, 'POST /api/admin/deposits/:id/approve successfully approves deposit', JSON.stringify(approveDepJson));

        // Verify DB update: wallet balance credited
        const [updatedWallet] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentUserId]);
        assert(Number(updatedWallet[0]?.balance) >= depositAmount, `Student wallet balance credited to $${updatedWallet[0]?.balance}`);

        // ── 6. Package Purchase & Affiliate Commission Engine ──
        console.log('\n--- 6. PACKAGE PURCHASE & COMMISSION ENGINE ---');
        const [targetPackage] = await db.query('SELECT * FROM packages WHERE price <= 100 ORDER BY price ASC LIMIT 1');
        if (targetPackage.length > 0) {
            const pkg = targetPackage[0];
            const purchaseRes = await fetch(`${API_BASE}/packages/purchase`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${studentToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    packageId: pkg.id,
                    paymentMethod: 'wallet'
                })
            });
            const purchaseJson = await purchaseRes.json();
            assert(purchaseRes.status === 200, `POST /api/packages/purchase buys package '${pkg.name}' with wallet`, JSON.stringify(purchaseJson));

            // Verify user_packages table
            const [userPkg] = await db.query('SELECT * FROM user_packages WHERE user_id = ? AND package_id = ?', [studentUserId, pkg.id]);
            assert(userPkg.length > 0 && userPkg[0].status === 'active', 'Purchased package active in `user_packages` table');

            // Verify commissions table received entries for the referrer/generations
            const [commissions] = await db.query('SELECT * FROM commissions WHERE source_user_id = ?', [studentUserId]);
            assert(commissions.length > 0, `Affiliate engine distributed ${commissions.length} commission(s) in \`commissions\` table`);
        }

        // ── 7. Withdrawal Request & Admin Rejection/Approval ──
        console.log('\n--- 7. WITHDRAWAL LIFECYCLE ---');
        // Give wallet extra balance to test withdrawal
        await db.query('UPDATE user_wallets SET balance = 120.00 WHERE user_id = ?', [studentUserId]);

        const withdrawAmount = 55;
        const withRes = await fetch(`${API_BASE}/affiliate/withdraw`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${studentToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: withdrawAmount,
                paymentMethod: 'bank_transfer',
                paymentDetails: 'DZ5400799999000123456789 IBAN'
            })
        });
        const withJson = await withRes.json();
        assert(withRes.status === 201, 'POST /api/affiliate/withdraw submits withdrawal request', JSON.stringify(withJson));

        const [withInDb] = await db.query('SELECT * FROM withdrawal_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [studentUserId]);
        assert(withInDb.length > 0 && withInDb[0].status === 'pending', 'Withdrawal request recorded in `withdrawal_requests`');
        const withReqId = withInDb[0]?.id;

        // Admin checks and rejects withdrawal (or tests status update)
        const rejectWithRes = await fetch(`${API_BASE}/admin/withdrawals/${withReqId}/reject`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${adminToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reason: 'Audit automated test rejection - refund' })
        });
        assert(rejectWithRes.status === 200, 'POST /api/admin/withdrawals/:id/reject functions properly');

        // Verify withdrawal status in DB
        const [rejectedWith] = await db.query('SELECT status FROM withdrawal_requests WHERE id = ?', [withReqId]);
        assert(rejectedWith[0]?.status === 'rejected', 'Withdrawal status updated to `rejected` in database');

        // ── 8. Team Network & Additional Admin Endpoints ──
        console.log('\n--- 8. TEAM NETWORK & ADDITIONAL ADMIN SERVICES ---');
        const teamRes = await fetch(`${API_BASE}/affiliate/team`, {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        const teamJson = await teamRes.json();
        assert(teamRes.status === 200 && typeof teamJson.generations === 'object', 'GET /api/affiliate/team returns 5-generation data');

        const adminUsersRes = await fetch(`${API_BASE}/admin/users`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const adminUsersJson = await adminUsersRes.json();
        assert(adminUsersRes.status === 200 && Array.isArray(adminUsersJson.users), 'GET /api/admin/users returns users list');

        const emailSettingsRes = await fetch(`${API_BASE}/admin/email/settings`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        assert(emailSettingsRes.status === 200, 'GET /api/admin/email/settings returns 200 OK');

        const emailTemplatesRes = await fetch(`${API_BASE}/admin/email/templates`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const emailTemplatesJson = await emailTemplatesRes.json();
        assert(emailTemplatesRes.status === 200 && Array.isArray(emailTemplatesJson), 'GET /api/admin/email/templates returns templates array');
        console.log(`  Loaded ${emailTemplatesJson.length} email templates from database.`);

        // ── 9. Clean up audit data ──
        await db.query('DELETE FROM commissions WHERE source_user_id = ?', [studentUserId]);
        await db.query('DELETE FROM user_packages WHERE user_id = ?', [studentUserId]);
        await db.query('DELETE FROM withdrawal_requests WHERE user_id = ?', [studentUserId]);
        await db.query('DELETE FROM transactions WHERE user_id = ?', [studentUserId]);
        await db.query('DELETE FROM user_wallets WHERE user_id = ?', [studentUserId]);
        await db.query('DELETE FROM profiles WHERE id = ?', [studentUserId]);
        await db.query('DELETE FROM user_roles WHERE user_id = ?', [studentUserId]);
        await db.query('DELETE FROM students WHERE user_id = ?', [studentUserId]);
        await db.query('DELETE FROM users WHERE id = ?', [studentUserId]);
        console.log('\n  Audit test records cleanly purged from database.');

        // ── 10. Summary ──
        console.log('\n====================================================');
        console.log(`TOTAL TESTS: ${totalTests}`);
        console.log(`PASSED: ${passedTests}`);
        console.log(`FAILED: ${failedTests}`);
        console.log('====================================================\n');

        if (failedTests === 0) {
            console.log('>>> ALL APIS, DATABASE INSERTS, AND WORKFLOWS ARE WORKING 100% PERFECTLY! <<<\n');
            process.exit(0);
        } else {
            console.error('>>> AUDIT ENCOUNTERED ISSUES <<<');
            process.exit(1);
        }
    } catch (err) {
        console.error('[FATAL AUDIT ERROR]', err);
        process.exit(1);
    }
}

runAudit();
