const pool = require('./config/db');

async function migrate() {
    try {
        console.log('Adding experience column to teachers table...');
        await pool.query("ALTER TABLE teachers ADD COLUMN experience TEXT AFTER specialty");
        console.log('Column added successfully (or already exists).');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
