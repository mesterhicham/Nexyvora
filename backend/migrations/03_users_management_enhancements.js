const db = require('../config/db');

async function runMigration() {
    console.log('--- Starting Migration 03: Users Management Enhancements ---');
    try {
        // 1. Add username column if not exists
        try {
            await db.query(`ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER email`);
            console.log('Added column users.username');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('users.username already exists');
            else console.log('users.username:', e.message);
        }

        // 2. Add wallet_pin column if not exists
        try {
            await db.query(`ALTER TABLE users ADD COLUMN wallet_pin VARCHAR(20) NULL AFTER password`);
            console.log('Added column users.wallet_pin');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('users.wallet_pin already exists');
            else console.log('users.wallet_pin:', e.message);
        }

        // 3. Add status column if not exists
        try {
            await db.query(`ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active' AFTER affiliate_enabled`);
            console.log('Added column users.status');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') console.log('users.status already exists');
            else console.log('users.status:', e.message);
        }

        // 4. Update usernames for existing users who have null username
        await db.query(`
            UPDATE users 
            SET username = LOWER(REPLACE(SUBSTRING_INDEX(email, '@', 1), '.', '_')) 
            WHERE username IS NULL OR username = ''
        `);
        console.log('Populated usernames from email prefix where missing');

        console.log('--- Migration 03 Completed Successfully ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

runMigration();
