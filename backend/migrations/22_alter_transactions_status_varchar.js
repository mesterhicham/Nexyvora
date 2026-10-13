const db = require('../config/db');

async function up() {
    console.log('[Migration 22] Altering transactions table status column to VARCHAR(50)...');
    try {
        await db.query(`
            ALTER TABLE transactions 
            MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'completed'
        `);
        console.log('[Migration 22] Altered transactions.status successfully to VARCHAR(50).');
    } catch (err) {
        console.error('[Migration 22] Error altering transactions.status:', err.message);
        throw err;
    }
}

if (require.main === module) {
    up().then(() => {
        console.log('[Migration 22] Completed successfully.');
        process.exit(0);
    }).catch(err => {
        console.error('[Migration 22] Failed:', err);
        process.exit(1);
    });
}

module.exports = { up };
