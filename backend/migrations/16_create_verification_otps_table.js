const db = require('../config/db');
const crypto = require('crypto');

async function up() {
    console.log('--- Migration 16: Creating verification_otps table and email verification columns ---');
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Table: verification_otps
        console.log('1. Creating verification_otps table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS verification_otps (
                id VARCHAR(36) PRIMARY KEY,
                identifier VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL DEFAULT 'registration',
                code VARCHAR(10) NOT NULL,
                expires_at DATETIME NOT NULL,
                is_verified TINYINT(1) NOT NULL DEFAULT 0,
                attempts INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_otp_lookup (identifier, type, is_verified, expires_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // 2. Add email_verified column to users and profiles if missing
        console.log('2. Adding email_verified columns if not existing...');
        const [userCols] = await connection.query(`SHOW COLUMNS FROM users LIKE 'email_verified'`);
        if (userCols.length === 0) {
            await connection.query(`ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER role`);
        }

        const [profileCols] = await connection.query(`SHOW COLUMNS FROM profiles LIKE 'email_verified'`);
        if (profileCols.length === 0) {
            await connection.query(`ALTER TABLE profiles ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0`);
        }

        // 3. Ensure email_settings has an initial row if empty
        console.log('3. Checking email_settings initial record...');
        const [existingSettings] = await connection.query(`SELECT id FROM email_settings LIMIT 1`);
        if (existingSettings.length === 0) {
            const settingsId = crypto.randomUUID();
            await connection.query(`
                INSERT INTO email_settings 
                (id, smtp_host, smtp_port, smtp_username, smtp_password, encryption, from_email, from_name, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `, [
                settingsId,
                'smtp.gmail.com',
                465,
                '',
                '',
                'ssl',
                'noreply@nextvora.com',
                'Nextvora Platform',
                0
            ]);
            console.log('   Initialized default email_settings placeholder.');
        }

        await connection.commit();
        console.log('--- Migration 16 completed successfully ---');
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Migration 16 failed:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up };
