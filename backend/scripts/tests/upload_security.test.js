const assert = require('assert');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const app = require('../../server');
const db = require('../../config/db');
const { makeRequest } = require('./test_http_client');

async function runUploadSecurityTests() {
    console.log('\n======================================================');
    console.log('   TEST SUITE 4: FILE UPLOAD SECURITY (REAL HTTP)     ');
    console.log('======================================================');

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

    const studentId = crypto.randomUUID();
    const testEmail = `upload_tester_${Date.now()}@nexyvora.com`;
    const token = jwt.sign(
        { id: studentId, role: 'student', token_version: 1 },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    // Insert user into DB so auth middleware passes
    await db.query(`
        INSERT INTO users (id, email, password, role, status, token_version, affiliate_code)
        VALUES (?, ?, 'dummy_hash', 'student', 'active', 1, ?)
    `, [studentId, testEmail, 'NV' + crypto.randomInt(100000, 999999)]);

    // Create multipart/form-data payload
    function buildMultipartBody(boundary, fieldName, filename, contentType, content) {
        const head = `--${boundary}\r\nContent-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`;
        const tail = `\r\n--${boundary}--\r\n`;
        return Buffer.concat([
            Buffer.from(head, 'utf8'),
            Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8'),
            Buffer.from(tail, 'utf8')
        ]);
    }

    try {
        // -------------------------------------------------------------
        // 1. Rejection of Dangerous Extensions (.php, .exe, .svg) (P1 #8)
        // -------------------------------------------------------------
        console.log('\n--- 1. Testing Rejection of Malicious & SVG Uploads ---');

        const maliciousAttempts = [
            { name: 'webshell.php', mime: 'application/x-php', content: '<?php echo "evil"; ?>' },
            { name: 'malware.exe', mime: 'application/octet-stream', content: 'MZ......' },
            { name: 'xss_vector.svg', mime: 'image/svg+xml', content: '<svg onload="alert(1)"></svg>' },
            { name: 'fake_image.php', mime: 'image/jpeg', content: '<?php system($_GET["c"]); ?>' }
        ];

        for (const item of maliciousAttempts) {
            const boundary = `----NexyvoraFormBoundary${Date.now()}`;
            const body = buildMultipartBody(boundary, 'file', item.name, item.mime, item.content);

            const res = await makeRequest(server, {
                method: 'POST',
                path: '/api/upload',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`
                }
            }, body);

            assert.strictEqual(
                res.statusCode,
                400,
                `Expected 400 rejection for ${item.name} (got ${res.statusCode}: ${res.body})`
            );
            console.log(`  [PASS] Blocked dangerous file upload: ${item.name} (HTTP 400)`);
        }

        // -------------------------------------------------------------
        // 2. Legitimate Public File Upload
        // -------------------------------------------------------------
        console.log('\n--- 2. Testing Legitimate Public Upload ---');
        const boundaryLegit = `----NexyvoraLegitBoundary${Date.now()}`;
        const legitBody = buildMultipartBody(
            boundaryLegit,
            'file',
            'sample_photo.jpg',
            'image/jpeg',
            Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46]) // JPEG SOI header
        );

        const resLegit = await makeRequest(server, {
            method: 'POST',
            path: '/api/upload',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundaryLegit}`
            }
        }, legitBody);

        assert.strictEqual(
            resLegit.statusCode,
            200,
            `Expected 200 for valid image upload (got ${resLegit.statusCode}: ${resLegit.body})`
        );
        assert.ok(resLegit.json.url, 'Upload response contains public URL');
        const uploadedFilename = resLegit.json.filename;
        console.log(`  [PASS] Legitimate image upload succeeded: ${uploadedFilename}`);

        // Verify public file exists in uploads/public/
        const publicFilePath = path.join(__dirname, '..', '..', 'uploads', 'public', uploadedFilename);
        assert.strictEqual(fs.existsSync(publicFilePath), true, 'File saved in uploads/public');

        // Cleanup public file
        fs.unlinkSync(publicFilePath);

        // -------------------------------------------------------------
        // 3. Private File Upload & Secure Route Access Control
        // -------------------------------------------------------------
        console.log('\n--- 3. Testing Private Upload & Secure File Access ---');
        const boundaryPrivate = `----NexyvoraPrivBoundary${Date.now()}`;
        const privBody = Buffer.concat([
            Buffer.from(`--${boundaryPrivate}\r\nContent-Disposition: form-data; name="visibility"\r\n\r\nprivate\r\n`),
            buildMultipartBody(
                boundaryPrivate,
                'file',
                'confidential_contract.pdf',
                'application/pdf',
                '%PDF-1.4 sample content'
            )
        ]);

        const resPrivate = await makeRequest(server, {
            method: 'POST',
            path: '/api/upload?private=true',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': `multipart/form-data; boundary=${boundaryPrivate}`
            }
        }, privBody);

        assert.strictEqual(
            resPrivate.statusCode,
            200,
            `Expected 200 for private upload (got ${resPrivate.statusCode}: ${resPrivate.body})`
        );
        const privateFilename = resPrivate.json.filename;
        const privateFilePath = path.join(__dirname, '..', '..', 'uploads', 'private', privateFilename);
        assert.strictEqual(fs.existsSync(privateFilePath), true, 'File saved in uploads/private');

        // Test 3a: Direct static access via /uploads/:privateFilename -> MUST RETURN 404 (not served publicly!)
        const resDirectAccess = await makeRequest(server, {
            method: 'GET',
            path: `/uploads/${privateFilename}`
        });
        assert.strictEqual(
            resDirectAccess.statusCode,
            404,
            `Expected 404 for direct static URL to private file (got ${resDirectAccess.statusCode})`
        );
        console.log('  [PASS] Direct public access to private file blocked (HTTP 404)');

        // Test 3b: Accessing /api/upload/secure/:filename WITHOUT authentication -> Expect 401
        const resUnauthSecure = await makeRequest(server, {
            method: 'GET',
            path: `/api/upload/secure/${privateFilename}`
        });
        assert.strictEqual(
            resUnauthSecure.statusCode,
            401,
            `Expected 401 without auth for /api/upload/secure (got ${resUnauthSecure.statusCode})`
        );
        console.log('  [PASS] Unauthenticated access to /api/upload/secure rejected with 401');

        // Test 3c: Accessing /api/upload/secure/:filename WITH authentication -> Expect 200
        const resAuthSecure = await makeRequest(server, {
            method: 'GET',
            path: `/api/upload/secure/${privateFilename}`,
            headers: { Authorization: `Bearer ${token}` }
        });
        assert.strictEqual(
            resAuthSecure.statusCode,
            200,
            `Expected 200 for authenticated user accessing secure file (got ${resAuthSecure.statusCode})`
        );
        console.log('  [PASS] Authenticated user successfully retrieved secure file');

        // Cleanup private file
        fs.unlinkSync(privateFilePath);

        console.log('\n>>> ALL FILE UPLOAD SECURITY TESTS PASSED! <<<\n');
        return true;
    } finally {
        await db.query('DELETE FROM users WHERE id = ?', [studentId]).catch(() => {});
        await new Promise((resolve) => server.close(resolve));
    }
}

if (require.main === module) {
    runUploadSecurityTests().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runUploadSecurityTests;
