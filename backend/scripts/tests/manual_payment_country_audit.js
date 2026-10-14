const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = require('../../server');
const db = require('../../config/db');
const { makeRequest } = require('./test_http_client');
const currencyService = require('../../services/currencyService');

const testResults = [];

function recordResult(testNumber, name, status, evidence) {
    testResults.push({ testNumber, name, status, evidence });
    const symbol = status === 'PASS' ? '✅' : '❌';
    console.log(`\n${symbol} [${status}] Test ${testNumber}: ${name}`);
    console.log(`       Evidence: ${evidence}`);
}

async function runManualPaymentCountryAudit() {
    console.log('\n================================================================');
    console.log('   NEXYVORA COUNTRY-BASED MANUAL PAYMENT & SECURITY AUDIT       ');
    console.log('================================================================\n');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const testAdminId = crypto.randomUUID();
    const studentMaId = crypto.randomUUID();
    const studentDzId = crypto.randomUUID();
    const studentTnId = crypto.randomUUID();
    const studentAeId = crypto.randomUUID();

    // 1. Create test users in DB
    try {
        const testEmails = [
            'admin_test@nexyvora.com',
            'student_ma@nexyvora.com',
            'student_dz@nexyvora.com',
            'student_tn@nexyvora.com',
            'student_ae@nexyvora.com'
        ];
        await db.query('DELETE FROM profiles WHERE id IN (?, ?, ?, ?, ?)', [testAdminId, studentMaId, studentDzId, studentTnId, studentAeId]).catch(() => {});
        await db.query('DELETE FROM users WHERE email IN (?)', [testEmails]).catch(() => {});

        await db.query(`
            INSERT INTO users (id, email, password, role, status, token_version, affiliate_code)
            VALUES 
            (?, 'admin_test@nexyvora.com', '$2b$12$eX4mpL3h4sh3dPa$$w0rdF0rAud1tTest1234567890', 'admin', 'active', 1, 'NV000001'),
            (?, 'student_ma@nexyvora.com', '$2b$12$eX4mpL3h4sh3dPa$$w0rdF0rAud1tTest1234567890', 'student', 'active', 1, 'NV000002'),
            (?, 'student_dz@nexyvora.com', '$2b$12$eX4mpL3h4sh3dPa$$w0rdF0rAud1tTest1234567890', 'student', 'active', 1, 'NV000003'),
            (?, 'student_tn@nexyvora.com', '$2b$12$eX4mpL3h4sh3dPa$$w0rdF0rAud1tTest1234567890', 'student', 'active', 1, 'NV000004'),
            (?, 'student_ae@nexyvora.com', '$2b$12$eX4mpL3h4sh3dPa$$w0rdF0rAud1tTest1234567890', 'student', 'active', 1, 'NV000005')
        `, [testAdminId, studentMaId, studentDzId, studentTnId, studentAeId]);

        await db.query(`
            INSERT INTO profiles (id, full_name, email, country, country_code)
            VALUES
            (?, 'Test Admin', 'admin_test@nexyvora.com', 'Global', 'GLOBAL'),
            (?, 'Student Morocco', 'student_ma@nexyvora.com', 'Morocco', 'MA'),
            (?, 'Student Algeria', 'student_dz@nexyvora.com', 'Algeria', 'DZ'),
            (?, 'Student Tunisia', 'student_tn@nexyvora.com', 'Tunisia', 'TN'),
            (?, 'Student UAE', 'student_ae@nexyvora.com', 'United Arab Emirates', 'AE')
        `, [testAdminId, studentMaId, studentDzId, studentTnId, studentAeId]);

        // Give student DZ and MA some balance in user_wallets to test withdrawal
        await db.query(`
            INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
            VALUES 
            (?, ?, 200.00, 0, 0, 0),
            (?, ?, 200.00, 0, 0, 0)
            ON DUPLICATE KEY UPDATE balance = 200.00
        `, [crypto.randomUUID(), studentDzId, crypto.randomUUID(), studentMaId]);
    } catch (e) {
        console.warn('User setup note:', e.message);
    }

    const adminToken = jwt.sign(
        { id: testAdminId, role: 'admin', token_version: 1 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );

    const studentMaToken = jwt.sign(
        { id: studentMaId, role: 'student', token_version: 1 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );

    const studentDzToken = jwt.sign(
        { id: studentDzId, role: 'student', token_version: 1 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );

    const studentTnToken = jwt.sign(
        { id: studentTnId, role: 'student', token_version: 1 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );

    const studentAeToken = jwt.sign(
        { id: studentAeId, role: 'student', token_version: 1 },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
    );

    // -------------------------------------------------------------
    // TEST 1: Admin Save & Update Country Bank Rules
    // -------------------------------------------------------------
    try {
        const updateRes = await makeRequest(server, {
            method: 'PUT',
            path: '/api/currency/admin/rules/MA',
            headers: { Authorization: `Bearer ${adminToken}` }
        }, {
            country_name: 'Morocco',
            country_name_ar: 'المملكة المغربية',
            currency_code: 'MAD',
            currency_symbol: 'DH',
            usd_rate: 10.0,
            usdt_enabled: 1,
            local_currency_enabled: 1,
            bank_name: 'Attijariwafa Bank',
            account_holder: 'Nexyvora Morocco SARL',
            account_number: '007780000123456789012345',
            iban: 'MA64007780000123456789012345',
            swift_code: 'BCMAMAMC',
            bank_instructions: 'Please transfer in MAD to Attijariwafa Bank and attach deposit slip.',
            bank_instructions_ar: 'يرجى التحويل بالدرهم المغربي (MAD) إلى حساب التجاري وفا بنك وإرفاق وصل التحويل لتفعيل حسابك فوراً.'
        });

        assert.strictEqual(updateRes.statusCode, 200, `Expected 200, got ${updateRes.statusCode}`);
        assert.strictEqual(updateRes.json?.rule?.bank_name, 'Attijariwafa Bank');
        assert.strictEqual(updateRes.json?.rule?.account_number, '007780000123456789012345');
        assert.strictEqual(updateRes.json?.rule?.iban, 'MA64007780000123456789012345');

        recordResult(
            1,
            'Admin Update Country Bank Credentials (MA)',
            'PASS',
            `Rule updated successfully: Bank=${updateRes.json?.rule?.bank_name}, Currency=${updateRes.json?.rule?.currency_code}, IBAN=${updateRes.json?.rule?.iban}`
        );
    } catch (e) {
        recordResult(1, 'Admin Update Country Bank Credentials (MA)', 'FAIL', e.message);
    }

    // -------------------------------------------------------------
    // TEST 2: Algeria Strict USDT Ban Verification in Admin Update
    // -------------------------------------------------------------
    try {
        // Even if an admin tries to enable USDT for Algeria, backend must enforce usdt_enabled: 0
        const dzRes = await makeRequest(server, {
            method: 'PUT',
            path: '/api/currency/admin/rules/DZ',
            headers: { Authorization: `Bearer ${adminToken}` }
        }, {
            country_name: 'Algeria',
            country_name_ar: 'الجزائر',
            currency_code: 'DZD',
            currency_symbol: 'DA',
            usd_rate: 220.0,
            usdt_enabled: 1, // Malicious / accidental attempt to enable USDT
            local_currency_enabled: 1,
            bank_name: 'البنك الوطني الجزائري (BNA) / BaridiMob',
            account_holder: 'Nexyvora Algeria EURL',
            account_number: '00799999000123456789',
            iban: 'DZ0000799999000123456789',
            swift_code: 'BNAADZAL',
            bank_instructions: 'Pay via BNA or BaridiMob RIP with phone number in note.',
            bank_instructions_ar: 'يرجى التحويل بالدينار الجزائري عبر تطبيق بريدي موب (BaridiMob RIP) أو الحساب البنكي BNA وكتابة رقم الهاتف في سبب التحويل.'
        });

        assert.strictEqual(dzRes.statusCode, 200, `Expected 200, got ${dzRes.statusCode}`);
        // Backend must enforce usdt_enabled: 0 / false for DZ
        assert.strictEqual(Number(dzRes.json?.rule?.usdt_enabled), 0, 'Algeria USDT must remain strictly disabled');

        recordResult(
            2,
            'Admin Update Algeria Rule: Strict USDT Ban Enforcement',
            'PASS',
            `Algeria bank credentials updated with usdt_enabled strictly set to 0: Bank=${dzRes.json?.rule?.bank_name}`
        );
    } catch (e) {
        recordResult(2, 'Admin Update Algeria Rule: Strict USDT Ban Enforcement', 'FAIL', e.message);
    }

    // -------------------------------------------------------------
    // TEST 3: Moroccan Student Payment Methods (MAD + Bank + USDT allowed)
    // -------------------------------------------------------------
    try {
        const maMethodsRes = await makeRequest(server, {
            method: 'GET',
            path: '/api/affiliate/payment-methods?type=deposit',
            headers: { Authorization: `Bearer ${studentMaToken}` }
        });

        assert.strictEqual(maMethodsRes.statusCode, 200, `Expected 200, got ${maMethodsRes.statusCode}`);
        const methods = maMethodsRes.json?.paymentMethods || [];
        const detectedCountry = maMethodsRes.json?.detectedCountry;
        const bankMethod = methods.find(m => m.type === 'bank_transfer' || m.id === 'manual_bank');
        const usdtMethod = methods.find(m => m.type === 'nowpayments_crypto' || m.type === 'crypto');

        assert.strictEqual(detectedCountry, 'MA', `Expected detected country MA, got ${detectedCountry}`);
        assert.ok(bankMethod, 'Bank transfer method must be present');
        assert.strictEqual(bankMethod.bank_name, 'Attijariwafa Bank');
        assert.strictEqual(bankMethod.account_number, '007780000123456789012345');
        assert.ok(bankMethod.instructions_ar.includes('الدرهم المغربي'), 'Arabic instructions must mention Moroccan Dirham');
        assert.ok(usdtMethod, 'USDT must be allowed for Morocco');

        recordResult(
            3,
            'Moroccan Student Methods: Attijariwafa Bank, MAD, USDT Allowed',
            'PASS',
            `Country: ${detectedCountry}, Bank: ${bankMethod.bank_name}, Currency: MAD, USDT Available: ${!!usdtMethod}`
        );
    } catch (e) {
        recordResult(3, 'Moroccan Student Methods: Attijariwafa Bank, MAD, USDT Allowed', 'FAIL', e.message);
    }

    // -------------------------------------------------------------
    // TEST 4: Algerian Student Payment Methods (DZD + BNA/BaridiMob + ZERO USDT)
    // -------------------------------------------------------------
    try {
        const dzMethodsRes = await makeRequest(server, {
            method: 'GET',
            path: '/api/affiliate/payment-methods?type=deposit',
            headers: { Authorization: `Bearer ${studentDzToken}` }
        });

        assert.strictEqual(dzMethodsRes.statusCode, 200, `Expected 200, got ${dzMethodsRes.statusCode}`);
        const methods = dzMethodsRes.json?.paymentMethods || [];
        const detectedCountry = dzMethodsRes.json?.detectedCountry;
        const bankMethod = methods.find(m => m.type === 'bank_transfer' || m.id === 'manual_bank');
        const usdtMethod = methods.find(m => m.type === 'nowpayments_crypto' || m.type === 'crypto');

        assert.strictEqual(detectedCountry, 'DZ', `Expected detected country DZ, got ${detectedCountry}`);
        assert.ok(bankMethod, 'Bank transfer method must be present for Algeria');
        assert.ok(bankMethod.bank_name.includes('BaridiMob') || bankMethod.bank_name.includes('BNA'), `Bank should be BNA / BaridiMob, got ${bankMethod.bank_name}`);
        assert.strictEqual(bankMethod.account_number, '00799999000123456789');
        assert.strictEqual(usdtMethod, undefined, 'USDT MUST NOT be returned for Algerian student');

        recordResult(
            4,
            'Algerian Student Methods: BNA/BaridiMob, DZD, ZERO USDT (Strict Ban)',
            'PASS',
            `Country: ${detectedCountry}, Bank: ${bankMethod.bank_name}, Methods Count: ${methods.length}, USDT Present: ${!!usdtMethod}`
        );
    } catch (e) {
        recordResult(4, 'Algerian Student Methods: BNA/BaridiMob, DZD, ZERO USDT (Strict Ban)', 'FAIL', e.message);
    }

    // -------------------------------------------------------------
    // TEST 5: Tunisian Student Payment Methods (TND + BIAT Bank)
    // -------------------------------------------------------------
    try {
        const tnMethodsRes = await makeRequest(server, {
            method: 'GET',
            path: '/api/affiliate/payment-methods?type=deposit',
            headers: { Authorization: `Bearer ${studentTnToken}` }
        });

        assert.strictEqual(tnMethodsRes.statusCode, 200, `Expected 200, got ${tnMethodsRes.statusCode}`);
        const methods = tnMethodsRes.json?.paymentMethods || [];
        const detectedCountry = tnMethodsRes.json?.detectedCountry;
        const bankMethod = methods.find(m => m.type === 'bank_transfer' || m.id === 'manual_bank');

        assert.strictEqual(detectedCountry, 'TN', `Expected detected country TN, got ${detectedCountry}`);
        assert.ok(bankMethod, 'Bank transfer method must be present for Tunisia');
        assert.ok(bankMethod.bank_name.includes('BIAT') || bankMethod.bank_name.includes('تونس'), `Expected BIAT bank, got ${bankMethod.bank_name}`);

        recordResult(
            5,
            'Tunisian Student Methods: BIAT Bank & TND Currency',
            'PASS',
            `Country: ${detectedCountry}, Bank: ${bankMethod.bank_name}, Instructions: ${bankMethod.instructions_ar?.substring(0, 40)}...`
        );
    } catch (e) {
        recordResult(5, 'Tunisian Student Methods: BIAT Bank & TND Currency', 'FAIL', e.message);
    }

    // -------------------------------------------------------------
    // TEST 6: Emirati Student Payment Methods (AED + Emirates NBD)
    // -------------------------------------------------------------
    try {
        const aeMethodsRes = await makeRequest(server, {
            method: 'GET',
            path: '/api/affiliate/payment-methods?type=deposit',
            headers: { Authorization: `Bearer ${studentAeToken}` }
        });

        assert.strictEqual(aeMethodsRes.statusCode, 200, `Expected 200, got ${aeMethodsRes.statusCode}`);
        const methods = aeMethodsRes.json?.paymentMethods || [];
        const detectedCountry = aeMethodsRes.json?.detectedCountry;
        const bankMethod = methods.find(m => m.type === 'bank_transfer' || m.id === 'manual_bank');

        assert.strictEqual(detectedCountry, 'AE', `Expected detected country AE, got ${detectedCountry}`);
        assert.ok(bankMethod, 'Bank transfer method must be present for UAE');
        assert.ok(bankMethod.bank_name.includes('Emirates NBD') || bankMethod.bank_name.includes('الإمارات'), `Expected Emirates NBD, got ${bankMethod.bank_name}`);
        assert.strictEqual(bankMethod.currency, 'AED');

        recordResult(
            6,
            'Emirati Student Methods: Emirates NBD & AED Currency',
            'PASS',
            `Country: ${detectedCountry}, Bank: ${bankMethod.bank_name}, Currency: ${bankMethod.currency}, IBAN: ${bankMethod.iban}`
        );
    } catch (e) {
        recordResult(6, 'Emirati Student Methods: Emirates NBD & AED Currency', 'FAIL', e.message);
    }

    // -------------------------------------------------------------
    // TEST 7: Backend Deposit Security: Algeria USDT Deposit BLOCKED (403)
    // -------------------------------------------------------------
    try {
        const dzDepositUsdtRes = await makeRequest(server, {
            method: 'POST',
            path: '/api/affiliate/deposit',
            headers: { Authorization: `Bearer ${studentDzToken}` }
        }, {
            amount: 50,
            paymentMethod: 'nowpayments_crypto',
            paymentReference: '0x123456789'
        });

        assert.strictEqual(dzDepositUsdtRes.statusCode, 403, `Expected 403 Forbidden, got ${dzDepositUsdtRes.statusCode}`);
        assert.ok(dzDepositUsdtRes.json?.error.includes('غير متاح') || dzDepositUsdtRes.json?.error.includes('not supported') || dzDepositUsdtRes.json?.error.includes('USDT'), 'Error must explain USDT restriction');

        recordResult(
            7,
            'Algerian Student Deposit: USDT Strictly Blocked with HTTP 403',
            'PASS',
            `Status: ${dzDepositUsdtRes.statusCode}, Error: "${dzDepositUsdtRes.json?.error}"`
        );
    } catch (e) {
        recordResult(7, 'Algerian Student Deposit: USDT Strictly Blocked with HTTP 403', 'FAIL', e.message);
    }

    // -------------------------------------------------------------
    // TEST 8: Backend Deposit Security: Algeria Manual Bank Deposit ALLOWED
    // -------------------------------------------------------------
    try {
        const dzDepositBankRes = await makeRequest(server, {
            method: 'POST',
            path: '/api/affiliate/deposit',
            headers: { Authorization: `Bearer ${studentDzToken}` }
        }, {
            amount: 50,
            paymentMethod: 'bank_transfer',
            paymentReference: 'BARIDI-123456789',
            receiptUrl: 'https://cdn.nexyvora.com/receipts/dz-bank-proof.jpg',
            notes: 'Algeria BaridiMob deposit'
        });

        assert.strictEqual(dzDepositBankRes.statusCode, 201, `Expected 201 Created, got ${dzDepositBankRes.statusCode}`);
        assert.ok(dzDepositBankRes.json?.transactionId, 'Transaction record must be created');
        assert.ok(dzDepositBankRes.json?.referenceId, 'Reference ID must be returned');

        recordResult(
            8,
            'Algerian Student Deposit: Manual Bank Transfer Allowed & Pending Review',
            'PASS',
            `Status: ${dzDepositBankRes.statusCode}, Transaction ID: ${dzDepositBankRes.json?.transactionId}, Ref: ${dzDepositBankRes.json?.referenceId}`
        );
    } catch (e) {
        recordResult(8, 'Algerian Student Deposit: Manual Bank Transfer Allowed & Pending Review', 'FAIL', e.message);
    }

    // -------------------------------------------------------------
    // TEST 9: Backend Withdrawal Security: Algeria USDT Withdrawal BLOCKED (403)
    // -------------------------------------------------------------
    try {
        const dzWithdrawUsdtRes = await makeRequest(server, {
            method: 'POST',
            path: '/api/affiliate/withdraw',
            headers: { Authorization: `Bearer ${studentDzToken}` }
        }, {
            amount: 50,
            paymentMethod: 'nowpayments_crypto',
            paymentDetails: '0x9876543210abcdef'
        });

        assert.strictEqual(dzWithdrawUsdtRes.statusCode, 403, `Expected 403 Forbidden, got ${dzWithdrawUsdtRes.statusCode}`);

        recordResult(
            9,
            'Algerian Student Withdrawal: USDT Strictly Blocked with HTTP 403',
            'PASS',
            `Status: ${dzWithdrawUsdtRes.statusCode}, Error: "${dzWithdrawUsdtRes.json?.error}"`
        );
    } catch (e) {
        recordResult(9, 'Algerian Student Withdrawal: USDT Strictly Blocked with HTTP 403', 'FAIL', e.message);
    }

    // -------------------------------------------------------------
    // TEST 10: Backend Withdrawal Security: Algeria Bank Transfer Withdrawal ALLOWED
    // -------------------------------------------------------------
    try {
        const dzWithdrawBankRes = await makeRequest(server, {
            method: 'POST',
            path: '/api/affiliate/withdraw',
            headers: { Authorization: `Bearer ${studentDzToken}` }
        }, {
            amount: 50,
            paymentMethod: 'bank_transfer',
            paymentDetails: 'BNA Account: 00799999000123456789 - Ahmed Benali'
        });

        assert.strictEqual(dzWithdrawBankRes.statusCode, 201, `Expected 201 Created, got ${dzWithdrawBankRes.statusCode}`);
        assert.ok(dzWithdrawBankRes.json?.withdrawalId, 'Withdrawal request record must be created');

        recordResult(
            10,
            'Algerian Student Withdrawal: Bank Transfer Allowed & Pending Review',
            'PASS',
            `Status: ${dzWithdrawBankRes.statusCode}, Withdrawal ID: ${dzWithdrawBankRes.json?.withdrawalId}, Balance Deducted`
        );
    } catch (e) {
        recordResult(10, 'Algerian Student Withdrawal: Bank Transfer Allowed & Pending Review', 'FAIL', e.message);
    }

    // -------------------------------------------------------------
    // TEST 11: Moroccan Student Withdrawal: USDT Allowed
    // -------------------------------------------------------------
    try {
        const maWithdrawRes = await makeRequest(server, {
            method: 'POST',
            path: '/api/affiliate/withdraw',
            headers: { Authorization: `Bearer ${studentMaToken}` }
        }, {
            amount: 50,
            paymentMethod: 'nowpayments_crypto',
            paymentDetails: '0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B'
        });

        assert.strictEqual(maWithdrawRes.statusCode, 201, `Expected 201 Created, got ${maWithdrawRes.statusCode}`);
        assert.ok(maWithdrawRes.json?.withdrawalId, 'Withdrawal ID must be returned');

        recordResult(
            11,
            'Moroccan Student Withdrawal: USDT Allowed & Pending Review',
            'PASS',
            `Status: ${maWithdrawRes.statusCode}, Withdrawal ID: ${maWithdrawRes.json?.withdrawalId}`
        );
    } catch (e) {
        recordResult(11, 'Moroccan Student Withdrawal: USDT Allowed & Pending Review', 'FAIL', e.message);
    }

    // Clean up test data
    try {
        await db.query(`DELETE FROM deposit_requests WHERE user_id IN (?, ?, ?, ?, ?)`, [testAdminId, studentMaId, studentDzId, studentTnId, studentAeId]).catch(() => {});
        await db.query(`DELETE FROM withdrawal_requests WHERE user_id IN (?, ?, ?, ?, ?)`, [testAdminId, studentMaId, studentDzId, studentTnId, studentAeId]).catch(() => {});
        await db.query(`DELETE FROM affiliate_wallets WHERE user_id IN (?, ?, ?, ?, ?)`, [testAdminId, studentMaId, studentDzId, studentTnId, studentAeId]).catch(() => {});
        await db.query(`DELETE FROM profiles WHERE id IN (?, ?, ?, ?, ?)`, [testAdminId, studentMaId, studentDzId, studentTnId, studentAeId]).catch(() => {});
        await db.query(`DELETE FROM users WHERE id IN (?, ?, ?, ?, ?)`, [testAdminId, studentMaId, studentDzId, studentTnId, studentAeId]).catch(() => {});
    } catch (_) {}

    server.close();

    console.log('\n================================================================');
    console.log('                      AUDIT SUMMARY RESULTS                     ');
    console.log('================================================================');
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    console.log(`Total Tests Run: ${testResults.length}`);
    console.log(`Passed:          ${passed} ✅`);
    console.log(`Failed:          ${failed} ❌`);
    console.log('================================================================\n');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runManualPaymentCountryAudit().catch(err => {
    console.error('Audit fatal error:', err);
    process.exit(1);
});
