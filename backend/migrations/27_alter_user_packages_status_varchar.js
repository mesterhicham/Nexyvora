const db = require('../config/db');

async function up() {
    console.log('[Migration 27] Altering user_packages table status column to VARCHAR(50)...');
    try {
        await db.query(`
            ALTER TABLE user_packages 
            MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'
        `);
        console.log('[Migration 27] Altered user_packages.status successfully to VARCHAR(50).');
    } catch (err) {
        console.error('[Migration 27] Error altering user_packages.status:', err.message);
        throw err;
    }
}

if (require.main === module) {
    up().then(() => {
        console.log('[Migration 27] Completed successfully.');
        process.exit(0);
    }).catch(err => {
        console.error('[Migration 27] Failed:', err);
        process.exit(1);
    });
}

module.exports = { up };
