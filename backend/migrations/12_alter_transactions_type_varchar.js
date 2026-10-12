const db = require('../config/db');

async function up() {
    console.log('[Migration 12] Altering transactions table type column to VARCHAR(50)...');
    try {
        await db.query(`
            ALTER TABLE transactions 
            MODIFY COLUMN type VARCHAR(50) NOT NULL DEFAULT 'commission'
        `);
        console.log('[Migration 12] Altered transactions.type successfully to VARCHAR(50).');
    } catch (err) {
        console.error('[Migration 12] Error altering transactions.type:', err.message);
        throw err;
    }
}

if (require.main === module) {
    up().then(() => {
        console.log('[Migration 12] Completed successfully.');
        process.exit(0);
    }).catch(err => {
        console.error('[Migration 12] Failed:', err);
        process.exit(1);
    });
}

module.exports = { up };
