const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const db = require('../../config/db');
const { makeRequest } = require('./test_http_client');

async function runRbacTests() {
    console.log('\n======================================================');
    console.log('   TEST SUITE 2: RBAC & TEACHER APPROVAL (REAL HTTP)  ');
    console.log('======================================================');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const studentId = crypto.randomUUID();
    const pendingTeacherUserId = crypto.randomUUID();
    const approvedTeacherUserId = crypto.randomUUID();
    const adminId = crypto.randomUUID();

    try {
        // Create test tokens
        const studentToken = jwt.sign(
            { id: studentId, role: 'student', token_version: 1 },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const pendingTeacherToken = jwt.sign(
            { id: pendingTeacherUserId, role: 'teacher', token_version: 1 },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const approvedTeacherToken = jwt.sign(
            { id: approvedTeacherUserId, role: 'teacher', token_version: 1 },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        const adminToken = jwt.sign(
            { id: adminId, role: 'admin', token_version: 1 },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Insert test accounts in DB
        await db.query(`
            INSERT INTO users (id, email, password, role, status, token_version, affiliate_code)
            VALUES 
            (?, 'rbac_student@test.com', 'hash', 'student', 'active', 1, ?),
            (?, 'rbac_pteacher@test.com', 'hash', 'teacher', 'active', 1, ?),
            (?, 'rbac_ateacher@test.com', 'hash', 'teacher', 'active', 1, ?),
            (?, 'rbac_admin@test.com', 'hash', 'admin', 'active', 1, ?)
        `, [
            studentId, 'NV' + crypto.randomInt(100000, 999999),
            pendingTeacherUserId, 'NV' + crypto.randomInt(100000, 999999),
            approvedTeacherUserId, 'NV' + crypto.randomInt(100000, 999999),
            adminId, 'NV' + crypto.randomInt(100000, 999999)
        ]);

        // Insert teachers status (one pending, one approved)
        await db.query(`
            INSERT INTO teachers (id, user_id, status)
            VALUES (?, ?, 'pending'), (?, ?, 'approved')
        `, [crypto.randomUUID(), pendingTeacherUserId, crypto.randomUUID(), approvedTeacherUserId]);

        // -------------------------------------------------------------
        // 1. Student accessing Admin route -> 403
        // -------------------------------------------------------------
        console.log('\n--- 1. Testing Admin Route Protection ---');
        const resStudentAdmin = await makeRequest(server, {
            method: 'GET',
            path: '/api/admin/users',
            headers: { Authorization: `Bearer ${studentToken}` }
        });
        assert.strictEqual(
            resStudentAdmin.statusCode,
            403,
            `Expected 403 for student accessing /api/admin/users (got ${resStudentAdmin.statusCode})`
        );
        console.log('  [PASS] 1. Student forbidden (403) from accessing admin routes');

        // -------------------------------------------------------------
        // 2. Teacher with PENDING status accessing Teacher API -> 403 (P1 #6)
        // -------------------------------------------------------------
        console.log('\n--- 2. Testing Teacher Approval Guard ---');
        const resPendingTeacher = await makeRequest(server, {
            method: 'GET',
            path: '/api/teacher/formation-progress',
            headers: { Authorization: `Bearer ${pendingTeacherToken}` }
        });
        assert.strictEqual(
            resPendingTeacher.statusCode,
            403,
            `Expected 403 for pending teacher accessing /api/teacher/formation-progress (got ${resPendingTeacher.statusCode})`
        );
        assert.strictEqual(
            resPendingTeacher.json.code,
            'TEACHER_APPROVAL_REQUIRED',
            'Expected TEACHER_APPROVAL_REQUIRED error code'
        );
        console.log('  [PASS] 2. Pending teacher blocked (403 TEACHER_APPROVAL_REQUIRED)');

        // -------------------------------------------------------------
        // 3. Teacher with APPROVED status accessing Teacher API -> Authorized
        // -------------------------------------------------------------
        const resApprovedTeacher = await makeRequest(server, {
            method: 'GET',
            path: '/api/teacher/formation-progress',
            headers: { Authorization: `Bearer ${approvedTeacherToken}` }
        });
        assert.strictEqual(
            resApprovedTeacher.statusCode,
            200,
            `Expected 200 for approved teacher accessing /api/teacher/formation-progress (got ${resApprovedTeacher.statusCode})`
        );
        console.log('  [PASS] 3. Approved teacher successfully authorized on /api/teacher/formation-progress');

        // -------------------------------------------------------------
        // 4. Admin authorized on Admin routes
        // -------------------------------------------------------------
        console.log('\n--- 4. Testing Admin Route Authorization ---');
        const resAdminUsers = await makeRequest(server, {
            method: 'GET',
            path: '/api/admin/users',
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        assert.strictEqual(
            resAdminUsers.statusCode,
            200,
            `Expected 200 for admin accessing /api/admin/users (got ${resAdminUsers.statusCode})`
        );
        console.log('  [PASS] 4. Admin successfully authorized on /api/admin/users');

        console.log('\n>>> ALL RBAC & TEACHER APPROVAL TESTS PASSED! <<<\n');
        return true;
    } finally {
        await db.query('DELETE FROM teachers WHERE user_id IN (?, ?)', [pendingTeacherUserId, approvedTeacherUserId]).catch(() => {});
        await db.query('DELETE FROM users WHERE id IN (?, ?, ?, ?)', [studentId, pendingTeacherUserId, approvedTeacherUserId, adminId]).catch(() => {});
        await new Promise((resolve) => server.close(resolve));
    }
}

if (require.main === module) {
    runRbacTests().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runRbacTests;
