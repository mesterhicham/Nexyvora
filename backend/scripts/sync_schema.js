const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function syncSchema() {
    try {
        const [tables] = await pool.query('SHOW TABLES');
        let sql = `-- ============================================================
-- NEXYVORA CANONICAL DATABASE SCHEMA (MySQL Version)
-- Complete 55-Table Schema Synchronized with Backend
-- ============================================================

CREATE DATABASE IF NOT EXISTS \`nextvora\`;
USE \`nextvora\`;

SET FOREIGN_KEY_CHECKS = 0;

`;

        for (const row of tables) {
            const tableName = Object.values(row)[0];
            const [createRes] = await pool.query(`SHOW CREATE TABLE \`${tableName}\``);
            const createSql = createRes[0]['Create Table'];
            sql += `-- ------------------------------------------------------------\n`;
            sql += `-- Table: ${tableName}\n`;
            sql += `-- ------------------------------------------------------------\n`;
            sql += createSql + ';\n\n';
        }

        sql += `SET FOREIGN_KEY_CHECKS = 1;\n`;

        const targetPath = path.join(__dirname, '..', '..', 'mysql_schema.sql');
        fs.writeFileSync(targetPath, sql, 'utf8');
        console.log(`Successfully synchronized ${tables.length} tables to mysql_schema.sql`);
        process.exit(0);
    } catch (err) {
        console.error('Failed to sync schema:', err);
        process.exit(1);
    }
}

syncSchema();
