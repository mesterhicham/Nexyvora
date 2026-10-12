const db = require('../config/db');
const crypto = require('crypto');
const genUuid = () => crypto.randomUUID();

async function migratePhase3() {
    let connection;
    try {
        console.log('Connecting to MySQL database...');
        connection = await db.getConnection();
        console.log('Connected successfully. Starting Phase 3 Migration...');

        // 1. Add can_withdraw to user_wallets if not present
        console.log('1. Checking user_wallets for can_withdraw...');
        const [walletCols] = await connection.query('DESCRIBE user_wallets');
        const hasCanWithdraw = walletCols.some(c => c.Field === 'can_withdraw');
        if (!hasCanWithdraw) {
            await connection.query('ALTER TABLE user_wallets ADD COLUMN can_withdraw TINYINT(1) DEFAULT 1 AFTER total_withdrawn');
            console.log('   Added can_withdraw column to user_wallets.');
        } else {
            console.log('   can_withdraw column already exists in user_wallets.');
        }

        // 2. Add kyc_status to users if not present
        console.log('2. Checking users for kyc_status...');
        const [userCols] = await connection.query('DESCRIBE users');
        const hasKycStatus = userCols.some(c => c.Field === 'kyc_status');
        if (!hasKycStatus) {
            await connection.query("ALTER TABLE users ADD COLUMN kyc_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' AFTER affiliate_enabled");
            console.log('   Added kyc_status column to users.');
        } else {
            console.log('   kyc_status column already exists in users.');
        }

        // 3. Create transactions table
        console.log('3. Creating transactions table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS transactions (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                type ENUM('deposit', 'withdrawal', 'commission', 'bonus', 'admin_credit', 'admin_debit', 'package_purchase') NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                balance_before DECIMAL(10, 2) DEFAULT 0.00,
                balance_after DECIMAL(10, 2) DEFAULT 0.00,
                status ENUM('pending', 'completed', 'failed', 'rejected') DEFAULT 'completed',
                reference_id VARCHAR(100),
                description TEXT,
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_tx_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 4. Create user_kyc table
        console.log('4. Creating user_kyc table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_kyc (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) UNIQUE NOT NULL,
                full_name VARCHAR(150) NOT NULL,
                document_type ENUM('national_id', 'passport', 'driving_license') DEFAULT 'national_id',
                document_number VARCHAR(100) NOT NULL,
                front_image_url VARCHAR(255) NOT NULL,
                back_image_url VARCHAR(255),
                status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
                admin_notes TEXT,
                reviewed_by VARCHAR(36) NULL,
                reviewed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_kyc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 5. Create leader_achievers table
        console.log('5. Creating leader_achievers table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS leader_achievers (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                rank_id VARCHAR(36) NOT NULL,
                direct_sales_at_time DECIMAL(10, 2) DEFAULT 0.00,
                team_turnover_at_time DECIMAL(10, 2) DEFAULT 0.00,
                reward_amount DECIMAL(10, 2) DEFAULT 0.00,
                reward_paid TINYINT(1) DEFAULT 0,
                achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_la_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_la_rank FOREIGN KEY (rank_id) REFERENCES ranks(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        console.log('Phase 3 Migration completed successfully!');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

migratePhase3();
