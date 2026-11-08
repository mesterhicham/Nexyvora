const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const db = require('../../config/db');
const { makeRequest } = require('./test_http_client');
const { validateReceiptUrl, isSafeHttpUrl } = require('../../services/uploadUrlPolicy');

/**
 * Covers the November 2026 hardening: audited impersonation, receipt URL policy,
 * strict country detection for money movements and the profile country lock.
 */
async function runSecurityHardeningTests() {
    console.log('\n======================================================');
    console.log('   TEST SUITE: SECURITY HARDENING (REAL HTTP)          ');
    console.log('======================================================');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const adminId = crypto.randomUUID();
    const otherAdminId = crypto.randomUUID();
    const studentId = crypto.randomUUID();
    const dzStudentId = crypto.randomUUID();
    const code = () => 'NV' + crypto.randomInt(100000, 999999);
    const sign = (payload) => jwt.sign({ token_version: 1, ...payload }, process.env.JWT_SECRET, { expiresIn: '1h' });

    try {
        await db.query(`
            INSERT INTO users (id, email, password, role, status, token_version, affiliate_code, kyc_status)
            VALUES
            (?, 'hardening_admin@test.com', 'hash', 'admin', 'active', 1, ?, 'unverified'),
            (?, 'hardening_admin2@test.com', 'hash', 'admin', 'active', 1, ?, 'unverified'),
            (?, 'hardening_student@test.com', 'hash', 'student', 'active', 1, ?, 'unverified'),
            (?, 'hardening_dz@test.com', 'hash', 'student', 'active', 1, ?, 'verified')
        `, [adminId, code(), otherAdminId, code(), studentId, code(), dzStudentId, code()]);
        await db.query(`
            INSERT INTO profiles (id, email, full_name, country, country_code)
            VALUES (?, 'hardening_dz@test.com', 'DZ Student', 'Algeria', 'DZ')
        `, [dzStudentId]);

        const adminToken = sign({ id: adminId, role: 'admin' });
        const studentToken = sign({ id: studentId, role: 'student' });
        const dzToken = sign({ id: dzStudentId, role: 'student' });

        // 1. Unit checks of the URL policy
        assert.strictEqual(validateReceiptUrl('javascript:alert(1)', studentId).ok, false);
        assert.strictEqual(validateReceiptUrl('data:text/html,<script>', studentId).ok, false);
        assert.strictEqual(validateReceiptUrl(`/api/upload/secure/sec_${dzStudentId}_1.png`, studentId).ok, false);
        assert.strictEqual(validateReceiptUrl('/uploads/file-1.png', studentId, { allowPublic: false }).ok, false);
        const okReceipt = validateReceiptUrl(`https://evil.example/api/upload/secure/sec_${studentId}_1.png`, studentId);
        assert.strictEqual(okReceipt.ok, true);
        assert.strictEqual(okReceipt.value, `/api/upload/secure/sec_${studentId}_1.png`, 'Host is stripped from stored URL');
        assert.strictEqual(isSafeHttpUrl('javascript:alert(1)'), false);
        assert.strictEqual(isSafeHttpUrl('https://drive.google.com/x'), true);
        console.log('  [PASS] 1. Receipt / link URL policy rejects script schemes and foreign private files');

        // 2. Impersonating an admin is refused
        const resImpAdmin = await makeRequest(server, {
            method: 'POST', path: `/api/admin/users/${otherAdminId}/impersonate`, headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.strictEqual(resImpAdmin.statusCode, 403, `Expected 403 when impersonating an admin (got ${resImpAdmin.statusCode})`);
        console.log('  [PASS] 2. Admin accounts cannot be impersonated');

        // 3. Impersonating a student: short-lived, tagged and audited
        const resImp = await makeRequest(server, {
            method: 'POST', path: `/api/admin/users/${studentId}/impersonate`, headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.strictEqual(resImp.statusCode, 200, `Expected 200 (got ${resImp.statusCode}: ${resImp.body})`);
        const decoded = jwt.decode(resImp.json.token);
        assert.strictEqual(decoded.impersonated_by, adminId, 'Token carries impersonated_by');
        assert.ok(decoded.exp - decoded.iat <= 3600, 'Impersonation token lives at most 1 hour');
        const [audit] = await db.query(
            "SELECT id FROM admin_audit_logs WHERE admin_id = ? AND target_user_id = ? AND action = 'impersonate_user'",
            [adminId, studentId]
        );
        assert.strictEqual(audit.length, 1, 'Impersonation written to admin_audit_logs');
        console.log('  [PASS] 3. Impersonation token is 1h, tagged with impersonated_by and audited');

        const resImpStudentRoute = await makeRequest(server, {
            method: 'POST', path: `/api/academic/students/${studentId}/impersonate`, headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.ok([200, 404].includes(resImpStudentRoute.statusCode), 'Academic impersonation route uses the same service');
        if (resImpStudentRoute.statusCode === 200) {
            assert.strictEqual(jwt.decode(resImpStudentRoute.json.token).impersonated_by, adminId);
        }

        // 4. Sensitive actions blocked during impersonation
        const resPwd = await makeRequest(server, {
            method: 'POST', path: '/api/user/change-password', headers: { Authorization: `Bearer ${resImp.json.token}` }
        }, { currentPassword: 'x', newPassword: 'NewPassword123!' });
        assert.strictEqual(resPwd.statusCode, 403, `Password change blocked while impersonating (got ${resPwd.statusCode})`);
        assert.strictEqual(resPwd.json.code, 'IMPERSONATION_FORBIDDEN');
        const resPayout = await makeRequest(server, {
            method: 'POST', path: '/api/affiliate/payout-settings', headers: { Authorization: `Bearer ${resImp.json.token}` }
        }, { paypal_email: 'attacker@example.com' });
        assert.strictEqual(resPayout.statusCode, 403, 'Payout destination change blocked while impersonating');
        console.log('  [PASS] 4. Password and payout changes blocked during impersonation');

        // 5. Receipt URL validation on deposits
        const resXss = await makeRequest(server, {
            method: 'POST', path: '/api/affiliate/deposit', headers: { Authorization: `Bearer ${studentToken}` }
        }, { amount: 10, paymentMethod: 'bank_transfer', paymentReference: 'REF-1', receiptUrl: 'javascript:alert(document.cookie)' });
        assert.strictEqual(resXss.statusCode, 400);
        assert.strictEqual(resXss.json.code, 'INVALID_RECEIPT_URL');
        const resForeign = await makeRequest(server, {
            method: 'POST', path: '/api/affiliate/deposit', headers: { Authorization: `Bearer ${studentToken}` }
        }, { amount: 10, paymentMethod: 'bank_transfer', paymentReference: 'REF-1', receiptUrl: `/api/upload/secure/sec_${dzStudentId}_x.png` });
        assert.strictEqual(resForeign.statusCode, 400);
        console.log('  [PASS] 5. Deposits reject script URLs and other users\' private receipts');

        // 6. Strict country: ?country= cannot lift the DZ USDT ban
        const resDzUsdt = await makeRequest(server, {
            method: 'POST', path: '/api/affiliate/deposit?country=US', headers: { Authorization: `Bearer ${dzToken}`, 'x-country': 'US' }
        }, { amount: 10, paymentMethod: 'usdt', paymentReference: 'TX-1', receiptUrl: '' });
        assert.strictEqual(resDzUsdt.statusCode, 403, `Expected 403 for DZ USDT deposit with spoofed country (got ${resDzUsdt.statusCode})`);
        console.log('  [PASS] 6. Spoofed ?country= and x-country headers cannot bypass the DZ USDT restriction');

        // 6b. Algeria: crypto package purchase refused, bank + PayPal offered, crypto never listed
        const resDzPkg = await makeRequest(server, {
            method: 'POST', path: '/api/packages/purchase?country=US', headers: { Authorization: `Bearer ${dzToken}` }
        }, { packageId: 'any', paymentMethod: 'usdt', paymentReference: 'TX-2' });
        assert.strictEqual(resDzPkg.statusCode, 403, `Expected 403 for DZ USDT package purchase (got ${resDzPkg.statusCode}: ${resDzPkg.body})`);
        assert.strictEqual(resDzPkg.json.code, 'CRYPTO_NOT_ALLOWED');

        const resDzMethods = await makeRequest(server, {
            method: 'GET', path: '/api/affiliate/payment-methods?mode=deposit&country=US', headers: { Authorization: `Bearer ${dzToken}` }
        });
        assert.strictEqual(resDzMethods.statusCode, 200, `Expected 200 listing methods (got ${resDzMethods.statusCode})`);
        const listed = Array.isArray(resDzMethods.json) ? resDzMethods.json : (resDzMethods.json.methods || resDzMethods.json.data || []);
        assert.ok(!listed.some(m => /crypto|nowpayments|usdt/i.test(`${m.type} ${m.provider} ${m.currency}`)), 'No crypto method listed for DZ');

        const currencyService = require('../../services/currencyService');
        const dzRule = await currencyService.getRuleForCountry('DZ');
        assert.ok(!dzRule.usdt_enabled, 'DZ rule keeps USDT disabled');
        assert.ok(dzRule.bank_transfer_enabled && dzRule.paypal_enabled, 'DZ rule enables local bank and PayPal');
        console.log('  [PASS] 6b. Algeria: no crypto package purchase or listing, bank transfer and PayPal enabled');

        // 6c. Methods disabled in the Country Currency page are refused, enabled ones accepted
        const dzCard = await makeRequest(server, {
            method: 'POST', path: '/api/affiliate/deposit', headers: { Authorization: `Bearer ${dzToken}` }
        }, { amount: 10, paymentMethod: 'Credit / Debit Card (Online Gateway)', paymentReference: 'REF-C', receiptUrl: '' });
        assert.strictEqual(dzCard.statusCode, 403, `Card deposit must be refused when Stripe is off for DZ (got ${dzCard.statusCode}: ${dzCard.body})`);
        assert.strictEqual(dzCard.json.code, 'METHOD_NOT_ALLOWED');

        const dzBank = await makeRequest(server, {
            method: 'POST', path: '/api/affiliate/deposit', headers: { Authorization: `Bearer ${dzToken}` }
        }, { amount: 10, paymentMethod: 'تحويل بنكي محلي (الجزائر - DZD)', paymentReference: 'REF-B', receiptUrl: '' });
        assert.notStrictEqual(dzBank.json?.code, 'METHOD_NOT_ALLOWED', 'Local bank deposit allowed for DZ');

        const dzForeignId = await makeRequest(server, {
            method: 'POST', path: '/api/packages/purchase', headers: { Authorization: `Bearer ${dzToken}` }
        }, { packageId: 'any', paymentMethod: 'bank_transfer', paymentMethodId: 'not-an-allowed-method' });
        assert.strictEqual(dzForeignId.statusCode, 403, 'Unknown / disallowed method id refused');

        const dzStripePkg = await makeRequest(server, {
            method: 'POST', path: '/api/packages/purchase', headers: { Authorization: `Bearer ${dzToken}` }
        }, { packageId: 'any', paymentMethod: 'card_gateway' });
        assert.strictEqual(dzStripePkg.statusCode, 403, 'Card package purchase refused when Stripe is off for DZ');
        console.log('  [PASS] 6c. Deposit and purchase methods follow the Country Currency toggles');

        // 6d. Profile says Morocco but the phone is Algerian (+213): Algerian rules apply
        await db.query(
            "INSERT INTO profiles (id, email, full_name, country, country_code, city, whatsapp_number) VALUES (?, 'hardening_student@test.com', 'MA profile DZ phone', 'Morocco', 'MA', 'Bouira', '213794000000')",
            [studentId]
        );
        const resMaDzMethods = await makeRequest(server, {
            method: 'GET', path: '/api/affiliate/payment-methods?mode=deposit', headers: { Authorization: `Bearer ${studentToken}` }
        });
        assert.strictEqual(resMaDzMethods.json.detectedCountry, 'DZ', `Expected DZ rules for a +213 phone (got ${resMaDzMethods.json.detectedCountry})`);
        assert.ok(!(resMaDzMethods.json.paymentMethods || []).some(m => /crypto|nowpayments|usdt/i.test(`${m.type} ${m.provider} ${m.currency}`)), 'No crypto listed');
        const resMaDzUsdt = await makeRequest(server, {
            method: 'POST', path: '/api/affiliate/deposit', headers: { Authorization: `Bearer ${studentToken}` }
        }, { amount: 10, paymentMethod: 'nowpayments_crypto', paymentReference: 'TX-3', receiptUrl: '' });
        assert.strictEqual(resMaDzUsdt.statusCode, 403, `USDT deposit refused for +213 phone (got ${resMaDzUsdt.statusCode})`);
        const resMaDzRule = await makeRequest(server, {
            method: 'GET', path: '/api/currency/my-rule', headers: { Authorization: `Bearer ${studentToken}` }
        });
        const myRule = resMaDzRule.json.rule || resMaDzRule.json;
        assert.strictEqual(myRule.country_code, 'DZ', `Displayed currency rule must be DZ (got ${myRule.country_code})`);
        console.log('  [PASS] 6d. Morocco profile with an Algerian phone number gets Algerian rules (no USDT, DZ bank)');

        // 7. Country locked after KYC verification
        const resCountry = await makeRequest(server, {
            method: 'PUT', path: '/api/user/profile', headers: { Authorization: `Bearer ${dzToken}` }
        }, { country: 'France' });
        assert.strictEqual(resCountry.statusCode, 403, `Expected 403 COUNTRY_LOCKED (got ${resCountry.statusCode}: ${resCountry.body})`);
        assert.strictEqual(resCountry.json.code, 'COUNTRY_LOCKED');
        console.log('  [PASS] 7. Verified users cannot change their country themselves');

        // 8. Unsafe assignment link rejected
        const resAssign = await makeRequest(server, {
            method: 'POST', path: '/api/student/submit-assignment', headers: { Authorization: `Bearer ${studentToken}` }
        }, { assignment_id: 'x', submission_url: 'javascript:alert(1)' });
        assert.strictEqual(resAssign.statusCode, 400, `Expected 400 for unsafe assignment link (got ${resAssign.statusCode})`);
        console.log('  [PASS] 8. Unsafe assignment submission link rejected');

        // 9. Manual wallet adjustment works with the frontend payload and is audited
        await db.query(
            'INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn) VALUES (?, ?, 0, 0, 0, 0)',
            [crypto.randomUUID(), studentId]
        );
        const resAdjust = await makeRequest(server, {
            method: 'POST', path: '/api/admin/wallets/adjust', headers: { Authorization: `Bearer ${adminToken}` }
        }, { userId: studentId, action: 'credit', amount: 15, note: 'test credit' });
        assert.strictEqual(resAdjust.statusCode, 200, `Expected 200 for wallet adjust (got ${resAdjust.statusCode}: ${resAdjust.body})`);
        const [adjAudit] = await db.query(
            "SELECT id FROM admin_audit_logs WHERE admin_id = ? AND target_user_id = ? AND action = 'wallet_adjust'",
            [adminId, studentId]
        );
        assert.strictEqual(adjAudit.length, 1, 'Wallet adjustment written to admin_audit_logs');
        console.log('  [PASS] 9. Manual wallet adjustment succeeds and is audited');

        console.log('\n>>> ALL SECURITY HARDENING TESTS PASSED! <<<\n');
        return true;
    } finally {
        const ids = [adminId, otherAdminId, studentId, dzStudentId];
        await db.query('DELETE FROM admin_audit_logs WHERE admin_id IN (?, ?)', [adminId, otherAdminId]).catch(() => {});
        await db.query('DELETE FROM transactions WHERE user_id IN (?, ?, ?, ?)', ids).catch(() => {});
        await db.query('DELETE FROM notifications WHERE user_id IN (?, ?, ?, ?)', ids).catch(() => {});
        await db.query('DELETE FROM user_wallets WHERE user_id IN (?, ?, ?, ?)', ids).catch(() => {});
        await db.query('DELETE FROM profiles WHERE id IN (?, ?, ?, ?)', ids).catch(() => {});
        await db.query('DELETE FROM students WHERE user_id IN (?, ?, ?, ?)', ids).catch(() => {});
        await db.query('DELETE FROM users WHERE id IN (?, ?, ?, ?)', ids).catch(() => {});
        await new Promise((resolve) => server.close(resolve));
    }
}

if (require.main === module) {
    runSecurityHardeningTests().then(() => process.exit(0)).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = runSecurityHardeningTests;
