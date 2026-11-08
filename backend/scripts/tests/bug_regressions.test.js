const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const db = require('../../config/db');
const { makeRequest } = require('./test_http_client');

/**
 * Regressions for errors seen in the production log (November 2026):
 *  - founder grant inserted notifications.message (column is content);
 *  - Assign Courses failed on duplicated course ids;
 *  - granting a package enrolled courses with users.id instead of students.id;
 *  - rejecting a deposit with an emoji in the reason ("Illegal mix of collations");
 *  - assignment submission and news creation wrote columns missing from the schema.
 */
async function runBugRegressionTests() {
    console.log('\n======================================================');
    console.log('   TEST SUITE: PRODUCTION BUG REGRESSIONS (REAL HTTP)  ');
    console.log('======================================================');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const ids = {
        admin: crypto.randomUUID(), member: crypto.randomUUID(), pkg: crypto.randomUUID(),
        formation: crypto.randomUUID(), userPkg: crypto.randomUUID(), assignment: crypto.randomUUID(),
        student: crypto.randomUUID(),
    };
    const users = [ids.admin, ids.member];
    const sign = (id, role) => jwt.sign({ id, role, token_version: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const tAdmin = sign(ids.admin, 'admin');
    const tMember = sign(ids.member, 'student');
    const call = (token, method, path, body) => makeRequest(server, { method, path, headers: { Authorization: `Bearer ${token}` } }, body);
    let newsId = null;

    try {
        await db.query(
            "INSERT INTO users (id, email, password, role, status, token_version, affiliate_code) VALUES (?, ?, 'x', 'admin', 'active', 1, ?), (?, ?, 'x', 'student', 'active', 1, ?)",
            [ids.admin, `reg_admin_${Date.now()}@test.com`, 'NVR' + crypto.randomInt(100000, 999999), ids.member, `reg_member_${Date.now()}@test.com`, 'NVR' + crypto.randomInt(100000, 999999)]
        );
        await db.query("INSERT INTO profiles (id, email, full_name) VALUES (?, 'reg_member@test.com', 'Regression Member')", [ids.member]);
        // Throw-away package: Assign Courses replaces every course of the package it targets
        await db.query("INSERT INTO packages (id, name, slug, price, level, is_active) VALUES (?, 'REGRESSION', ?, 0, 99, 0)", [ids.pkg, `regression-${Date.now()}`]);
        await db.query("INSERT INTO formations (id, title, price, is_published) VALUES (?, 'Regression course', 0, 1)", [ids.formation]);

        // 1. Assign Courses with the same course twice
        const assign = await call(tAdmin, 'POST', `/api/packages/admin/${ids.pkg}/courses`, { formationIds: [ids.formation, ids.formation] });
        assert.strictEqual(assign.statusCode, 200, `Assign Courses with duplicates (got ${assign.statusCode}: ${assign.body})`);
        const [[links]] = await db.query('SELECT COUNT(*) n FROM package_courses WHERE package_id = ?', [ids.pkg]);
        assert.strictEqual(Number(links.n), 1, 'Duplicated course stored once');
        console.log('  [PASS] 1. Assign Courses accepts a duplicated course and stores it once');

        // 2. Granting a package enrolls courses with the students.id
        const grant = await call(tAdmin, 'POST', '/api/admin/promised-packages/grant', { user_id: ids.member, package_id: ids.pkg, notes: 'regression' });
        assert.ok([200, 201].includes(grant.statusCode), `Grant package (got ${grant.statusCode}: ${grant.body})`);
        const [enr] = await db.query(
            'SELECT fe.id FROM formation_enrollments fe JOIN students s ON s.id = fe.student_id WHERE s.user_id = ? AND fe.formation_id = ?',
            [ids.member, ids.formation]
        );
        assert.strictEqual(enr.length, 1, 'Granted member is enrolled through students.id');
        console.log('  [PASS] 2. Granting a package enrolls its courses (no foreign key failure)');

        // 3. Founder grant writes its notification
        const founder = await call(tAdmin, 'POST', '/api/founders/admin/grant', { userId: ids.member, notes: 'regression 👑' });
        assert.ok([200, 201].includes(founder.statusCode), `Founder grant (got ${founder.statusCode}: ${founder.body})`);
        const [notif] = await db.query("SELECT id FROM notifications WHERE user_id = ? AND content LIKE '%Founders%'", [ids.member]);
        assert.ok(notif.length >= 1, 'Founder notification stored');
        console.log('  [PASS] 3. Founder grant succeeds and notifies the member');

        // 4. Rejecting a deposit with emoji in the reason
        await db.query(
            "INSERT INTO user_packages (id, user_id, package_id, amount_paid, payment_method, payment_reference, status, is_current, notes) VALUES (?, ?, ?, 10, 'bank_transfer', 'REG-REF', 'pending', 0, 'note')",
            [ids.userPkg, ids.member, ids.pkg]
        );
        const reject = await call(tAdmin, 'POST', `/api/admin/deposits/${ids.userPkg}/reject`, { reason: '❌ الوصل غير واضح 🙏' });
        assert.strictEqual(reject.statusCode, 200, `Reject with emoji (got ${reject.statusCode}: ${reject.body})`);
        const [[rejected]] = await db.query('SELECT status, notes FROM user_packages WHERE id = ?', [ids.userPkg]);
        assert.strictEqual(rejected.status, 'cancelled');
        assert.ok(rejected.notes.includes('🙏'), 'Emoji reason stored');
        console.log('  [PASS] 4. Rejecting a deposit with an emoji reason works');

        // 5. Assignment submission
        await db.query("INSERT INTO assignments (id, title) VALUES (?, 'Regression assignment')", [ids.assignment]);
        const submit = await call(tMember, 'POST', '/api/student/submit-assignment', { assignment_id: ids.assignment, submission_url: 'https://example.com/work', submission_text: 'Mon travail ✅' });
        assert.ok([200, 201].includes(submit.statusCode), `Submit assignment (got ${submit.statusCode}: ${submit.body})`);
        const resubmit = await call(tMember, 'POST', '/api/student/submit-assignment', { assignment_id: ids.assignment, submission_url: 'https://example.com/work-v2' });
        assert.ok([200, 201].includes(resubmit.statusCode), 'Re-submission updates the existing submission');
        const [subs] = await db.query('SELECT submission_url FROM assignment_submissions WHERE assignment_id = ?', [ids.assignment]);
        assert.strictEqual(subs.length, 1);
        assert.strictEqual(subs[0].submission_url, 'https://example.com/work-v2');
        console.log('  [PASS] 5. Assignment submission and re-submission work');

        // 6. News with media
        const news = await call(tAdmin, 'POST', '/api/admin/news', { title: 'Regression news 📰', content: 'Body', media_url: '/uploads/x.png', media_name: 'x.png', media_type: 'image', is_featured: true });
        assert.ok([200, 201].includes(news.statusCode), `Create news (got ${news.statusCode}: ${news.body})`);
        newsId = news.json?.id || null;
        console.log('  [PASS] 6. Creating a news item with media works');

        console.log('\n>>> ALL BUG REGRESSION TESTS PASSED! <<<\n');
        return true;
    } finally {
        const [st] = await db.query('SELECT id FROM students WHERE user_id IN (?, ?)', users).catch(() => [[]]);
        const studentIds = st.map((s) => s.id);
        if (newsId) await db.query('DELETE FROM news WHERE id = ?', [newsId]).catch(() => {});
        await db.query("DELETE FROM news WHERE title = 'Regression news 📰'").catch(() => {});
        await db.query('DELETE FROM assignment_submissions WHERE assignment_id = ?', [ids.assignment]).catch(() => {});
        await db.query('DELETE FROM assignments WHERE id = ?', [ids.assignment]).catch(() => {});
        if (studentIds.length) {
            await db.query('DELETE FROM formation_enrollments WHERE student_id IN (?)', [studentIds]).catch(() => {});
        }
        await db.query('DELETE FROM package_courses WHERE package_id = ? OR formation_id = ?', [ids.pkg, ids.formation]).catch(() => {});
        await db.query('DELETE FROM formations WHERE id = ?', [ids.formation]).catch(() => {});
        for (const t of ['founder_members', 'promised_packages', 'notifications', 'transactions', 'user_packages', 'user_wallets', 'commissions']) {
            await db.query(`DELETE FROM ${t} WHERE user_id IN (?, ?)`, users).catch(() => {});
        }
        await db.query('DELETE FROM admin_audit_logs WHERE admin_id = ?', [ids.admin]).catch(() => {});
        await db.query('DELETE FROM students WHERE user_id IN (?, ?)', users).catch(() => {});
        await db.query('DELETE FROM profiles WHERE id IN (?, ?)', users).catch(() => {});
        await db.query('DELETE FROM users WHERE id IN (?, ?)', users).catch(() => {});
        await db.query('DELETE FROM packages WHERE id = ?', [ids.pkg]).catch(() => {});
        await new Promise((resolve) => server.close(resolve));
    }
}

if (require.main === module) {
    runBugRegressionTests().then(() => process.exit(0)).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = runBugRegressionTests;
