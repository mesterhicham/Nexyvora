const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const db = require('../../config/db');
const { makeRequest } = require('./test_http_client');

async function runPrivilegeEscalationSecurityTests() {
    console.log('\n================================================================');
    console.log('   TEST SUITE: PRIVILEGE ESCALATION & ADMIN PROTECTION AUDIT   ');
    console.log('================================================================');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const studentUserId = crypto.randomUUID();
    const teacherUserId = crypto.randomUUID();
    const adminUserId = crypto.randomUUID();
    const suspendedAdminUserId = crypto.randomUUID();
    const referrerUserId = crypto.randomUUID();

    const studentAffiliateCode = 'NV' + crypto.randomInt(100000, 999999);
    const teacherAffiliateCode = 'NV' + crypto.randomInt(100000, 999999);
    const adminAffiliateCode = 'NV' + crypto.randomInt(100000, 999999);
    const referrerAffiliateCode = 'NV' + crypto.randomInt(100000, 999999);

    const JWT_SECRET = process.env.JWT_SECRET;
    const testSecret = 'SuperAuditAdminSecret2026!';
    const originalAdminSetupSecret = process.env.ADMIN_SETUP_SECRET;
    process.env.ADMIN_SETUP_SECRET = testSecret;

    try {
        // Setup initial users in DB:
        // 1. Referrer (active student)
        await db.query(`
            INSERT INTO users (id, email, password, role, status, token_version, affiliate_code)
            VALUES (?, 'priv_referrer@nexytest.com', 'hash', 'student', 'active', 1, ?)
        `, [referrerUserId, referrerAffiliateCode]);

        // 2. Student
        await db.query(`
            INSERT INTO users (id, email, password, role, status, token_version, affiliate_code)
            VALUES (?, 'priv_student@nexytest.com', 'hash', 'student', 'active', 1, ?)
        `, [studentUserId, studentAffiliateCode]);
        await db.query(`
            INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'student')
        `, [crypto.randomUUID(), studentUserId]);
        await db.query(`
            INSERT INTO profiles (id, email, full_name, city, country, country_code)
            VALUES (?, 'priv_student@nexytest.com', 'Audit Student', 'Algiers', 'Algeria', 'DZ')
        `, [studentUserId]);

        // 3. Approved Teacher
        await db.query(`
            INSERT INTO users (id, email, password, role, status, token_version, affiliate_code)
            VALUES (?, 'priv_teacher@nexytest.com', 'hash', 'teacher', 'active', 1, ?)
        `, [teacherUserId, teacherAffiliateCode]);
        await db.query(`
            INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'teacher')
        `, [crypto.randomUUID(), teacherUserId]);
        await db.query(`
            INSERT INTO teachers (id, user_id, status) VALUES (?, ?, 'approved')
        `, [crypto.randomUUID(), teacherUserId]);
        await db.query(`
            INSERT INTO profiles (id, email, full_name, city, country, country_code)
            VALUES (?, 'priv_teacher@nexytest.com', 'Audit Teacher', 'Casablanca', 'Morocco', 'MA')
        `, [teacherUserId]);

        // 4. Legitimate Admin
        await db.query(`
            INSERT INTO users (id, email, password, role, status, token_version, affiliate_code)
            VALUES (?, 'priv_admin@nexytest.com', 'hash', 'admin', 'active', 1, ?)
        `, [adminUserId, adminAffiliateCode]);
        await db.query(`
            INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')
        `, [crypto.randomUUID(), adminUserId]);
        await db.query(`
            INSERT INTO profiles (id, email, full_name, city, country, country_code)
            VALUES (?, 'priv_admin@nexytest.com', 'Audit Admin', 'Rabat', 'Morocco', 'MA')
        `, [adminUserId]);

        // 5. Suspended Admin
        await db.query(`
            INSERT INTO users (id, email, password, role, status, token_version, affiliate_code)
            VALUES (?, 'priv_suspended_admin@nexytest.com', 'hash', 'admin', 'suspended', 1, ?)
        `, [suspendedAdminUserId, 'NV' + crypto.randomInt(100000, 999999)]);
        await db.query(`
            INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin')
        `, [crypto.randomUUID(), suspendedAdminUserId]);

        // Valid JWT tokens
        const studentToken = jwt.sign({ id: studentUserId, role: 'student', token_version: 1 }, JWT_SECRET, { expiresIn: '1h' });
        const teacherToken = jwt.sign({ id: teacherUserId, role: 'teacher', token_version: 1 }, JWT_SECRET, { expiresIn: '1h' });
        const adminToken = jwt.sign({ id: adminUserId, role: 'admin', token_version: 1 }, JWT_SECRET, { expiresIn: '1h' });
        const suspendedAdminToken = jwt.sign({ id: suspendedAdminUserId, role: 'admin', token_version: 1 }, JWT_SECRET, { expiresIn: '1h' });

        // ---------------------------------------------------------------------------------------------------
        // CASE 1: Teacher attempting to escalate to admin via API
        // ---------------------------------------------------------------------------------------------------
        console.log('\n--- Case 1: Teacher attempting to escalate to admin via API ---');

        // 1a. Teacher directly calling PUT /api/admin/users/:id/role
        const resTeacherRoleEsc = await makeRequest(server, {
            method: 'PUT',
            path: `/api/admin/users/${teacherUserId}/role`,
            headers: { Authorization: `Bearer ${teacherToken}` }
        }, { role: 'admin' });
        assert.strictEqual(resTeacherRoleEsc.statusCode, 403, `Teacher must be forbidden (403) from calling /api/admin/users/:id/role (got ${resTeacherRoleEsc.statusCode})`);

        // 1b. Teacher directly calling PUT /api/admin/users/:id
        const resTeacherUpdateEsc = await makeRequest(server, {
            method: 'PUT',
            path: `/api/admin/users/${teacherUserId}`,
            headers: { Authorization: `Bearer ${teacherToken}` }
        }, { role: 'admin' });
        assert.strictEqual(resTeacherUpdateEsc.statusCode, 403, `Teacher must be forbidden (403) from calling /api/admin/users/:id (got ${resTeacherUpdateEsc.statusCode})`);

        // 1c. Teacher trying to send role: admin via profile update
        const resTeacherProfileEsc = await makeRequest(server, {
            method: 'PUT',
            path: '/api/user/profile',
            headers: { Authorization: `Bearer ${teacherToken}` }
        }, { role: 'admin', full_name: 'Hacked Teacher' });
        assert.strictEqual(resTeacherProfileEsc.statusCode, 403, `Teacher profile role update must be forbidden (403) (got ${resTeacherProfileEsc.statusCode})`);

        // Verify DB integrity for teacher
        const [teacherDbRow] = await db.query('SELECT role FROM users WHERE id = ?', [teacherUserId]);
        assert.strictEqual(teacherDbRow[0].role, 'teacher', 'Teacher role in database MUST NOT change');
        const [teacherRoleRow] = await db.query('SELECT role FROM user_roles WHERE user_id = ?', [teacherUserId]);
        assert.strictEqual(teacherRoleRow[0].role, 'teacher', 'Teacher user_roles in database MUST NOT change');
        console.log('  [PASS] Case 1: Teacher cannot escalate role to admin via any API endpoint');

        // ---------------------------------------------------------------------------------------------------
        // CASE 2: Student or member attempting to change role in profile update
        // ---------------------------------------------------------------------------------------------------
        console.log('\n--- Case 2: Student attempting to change role in profile update ---');

        // 2a. role: admin
        const resStudentRoleAdmin = await makeRequest(server, {
            method: 'PUT',
            path: '/api/user/profile',
            headers: { Authorization: `Bearer ${studentToken}` }
        }, { role: 'admin' });
        assert.strictEqual(resStudentRoleAdmin.statusCode, 403, `Student role: admin must be rejected with 403 (got ${resStudentRoleAdmin.statusCode})`);

        // 2b. Case variations: Role, ROLE
        const resStudentRoleUpper = await makeRequest(server, {
            method: 'PUT',
            path: '/api/user/profile',
            headers: { Authorization: `Bearer ${studentToken}` }
        }, { Role: 'admin' });
        assert.strictEqual(resStudentRoleUpper.statusCode, 403, `Student Role: admin must be rejected with 403 (got ${resStudentRoleUpper.statusCode})`);

        // 2c. role: teacher
        const resStudentRoleTeacher = await makeRequest(server, {
            method: 'PUT',
            path: '/api/user/profile',
            headers: { Authorization: `Bearer ${studentToken}` }
        }, { role: 'teacher' });
        assert.strictEqual(resStudentRoleTeacher.statusCode, 403, `Student role: teacher must be rejected with 403 (got ${resStudentRoleTeacher.statusCode})`);

        // Verify DB integrity for student
        const [studentDbRow] = await db.query('SELECT role FROM users WHERE id = ?', [studentUserId]);
        assert.strictEqual(studentDbRow[0].role, 'student', 'Student role in database MUST remain student');
        console.log('  [PASS] Case 2: Student cannot change role in profile update request');

        // ---------------------------------------------------------------------------------------------------
        // CASE 3: User sending role: admin during registration
        // ---------------------------------------------------------------------------------------------------
        console.log('\n--- Case 3: User sending role: admin during registration ---');

        // 3a. Plain role: admin
        const regAttemptEmail1 = `reg_hacker_admin_${Date.now()}@nexytest.com`;
        const resRegAdmin = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/register'
        }, {
            fullName: 'Malicious Admin Wannabe',
            email: regAttemptEmail1,
            password: 'StrongPassword123!',
            role: 'admin',
            referralCode: referrerAffiliateCode
        });
        assert.strictEqual(resRegAdmin.statusCode, 403, `Public registration with role: admin must return 403 (got ${resRegAdmin.statusCode})`);

        // 3b. role: ' admin ' with whitespace / mixed case
        const regAttemptEmail2 = `reg_hacker_space_${Date.now()}@nexytest.com`;
        const resRegSpace = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/register'
        }, {
            fullName: 'Malicious Admin Whitespace',
            email: regAttemptEmail2,
            password: 'StrongPassword123!',
            role: '  ADMIN  ',
            referralCode: referrerAffiliateCode
        });
        assert.strictEqual(resRegSpace.statusCode, 403, `Public registration with role: '  ADMIN  ' must return 403 (got ${resRegSpace.statusCode})`);

        // 3c. role: 'teacher'
        const regAttemptEmail3 = `reg_hacker_teacher_${Date.now()}@nexytest.com`;
        const resRegTeacher = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/register'
        }, {
            fullName: 'Malicious Teacher Wannabe',
            email: regAttemptEmail3,
            password: 'StrongPassword123!',
            role: 'teacher',
            referralCode: referrerAffiliateCode
        });
        assert.strictEqual(resRegTeacher.statusCode, 403, `Public registration with role: teacher must return 403 (got ${resRegTeacher.statusCode})`);

        // Verify none of these malicious emails were inserted in the DB
        const [hackerDbRows] = await db.query(
            'SELECT email, role FROM users WHERE email IN (?, ?, ?)',
            [regAttemptEmail1, regAttemptEmail2, regAttemptEmail3]
        );
        assert.strictEqual(hackerDbRows.length, 0, 'No user accounts should be inserted in DB for rejected registrations');
        console.log('  [PASS] Case 3: Public registration strictly rejects admin, teacher, or whitespace variations');

        // ---------------------------------------------------------------------------------------------------
        // CASE 4: Regular user calling admin endpoints directly
        // ---------------------------------------------------------------------------------------------------
        console.log('\n--- Case 4: Regular user calling admin endpoints directly ---');

        const adminEndpoints = [
            { method: 'GET', path: '/api/admin/users' },
            { method: 'POST', path: '/api/admin/settings', body: { site_name: 'Hacked' } },
            { method: 'GET', path: '/api/admin/wallets' },
            { method: 'POST', path: '/api/academic/programs', body: { name: 'Hacked Program' } },
            { method: 'GET', path: '/api/admin/promised-packages' },
            { method: 'GET', path: '/api/admin/ipn-logs' },
            { method: 'GET', path: '/api/user/stats/admin' },
            { method: 'GET', path: '/api/founders/admin' },
            { method: 'GET', path: '/api/bonus-pools/admin' }
        ];

        for (const ep of adminEndpoints) {
            const res = await makeRequest(server, {
                method: ep.method,
                path: ep.path,
                headers: { Authorization: `Bearer ${studentToken}` }
            }, ep.body);
            assert.strictEqual(
                res.statusCode,
                403,
                `Expected 403 for student calling ${ep.method} ${ep.path} (got ${res.statusCode})`
            );
        }
        console.log(`  [PASS] Case 4: All ${adminEndpoints.length} tested administrative endpoints strictly returned 403 Forbidden`);

        // ---------------------------------------------------------------------------------------------------
        // CASE 5: Attempting to reuse first-admin setup route after admin already exists
        // ---------------------------------------------------------------------------------------------------
        console.log('\n--- Case 5: Attempting to reuse first-admin setup route after admin exists ---');

        // 5a. checkAdminExists returns true
        const resCheckAdmin = await makeRequest(server, {
            method: 'GET',
            path: '/api/auth/check-admin'
        });
        assert.strictEqual(resCheckAdmin.statusCode, 200);
        assert.strictEqual(resCheckAdmin.json.hasAdmin, true, 'hasAdmin must be true when admin accounts exist');

        // 5b. Calling setup-first-admin with correct setup secret by student -> must return 403 ADMIN_ALREADY_EXISTS
        const resSetupFirstAdmin = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/setup-first-admin',
            headers: { Authorization: `Bearer ${studentToken}` }
        }, {
            setup_secret: testSecret
        });
        assert.strictEqual(
            resSetupFirstAdmin.statusCode,
            403,
            `Expected 403 when reusing setup-first-admin (got ${resSetupFirstAdmin.statusCode})`
        );
        assert.strictEqual(
            resSetupFirstAdmin.json.code,
            'ADMIN_ALREADY_EXISTS',
            'Expected error code ADMIN_ALREADY_EXISTS'
        );

        // 5c. Calling alias /setup-admin by teacher -> must return 403 ADMIN_ALREADY_EXISTS
        const resSetupAdmin = await makeRequest(server, {
            method: 'POST',
            path: '/api/auth/setup-admin',
            headers: { Authorization: `Bearer ${teacherToken}` }
        }, {
            setupSecret: testSecret
        });
        assert.strictEqual(
            resSetupAdmin.statusCode,
            403,
            `Expected 403 when reusing setup-admin alias (got ${resSetupAdmin.statusCode})`
        );
        assert.strictEqual(
            resSetupAdmin.json.code,
            'ADMIN_ALREADY_EXISTS',
            'Expected error code ADMIN_ALREADY_EXISTS'
        );

        // Verify student and teacher roles still remain untouched in DB
        const [sCheck] = await db.query('SELECT role FROM users WHERE id = ?', [studentUserId]);
        assert.strictEqual(sCheck[0].role, 'student', 'Student must not have been promoted');
        const [tCheck] = await db.query('SELECT role FROM users WHERE id = ?', [teacherUserId]);
        assert.strictEqual(tCheck[0].role, 'teacher', 'Teacher must not have been promoted');
        console.log('  [PASS] Case 5: Setup first-admin route is permanently closed (403 ADMIN_ALREADY_EXISTS)');

        // ---------------------------------------------------------------------------------------------------
        // CASE 6: Old JWT or suspended account attempting to access admin routes
        // ---------------------------------------------------------------------------------------------------
        console.log('\n--- Case 6: Old JWT or suspended account attempting to access admin routes ---');

        // 6a. Suspended admin token -> must return 403
        const resSuspendedAdmin = await makeRequest(server, {
            method: 'GET',
            path: '/api/admin/users',
            headers: { Authorization: `Bearer ${suspendedAdminToken}` }
        });
        assert.strictEqual(
            resSuspendedAdmin.statusCode,
            403,
            `Suspended admin must receive 403 (got ${resSuspendedAdmin.statusCode})`
        );
        console.log('  [PASS] 6a. Suspended admin account blocked from admin routes (403)');

        // 6b. Stale token_version: Admin token with token_version = 0 while DB has 1
        const staleToken = jwt.sign(
            { id: adminUserId, role: 'admin', token_version: 0 },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        const resStaleToken = await makeRequest(server, {
            method: 'GET',
            path: '/api/admin/users',
            headers: { Authorization: `Bearer ${staleToken}` }
        });
        assert.strictEqual(
            resStaleToken.statusCode,
            401,
            `Stale token_version must return 401 SESSION_REVOKED (got ${resStaleToken.statusCode})`
        );
        assert.strictEqual(resStaleToken.json.code, 'SESSION_REVOKED');
        console.log('  [PASS] 6b. Stale JWT token immediately rejected (401 SESSION_REVOKED)');

        // 6c. Forged JWT: Token claims role: 'admin', but DB record has role: 'student'
        const forgedToken = jwt.sign(
            { id: studentUserId, role: 'admin', token_version: 1 },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        const resForgedToken = await makeRequest(server, {
            method: 'GET',
            path: '/api/admin/users',
            headers: { Authorization: `Bearer ${forgedToken}` }
        });
        assert.strictEqual(
            resForgedToken.statusCode,
            403,
            `Forged token must be rejected based on DB live role (got ${resForgedToken.statusCode})`
        );
        console.log('  [PASS] 6c. Forged JWT claiming admin role rejected (middleware enforces live DB role)');

        // ---------------------------------------------------------------------------------------------------
        // CASE 7: Role modification via Mass Assignment or extra sensitive fields
        // ---------------------------------------------------------------------------------------------------
        console.log('\n--- Case 7: Mass Assignment & Sensitive Fields Tampering ---');

        const massAssignmentPayloads = [
            { is_admin: true },
            { isAdmin: true },
            { status: 'active' },
            { user_status: 'admin' },
            { token_version: 99 },
            { account_role: 'ADMIN' },
            { permissions: ['*'] },
            { user_roles: ['admin'] },
            { affiliate_code: 'NV_HACK' },
            { referrer_id: crypto.randomUUID() },
            { email_verified: 1 }
        ];

        for (const payload of massAssignmentPayloads) {
            const resMass = await makeRequest(server, {
                method: 'PUT',
                path: '/api/user/profile',
                headers: { Authorization: `Bearer ${studentToken}` }
            }, payload);
            assert.strictEqual(
                resMass.statusCode,
                403,
                `Expected 403 when sending sensitive field ${JSON.stringify(payload)} (got ${resMass.statusCode})`
            );
            assert.strictEqual(resMass.json.code, 'FORBIDDEN_FIELD_MODIFICATION');
        }

        // Verify that database remained completely unchanged
        const [postCheckStudent] = await db.query(
            'SELECT role, status, token_version, affiliate_code, referrer_id FROM users WHERE id = ?',
            [studentUserId]
        );
        assert.strictEqual(postCheckStudent[0].role, 'student');
        assert.strictEqual(postCheckStudent[0].token_version, 1);
        assert.strictEqual(postCheckStudent[0].affiliate_code, studentAffiliateCode);
        console.log(`  [PASS] Case 7: All ${massAssignmentPayloads.length} mass-assignment attempts blocked (403 FORBIDDEN_FIELD_MODIFICATION)`);

        console.log('\n================================================================');
        console.log('>>> ALL PRIVILEGE ESCALATION SECURITY TESTS PASSED (7/7)! <<<');
        console.log('================================================================\n');
        return true;
    } finally {
        // Restore environment
        if (originalAdminSetupSecret !== undefined) {
            process.env.ADMIN_SETUP_SECRET = originalAdminSetupSecret;
        } else {
            delete process.env.ADMIN_SETUP_SECRET;
        }

        // Cleanup test accounts
        await db.query('DELETE FROM teachers WHERE user_id = ?', [teacherUserId]).catch(() => {});
        await db.query('DELETE FROM profiles WHERE id IN (?, ?, ?, ?)', [studentUserId, teacherUserId, adminUserId, suspendedAdminUserId]).catch(() => {});
        await db.query('DELETE FROM user_roles WHERE user_id IN (?, ?, ?, ?)', [studentUserId, teacherUserId, adminUserId, suspendedAdminUserId]).catch(() => {});
        await db.query('DELETE FROM users WHERE id IN (?, ?, ?, ?, ?)', [studentUserId, teacherUserId, adminUserId, suspendedAdminUserId, referrerUserId]).catch(() => {});
        await new Promise((resolve) => server.close(resolve));
    }
}

if (require.main === module) {
    runPrivilegeEscalationSecurityTests().then(() => process.exit(0)).catch((err) => {
        console.error('\n[TEST FAILURE]:', err);
        process.exit(1);
    });
}

module.exports = runPrivilegeEscalationSecurityTests;
