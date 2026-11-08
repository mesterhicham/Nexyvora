const db = require('../config/db');

/**
 * Migration 32: lesson presentation fields for the Academy watch page.
 *  - formation_content.thumbnail_url : per-lesson thumbnail (falls back to the course thumbnail)
 *  - formation_content.description   : lesson description shown under the player
 *  - formation_content.resources     : JSON array of { title, url } downloadable resources
 *  - formations.package_id / teacher_id when missing (referenced by the code, absent from the schema)
 */
async function columnExists(connection, table, column) {
    const [rows] = await connection.query(
        `SELECT 1 FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
        [table, column]
    );
    return rows.length > 0;
}

async function up() {
    console.log('--- Migration 32: lesson thumbnail, description and resources ---');
    let connection;
    try {
        connection = await db.getConnection();
        const columns = [
            ['thumbnail_url', 'TEXT NULL'],
            ['description', 'TEXT NULL'],
            ['resources', 'TEXT NULL'],
        ];
        for (const [name, definition] of columns) {
            if (!(await columnExists(connection, 'formation_content', name))) {
                console.log(`Adding formation_content.${name}...`);
                await connection.query(`ALTER TABLE formation_content ADD COLUMN ${name} ${definition}`);
            }
        }
        // formations.package_id / teacher_id are used by the code but were never created by a migration
        if (!(await columnExists(connection, 'formations', 'package_id'))) {
            console.log('Adding formations.package_id...');
            await connection.query('ALTER TABLE formations ADD COLUMN package_id VARCHAR(36) NULL');
        }
        if (!(await columnExists(connection, 'formations', 'teacher_id'))) {
            console.log('Adding formations.teacher_id...');
            await connection.query('ALTER TABLE formations ADD COLUMN teacher_id VARCHAR(36) NULL');
        }
        console.log('--- Migration 32 completed ---');
    } catch (err) {
        console.error('Migration 32 failed:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    up().then(() => {
        console.log('Done.');
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { up };
