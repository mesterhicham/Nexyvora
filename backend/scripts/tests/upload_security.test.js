const assert = require('assert');
const upload = require('../../middleware/uploadMiddleware');

async function runUploadSecurityTests() {
    console.log('\n========================================');
    console.log('   TEST SUITE 4: FILE UPLOAD SECURITY GUARDS');
    console.log('========================================');

    const fileFilter = upload.fileFilter;
    assert.strictEqual(typeof fileFilter, 'function', 'fileFilter is exported and callable');

    // Helper to run fileFilter
    const testFile = (filename, mimetype) => {
        return new Promise((resolve) => {
            fileFilter({}, { originalname: filename, mimetype }, (err, accepted) => {
                resolve({ err, accepted: !!accepted });
            });
        });
    };

    try {
        // 1. Dangerous executable extensions must be rejected
        const forbiddenFiles = [
            { name: 'webshell.php', mime: 'application/x-php' },
            { name: 'payload.phtml', mime: 'text/html' },
            { name: 'trojan.exe', mime: 'application/x-msdownload' },
            { name: 'exploit.sh', mime: 'application/x-sh' },
            { name: 'script.js', mime: 'application/javascript' },
            { name: 'phish.html', mime: 'text/html' },
            { name: 'shell.phar', mime: 'application/octet-stream' },
            { name: 'backdoor.pl', mime: 'text/plain' }
        ];

        for (const file of forbiddenFiles) {
            const res = await testFile(file.name, file.mime);
            assert.strictEqual(res.accepted, false, `File ${file.name} must be rejected`);
            assert.notStrictEqual(res.err, null, `Error must be returned for ${file.name}`);
            console.log(`  [PASS] Blocked dangerous file: ${file.name} (${res.err.message})`);
        }

        // 2. Disguised MIME / Extension mismatch
        const disguisedRes = await testFile('evil.php', 'image/jpeg');
        assert.strictEqual(disguisedRes.accepted, false, 'PHP file with image/jpeg MIME must be rejected');
        console.log('  [PASS] Blocked disguised extension bypass: evil.php with image/jpeg');

        // 3. Legitimate files must be accepted
        const legitimateFiles = [
            { name: 'avatar.png', mime: 'image/png' },
            { name: 'photo.jpg', mime: 'image/jpeg' },
            { name: 'photo.webp', mime: 'image/webp' },
            { name: 'document.pdf', mime: 'application/pdf' },
            { name: 'presentation.pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
            { name: 'lecture.mp4', mime: 'video/mp4' }
        ];

        for (const file of legitimateFiles) {
            const res = await testFile(file.name, file.mime);
            assert.strictEqual(res.accepted, true, `Legitimate file ${file.name} must be accepted`);
            assert.strictEqual(res.err, null, `No error should occur for legitimate file ${file.name}`);
            console.log(`  [PASS] Allowed legitimate file: ${file.name} (${file.mime})`);
        }

        console.log('>>> ALL FILE UPLOAD SECURITY TESTS PASSED! <<<\n');
        return true;
    } catch (err) {
        console.error('  [FAIL] Upload Security Test failed:', err);
        throw err;
    }
}

if (require.main === module) {
    runUploadSecurityTests().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runUploadSecurityTests;
