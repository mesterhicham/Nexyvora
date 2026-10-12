const db = require('../config/db');

async function up() {
    console.log('[Migration 13] Altering withdrawal_requests payment_method column to VARCHAR(100)...');
    try {
        await db.query(`
            ALTER TABLE withdrawal_requests 
            MODIFY COLUMN payment_method VARCHAR(100) NOT NULL DEFAULT 'other'
        `);
        console.log('[Migration 13] Altered withdrawal_requests.payment_method successfully to VARCHAR(100).');
    } catch (err) {
        console.error('[Migration 13] Error altering withdrawal_requests.payment_method:', err.message);
        throw err;
    }
}

if (require.main === module) {
    up().then(() => {
        console.log('[Migration 13] Completed successfully.');
        process.exit(0);
    }).catch(err => {
        console.error('[Migration 13] Failed:', err);
        process.exit(1);
    });
}

module.exports = { up };
