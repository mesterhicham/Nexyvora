const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function importSchema(targetDbName) {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = parseInt(process.env.DB_PORT, 10) || 3306;
    const dbUser = process.env.DB_USER || 'root';
    const dbPass = process.env.DB_PASS || 'root';
    const dbName = targetDbName || process.env.DB_NAME || 'nextvora';

    console.log(`[import-schema] Target Database: ${dbName} on ${dbHost}:${dbPort}`);

    let connection;
    try {
        // 1. Establish connection without selecting a DB first
        connection = await mysql.createConnection({
            host: dbHost,
            port: dbPort,
            user: dbUser,
            password: dbPass,
            multipleStatements: true
        });

        console.log(`[import-schema] Ensuring database \`${dbName}\` exists...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await connection.query(`USE \`${dbName}\``);

        // 2. Read schema file
        const schemaPath = path.join(__dirname, '..', 'mysql_schema.sql');
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found at ${schemaPath}`);
        }

        let schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Dynamically replace hardcoded DB names with target dbName
        schemaSql = schemaSql.replace(/CREATE DATABASE IF NOT EXISTS `[^`]+`;/g, '');
        schemaSql = schemaSql.replace(/USE `[^`]+`;/g, '');

        console.log('[import-schema] Executing schema statements...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query(schemaSql);
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('[import-schema] Running post-schema integrity validations...');

        // 3. Validation checks: verify critical tables
        const [tables] = await connection.query('SHOW TABLES');
        const tableList = tables.map(t => Object.values(t)[0]);
        const requiredTables = [
            'users', 'profiles', 'user_roles', 'user_wallets', 'packages',
            'verification_otps', 'withdrawal_requests', 'transactions', 'teachers', 'students'
        ];

        for (const reqTable of requiredTables) {
            if (!tableList.includes(reqTable)) {
                throw new Error(`Integrity Error: Required table \`${reqTable}\` was not created!`);
            }
        }

        // 4. Validation checks: verify critical columns
        const [userCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'token_version'");
        if (userCols.length === 0) {
            console.log('[import-schema] Adding missing `token_version` to users...');
            await connection.query("ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 1 AFTER status");
        }

        const [profileCols] = await connection.query("SHOW COLUMNS FROM profiles LIKE 'whatsapp_verified'");
        if (profileCols.length === 0) {
            console.log('[import-schema] Adding missing `whatsapp_verified` to profiles...');
            await connection.query("ALTER TABLE profiles ADD COLUMN whatsapp_verified TINYINT(1) NOT NULL DEFAULT 0");
        }

        const [otpCols] = await connection.query("SHOW COLUMNS FROM verification_otps LIKE 'code'");
        if (otpCols.length > 0 && !otpCols[0].Type.includes('varchar(64)')) {
            console.log('[import-schema] Ensuring verification_otps.code is VARCHAR(64)...');
            await connection.query("ALTER TABLE verification_otps MODIFY COLUMN code VARCHAR(64) NOT NULL");
        }

        console.log(`[import-schema] SUCCESS: Schema imported and verified successfully (${tableList.length} tables verified).`);
        await connection.end();
        return { success: true, tableCount: tableList.length };
    } catch (err) {
        console.error('[import-schema] FATAL ERROR during schema import:', err.message);
        if (connection) {
            try { await connection.end(); } catch (e) {}
        }
        process.exit(1);
    }
}

if (require.main === module) {
    const targetDb = process.argv[2];
    importSchema(targetDb).then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { importSchema };
