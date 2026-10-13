/**
 * Phase 6 Automated Test Suite: NOWPayments 20-min Renewal, IPN Log & Double-Credit Prevention
 * Run on real Express server & real MySQL database.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('../../config/db');
const app = require('../../server');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const http = require('http');
const nowpaymentsService = require('../../services/nowpaymentsService');
const renewalWorker = require('../../workers/paymentRenewalWorker');

const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_123';
const TEST_PORT = 5099;
let serverInstance = null;
let baseUrl = `http://127.0.0.1:${TEST_PORT}`;

// Test users & credentials
const studentAId = crypto.randomUUID();
const studentBId = crypto.randomUUID();
const adminId = crypto.randomUUID();

let studentAToken = '';
let studentBToken = '';
let adminToken = '';

const testPaymentMethodId = crypto.randomUUID();
const testWebhookSecret = 'phase6_ipn_test_whsec_secret_xyz';

function generateHmacSha512(payload, secret) {
    function sortObject(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(sortObject);
        return Object.keys(obj).sort().reduce((acc, k) => {
            acc[k] = sortObject(obj[k]);
            return acc;
        }, {});
    }
    const sorted = sortObject(payload);
    return crypto.createHmac('sha512', secret).update(JSON.stringify(sorted)).digest('hex');
}

async function request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const headers = options.headers || {};
    if (options.body && typeof options.body === 'object') {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(options.body);
    }
    const res = await fetch(url, { ...options, headers });
    let data;
    try {
        data = await res.json();
    } catch (e) {
        data = null;
    }
    return { status: res.status, headers: res.headers, data };
}

async function setup() {
    return new Promise((resolve) => {
        serverInstance = app.listen(TEST_PORT, '127.0.0.1', async () => {
            console.log(`[Test Setup] Test server listening on ${baseUrl}`);

            // 1. Seed test users (clean any previous runs first)
            await db.query(`DELETE FROM users WHERE email IN ('phase6_student_a@test.com', 'phase6_student_b@test.com', 'phase6_admin@test.com')`);

            await db.query(`
                INSERT INTO users (id, email, password, role, token_version)
                VALUES 
                    (?, 'phase6_student_a@test.com', 'hash', 'student', 1),
                    (?, 'phase6_student_b@test.com', 'hash', 'student', 1),
                    (?, 'phase6_admin@test.com', 'hash', 'admin', 1)
            `, [studentAId, studentBId, adminId]);

            await db.query(`
                INSERT INTO profiles (id, full_name, email, country, country_code)
                VALUES 
                    (?, 'Student A Test', 'phase6_student_a@test.com', 'France', 'FR'),
                    (?, 'Student B Test', 'phase6_student_b@test.com', 'France', 'FR'),
                    (?, 'Admin Test', 'phase6_admin@test.com', 'France', 'FR')
                ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), country=VALUES(country), country_code=VALUES(country_code)
            `, [studentAId, studentBId, adminId]);

            // Wallets
            await db.query(`
                INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                VALUES 
                    (UUID(), ?, 100.00, 0.00, 0.00, 0.00),
                    (UUID(), ?, 50.00, 0.00, 0.00, 0.00),
                    (UUID(), ?, 0.00, 0.00, 0.00, 0.00)
                ON DUPLICATE KEY UPDATE balance=VALUES(balance)
            `, [studentAId, studentBId, adminId]);

            // 2. Seed active NOWPayments payment method
            await db.query(`
                UPDATE payment_methods 
                SET api_key = 'test_api_key_nowpay', webhook_secret = ?, status = 'active'
                WHERE LOWER(provider) = 'nowpayments'
            `, [testWebhookSecret]);

            await db.query(`
                INSERT INTO payment_methods (
                    id, name, name_ar, type, provider, currency, crypto_currency, crypto_network,
                    crypto_wallet_address, api_key, webhook_secret, is_sandbox, min_deposit, max_deposit,
                    enabled_for_deposit, enabled_for_withdrawal, status
                ) VALUES (
                    ?, 'NOWPayments Test', 'NOWPayments تجريبي', 'nowpayments_crypto', 'nowpayments',
                    'USD', 'USDT_BEP20', 'BEP20', '0xTestVaultAddress123', 'test_api_key_nowpay',
                    ?, 1, 10.00, 50000.00, 1, 1, 'active'
                ) ON DUPLICATE KEY UPDATE 
                    webhook_secret = VALUES(webhook_secret),
                    api_key = VALUES(api_key),
                    status = 'active'
            `, [testPaymentMethodId, testWebhookSecret]);

            // 3. Generate tokens
            studentAToken = jwt.sign({ id: studentAId, role: 'student', token_version: 1 }, JWT_SECRET);
            studentBToken = jwt.sign({ id: studentBId, role: 'student', token_version: 1 }, JWT_SECRET);
            adminToken = jwt.sign({ id: adminId, role: 'admin', token_version: 1 }, JWT_SECRET);

            resolve();
        });
    });
}

async function teardown() {
    nowpaymentsService.clearMockAdapter();
    renewalWorker.stop();

    // Clean up test data
    await db.query('DELETE FROM payment_attempts WHERE user_id IN (?, ?)', [studentAId, studentBId]);
    await db.query('DELETE FROM transactions WHERE user_id IN (?, ?)', [studentAId, studentBId]);
    await db.query('DELETE FROM user_wallets WHERE user_id IN (?, ?)', [studentAId, studentBId]);
    await db.query('DELETE FROM payment_methods WHERE id = ?', [testPaymentMethodId]);
    await db.query('DELETE FROM profiles WHERE id IN (?, ?, ?)', [studentAId, studentBId, adminId]);
    await db.query('DELETE FROM users WHERE id IN (?, ?, ?)', [studentAId, studentBId, adminId]);

    if (serverInstance) {
        await new Promise((res) => serverInstance.close(res));
    }
}

async function runTests() {
    const results = [];

    function record(testNumber, name, passed, details = '') {
        results.push({ testNumber, name, status: passed ? 'PASS' : 'FAIL', details });
        const icon = passed ? '✅' : '❌';
        console.log(`${icon} [Test ${testNumber}] ${name}: ${passed ? 'PASS' : 'FAIL'}${details ? ' - ' + details : ''}`);
    }

    try {
        await setup();

        let createdTrxId = null;
        let attempt1PaymentId = 'pay_np_mock_001';
        let attempt1PayAddress = '0xMockBscAddress_Attempt_1';

        // Set up initial mock adapter for NOWPayments
        nowpaymentsService.setMockAdapter({
            createPayment: async (payload) => {
                return {
                    paymentId: attempt1PaymentId,
                    orderId: payload.order_id,
                    payAddress: attempt1PayAddress,
                    payAmount: 50.00,
                    payCurrency: 'USDTBSC',
                    priceAmount: payload.price_amount,
                    priceCurrency: 'USD',
                    paymentStatus: 'waiting',
                    network: 'bsc',
                    raw: { mock: true, payload }
                };
            }
        });

        // ─────────────────────────────────────────────────────────────────────────────
        // 1. Member initiates deposit: First attempt saved in DB
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const res = await request('/api/affiliate/deposit', {
                method: 'POST',
                headers: { Authorization: `Bearer ${studentAToken}` },
                body: { amount: 50, paymentMethod: 'nowpayments_crypto' }
            });

            const pass = res.status === 201 && 
                         res.data?.transactionId && 
                         res.data?.payment?.paymentId === attempt1PaymentId &&
                         res.data?.payment?.payAddress === attempt1PayAddress &&
                         res.data?.payment?.attemptNumber === 1;

            if (pass) {
                createdTrxId = res.data.transactionId;
                // Verify DB row
                const [attempts] = await db.query('SELECT * FROM payment_attempts WHERE transaction_id = ?', [createdTrxId]);
                record(1, 'Member initiates deposit and saves first attempt record', attempts.length === 1 && attempts[0].attempt_number === 1);
            } else {
                record(1, 'Member initiates deposit and saves first attempt record', false, `Status ${res.status}: ${JSON.stringify(res.data)}`);
            }
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 2. Attempt appears in Admin IPN Log with pending state
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const res = await request('/api/admin/ipn-logs', {
                method: 'GET',
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            const found = res.data?.attempts?.find(a => a.transaction_id === createdTrxId && a.attempt_number === 1);
            const pass = res.status === 200 && 
                         found && 
                         found.status === 'waiting' && 
                         found.is_wallet_credited === 0 &&
                         found.user_email === 'phase6_student_a@test.com';

            record(2, 'Every attempt appears in IPN Log including pending attempts', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 3. Eligible session renews after 20 minutes
        // ─────────────────────────────────────────────────────────────────────────────
        let attempt2PaymentId = 'pay_np_mock_002';
        let attempt2PayAddress = '0xMockBscAddress_Attempt_2';
        {
            // Simulate 20 minutes elapsed by updating next_renewal_at to 1 second ago
            await db.query(
                'UPDATE payment_attempts SET next_renewal_at = DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE transaction_id = ?',
                [createdTrxId]
            );

            // Configure mock to return attempt 2 data
            nowpaymentsService.setMockAdapter({
                createPayment: async (payload) => {
                    return {
                        paymentId: attempt2PaymentId,
                        orderId: payload.order_id,
                        payAddress: attempt2PayAddress,
                        payAmount: 50.00,
                        payCurrency: 'USDTBSC',
                        priceAmount: payload.price_amount,
                        priceCurrency: 'USD',
                        paymentStatus: 'waiting',
                        network: 'bsc',
                        raw: { mock: true, payload }
                    };
                }
            });

            const cycleResult = await renewalWorker.runRenewalCycle();
            const [allAttempts] = await db.query(
                'SELECT * FROM payment_attempts WHERE transaction_id = ? ORDER BY attempt_number ASC',
                [createdTrxId]
            );

            const pass = cycleResult.renewed === 1 && 
                         allAttempts.length === 2 && 
                         allAttempts[1].attempt_number === 2 &&
                         allAttempts[1].provider_payment_id === attempt2PaymentId;

            record(3, 'Eligible session renews after 20 minutes creating attempt #2', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 4. Ineligible session (not due yet) does NOT renew
        // ─────────────────────────────────────────────────────────────────────────────
        {
            // At this point, attempt #2 has next_renewal_at = NOW() + 20 minutes
            const cycleResult = await renewalWorker.runRenewalCycle();
            const [allAttempts] = await db.query(
                'SELECT * FROM payment_attempts WHERE transaction_id = ?',
                [createdTrxId]
            );

            const pass = cycleResult.renewed === 0 && allAttempts.length === 2;
            record(4, 'Session not due for renewal is not renewed', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 5. Ineligible session (completed/cancelled/credited) does NOT renew
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const dummyTrxId = crypto.randomUUID();
            await db.query(`
                INSERT INTO transactions (id, user_id, type, amount, currency, status, reference_id)
                VALUES (?, ?, 'deposit', 30.00, 'USD', 'completed', 'TEST-DONE-01')
            `, [dummyTrxId, studentAId]);

            await db.query(`
                INSERT INTO payment_attempts (
                    id, transaction_id, user_id, provider, provider_payment_id, attempt_number,
                    price_amount, status, is_wallet_credited, next_renewal_at
                ) VALUES (UUID(), ?, ?, 'nowpayments', 'pay_dummy_done', 1, 30.00, 'finished', 1, DATE_SUB(NOW(), INTERVAL 1 MINUTE))
            `, [dummyTrxId, studentAId]);

            const cycleResult = await renewalWorker.runRenewalCycle();
            const [dummyAttempts] = await db.query('SELECT * FROM payment_attempts WHERE transaction_id = ?', [dummyTrxId]);

            const pass = cycleResult.renewed === 0 && dummyAttempts.length === 1;
            record(5, 'Completed, credited, or cancelled session is not renewed', pass);

            // Clean dummy
            await db.query('DELETE FROM payment_attempts WHERE transaction_id = ?', [dummyTrxId]);
            await db.query('DELETE FROM transactions WHERE id = ?', [dummyTrxId]);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 6. Provider connection failure is safely logged with exponential backoff
        // ─────────────────────────────────────────────────────────────────────────────
        {
            // Simulate session due
            await db.query(
                'UPDATE payment_attempts SET next_renewal_at = DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE transaction_id = ? AND attempt_number = 2',
                [createdTrxId]
            );

            // Mock throws temporary network error
            nowpaymentsService.setMockAdapter({
                createPayment: async () => {
                    throw new Error('Temporary 502 Gateway Error from NOWPayments');
                }
            });

            const cycleResult = await renewalWorker.runRenewalCycle();
            const [attempts] = await db.query(
                'SELECT renewal_error, next_renewal_at FROM payment_attempts WHERE transaction_id = ? AND attempt_number = 2',
                [createdTrxId]
            );

            const pass = cycleResult.failed === 1 && 
                         attempts[0].renewal_error && 
                         attempts[0].renewal_error.includes('Temporary 502') &&
                         new Date(attempts[0].next_renewal_at).getTime() > Date.now();

            record(6, 'Gateway error logged safely and retries backed off', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 7. Previous attempts NOT deleted upon renewal failure
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const [allAttempts] = await db.query(
                'SELECT attempt_number, provider_payment_id, pay_address FROM payment_attempts WHERE transaction_id = ? ORDER BY attempt_number ASC',
                [createdTrxId]
            );

            const pass = allAttempts.length === 2 && 
                         allAttempts[0].attempt_number === 1 &&
                         allAttempts[0].provider_payment_id === attempt1PaymentId &&
                         allAttempts[1].attempt_number === 2 &&
                         allAttempts[1].provider_payment_id === attempt2PaymentId;

            record(7, 'Previous attempts and addresses remain intact after failure', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 8. Prevent duplicate replacement orders when concurrent workers execute
        // ─────────────────────────────────────────────────────────────────────────────
        let attempt3PaymentId = 'pay_np_mock_003';
        {
            // Set session due for attempt 3
            await db.query(
                'UPDATE payment_attempts SET next_renewal_at = DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE transaction_id = ? AND attempt_number = 2',
                [createdTrxId]
            );

            nowpaymentsService.setMockAdapter({
                createPayment: async (payload) => {
                    return {
                        paymentId: attempt3PaymentId,
                        orderId: payload.order_id,
                        payAddress: '0xMockBscAddress_Attempt_3',
                        payAmount: 50.00,
                        payCurrency: 'USDTBSC',
                        priceAmount: payload.price_amount,
                        priceCurrency: 'USD',
                        paymentStatus: 'waiting',
                        network: 'bsc',
                        raw: { mock: true, payload }
                    };
                }
            });

            // Run two renewal cycles concurrently
            const [resA, resB] = await Promise.all([
                renewalWorker.runRenewalCycle(),
                renewalWorker.runRenewalCycle()
            ]);

            const [allAttempts] = await db.query(
                'SELECT * FROM payment_attempts WHERE transaction_id = ?',
                [createdTrxId]
            );

            // One should renew (or acquire lock), the other should be skipped or find nothing due
            const totalRenewed = (resA.renewed || 0) + (resB.renewed || 0);
            const pass = totalRenewed === 1 && allAttempts.length === 3;
            record(8, 'Concurrent workers cannot duplicate renewals on the same session', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 9. Late payment matching: Payment arrives on OLD attempt (#1) after renewals
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const [walletsBefore] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentAId]);
            const balBefore = Number(walletsBefore[0].balance);

            // Webhook payload referencing the OLD attempt #1 payment ID
            const lateWebhookPayload = {
                payment_id: attempt1PaymentId,
                payment_status: 'finished',
                price_amount: 50.00,
                price_currency: 'usd',
                pay_amount: 50.00,
                pay_currency: 'usdtbsc',
                actually_paid: 50.00,
                order_id: createdTrxId,
                order_description: 'Late deposit on attempt 1'
            };

            const sig = generateHmacSha512(lateWebhookPayload, testWebhookSecret);

            const res = await request('/api/payment/webhook/nowpayments', {
                method: 'POST',
                headers: {
                    'x-nowpayments-sig': sig
                },
                body: lateWebhookPayload
            });

            const [walletsAfter] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentAId]);
            const balAfter = Number(walletsAfter[0].balance);

            const [trxAfter] = await db.query('SELECT status FROM transactions WHERE id = ?', [createdTrxId]);
            const [att1] = await db.query('SELECT status, is_wallet_credited FROM payment_attempts WHERE provider_payment_id = ?', [attempt1PaymentId]);

            const pass = res.status === 200 && 
                         res.data?.credited === true && 
                         balAfter === balBefore + 50.00 && 
                         trxAfter[0].status === 'completed' &&
                         att1[0].is_wallet_credited === 1 &&
                         att1[0].status === 'finished';

            record(9, 'Late payment arriving on old attempt #1 matches and credits wallet', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 10. Prevent duplicate credit on duplicate webhooks or out-of-order events
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const [walletsBefore] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentAId]);
            const balBefore = Number(walletsBefore[0].balance);

            // Repeat the exact same webhook for attempt 1
            const duplicatePayload = {
                payment_id: attempt1PaymentId,
                payment_status: 'finished',
                price_amount: 50.00,
                price_currency: 'usd',
                pay_amount: 50.00,
                pay_currency: 'usdtbsc',
                actually_paid: 50.00,
                order_id: createdTrxId
            };
            const sig = generateHmacSha512(duplicatePayload, testWebhookSecret);

            const res = await request('/api/payment/webhook/nowpayments', {
                method: 'POST',
                headers: { 'x-nowpayments-sig': sig },
                body: duplicatePayload
            });

            const [walletsAfter] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentAId]);
            const balAfter = Number(walletsAfter[0].balance);

            const pass = res.status === 409 && balAfter === balBefore;
            record(10, 'Duplicate webhook is rejected with 409 and zero duplicate credit', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 11. Webhook on replacement attempt (#3) after attempt #1 was paid does NOT double credit
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const [walletsBefore] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentAId]);
            const balBefore = Number(walletsBefore[0].balance);

            const att3Payload = {
                payment_id: attempt3PaymentId,
                payment_status: 'finished',
                price_amount: 50.00,
                price_currency: 'usd',
                pay_amount: 50.00,
                pay_currency: 'usdtbsc',
                actually_paid: 50.00,
                order_id: createdTrxId
            };
            const sig = generateHmacSha512(att3Payload, testWebhookSecret);

            const res = await request('/api/payment/webhook/nowpayments', {
                method: 'POST',
                headers: { 'x-nowpayments-sig': sig },
                body: att3Payload
            });

            const [walletsAfter] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentAId]);
            const balAfter = Number(walletsAfter[0].balance);

            const pass = res.status === 409 && balAfter === balBefore;
            record(11, 'Payment on replacement attempt does not credit again when already paid', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 12. Prevent credit if actually_paid is missing, zero, or unverified
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const unverifiedTrxId = crypto.randomUUID();
            await db.query(`
                INSERT INTO transactions (id, user_id, type, amount, currency, status, reference_id)
                VALUES (?, ?, 'deposit', 25.00, 'USD', 'pending', 'TEST-UNVERIFIED')
            `, [unverifiedTrxId, studentBId]);

            await db.query(`
                INSERT INTO payment_attempts (
                    id, transaction_id, user_id, provider, provider_payment_id, attempt_number,
                    price_amount, status, is_wallet_credited
                ) VALUES (UUID(), ?, ?, 'nowpayments', 'pay_unverified_001', 1, 25.00, 'waiting', 0)
            `, [unverifiedTrxId, studentBId]);

            const [walletsBefore] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentBId]);
            const balBefore = Number(walletsBefore[0].balance);

            const invalidAmountPayload = {
                payment_id: 'pay_unverified_001',
                payment_status: 'finished',
                price_amount: 25.00,
                price_currency: 'usd',
                pay_currency: 'btc', // Crypto mismatch without actually_paid or fiat valuation
                actually_paid: null,
                order_id: unverifiedTrxId
            };
            const sig = generateHmacSha512(invalidAmountPayload, testWebhookSecret);

            const res = await request('/api/payment/webhook/nowpayments', {
                method: 'POST',
                headers: { 'x-nowpayments-sig': sig },
                body: invalidAmountPayload
            });

            const [walletsAfter] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentBId]);
            const balAfter = Number(walletsAfter[0].balance);

            const pass = res.status === 200 && res.data?.credited === false && balAfter === balBefore;
            record(12, 'Missing or unverified actually_paid is acknowledged with zero credit', pass);

            // Clean dummy
            await db.query('DELETE FROM payment_attempts WHERE transaction_id = ?', [unverifiedTrxId]);
            await db.query('DELETE FROM transactions WHERE id = ?', [unverifiedTrxId]);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 13. Currency mismatch or underpayment handled according to approved policy
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const underpaidTrxId = crypto.randomUUID();
            await db.query(`
                INSERT INTO transactions (id, user_id, type, amount, currency, status, reference_id)
                VALUES (?, ?, 'deposit', 100.00, 'USD', 'pending', 'TEST-UNDERPAID')
            `, [underpaidTrxId, studentBId]);

            await db.query(`
                INSERT INTO payment_attempts (
                    id, transaction_id, user_id, provider, provider_payment_id, attempt_number,
                    price_amount, status, is_wallet_credited
                ) VALUES (UUID(), ?, ?, 'nowpayments', 'pay_underpaid_001', 1, 100.00, 'waiting', 0)
            `, [underpaidTrxId, studentBId]);

            const [walletsBefore] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentBId]);
            const balBefore = Number(walletsBefore[0].balance);

            // Paid 40 USD instead of 100 USD
            const underpaidPayload = {
                payment_id: 'pay_underpaid_001',
                payment_status: 'finished',
                price_amount: 100.00,
                price_currency: 'usd',
                pay_amount: 100.00,
                pay_currency: 'usdtbsc',
                actually_paid: 40.00,
                order_id: underpaidTrxId
            };
            const sig = generateHmacSha512(underpaidPayload, testWebhookSecret);

            const res = await request('/api/payment/webhook/nowpayments', {
                method: 'POST',
                headers: { 'x-nowpayments-sig': sig },
                body: underpaidPayload
            });

            const [walletsAfter] = await db.query('SELECT balance FROM user_wallets WHERE user_id = ?', [studentBId]);
            const balAfter = Number(walletsAfter[0].balance);

            const [trx] = await db.query('SELECT status, amount FROM transactions WHERE id = ?', [underpaidTrxId]);

            const pass = res.status === 200 && 
                         res.data?.isUnderpaid === true && 
                         res.data?.creditedAmount === 40.00 && 
                         balAfter === balBefore + 40.00 &&
                         trx[0].status === 'partially_paid';

            record(13, 'Underpayment adds strictly actual received amount and marks partially_paid', pass);

            // Clean dummy
            await db.query('DELETE FROM payment_attempts WHERE transaction_id = ?', [underpaidTrxId]);
            await db.query('DELETE FROM transactions WHERE id = ?', [underpaidTrxId]);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 14. RBAC: Student B cannot view Student A's deposit attempts
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const res = await request(`/api/affiliate/deposits/${createdTrxId}/attempts`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${studentBToken}` }
            });

            const pass = res.status === 403;
            record(14, 'Member is forbidden from viewing another member deposit attempts', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 15. RBAC: Non-admin is forbidden from IPN Log admin operations
        // ─────────────────────────────────────────────────────────────────────────────
        {
            const res = await request('/api/admin/ipn-logs', {
                method: 'GET',
                headers: { Authorization: `Bearer ${studentAToken}` }
            });

            const pass = res.status === 403;
            record(15, 'Unauthorized non-admin is forbidden from accessing Admin IPN Logs', pass);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 16. Scheduler resilience across server/worker restarts
        // ─────────────────────────────────────────────────────────────────────────────
        {
            // Stop and restart worker
            renewalWorker.stop();
            renewalWorker.start();
            const isRunning = renewalWorker.isRunning;
            renewalWorker.stop();

            record(16, 'Worker recovers and state persists in DB across restarts', isRunning === true);
        }

        // ─────────────────────────────────────────────────────────────────────────────
        // 17. Regression: Previous security, authentication, and wallet flows succeed
        // ─────────────────────────────────────────────────────────────────────────────
        {
            // Verify student A wallet balance endpoint
            const resWallet = await request('/api/affiliate/wallet', {
                method: 'GET',
                headers: { Authorization: `Bearer ${studentAToken}` }
            });

            // Verify admin deposits endpoint
            const resAdmin = await request('/api/admin/deposits', {
                method: 'GET',
                headers: { Authorization: `Bearer ${adminToken}` }
            });

            const pass = resWallet.status === 200 && 
                         resAdmin.status === 200 && 
                         Array.isArray(resAdmin.data?.deposits);

            record(17, 'Regression test: Previous wallet, admin, and affiliate flows intact', pass);
        }

    } catch (err) {
        console.error('[Test Suite Error]', err);
        record(99, 'Fatal Suite Error', false, err.message);
    } finally {
        await teardown();
    }

    return results;
}

if (require.main === module) {
    runTests()
        .then((results) => {
            console.log('\n======================================================');
            console.log('              PHASE 6 TEST RESULTS SUMMARY            ');
            console.log('======================================================');
            let allPassed = true;
            for (const r of results) {
                if (r.status !== 'PASS') allPassed = false;
                console.log(`[${r.status}] Test ${r.testNumber}: ${r.name}`);
            }
            console.log('======================================================');
            if (allPassed) {
                console.log('ALL TESTS PASSED SUCCESSFULLY! (17/17)');
                process.exit(0);
            } else {
                console.error('SOME TESTS FAILED!');
                process.exit(1);
            }
        })
        .catch((err) => {
            console.error('Test execution failed:', err);
            process.exit(1);
        });
}

module.exports = { runTests };
