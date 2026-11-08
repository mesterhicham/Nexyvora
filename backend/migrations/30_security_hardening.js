const bcrypt = require('bcryptjs');
const db = require('../config/db');

/**
 * Migration 30: Security hardening
 *  - Wallet PIN is stored as a bcrypt hash (wallet_pin_hash) with brute-force lockout columns.
 *    Any legacy plaintext value in users.wallet_pin is hashed and then wiped.
 *  - admin_audit_logs records sensitive admin actions (impersonation, PIN resets...).
 *  - users.custom_unlocked_generations is created (referenced by the code, missing from the schema).
 */

async function columnExists(connection, table, column) {
    const [rows] = await connection.query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
        [table, column]
    );
    return rows.length > 0;
}

async function up() {
    console.log('--- Migration 30: Security hardening (wallet PIN hashing + admin audit log) ---');
    let connection;
    try {
        connection = await db.getConnection();

        const newColumns = [
            ['wallet_pin_hash', 'VARCHAR(100) NULL DEFAULT NULL'],
            ['wallet_pin_failed_attempts', 'INT NOT NULL DEFAULT 0'],
            ['wallet_pin_locked_until', 'DATETIME NULL DEFAULT NULL'],
            // Used by admin user management and affiliate generation unlocks but never created before
            ['custom_unlocked_generations', 'INT NULL DEFAULT NULL'],
        ];
        for (const [name, definition] of newColumns) {
            if (!(await columnExists(connection, 'users', name))) {
                console.log(`Adding users.${name}...`);
                await connection.query(`ALTER TABLE users ADD COLUMN ${name} ${definition}`);
            }
        }

        if (await columnExists(connection, 'users', 'wallet_pin')) {
            const [legacy] = await connection.query(
                "SELECT id, wallet_pin FROM users WHERE wallet_pin IS NOT NULL AND wallet_pin <> ''"
            );
            console.log(`Hashing ${legacy.length} legacy plaintext wallet PIN(s)...`);
            for (const row of legacy) {
                const hash = await bcrypt.hash(String(row.wallet_pin).trim(), 12);
                await connection.query(
                    'UPDATE users SET wallet_pin_hash = ?, wallet_pin = NULL WHERE id = ?',
                    [hash, row.id]
                );
            }
        }

        console.log('Creating admin_audit_logs table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS admin_audit_logs (
                id VARCHAR(36) NOT NULL PRIMARY KEY,
                admin_id VARCHAR(36) NOT NULL,
                action VARCHAR(64) NOT NULL,
                target_user_id VARCHAR(36) NULL DEFAULT NULL,
                ip_address VARCHAR(64) NULL DEFAULT NULL,
                user_agent VARCHAR(255) NULL DEFAULT NULL,
                details TEXT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_audit_admin (admin_id),
                INDEX idx_audit_target (target_user_id),
                INDEX idx_audit_action_date (action, created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('--- Migration 30 completed ---');
    } catch (err) {
        console.error('Migration 30 failed:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    up().then(() => {
        console.log('Done.');
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { up };
