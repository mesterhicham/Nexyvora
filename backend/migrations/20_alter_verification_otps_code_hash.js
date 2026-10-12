const db = require('../config/db');

async function up() {
    console.log('--- Migration 20: Altering verification_otps code column to VARCHAR(64) for secure SHA-256 hashes ---');
    let connection;
    try {
        connection = await db.getConnection();
        await connection.query("ALTER TABLE verification_otps MODIFY COLUMN code VARCHAR(64) NOT NULL");
        console.log('   Successfully altered verification_otps.code to VARCHAR(64).');
        console.log('--- Migration 20 completed successfully ---');
    } catch (err) {
        console.error('Migration 20 failed:', err.message);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up };
