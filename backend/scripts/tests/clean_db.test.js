const assert = require('assert');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { importSchema } = require('../../import-schema');

dotenv.config();

async function runCleanDbTest() {
    console.log('\n======================================================');
    console.log('   TEST SUITE 5: CLEAN DATABASE SCHEMA IMPORT TEST    ');
    console.log('======================================================');

    const tempDbName = `nexyvora_clean_test_${Date.now()}`;
    const baseConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 8889,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'root',
        multipleStatements: true,
    };

    let connection = null;

    try {
        console.log(`\n--- 1. Importing clean schema into temporary database: ${tempDbName} ---`);
        connection = await mysql.createConnection(baseConfig);

        // Run schema import on fresh temp db
        const result = await importSchema(tempDbName);
        assert.strictEqual(result.success, true, 'Schema import function returned success: true');

        // Check required tables exist
        const [tables] = await connection.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = ?
        `, [tempDbName]);

        const tableNames = tables.map(t => t.table_name || t.TABLE_NAME);
        const requiredTables = [
            'users',
            'user_wallets',
            'teachers',
            'students',
            'formations',
            'formation_content',
            'verification_otps',
            'withdrawal_requests',
            'packages',
            'bonus_pools'
        ];

        for (const reqTable of requiredTables) {
            assert.ok(
                tableNames.includes(reqTable),
                `Required table '${reqTable}' missing from cleanly imported database`
            );
        }
        console.log(`  [PASS] All ${requiredTables.length} core tables verified in clean database`);

        // Check verification_otps code column length
        const [otpColumns] = await connection.query(`
            SELECT character_maximum_length 
            FROM information_schema.columns 
            WHERE table_schema = ? AND table_name = 'verification_otps' AND column_name = 'code'
        `, [tempDbName]);

        assert.ok(otpColumns.length > 0, 'verification_otps.code column exists');
        const codeLen = otpColumns[0].character_maximum_length || otpColumns[0].CHARACTER_MAXIMUM_LENGTH;
        assert.ok(codeLen >= 64, `verification_otps.code length must be at least 64 chars for SHA-256 (got ${codeLen})`);
        console.log(`  [PASS] verification_otps.code column length is ${codeLen} (supports SHA-256 hashes)`);

        console.log('\n>>> CLEAN DATABASE INSTALL TEST PASSED! <<<\n');
        return true;
    } finally {
        if (connection) {
            console.log(`Cleaning up temporary database: ${tempDbName}...`);
            await connection.query(`DROP DATABASE IF EXISTS \`${tempDbName}\``).catch(() => {});
            await connection.end().catch(() => {});
        }
    }
}

if (require.main === module) {
    runCleanDbTest().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = runCleanDbTest;
