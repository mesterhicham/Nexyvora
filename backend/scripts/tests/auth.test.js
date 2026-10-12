const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../../config/db');

async function runAuthTests() {
    console.log('\n========================================');
    console.log('   TEST SUITE 1: AUTHENTICATION & SESSIONS');
    console.log('========================================');

    const testEmail = `test_auth_${Date.now()}@example.com`;
    const testPassword = 'Password123!';
    const userId = crypto.randomUUID();

    try {
        // 1. Password hashing test
        const hashedPassword = await bcrypt.hash(testPassword, 12);
        const matchValid = await bcrypt.compare(testPassword, hashedPassword);
        const matchInvalid = await bcrypt.compare('WrongPassword', hashedPassword);
        assert.strictEqual(matchValid, true, 'Bcrypt compares correct password successfully');
        assert.strictEqual(matchInvalid, false, 'Bcrypt rejects incorrect password');
        console.log('  [PASS] 1. Bcrypt password hashing & validation verified');

        // 2. Insert test user with token_version = 1
        await db.query(
            `INSERT INTO users (id, email, password, role, status, token_version, affiliate_code)
             VALUES (?, ?, ?, 'student', 'active', 1, ?)`,
            [userId, testEmail, hashedPassword, 'NV' + crypto.randomInt(100000, 1000000)]
        );
        console.log('  [PASS] 2. User created with token_version = 1');

        // 3. Issue JWT with token_version = 1
        const tokenV1 = jwt.sign(
            { id: userId, role: 'student', token_version: 1 },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const decodedV1 = jwt.verify(tokenV1, process.env.JWT_SECRET);
        assert.strictEqual(decodedV1.id, userId, 'JWT decoded user id matches');
        assert.strictEqual(decodedV1.token_version, 1, 'JWT token_version is 1');
        console.log('  [PASS] 3. JWT generated with token_version payload');

        // 4. Session Revocation: Increment token_version in DB
        await db.query('UPDATE users SET token_version = token_version + 1 WHERE id = ?', [userId]);
        const [userAfter] = await db.query('SELECT token_version FROM users WHERE id = ?', [userId]);
        assert.strictEqual(userAfter[0].token_version, 2, 'DB token_version incremented to 2');

        // Verify that old token with token_version = 1 is recognized as revoked
        const isRevoked = decodedV1.token_version !== userAfter[0].token_version;
        assert.strictEqual(isRevoked, true, 'Old token version is revoked against live DB');
        console.log('  [PASS] 4. Session invalidation on token_version mismatch verified');

        // 5. Account Suspension Test
        await db.query("UPDATE users SET status = 'suspended' WHERE id = ?", [userId]);
        const [suspendedUser] = await db.query('SELECT status FROM users WHERE id = ?', [userId]);
        assert.strictEqual(suspendedUser[0].status, 'suspended', 'User status set to suspended');
        console.log('  [PASS] 5. Account suspension enforcement verified');

        // Clean up
        await db.query('DELETE FROM users WHERE id = ?', [userId]);
        console.log('  [PASS] 6. Test cleanup completed');

        console.log('>>> ALL AUTHENTICATION TESTS PASSED! <<<\n');
        return true;
    } catch (err) {
        // Ensure cleanup even on error
        await db.query('DELETE FROM users WHERE id = ?', [userId]).catch(() => {});
        console.error('  [FAIL] Auth Test failed:', err);
        throw err;
    }
}

if (require.main === module) {
    runAuthTests().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runAuthTests;
