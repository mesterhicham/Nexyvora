const runAuthTests = require('./auth.test');
const runRbacTests = require('./rbac.test');
const runWalletSecurityTests = require('./wallet_security.test');
const runUploadSecurityTests = require('./upload_security.test');

async function runAll() {
    console.log('================================================================');
    console.log('       NEXYVORA AUTOMATED SECURITY & FUNCTIONAL AUDIT SUITE     ');
    console.log('================================================================');
    const startTime = Date.now();

    const results = [];

    try {
        console.log('\n[1/4] Running Authentication & Session Tests...');
        await runAuthTests();
        results.push({ name: 'Authentication & Session Invalidation', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Authentication & Session Invalidation', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[2/4] Running RBAC & Authorization Tests...');
        await runRbacTests();
        results.push({ name: 'RBAC & Authorization Guards', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'RBAC & Authorization Guards', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[3/4] Running Financial & Wallet Security Tests...');
        await runWalletSecurityTests();
        results.push({ name: 'Financial Integrity & Over-withdrawal Protection', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'Financial Integrity & Over-withdrawal Protection', status: 'FAILED', error: err.message });
    }

    try {
        console.log('\n[4/4] Running File Upload Security Tests...');
        await runUploadSecurityTests();
        results.push({ name: 'File Upload Extension Whitelist & Execution Block', status: 'PASSED' });
    } catch (err) {
        results.push({ name: 'File Upload Extension Whitelist & Execution Block', status: 'FAILED', error: err.message });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('================================================================');
    console.log(`                     AUDIT EXECUTION SUMMARY                    `);
    console.log('================================================================');
    let hasFailure = false;
    for (const r of results) {
        const mark = r.status === 'PASSED' ? '✓ [PASS]' : '✗ [FAIL]';
        console.log(`${mark} ${r.name}`);
        if (r.status === 'FAILED') hasFailure = true;
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
