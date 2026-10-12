const db = require('../config/db');
const crypto = require('crypto');

function genUuid() {
    return crypto.randomUUID();
}

async function run() {
    console.log('--- Migration 10: Creating Bonus Pools Tables ---');
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Table: bonus_pools
        console.log('1. Creating bonus_pools table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bonus_pools (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                name_ar VARCHAR(100) NOT NULL,
                target_rank_id VARCHAR(36) NULL,
                target_rank_level INT NOT NULL DEFAULT 5,
                pool_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.00,
                calculation_basis VARCHAR(30) NOT NULL DEFAULT 'net_margin',
                current_rollover DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_target_rank (target_rank_id),
                INDEX idx_target_level (target_rank_level)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 2. Table: bonus_pool_distributions
        console.log('2. Creating bonus_pool_distributions table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bonus_pool_distributions (
                id VARCHAR(36) PRIMARY KEY,
                pool_id VARCHAR(36) NOT NULL,
                period_year INT NOT NULL,
                period_month INT NOT NULL,
                gross_sales DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                total_commissions DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                net_margin DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                pool_percentage DECIMAL(5,2) NOT NULL DEFAULT 2.00,
                pool_base_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                rollover_in DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                total_pool_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                eligible_leaders_count INT NOT NULL DEFAULT 0,
                share_per_leader DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                rollover_out DECIMAL(12,2) NOT NULL DEFAULT 0.00,
                status ENUM('distributed', 'rolled_over', 'pending') NOT NULL DEFAULT 'pending',
                notes TEXT NULL,
                executed_by VARCHAR(36) NULL,
                executed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_pool_period (pool_id, period_year, period_month),
                INDEX idx_period (period_year, period_month),
                INDEX idx_pool_id (pool_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 3. Table: bonus_pool_payouts
        console.log('3. Creating bonus_pool_payouts table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS bonus_pool_payouts (
                id VARCHAR(36) PRIMARY KEY,
                distribution_id VARCHAR(36) NOT NULL,
                pool_id VARCHAR(36) NOT NULL,
                user_id VARCHAR(36) NOT NULL,
                amount DECIMAL(12,2) NOT NULL,
                status ENUM('paid', 'failed') NOT NULL DEFAULT 'paid',
                transaction_id VARCHAR(36) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_dist_user (distribution_id, user_id),
                INDEX idx_pool_user (pool_id, user_id),
                INDEX idx_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 4. Seed default Diamond VIP Pool if not already seeded
        console.log('4. Checking default Diamond Leadership Pool...');
        const [existingPools] = await connection.query('SELECT id FROM bonus_pools LIMIT 1');
        if (existingPools.length === 0) {
            // Find Diamond rank (level 5)
            const [diamondRanks] = await connection.query('SELECT id, level FROM ranks WHERE level = 5 LIMIT 1');
            const diamondRankId = diamondRanks[0]?.id || null;

            const poolId = genUuid();
            await connection.query(`
                INSERT INTO bonus_pools (id, name, name_ar, target_rank_id, target_rank_level, pool_percentage, calculation_basis, current_rollover, is_active)
                VALUES (?, 'Diamond Leadership Pool', 'حوض قيادة الماس الشهري', ?, 5, 2.00, 'net_margin', 0.00, 1)
            `, [poolId, diamondRankId]);
            console.log('   Seeded default Diamond VIP Pool (2%).');
        } else {
            console.log('   Bonus pools already exist.');
        }

        await connection.commit();
        console.log('--- Migration 10 Completed Successfully ---');
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Migration 10 failed:', err);
        process.exit(1);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

run();
