const fs = require('fs');
const path = require('path');
const pool = require('./config/db');

async function importSchema() {
    try {
        const schemaPath = path.join(__dirname, '..', 'mysql_schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolon but be careful with many statements
        // A better way is to use the mysql command line, but we'll try this
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Executing ${statements.length} SQL statements...`);

        for (let statement of statements) {
            try {
                await pool.query(statement);
            } catch (err) {
                console.error(`Error executing statement: ${statement.substring(0, 50)}...`);
                console.error(err.message);
            }
        }

        console.log('Schema import completed.');
        process.exit(0);
    } catch (err) {
        console.error('Schema import failed:', err.message);
        process.exit(1);
    }
}

importSchema();
