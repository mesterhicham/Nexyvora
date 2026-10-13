const db = require('../config/db');

async function up() {
    console.log('[Migration 23] Creating payment_attempts table...');

    await db.query(`
        CREATE TABLE IF NOT EXISTS payment_attempts (
            id VARCHAR(36) NOT NULL PRIMARY KEY,
            transaction_id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            provider VARCHAR(50) NOT NULL DEFAULT 'nowpayments',
            provider_payment_id VARCHAR(100) NULL,
            provider_order_id VARCHAR(100) NULL,
            attempt_number INT NOT NULL DEFAULT 1,
            pay_address VARCHAR(255) NULL,
            pay_amount DECIMAL(24, 8) NULL,
            pay_currency VARCHAR(50) NULL,
            price_amount DECIMAL(12, 2) NOT NULL,
            price_currency VARCHAR(10) NOT NULL DEFAULT 'USD',
            network VARCHAR(50) NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'waiting',
            is_wallet_credited TINYINT(1) NOT NULL DEFAULT 0,
            wallet_credited_at DATETIME NULL,
            actually_paid DECIMAL(24, 8) NULL,
            actually_paid_fiat DECIMAL(12, 2) NULL,
            calculation_policy VARCHAR(100) NULL,
            ipn_callback_url TEXT NULL,
            next_renewal_at DATETIME NULL,
            expires_at DATETIME NULL,
            renewal_error TEXT NULL,
            last_ipn_payload JSON NULL,
            metadata JSON NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_pa_trx (transaction_id),
            INDEX idx_pa_user (user_id),
            INDEX idx_pa_status (status),
            INDEX idx_pa_renewal (status, next_renewal_at),
            INDEX idx_pa_credited (is_wallet_credited),
            UNIQUE KEY uq_provider_payment (provider, provider_payment_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create cron_locks table for persistent distributed worker synchronization
    await db.query(`
        CREATE TABLE IF NOT EXISTS cron_locks (
            lock_name VARCHAR(100) NOT NULL PRIMARY KEY,
            locked_by VARCHAR(100) NOT NULL,
            acquired_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('[Migration 23] payment_attempts and cron_locks tables created successfully.');
}

async function down() {
    console.log('[Migration 23] Dropping payment_attempts and cron_locks tables...');
    await db.query(`DROP TABLE IF EXISTS payment_attempts;`);
    await db.query(`DROP TABLE IF EXISTS cron_locks;`);
}

if (require.main === module) {
    up()
        .then(() => {
            console.log('Migration completed successfully.');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Migration failed:', err);
            process.exit(1);
        });
}

module.exports = { up, down };
