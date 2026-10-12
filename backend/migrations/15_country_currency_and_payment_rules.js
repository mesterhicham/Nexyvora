const db = require('../config/db');
const crypto = require('crypto');

function genUuid() {
    return crypto.randomUUID();
}

async function up() {
    console.log('--- Migration 15: Creating Country Currency & Payment Rules & Audit Logs ---');
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Table: country_currency_rules
        console.log('1. Creating country_currency_rules table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS country_currency_rules (
                country_code VARCHAR(10) PRIMARY KEY,
                country_name VARCHAR(100) NOT NULL,
                country_name_ar VARCHAR(100) NOT NULL,
                currency_code VARCHAR(10) NOT NULL,
                currency_symbol VARCHAR(10) NOT NULL,
                usd_rate DECIMAL(12, 4) NOT NULL DEFAULT 1.0000,
                usdt_rate DECIMAL(12, 4) NOT NULL DEFAULT 1.0000,
                usdt_enabled TINYINT(1) NOT NULL DEFAULT 1,
                local_currency_enabled TINYINT(1) NOT NULL DEFAULT 1,
                stripe_enabled TINYINT(1) NOT NULL DEFAULT 0,
                paypal_enabled TINYINT(1) NOT NULL DEFAULT 0,
                payoneer_enabled TINYINT(1) NOT NULL DEFAULT 0,
                bank_transfer_enabled TINYINT(1) NOT NULL DEFAULT 1,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                sort_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // Seed default country rules if table is empty
        const [existingRules] = await connection.query('SELECT country_code FROM country_currency_rules LIMIT 1');
        if (existingRules.length === 0) {
            console.log('   Seeding initial country rules (Morocco, Algeria, Tunisia, France, USA, Global)...');
            const defaultRules = [
                // Morocco: 1 USD = 10 MAD, 1 USDT = 10 MAD, USDT enabled, Bank enabled
                ['MA', 'Morocco', 'المغرب', 'MAD', 'DH', 10.0000, 10.0000, 1, 1, 0, 0, 0, 1, 1, 1],
                // Algeria: 1 USD = 250 DZD, 1 USDT = 250 DZD, STRICT BAN ON USDT (usdt_enabled = 0)
                ['DZ', 'Algeria', 'الجزائر', 'DZD', 'DA', 250.0000, 250.0000, 0, 1, 0, 0, 0, 1, 1, 2],
                // Tunisia: 1 USD = 3.10 TND, USDT enabled
                ['TN', 'Tunisia', 'تونس', 'TND', 'DT', 3.1000, 3.1000, 1, 1, 0, 0, 0, 1, 1, 3],
                // France: 1 USD = 0.92 EUR
                ['FR', 'France', 'فرنسا', 'EUR', '€', 0.9200, 0.9200, 1, 1, 1, 1, 0, 1, 1, 4],
                // United States: 1 USD = 1 USD
                ['US', 'United States', 'الولايات المتحدة', 'USD', '$', 1.0000, 1.0000, 1, 1, 1, 1, 1, 1, 1, 5],
                // Global fallback
                ['GLOBAL', 'Global / Rest of World', 'باقي دول العالم', 'USD', '$', 1.0000, 1.0000, 1, 1, 1, 1, 1, 1, 1, 99]
            ];

            for (const r of defaultRules) {
                await connection.query(`
                    INSERT INTO country_currency_rules (
                        country_code, country_name, country_name_ar, currency_code, currency_symbol,
                        usd_rate, usdt_rate, usdt_enabled, local_currency_enabled,
                        stripe_enabled, paypal_enabled, payoneer_enabled, bank_transfer_enabled,
                        is_active, sort_order
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, r);
            }
            console.log('   Default country rules seeded successfully.');
        }

        // 2. Table: currency_audit_logs
        console.log('2. Creating currency_audit_logs table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS currency_audit_logs (
                id VARCHAR(36) PRIMARY KEY,
                admin_id VARCHAR(36) NOT NULL,
                admin_email VARCHAR(255) NOT NULL,
                action VARCHAR(100) NOT NULL,
                country_code VARCHAR(10) NOT NULL,
                field_name VARCHAR(100) NOT NULL,
                old_value TEXT,
                new_value TEXT,
                ip_address VARCHAR(50),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_audit_country (country_code),
                INDEX idx_audit_admin (admin_id),
                INDEX idx_audit_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // 3. Add country_code column to profiles if not present
        console.log('3. Checking profiles table for country_code column...');
        const [colRows] = await connection.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'profiles' AND COLUMN_NAME = 'country_code'
        `);

        if (colRows.length === 0) {
            console.log('   Adding country_code column to profiles...');
            await connection.query(`
                ALTER TABLE profiles ADD COLUMN country_code VARCHAR(10) NULL AFTER country,
                ADD INDEX idx_profiles_country_code (country_code)
            `);
        }

        // 4. Backfill country_code from profiles.country
        console.log('4. Backfilling country_code in profiles...');
        await connection.query(`
            UPDATE profiles 
            SET country_code = 'MA' 
            WHERE (country_code IS NULL OR country_code = '') 
              AND (country LIKE '%Morocco%' OR country LIKE '%Maroc%' OR country LIKE '%المغرب%')
        `);

        await connection.query(`
            UPDATE profiles 
            SET country_code = 'DZ' 
            WHERE (country_code IS NULL OR country_code = '') 
              AND (country LIKE '%Algeria%' OR country LIKE '%Algérie%' OR country LIKE '%الجزائر%')
        `);

        await connection.query(`
            UPDATE profiles 
            SET country_code = 'TN' 
            WHERE (country_code IS NULL OR country_code = '') 
              AND (country LIKE '%Tunisia%' OR country LIKE '%Tunisie%' OR country LIKE '%تونس%')
        `);

        await connection.query(`
            UPDATE profiles 
            SET country_code = 'FR' 
            WHERE (country_code IS NULL OR country_code = '') 
              AND (country LIKE '%France%' OR country LIKE '%فرنسا%')
        `);

        await connection.query(`
            UPDATE profiles 
            SET country_code = 'US' 
            WHERE (country_code IS NULL OR country_code = '') 
              AND (country LIKE '%United States%' OR country LIKE '%USA%' OR country LIKE '%أمريكا%')
        `);

        await connection.commit();
        console.log('--- Migration 15 completed successfully! ---');
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Migration 15 failed:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

async function down() {
    console.log('--- Migration 15 DOWN ---');
    // We intentionally do not drop columns or tables to preserve user safety
}

if (require.main === module) {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up, down };
