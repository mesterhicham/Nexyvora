const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const db = require('../../config/db');
const { makeRequest } = require('./test_http_client');

async function runWalletSecurityTests() {
    console.log('\n======================================================');
    console.log('   TEST SUITE 3: FINANCIAL & WALLET (REAL HTTP)       ');
    console.log('======================================================');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const testUserId = crypto.randomUUID();
    const adminUserId = crypto.randomUUID();
    const testWalletId = crypto.randomUUID();

    try {
        const userToken = jwt.sign(
            { id: testUserId, role: 'student', token_version: 1 },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const adminToken = jwt.sign(
            { id: adminUserId, role: 'admin', token_version: 1 },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // 1. Create test user and admin with initial wallet balance of $100.00
        await db.query(`
            INSERT INTO users (id, email, password, role, status, token_version, affiliate_code)
            VALUES 
            (?, 'wallet_user@test.com', 'hash', 'student', 'active', 1, ?),
            (?, 'wallet_admin@test.com', 'hash', 'admin', 'active', 1, ?)
        `, [
            testUserId, 'NV' + crypto.randomInt(100000, 999999),
            adminUserId, 'NV' + crypto.randomInt(100000, 999999)
        ]);

        await db.query(`
            INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
            VALUES (?, ?, 100.00, 0.00, 100.00, 0.00)
        `, [testWalletId, testUserId]);
        console.log('  [PASS] 1. Initialized user wallet with $100.00 balance');

        // -------------------------------------------------------------
        // 2. Over-withdrawal protection test via HTTP (P1 #7)
        // -------------------------------------------------------------
        console.log('\n--- 2. Testing Over-withdrawal Protection ---');
        const resOverWithdraw = await makeRequest(server, {
            method: 'POST',
            path: '/api/affiliate/withdraw',
            headers: { Authorization: `Bearer ${userToken}` }
        }, {
            amount: 250.00,
            payment_method: 'USDT',
            payment_details: 'TRC20-TEST-ADDRESS'
        });

        console.log('OverWithdraw response:', resOverWithdraw.statusCode, resOverWithdraw.body);
        assert.strictEqual(
            resOverWithdraw.statusCode,
            400,
            `Expected 400 for over-withdrawal attempt (got ${resOverWithdraw.statusCode})`
        );
        assert.strictEqual(
            resOverWithdraw.json.code,
            'INSUFFICIENT_BALANCE',
            'Expected INSUFFICIENT_BALANCE error code'
        );
        console.log('  [PASS] 2. Over-withdrawal ($250 > $100) strictly rejected with 400 INSUFFICIENT_BALANCE');

        // -------------------------------------------------------------
        // 3. Valid withdrawal request & duplicate rapid-fire guard (P1 #7)
        // -------------------------------------------------------------
        console.log('\n--- 3. Testing Valid Withdrawal & Duplicate Guard ---');
        const resValidWithdraw = await makeRequest(server, {
            method: 'POST',
            path: '/api/affiliate/withdraw',
            headers: { Authorization: `Bearer ${userToken}` }
        }, {
            amount: 60.00,
            payment_method: 'USDT',
            payment_details: 'TRC20-TEST-ADDRESS'
        });

        assert.strictEqual(
            resValidWithdraw.statusCode,
            201,
            `Expected 201 for valid withdrawal (got ${resValidWithdraw.statusCode}: ${resValidWithdraw.body})`
        );
        const withdrawalId = resValidWithdraw.json.withdrawalId || resValidWithdraw.json.withdrawal?.id;
        assert.ok(withdrawalId, 'Withdrawal request created with ID');

        // Verify balance decreased, but total_withdrawn has NOT increased yet (it's pending!)
        const [walletAfterRequest] = await db.query('SELECT balance, total_withdrawn FROM user_wallets WHERE user_id = ?', [testUserId]);
        assert.strictEqual(Number(walletAfterRequest[0].balance), 40.00, 'Balance deducted to $40.00');
        assert.strictEqual(Number(walletAfterRequest[0].total_withdrawn), 0.00, 'total_withdrawn must remain 0 while pending');
        console.log('  [PASS] 3a. Valid withdrawal deducted balance without prematurely inflating total_withdrawn');

        // Test Rapid Duplicate Request (within 10 seconds) -> Expect 409 Conflict
        const resDuplicateWithdraw = await makeRequest(server, {
            method: 'POST',
            path: '/api/affiliate/withdraw',
            headers: { Authorization: `Bearer ${userToken}` }
        }, {
            amount: 20.00,
            payment_method: 'USDT',
            payment_details: 'TRC20-TEST-ADDRESS'
        });

        assert.strictEqual(
            resDuplicateWithdraw.statusCode,
            409,
            `Expected 409 for duplicate request within throttle window (got ${resDuplicateWithdraw.statusCode})`
        );
        console.log('  [PASS] 3b. Duplicate withdrawal request within 10s window rejected with 409 Conflict');

        // -------------------------------------------------------------
        // 4. Admin Approval & Accounting Test
        // -------------------------------------------------------------
        console.log('\n--- 4. Testing Admin Approval & Accounting Accuracy ---');
        const resApprove = await makeRequest(server, {
            method: 'POST',
            path: `/api/admin/withdrawals/${withdrawalId}/approve`,
            headers: { Authorization: `Bearer ${adminToken}` }
        }, {});

        assert.strictEqual(
            resApprove.statusCode,
            200,
            `Expected 200 on admin approval (got ${resApprove.statusCode}: ${resApprove.body})`
        );

        // Verify total_withdrawn is now updated upon approval
        const [walletAfterApproval] = await db.query('SELECT balance, total_withdrawn FROM user_wallets WHERE user_id = ?', [testUserId]);
        assert.strictEqual(Number(walletAfterApproval[0].balance), 40.00, 'Balance remains $40.00');
        assert.strictEqual(Number(walletAfterApproval[0].total_withdrawn), 60.00, 'total_withdrawn increased to $60.00 upon approval');
        console.log('  [PASS] 4. Admin approval successfully updated total_withdrawn to $60.00');

        console.log('\n>>> ALL FINANCIAL & WALLET TESTS PASSED! <<<\n');
        return true;
    } finally {
        await db.query('DELETE FROM withdrawal_requests WHERE user_id = ?', [testUserId]).catch(() => {});
        await db.query('DELETE FROM user_wallets WHERE user_id = ?', [testUserId]).catch(() => {});
        await db.query('DELETE FROM users WHERE id IN (?, ?)', [testUserId, adminUserId]).catch(() => {});
        await new Promise((resolve) => server.close(resolve));
    }
}

if (require.main === module) {
    runWalletSecurityTests().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runWalletSecurityTests;
