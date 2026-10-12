const assert = require('assert');
const { authorize } = require('../../middleware/authMiddleware');

async function runRbacTests() {
    console.log('\n========================================');
    console.log('   TEST SUITE 2: RBAC & AUTHORIZATION GUARDS');
    console.log('========================================');

    try {
        // 1. Student accessing admin-only handler
        const adminGuard = authorize('admin');
        let nextCalled = false;
        let responseStatus = null;
        let responseJson = null;

        const fakeRes = {
            status: function (code) {
                responseStatus = code;
                return {
                    json: function (payload) {
                        responseJson = payload;
                    }
                };
            }
        };

        const studentReq = {
            user: { id: 'student-id-1', role: 'student' }
        };

        adminGuard(studentReq, fakeRes, () => {
            nextCalled = true;
        });

        assert.strictEqual(nextCalled, false, 'Next should NOT be called for student on admin route');
        assert.strictEqual(responseStatus, 403, 'Response status must be 403 Forbidden');
        assert.strictEqual(responseJson.error, 'Access denied: insufficient permissions', 'Error message matches');
        console.log('  [PASS] 1. Student correctly blocked (403) from Admin routes');

        // 2. Student accessing teacher-only handler
        const teacherGuard = authorize('teacher');
        nextCalled = false;
        responseStatus = null;

        teacherGuard(studentReq, fakeRes, () => {
            nextCalled = true;
        });

        assert.strictEqual(nextCalled, false, 'Next should NOT be called for student on teacher route');
        assert.strictEqual(responseStatus, 403, 'Response status must be 403 Forbidden');
        console.log('  [PASS] 2. Student correctly blocked (403) from Teacher routes');

        // 3. Admin accessing admin handler
        const adminReq = {
            user: { id: 'admin-id-1', role: 'admin' }
        };
        nextCalled = false;
        responseStatus = null;

        adminGuard(adminReq, fakeRes, () => {
            nextCalled = true;
        });

        assert.strictEqual(nextCalled, true, 'Next MUST be called for admin on admin route');
        assert.strictEqual(responseStatus, null, 'No error response status for authorized admin');
        console.log('  [PASS] 3. Admin correctly authorized on Admin routes');

        // 4. Multi-role handler (teacher or admin)
        const staffGuard = authorize('admin', 'teacher');
        nextCalled = false;
        const teacherReq = {
            user: { id: 'teacher-id-1', role: 'teacher' }
        };

        staffGuard(teacherReq, fakeRes, () => {
            nextCalled = true;
        });
        assert.strictEqual(nextCalled, true, 'Teacher authorized for multi-role route');
        console.log('  [PASS] 4. Multi-role authorization verified for Teacher');

        console.log('>>> ALL RBAC AUTHORIZATION TESTS PASSED! <<<\n');
        return true;
    } catch (err) {
        console.error('  [FAIL] RBAC Test failed:', err);
        throw err;
    }
}

if (require.main === module) {
    runRbacTests().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runRbacTests;
