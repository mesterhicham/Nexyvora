const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const db = require('../../config/db');
const { makeRequest } = require('./test_http_client');

/**
 * Academy rules:
 *  - access comes from admin "Assign Courses" (package_courses), inherited by higher tiers;
 *  - lessons unlock one after the other, enforced by the server;
 *  - videos complete when watched, PDF / text complete with "Mark as read";
 *  - progress never goes backwards; the certificate needs every lesson completed.
 */
async function runAcademyAccessTests() {
    console.log('\n======================================================');
    console.log('   TEST SUITE: ACADEMY ACCESS, SEQUENCE & CERTIFICATE ');
    console.log('======================================================');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const [pkgs] = await db.query('SELECT id, level FROM packages ORDER BY level ASC');
    assert.ok(pkgs.length >= 3, 'Need at least 3 package tiers');
    const lowPkg = pkgs[0];     // e.g. COMMUNITY
    const assignedPkg = pkgs[1]; // e.g. FLOW (course assigned here)
    const highPkg = pkgs[2];    // e.g. GROW (inherits)

    const ids = {
        high: crypto.randomUUID(), low: crypto.randomUUID(), none: crypto.randomUUID(),
        formation: crypto.randomUUID(), v1: crypto.randomUUID(), p2: crypto.randomUUID(), v3: crypto.randomUUID(),
        link: crypto.randomUUID(),
    };
    const users = [ids.high, ids.low, ids.none];
    const sign = (id) => jwt.sign({ id, role: 'student', token_version: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const call = (token, method, path, body) => makeRequest(server, { method, path, headers: { Authorization: `Bearer ${token}` } }, body);

    try {
        for (const [i, uid] of users.entries()) {
            await db.query(
                "INSERT INTO users (id, email, password, role, status, token_version, affiliate_code) VALUES (?, ?, 'x', 'student', 'active', 1, ?)",
                [uid, `academy_${i}_${Date.now()}@test.com`, 'NVA' + crypto.randomInt(100000, 999999)]
            );
        }
        await db.query("INSERT INTO user_packages (id, user_id, package_id, amount_paid, status, is_current) VALUES (?, ?, ?, 0, 'active', 1)", [crypto.randomUUID(), ids.high, highPkg.id]);
        await db.query("INSERT INTO user_packages (id, user_id, package_id, amount_paid, status, is_current) VALUES (?, ?, ?, 0, 'active', 1)", [crypto.randomUUID(), ids.low, lowPkg.id]);

        await db.query("INSERT INTO formations (id, title, price, is_published) VALUES (?, 'Academy test course', 0, 1)", [ids.formation]);
        await db.query("INSERT INTO formation_content (id, formation_id, title, content_type, file_url, duration_seconds, order_index) VALUES (?, ?, 'Lesson 1', 'video', '/uploads/v1.mp4', 100, 1), (?, ?, 'Lesson 2', 'pdf', '/uploads/p2.pdf', NULL, 2), (?, ?, 'Lesson 3', 'video', '/uploads/v3.mp4', 60, 3)",
            [ids.v1, ids.formation, ids.p2, ids.formation, ids.v3, ids.formation]);
        await db.query('INSERT INTO package_courses (id, package_id, formation_id) VALUES (?, ?, ?)', [ids.link, assignedPkg.id, ids.formation]);

        const tHigh = sign(ids.high), tLow = sign(ids.low), tNone = sign(ids.none);

        // 1. Access follows Assign Courses, inherited by higher tiers only
        const mineHigh = await call(tHigh, 'GET', '/api/formation/enrollments/mine');
        const enrollment = (mineHigh.json || []).find(e => e.formation_id === ids.formation);
        assert.ok(enrollment, 'Higher-tier member gets the course assigned to a lower tier');
        const mineLow = await call(tLow, 'GET', '/api/formation/enrollments/mine');
        assert.ok(!(mineLow.json || []).some(e => e.formation_id === ids.formation), 'Lower-tier member does not get it');
        console.log('  [PASS] 1. Course assigned to a package is granted to that tier and above only');

        // 1b. COMMUNITY (lowest tier): a course the admin assigns to it is opened to its members
        const communityLink = crypto.randomUUID();
        await db.query('INSERT INTO package_courses (id, package_id, formation_id) VALUES (?, ?, ?)', [communityLink, lowPkg.id, ids.formation]);
        const mineCommunity = await call(tLow, 'GET', '/api/formation/enrollments/mine');
        const communityEnrollment = (mineCommunity.json || []).find(e => e.formation_id === ids.formation);
        assert.ok(communityEnrollment, 'Lowest-tier (COMMUNITY) member gets the course assigned to COMMUNITY');
        const communityContent = (await call(tLow, 'GET', `/api/formation/${ids.formation}/content`)).json;
        assert.ok(communityContent[0].file_url && !communityContent[0].locked, 'COMMUNITY member can open the first lesson');
        await db.query('DELETE FROM package_courses WHERE id = ?', [communityLink]);
        console.log('  [PASS] 1b. COMMUNITY members get the courses the admin assigns to COMMUNITY');

        // 2. Sequential unlocking decided by the server
        let content = (await call(tHigh, 'GET', `/api/formation/${ids.formation}/content`)).json;
        assert.strictEqual(content[0].locked, false);
        assert.ok(content[0].file_url, 'First lesson exposes its file');
        assert.strictEqual(content[1].locked, true);
        assert.strictEqual(content[1].file_url, null, 'Locked lesson hides its file');
        assert.strictEqual(content[2].locked, true);
        console.log('  [PASS] 2. Only the first lesson is open; locked lessons hide their files');

        const progress = (body) => call(tHigh, 'POST', '/api/formation/progress', { enrollmentId: enrollment.id, ...body });

        // 3. Cannot skip ahead
        const skip = await progress({ contentId: ids.p2, completed: true });
        assert.strictEqual(skip.statusCode, 403, `Skipping refused (got ${skip.statusCode})`);
        assert.strictEqual(skip.json.code, 'LESSON_LOCKED');
        console.log('  [PASS] 3. Completing a lesson before the previous one is refused');

        // 4. A video completes only once watched
        const early = await progress({ contentId: ids.v1, watchedSeconds: 10, completed: true });
        assert.strictEqual(early.statusCode, 400);
        assert.strictEqual(early.json.code, 'VIDEO_NOT_WATCHED');
        const done1 = await progress({ contentId: ids.v1, watchedSeconds: 96, completed: true });
        assert.strictEqual(done1.statusCode, 200, `Video completion accepted (got ${done1.statusCode}: ${done1.body})`);
        content = (await call(tHigh, 'GET', `/api/formation/${ids.formation}/content`)).json;
        assert.strictEqual(content[1].locked, false, 'Lesson 2 unlocks after lesson 1');
        assert.strictEqual(content[2].locked, true, 'Lesson 3 still locked');
        console.log('  [PASS] 4. Video completes only when watched, then the next lesson unlocks');

        // 5. Progress never goes backwards
        await progress({ contentId: ids.v1, watchedSeconds: 5 });
        content = (await call(tHigh, 'GET', `/api/formation/${ids.formation}/content`)).json;
        assert.strictEqual(content[0].completed, true, 'Completed lesson stays completed');
        assert.ok(content[0].watched_seconds >= 96, 'Watched time does not decrease');
        console.log('  [PASS] 5. A later progress update cannot undo a completion');

        // 6. Certificate refused until everything is done
        const certEarly = await call(tHigh, 'GET', `/api/formation/enrollments/${enrollment.id}/certificate`);
        assert.strictEqual(certEarly.statusCode, 403);

        // 7. PDF completes with "Mark as read", then the last lesson unlocks
        const read = await progress({ contentId: ids.p2, completed: true });
        assert.strictEqual(read.statusCode, 200);
        content = (await call(tHigh, 'GET', `/api/formation/${ids.formation}/content`)).json;
        assert.strictEqual(content[2].locked, false, 'Lesson 3 unlocks after reading the PDF');
        await progress({ contentId: ids.v3, watchedSeconds: 60, completed: true });
        const cert = await call(tHigh, 'GET', `/api/formation/enrollments/${enrollment.id}/certificate`);
        assert.strictEqual(cert.statusCode, 200, `Certificate available when all lessons are done (got ${cert.statusCode})`);
        console.log('  [PASS] 6-7. PDF "Mark as read" unlocks the next lesson; certificate only at 100%');

        // 8. Members without the package see the outline only
        const outline = (await call(tNone, 'GET', `/api/formation/${ids.formation}/content`)).json;
        assert.ok(outline.every(c => c.locked && !c.file_url), 'Outline only for members without access');
        const foreign = await call(tLow, 'POST', '/api/formation/progress', { enrollmentId: enrollment.id, contentId: ids.v1, completed: true });
        assert.ok([403, 404].includes(foreign.statusCode), 'Cannot write progress on someone else\'s enrollment');
        console.log('  [PASS] 8. Members without the package get no files and cannot write progress');

        // 9. Removing the course from the package removes access
        await db.query('DELETE FROM package_courses WHERE id = ?', [ids.link]);
        const after = await call(tHigh, 'GET', '/api/formation/enrollments/mine');
        assert.ok(!(after.json || []).some(e => e.formation_id === ids.formation), 'Unassigned course disappears from the list');
        const locked = (await call(tHigh, 'GET', `/api/formation/${ids.formation}/content`)).json;
        assert.ok(locked.every(c => c.locked && !c.file_url), 'Unassigned course content is locked');
        console.log('  [PASS] 9. Removing a course from Assign Courses revokes access');

        console.log('\n>>> ALL ACADEMY ACCESS TESTS PASSED! <<<\n');
        return true;
    } finally {
        await db.query('DELETE FROM package_courses WHERE id = ? OR formation_id = ?', [ids.link, ids.formation]).catch(() => {});
        await db.query('DELETE fp FROM formation_progress fp JOIN formation_enrollments fe ON fe.id = fp.enrollment_id WHERE fe.formation_id = ?', [ids.formation]).catch(() => {});
        await db.query('DELETE FROM formation_enrollments WHERE formation_id = ?', [ids.formation]).catch(() => {});
        await db.query('DELETE FROM formation_content WHERE formation_id = ?', [ids.formation]).catch(() => {});
        await db.query('DELETE FROM formations WHERE id = ?', [ids.formation]).catch(() => {});
        await db.query('DELETE FROM user_packages WHERE user_id IN (?, ?, ?)', users).catch(() => {});
        await db.query('DELETE FROM students WHERE user_id IN (?, ?, ?)', users).catch(() => {});
        await db.query('DELETE FROM users WHERE id IN (?, ?, ?)', users).catch(() => {});
        await new Promise((resolve) => server.close(resolve));
    }
}

if (require.main === module) {
    runAcademyAccessTests().then(() => process.exit(0)).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = runAcademyAccessTests;
