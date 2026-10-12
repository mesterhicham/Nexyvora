const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const app = require('../../server');
const db = require('../../config/db');
const { makeRequest } = require('./test_http_client');

async function runAuthTests() {
    console.log('\n======================================================');
    console.log('   TEST SUITE 1: AUTHENTICATION & RECOVERY (REAL HTTP) ');
    console.log('======================================================');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const testEmail = `real_test_${Date.now()}@nexyvora.com`;
    const testPassword = 'Password123!';
    let createdUserId = null;
    let originalSecret = process.env.ADMIN_SETUP_SECRET;

    try {
        // -------------------------------------------------------------
        // 1. Setup First Admin Protection Test (P0 #1)
        // -------------------------------------------------------------
        console.log('\n--- 1. Testing /api/auth/setup-first-admin ---');

        // 1a. Missing Secret -> Expect 403 Forbidden
        delete process.env.ADMIN_SETUP_SECRET;
        const resMissingSecret = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/setup-first-admin'
        }, {
            email: 'admin@nexyvora.com',
            password: 'AdminPassword123!'
        });
        assert.strictEqual(
            resMissingSecret.statusCode,
            403,
            `Expected 403 when ADMIN_SETUP_SECRET is not configured on server (got ${resMissingSecret.statusCode})`
        );
        console.log('  [PASS] 1a. Request rejected (403) when ADMIN_SETUP_SECRET is missing from server env');

        // 1b. Secret configured on server, but client provides wrong secret -> Expect 403
        process.env.ADMIN_SETUP_SECRET = 'SuperSecretSetupKey2026!';
        const resWrongSecret = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/setup-first-admin'
        }, {
            email: 'admin@nexyvora.com',
            password: 'AdminPassword123!',
            setup_secret: 'WrongSecretKey'
        });
        assert.strictEqual(
            resWrongSecret.statusCode,
            403,
            `Expected 403 with invalid setup_secret (got ${resWrongSecret.statusCode})`
        );
        console.log('  [PASS] 1b. Request rejected (403) when client sends wrong setup_secret');

        // 1c. Client sends correct secret, but admins already exist in DB -> Expect 403 (Already configured)
        const [existingAdmins] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
        if (existingAdmins[0].count > 0) {
            const resAdminExists = await makeRequest(server, {
                method: 'POST',
                path: '/api/auth/setup-first-admin'
            }, {
                email: 'admin_duplicate@nexyvora.com',
                password: 'AdminPassword123!',
                setup_secret: 'SuperSecretSetupKey2026!'
            });
            assert.strictEqual(
                resAdminExists.statusCode,
                403,
                `Expected 403 because admin account already exists (got ${resAdminExists.statusCode})`
            );
            console.log('  [PASS] 1c. Setup rejected (403) because platform admin is already initialized in DB');
        }

        // -------------------------------------------------------------
        // 2. Real HTTP Registration & Transaction Test (P1 #5)
        // -------------------------------------------------------------
        console.log('\n--- 2. Testing /api/auth/register (Atomic Transaction) ---');
        const resRegister = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/register'
        }, {
            fullName: 'Audit Tester',
            email: testEmail,
            password: testPassword,
            role: 'student'
        });

        console.log('Register response:', resRegister.statusCode, resRegister.body);
        assert.strictEqual(resRegister.statusCode, 201, `Expected 201 on registration (got ${resRegister.statusCode}: ${resRegister.body})`);
        assert.strictEqual(resRegister.json.success, true, 'Registration returned success: true');
        createdUserId = resRegister.json.user.id;
        assert.ok(createdUserId, 'Registration returned valid user ID');

        // Verify user and wallet were both committed in DB
        const [userRow] = await db.query('SELECT * FROM users WHERE id = ?', [createdUserId]);
        assert.strictEqual(userRow.length, 1, 'User row created in DB');
        assert.strictEqual(userRow[0].email, testEmail, 'User email matches');

        const [walletRow] = await db.query('SELECT * FROM user_wallets WHERE user_id = ?', [createdUserId]);
        assert.strictEqual(walletRow.length, 1, 'User wallet row created atomically in DB');
        console.log('  [PASS] 2. Registration committed both User & Wallet atomically');

        // -------------------------------------------------------------
        // 3. Real HTTP Login & Token Version Test
        // -------------------------------------------------------------
        console.log('\n--- 3. Testing /api/auth/login & Session Verification ---');
        const resLogin = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/login'
        }, {
            email: testEmail,
            password: testPassword
        });

        assert.strictEqual(resLogin.statusCode, 200, `Expected 200 on login (got ${resLogin.statusCode})`);
        const token = resLogin.json.token;
        assert.ok(token, 'Login returned valid JWT token');
        console.log('  [PASS] 3a. User login returned valid JWT token');

        // Access protected route with token
        const resProfile = await makeRequest(server, {
            method: 'GET',
            path: '/api/user/profile',
            headers: { Authorization: `Bearer ${token}` }
        });
        assert.strictEqual(resProfile.statusCode, 200, `Expected 200 accessing /profile with token (got ${resProfile.statusCode})`);
        console.log('  [PASS] 3b. Authenticated request succeeded via JWT');

        // Session invalidation: Increment token_version in DB
        await db.query('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [createdUserId]);
        const resProfileAfterRevoke = await makeRequest(server, {
            method: 'GET',
            path: '/api/user/profile',
            headers: { Authorization: `Bearer ${token}` }
        });
        assert.strictEqual(
            resProfileAfterRevoke.statusCode,
            401,
            `Expected 401 after token_version revocation (got ${resProfileAfterRevoke.statusCode})`
        );
        console.log('  [PASS] 3c. Stale JWT immediately revoked upon token_version increment');

        // -------------------------------------------------------------
        // 4. Forgot Password & OTP Hashing Test (P0 #2)
        // -------------------------------------------------------------
        console.log('\n--- 4. Testing OTP Hashing & Password Reset ---');
        // 4a. Forgot Password non-existent email -> Returns generic 200 (prevents enumeration)
        const resForgotNonExistent = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/forgot-password-otp'
        }, {
            email: 'nonexistent_account_audit@nexyvora.com'
        });
        assert.strictEqual(
            resForgotNonExistent.statusCode,
            200,
            `Expected 200 generic message on non-existent email to prevent enumeration (got ${resForgotNonExistent.statusCode})`
        );
        console.log('  [PASS] 4a. Forgot password returns uniform 200 response to prevent email enumeration');

        // 4b. Forgot Password for real email -> Inspect DB verification_otps
        const resForgotReal = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/forgot-password-otp'
        }, {
            email: testEmail
        });
        assert.strictEqual(resForgotReal.statusCode, 200, 'Expected 200 for real email forgot password');

        const [otpRows] = await db.query(
            'SELECT * FROM verification_otps WHERE identifier = ? ORDER BY created_at DESC LIMIT 1',
            [testEmail]
        );
        assert.ok(otpRows.length > 0, 'OTP entry inserted in verification_otps');
        const storedCode = otpRows[0].code;
        // Verify SHA-256 hash length (64 hex characters) and that it's NOT a cleartext 6-digit number
        assert.strictEqual(storedCode.length, 64, `Stored OTP must be a 64-char SHA-256 hash (got ${storedCode.length})`);
        assert.strictEqual(/^\d{4,6}$/.test(storedCode), false, 'Stored OTP code must NOT be stored in cleartext digits');
        console.log('  [PASS] 4b. OTP code stored as a 64-character SHA-256 hash in database');

        console.log('\n>>> ALL AUTHENTICATION & RECOVERY TESTS PASSED! <<<\n');
        return true;
    } finally {
        // Cleanup
        if (originalSecret !== undefined) {
            process.env.ADMIN_SETUP_SECRET = originalSecret;
        } else {
            delete process.env.ADMIN_SETUP_SECRET;
        }

        if (createdUserId) {
            await db.query('DELETE FROM verification_otps WHERE identifier = ?', [testEmail]).catch(() => {});
            await db.query('DELETE FROM user_wallets WHERE user_id = ?', [createdUserId]).catch(() => {});
            await db.query('DELETE FROM users WHERE id = ?', [createdUserId]).catch(() => {});
        }

        await new Promise((resolve) => server.close(resolve));
    }
}

if (require.main === module) {
    runAuthTests().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runAuthTests;
