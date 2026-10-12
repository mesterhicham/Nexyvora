const runAuthTests = require('./auth.test');
const runRbacTests = require('./rbac.test');
const runWalletSecurityTests = require('./wallet_security.test');
const runUploadSecurityTests = require('./upload_security.test');
const runCleanDbTest = require('./clean_db.test');

async function runAll() {
    console.log('================================================================');
    console.log('       NEXYVORA AUTOMATED SECURITY & FUNCTIONAL AUDIT SUITE     ');
    console.log('================================================================');
    const startTime = Date.now();

    const results = [];

    try {
        console.log('\n[1/5] Running Authentication & Recovery HTTP Integration Tests...');
        await runAuthTests();
        results.push({ name: 'Authentication, Admin Secret & SHA-256 OTP', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Authentication, Admin Secret & SHA-256 OTP', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[2/5] Running RBAC & Teacher Approval HTTP Integration Tests...');
        await runRbacTests();
        results.push({ name: 'RBAC & Teacher Approval Guards', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'RBAC & Teacher Approval Guards', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[3/5] Running Financial & Wallet HTTP Integration Tests...');
        await runWalletSecurityTests();
        results.push({ name: 'Financial Integrity, Deductions & Duplicate Guard', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Financial Integrity, Deductions & Duplicate Guard', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[4/5] Running File Upload Security HTTP Integration Tests...');
        await runUploadSecurityTests();
        results.push({ name: 'File Upload Whitelist, SVG Ban & Private File ACL', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'File Upload Whitelist, SVG Ban & Private File ACL', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[5/5] Running Clean Database Schema Import & Migration Test...');
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
