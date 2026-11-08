const runAuthTests = require('./auth.test');
const runRbacTests = require('./rbac.test');
const runPrivilegeEscalationTests = require('./privilege_escalation_security.test');
const runWalletSecurityTests = require('./wallet_security.test');
const runUploadSecurityTests = require('./upload_security.test');
const runCleanDbTest = require('./clean_db.test');
const runSecurityHardeningTests = require('./security_hardening.test');
const runAcademyAccessTests = require('./academy_access.test');
const runBugRegressionTests = require('./bug_regressions.test');

async function runAll() {
    console.log('================================================================');
    console.log('       NEXYVORA AUTOMATED SECURITY & FUNCTIONAL AUDIT SUITE     ');
    console.log('================================================================');
    const startTime = Date.now();

    const results = [];

    try {
        console.log('\n[1/9] Running Authentication & Recovery HTTP Integration Tests...');
        await runAuthTests();
        results.push({ name: 'Authentication, Admin Secret & SHA-256 OTP', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Authentication, Admin Secret & SHA-256 OTP', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[2/9] Running RBAC & Teacher Approval HTTP Integration Tests...');
        await runRbacTests();
        results.push({ name: 'RBAC & Teacher Approval Guards', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'RBAC & Teacher Approval Guards', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[3/9] Running Privilege Escalation & Admin Tampering HTTP Tests...');
        await runPrivilegeEscalationTests();
        results.push({ name: 'Privilege Escalation & Admin Tampering Prevention', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Privilege Escalation & Admin Tampering Prevention', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[4/9] Running Financial & Wallet HTTP Integration Tests...');
        await runWalletSecurityTests();
        results.push({ name: 'Financial Integrity, Deductions & Duplicate Guard', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Financial Integrity, Deductions & Duplicate Guard', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[5/9] Running File Upload Security HTTP Integration Tests...');
        await runUploadSecurityTests();
        results.push({ name: 'File Upload Whitelist, SVG Ban & Private File ACL', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'File Upload Whitelist, SVG Ban & Private File ACL', status: 'FAILED', error: err.message });
    }

    try {
        console.log('[7/9] Running Security Hardening HTTP Integration Tests...');
        await runSecurityHardeningTests();
        results.push({ name: 'Impersonation Audit, Receipt URL Policy & Strict Country Rules', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Impersonation Audit, Receipt URL Policy & Strict Country Rules', status: 'FAILED', error: err.message });
    }

    try {
        console.log('[8/9] Running Academy Access, Sequence & Certificate HTTP Tests...');
        await runAcademyAccessTests();
        results.push({ name: 'Academy Package Access, Lesson Sequence & Certificate', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Academy Package Access, Lesson Sequence & Certificate', status: 'FAILED', error: err.message });
    }

    try {
        console.log('[9/9] Running Production Bug Regression HTTP Tests...');
        await runBugRegressionTests();
        results.push({ name: 'Production Bug Regressions (founders, courses, deposits, assignments, news)', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Production Bug Regressions (founders, courses, deposits, assignments, news)', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[6/9] Running Clean Database Schema Import & Migration Test...');
        await runCleanDbTest();
        results.push({ name: 'Clean Database Installation & Validation', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Clean Database Installation & Validation', status: 'FAILED', error: err.message });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('================================================================');
    console.log(`                     AUDIT EXECUTION SUMMARY                    `);
    console.log('================================================================');
    let hasFailure = false;
    for (const r of results) {
        const mark = r.status === 'PASSED' ? '✓ [PASS]' : '✗ [FAIL]';
        console.log(`${mark} ${r.name}`);
        if (r.status === 'FAILED') {
            console.log(`       Error: ${r.error}`);
            hasFailure = true;
        }
    }
    console.log(`Total duration: ${duration}s`);
    console.log('================================================================\n');

    if (hasFailure) {
        process.exit(1);
    } else {
        console.log('>>> 100% OF SECURITY AND SYSTEM INTEGRITY TESTS PASSED! <<<\n');
        process.exit(0);
    }
}

runAll();
