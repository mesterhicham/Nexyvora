const db = require('../config/db');
const crypto = require('crypto');

function genUuid() {
    return crypto.randomUUID();
}

async function up() {
    console.log('--- Migration 14: Creating Founder Club & Pool Tables ---');
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Table: founder_settings
        console.log('1. Creating founder_settings table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS founder_settings (
                id VARCHAR(36) PRIMARY KEY,
                total_seats INT NOT NULL DEFAULT 100,
                target_direct_sales DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
                pool_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.00,
                calculation_basis VARCHAR(30) NOT NULL DEFAULT 'net_margin',
                current_rollover DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // Seed default founder_settings if empty
        const [settingsRows] = await connection.query('SELECT id FROM founder_settings LIMIT 1');
        if (settingsRows.length === 0) {
            await connection.query(`
                INSERT INTO founder_settings (id, total_seats, target_direct_sales, pool_percentage, calculation_basis, current_rollover, is_active)
                VALUES (?, 100, 5000.00, 2.00, 'net_margin', 0.00, 1)
            `, [genUuid()]);
            console.log('   Seeded default founder_settings (100 seats, $5000 sales, 2%).');
        }

        // 2. Table: founder_members
        console.log('2. Creating founder_members table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS founder_members (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                seat_number INT NOT NULL,
                qualified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                direct_sales_achieved DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                status ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
                granted_by ENUM('system', 'admin_manual') NOT NULL DEFAULT 'system',
                notes TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_founder_user (user_id),
                UNIQUE KEY uq_founder_seat (seat_number),
                INDEX idx_founder_status (status),
                CONSTRAINT fk_founder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 3. Table: founder_distributions
        console.log('3. Creating founder_distributions table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS founder_distributions (
                id VARCHAR(36) PRIMARY KEY,
                period_year INT NOT NULL,
                period_month INT NOT NULL,
                gross_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                total_commissions DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                net_margin DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                pool_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.00,
                pool_base_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                rollover_in DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                total_pool_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                founders_count INT NOT NULL DEFAULT 0,
                share_per_founder DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                rollover_out DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                status ENUM('distributed', 'rolled_over', 'pending') NOT NULL DEFAULT 'pending',
                notes TEXT NULL,
                executed_by VARCHAR(36) NULL,
                executed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_founder_dist_period (period_year, period_month),
                INDEX idx_founder_dist_period (period_year, period_month)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 4. Table: founder_payouts
        console.log('4. Creating founder_payouts table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS founder_payouts (
                id VARCHAR(36) PRIMARY KEY,
                distribution_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                seat_number INT NOT NULL,
                amount DECIMAL(12,2) NOT NULL,
                status ENUM('paid', 'failed') NOT NULL DEFAULT 'paid',
                transaction_id VARCHAR(36) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_fp_dist_user (distribution_id, user_id),
                INDEX idx_fp_user (user_id),
                INDEX idx_fp_seat (seat_number),
                CONSTRAINT fk_fp_dist FOREIGN KEY (distribution_id) REFERENCES founder_distributions(id) ON DELETE CASCADE,
                CONSTRAINT fk_fp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        await connection.commit();
        console.log('✓ Migration 14 completed successfully.');
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Error during migration 14:', err.message);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    up().then(() => {
        console.log('Migration 14 finished.');
        process.exit(0);
    }).catch(err => {
        console.error('Migration 14 failed:', err);
        process.exit(1);
    });
}

module.exports = { up };
