const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'nextvora'
    });

    console.log('--- Migration: Add teacher_id to formations ---');

    try {
        const [cols] = await connection.query("SHOW COLUMNS FROM formations LIKE 'teacher_id'");
        if (cols.length === 0) {
            await connection.query("ALTER TABLE formations ADD COLUMN teacher_id VARCHAR(36) NULL AFTER package_id");
            await connection.query("ALTER TABLE formations ADD INDEX idx_formations_teacher_id (teacher_id)");
            console.log('Successfully added teacher_id column to formations.');
        } else {
            console.log('Column teacher_id already exists in formations.');
        }
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await connection.end();
    }
}

if (require.main === module) {
    runMigration();
}

module.exports = runMigration;
