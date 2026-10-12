const db = require('../config/db');

async function up() {
    console.log('--- Migration 18: Creating promised_packages table ---');
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Table: promised_packages
        console.log('1. Creating promised_packages table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS promised_packages (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                package_id VARCHAR(36) NOT NULL,
                granted_by VARCHAR(36) NOT NULL,
                type VARCHAR(50) NOT NULL DEFAULT 'marketing',
                status ENUM('active', 'pending', 'revoked') NOT NULL DEFAULT 'active',
                user_package_id VARCHAR(36) NULL,
                notes TEXT NULL,
                granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                revoked_at DATETIME NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_pp_user_status (user_id, status),
                INDEX idx_pp_package (package_id),
                INDEX idx_pp_status (status),
                CONSTRAINT fk_pp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_pp_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
                CONSTRAINT fk_pp_granter FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `);

        // 2. Add is_promised column to user_packages if not present
        console.log('2. Checking is_promised column in user_packages...');
        const [cols] = await connection.query(`SHOW COLUMNS FROM user_packages LIKE 'is_promised'`);
        if (cols.length === 0) {
            await connection.query(`ALTER TABLE user_packages ADD COLUMN is_promised TINYINT(1) DEFAULT 0 AFTER is_current`);
            console.log('   Added is_promised column to user_packages.');
        }

        await connection.commit();
        console.log('--- Migration 18 completed successfully ---');
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Migration 18 failed:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up };
