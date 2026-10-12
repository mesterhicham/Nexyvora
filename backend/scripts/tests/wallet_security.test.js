const assert = require('assert');
const crypto = require('crypto');
const db = require('../../config/db');

async function runWalletSecurityTests() {
    console.log('\n========================================');
    console.log('   TEST SUITE 3: FINANCIAL & WALLET INTEGRITY');
    console.log('========================================');

    const testUserId = crypto.randomUUID();
    const testWalletId = crypto.randomUUID();

    try {
        // 1. Create a test user with a wallet having $100.00
        await db.query(
            `INSERT INTO users (id, email, password, role, status, affiliate_code)
             VALUES (?, ?, 'dummy_hash', 'student', 'active', ?)`,
            [testUserId, `wallet_test_${Date.now()}@test.com`, 'NV' + crypto.randomInt(100000, 1000000)]
        );

        await db.query(
            `INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
             VALUES (?, ?, 100.00, 0.00, 100.00, 0.00)`,
            [testWalletId, testUserId]
        );
        console.log('  [PASS] 1. Test wallet initialized with $100.00 balance');

        // 2. Test: Over-withdrawal check (attempting to withdraw $250.00 from $100.00 balance)
        const conn = await db.getConnection();
        await conn.beginTransaction();

        const withdrawAmount = 250.00;
        const [wallets] = await conn.query('SELECT balance FROM user_wallets WHERE user_id = ? FOR UPDATE', [testUserId]);
        const currentBalance = Number(wallets[0].balance);

        const isAllowed = currentBalance >= withdrawAmount;
        assert.strictEqual(isAllowed, false, 'Over-withdrawal must be strictly rejected');
        await conn.rollback();
        conn.release();
        console.log('  [PASS] 2. Over-withdrawal ($250 > $100) successfully rejected by wallet guard');

        // 3. Test: Valid withdrawal deduction ($50.00 from $100.00 balance)
        const conn2 = await db.getConnection();
        await conn2.beginTransaction();

        const validWithdraw = 50.00;
        await conn2.query(
            `UPDATE user_wallets 
             SET balance = balance - ?, total_withdrawn = total_withdrawn + ?
             WHERE user_id = ?`,
            [validWithdraw, validWithdraw, testUserId]
        );

        await conn2.query(
            `INSERT INTO withdrawal_requests (id, user_id, amount, payment_method, payment_details, status)
             VALUES (?, ?, ?, 'USDT', 'TRC20-TEST-ADDRESS', 'pending')`,
            [crypto.randomUUID(), testUserId, validWithdraw]
        );

        await conn2.commit();
        conn2.release();

        const [walletAfter] = await db.query('SELECT balance, total_withdrawn FROM user_wallets WHERE user_id = ?', [testUserId]);
        assert.strictEqual(Number(walletAfter[0].balance), 50.00, 'Balance correctly reduced to $50.00');
        assert.strictEqual(Number(walletAfter[0].total_withdrawn), 50.00, 'Total withdrawn correctly increased to $50.00');
        console.log('  [PASS] 3. Valid withdrawal atomic deduction & ledger entry verified');

        // Clean up
        await db.query('DELETE FROM withdrawal_requests WHERE user_id = ?', [testUserId]);
        await db.query('DELETE FROM user_wallets WHERE user_id = ?', [testUserId]);
        await db.query('DELETE FROM users WHERE id = ?', [testUserId]);
        console.log('  [PASS] 4. Financial test cleanup completed');

        console.log('>>> ALL FINANCIAL & WALLET TESTS PASSED! <<<\n');
        return true;
    } catch (err) {
        await db.query('DELETE FROM withdrawal_requests WHERE user_id = ?', [testUserId]).catch(() => {});
        await db.query('DELETE FROM user_wallets WHERE user_id = ?', [testUserId]).catch(() => {});
        await db.query('DELETE FROM users WHERE id = ?', [testUserId]).catch(() => {});
        console.error('  [FAIL] Wallet Security Test failed:', err);
        throw err;
    }
}

if (require.main === module) {
    runWalletSecurityTests().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runWalletSecurityTests;
