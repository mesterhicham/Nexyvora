const db = require('../config/db');

async function up() {
    console.log('--- Migration 19: Adding token_version to users table ---');
    let connection;
    try {
        connection = await db.getConnection();
        const [cols] = await connection.query("SHOW COLUMNS FROM users LIKE 'token_version'");
        if (cols.length === 0) {
            await connection.query("ALTER TABLE users ADD COLUMN token_version INT NOT NULL DEFAULT 1 AFTER status");
            console.log('   Added token_version column to users.');
        } else {
            console.log('   token_version already exists.');
        }
        console.log('--- Migration 19 completed successfully ---');
    } catch (err) {
        console.error('Migration 19 failed:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up };
