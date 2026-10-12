const pool = require('../config/db');
const crypto = require('crypto');

function genUuid() {
    return crypto.randomUUID();
}

async function runMigration() {
    console.log('--- Starting Phase 1 Migration: Packages & 5-Gen Affiliate System ---');
    const connection = await pool.getConnection();

    try {
        // 1. Add affiliate columns to users table if they don't exist
        console.log('1. Updating users table with affiliate columns...');
        const [userCols] = await connection.query("SHOW COLUMNS FROM users LIKE 'affiliate_code'");
        if (userCols.length === 0) {
            await connection.query(`
                ALTER TABLE users
                ADD COLUMN affiliate_code VARCHAR(20) UNIQUE NULL AFTER role,
                ADD COLUMN referrer_id VARCHAR(36) NULL AFTER affiliate_code,
                ADD COLUMN affiliate_status ENUM('inactive', 'active', 'suspended') DEFAULT 'active' AFTER referrer_id,
                ADD COLUMN affiliate_enabled TINYINT(1) DEFAULT 1 AFTER affiliate_status,
                ADD CONSTRAINT fk_users_referrer FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE SET NULL
            `);
            console.log('   Users table altered successfully.');
        } else {
            console.log('   Affiliate columns already present in users table.');
        }

        // 2. Generate unique affiliate codes for existing users who don't have one
        console.log('2. Populating affiliate_code for existing users...');
        const [existingUsers] = await connection.query("SELECT id FROM users WHERE affiliate_code IS NULL OR affiliate_code = ''");
        for (const u of existingUsers) {
            const shortCode = 'NV' + Math.floor(100000 + Math.random() * 900000);
            await connection.query("UPDATE users SET affiliate_code = ? WHERE id = ?", [shortCode, u.id]);
        }
        console.log(`   Generated affiliate codes for ${existingUsers.length} user(s).`);

        // Clean drop any partially created tables to ensure unified charset
        console.log('Cleaning up any previous partial tables...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DROP TABLE IF EXISTS package_courses');
        await connection.query('DROP TABLE IF EXISTS user_packages');
        await connection.query('DROP TABLE IF EXISTS commissions');
        await connection.query('DROP TABLE IF EXISTS packages');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // 3. Create packages table
        console.log('3. Creating packages table...');
        await connection.query(`
            CREATE TABLE packages (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                name_ar VARCHAR(100) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                level INT NOT NULL UNIQUE,
                description TEXT,
                description_ar TEXT,
                features TEXT,
                badge_text VARCHAR(50),
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 4. Create package_courses table
        console.log('4. Creating package_courses table...');
        await connection.query(`
            CREATE TABLE package_courses (
                id VARCHAR(36) PRIMARY KEY,
                package_id VARCHAR(36) NOT NULL,
                formation_id VARCHAR(36) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uk_package_formation (package_id, formation_id),
                CONSTRAINT fk_pc_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE,
                CONSTRAINT fk_pc_formation FOREIGN KEY (formation_id) REFERENCES formations(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 5. Create user_packages table (Student active subscriptions & upgrades)
        console.log('5. Creating user_packages table...');
        await connection.query(`
            CREATE TABLE user_packages (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                package_id VARCHAR(36) NOT NULL,
                amount_paid DECIMAL(10, 2) NOT NULL,
                payment_method VARCHAR(50) DEFAULT 'manual',
                payment_reference VARCHAR(255),
                status ENUM('active', 'expired', 'upgraded', 'pending') DEFAULT 'active',
                is_current TINYINT(1) DEFAULT 1,
                upgraded_from_package_id VARCHAR(36) NULL,
                purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NULL,
                CONSTRAINT fk_up_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_up_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 6. Create user_wallets table
        console.log('6. Creating user_wallets table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_wallets (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) UNIQUE NOT NULL,
                balance DECIMAL(10, 2) DEFAULT 0.00,
                pending_balance DECIMAL(10, 2) DEFAULT 0.00,
                total_earned DECIMAL(10, 2) DEFAULT 0.00,
                total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_wallet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // Create wallets for all existing users if they don't have one
        const [usersWithoutWallet] = await connection.query(`
            SELECT u.id FROM users u
            LEFT JOIN user_wallets w ON u.id = w.user_id
            WHERE w.id IS NULL
        `);
        for (const u of usersWithoutWallet) {
            await connection.query(`
                INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)
            `, [genUuid(), u.id]);
        }
        console.log(`   Ensured wallets for ${usersWithoutWallet.length} user(s).`);

        // 7. Create commissions table (5-Generation logs)
        console.log('7. Creating commissions table...');
        await connection.query(`
            CREATE TABLE commissions (
                id VARCHAR(36) PRIMARY KEY,
                recipient_id VARCHAR(36) NOT NULL,
                source_user_id VARCHAR(36) NOT NULL,
                package_id VARCHAR(36) NOT NULL,
                user_package_id VARCHAR(36) NULL,
                generation_level TINYINT NOT NULL,
                rate_percentage DECIMAL(5, 2) NOT NULL,
                sale_amount DECIMAL(10, 2) NOT NULL,
                commission_amount DECIMAL(10, 2) NOT NULL,
                status ENUM('available', 'pending', 'paid', 'cancelled') DEFAULT 'available',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_comm_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_comm_source FOREIGN KEY (source_user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_comm_package FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 8. Create withdrawal_requests table
        console.log('8. Creating withdrawal_requests table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS withdrawal_requests (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_method ENUM('bank_transfer', 'paypal', 'payoneer', 'stripe', 'other') NOT NULL,
                payment_details TEXT NOT NULL,
                status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
                admin_notes TEXT,
                transaction_proof VARCHAR(255),
                processed_by VARCHAR(36) NULL,
                processed_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_with_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 9. Create user_payout_settings table
        console.log('9. Creating user_payout_settings table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_payout_settings (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) UNIQUE NOT NULL,
                bank_name VARCHAR(100),
                account_holder VARCHAR(100),
                iban VARCHAR(50),
                swift_code VARCHAR(50),
                paypal_email VARCHAR(255),
                payoneer_email VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_payout_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 10. Create ranks table
        console.log('10. Creating ranks table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ranks (
                id VARCHAR(36) PRIMARY KEY,
                level INT NOT NULL UNIQUE,
                name VARCHAR(100) NOT NULL,
                name_ar VARCHAR(100) NOT NULL,
                badge_icon VARCHAR(50) DEFAULT 'Award',
                min_direct_sales INT DEFAULT 0,
                min_team_turnover DECIMAL(12, 2) DEFAULT 0.00,
                reward_bonus DECIMAL(10, 2) DEFAULT 0.00,
                color_hex VARCHAR(20) DEFAULT '#7c3aed',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8
        `);

        // 11. Seed the 4 Standard Packages ($100, $250, $500, $1000)
        console.log('11. Seeding default Packages...');
        const defaultPackages = [
            {
                id: genUuid(),
                name: 'Starter Pack',
                name_ar: 'الباقة الأساسية',
                slug: 'pack-100',
                price: 100.00,
                level: 1,
                description: 'Ideal starting pack to begin learning and affiliate marketing.',
                description_ar: 'الباقة المثالية للبداية واكتساب المهارات الأساسية وبدء بناء فريقك التسويقي.',
                badge_text: 'البداية',
                features: JSON.stringify([
                    'الوصول لدورات المستوى الأول',
                    'كود ورابط إحالة لتسويق الباقات',
                    'أرباح مباشرة 10% على مبيعاتك',
                    'أرباح غير مباشرة حتى 5 أجيال (4%, 3%, 2%, 1%)',
                    'دعم فني عبر المنصة'
                ])
            },
            {
                id: genUuid(),
                name: 'Pro Pack',
                name_ar: 'الباقة المتقدمة (برو)',
                slug: 'pack-250',
                price: 250.00,
                level: 2,
                description: 'Advanced pack including all Starter courses plus specialized training.',
                description_ar: 'تشمل جميع دورات الباقة الأساسية بالإضافة إلى تدريبات ومحتوى تخصصي متقدم.',
                badge_text: 'الأكثر طلباً',
                features: JSON.stringify([
                    'جميع مميزات ودورات باقة 100$',
                    'دورات متقدمة في التجارة والمهارات الرقمية',
                    'جلسات تدريبية أسبوعية مسجلة',
                    'أرباح حتى 5 أجيال كاملة',
                    'أولوية في معالجة طلبات السحب'
                ])
            },
            {
                id: genUuid(),
                name: 'Master Pack',
                name_ar: 'باقة الماستر (الاحترافية)',
                slug: 'pack-500',
                price: 500.00,
                level: 3,
                description: 'Comprehensive professional training bundle with full cumulative access.',
                description_ar: 'حزمة احترافية متكاملة تفتح جميع محتويات باقات 100$ و 250$ مع دورات حصرية.',
                badge_text: 'قيمة ممتازة',
                features: JSON.stringify([
                    'جميع محتويات باقات 100$ و 250$ التراكمية',
                    'دورات احترافية واستراتيجيات متقدمة',
                    'قوالب ومصادر عمل حصرية',
                    'شارات تميز في الحساب الشخصي',
                    'دعم مخصص واستشارات'
                ])
            },
            {
                id: genUuid(),
                name: 'VIP Elite Pack',
                name_ar: 'باقة النخبة (VIP)',
                slug: 'pack-1000',
                price: 1000.00,
                level: 4,
                description: 'The ultimate VIP package giving full access to all platform courses and resources.',
                description_ar: 'الباقة الشاملة الكبرى تمنحك وصولاً كاملاً وغير محدود لجميع دورات وتحديثات الأكاديمية.',
                badge_text: 'VIP النخبة',
                features: JSON.stringify([
                    'وصول كامل وتراكمي لجميع باقات الأكاديمية (100$, 250$, 500$)',
                    'كل الدورات التكوينية الحالية والمستقبلية',
                    'توجيه خاص ومرافقة استراتيجية',
                    'أعلى رتبة تميز ومجتمع النخبة المغلق',
                    'سحب فوري وميزات حصرية لكبار القادة'
                ])
            }
        ];

        for (const pkg of defaultPackages) {
            const [existing] = await connection.query('SELECT id FROM packages WHERE slug = ?', [pkg.slug]);
            if (existing.length === 0) {
                await connection.query(`
                    INSERT INTO packages (id, name, name_ar, slug, price, level, description, description_ar, badge_text, features, is_active)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                `, [pkg.id, pkg.name, pkg.name_ar, pkg.slug, pkg.price, pkg.level, pkg.description, pkg.description_ar, pkg.badge_text, pkg.features]);
                console.log(`   Seeded package: ${pkg.name} ($${pkg.price})`);
            } else {
                console.log(`   Package ${pkg.slug} already exists.`);
            }
        }

        // 12. Seed default Ranks
        console.log('12. Seeding default Ranks...');
        const defaultRanks = [
            { level: 1, name: 'Member', name_ar: 'عضو', badge_icon: 'User', min_direct: 0, min_turnover: 0, reward: 0, color: '#94a3b8' },
            { level: 2, name: 'Bronze Leader', name_ar: 'قائد برونزي', badge_icon: 'Shield', min_direct: 3, min_turnover: 1000, reward: 50, color: '#cd7f32' },
            { level: 3, name: 'Silver Leader', name_ar: 'قائد فضي', badge_icon: 'Award', min_direct: 7, min_turnover: 3000, reward: 150, color: '#94a3b8' },
            { level: 4, name: 'Gold Leader', name_ar: 'قائد ذهبي', badge_icon: 'Crown', min_direct: 15, min_turnover: 8000, reward: 400, color: '#eab308' },
            { level: 5, name: 'Diamond VIP', name_ar: 'الماسي VIP', badge_icon: 'Gem', min_direct: 30, min_turnover: 20000, reward: 1000, color: '#06b6d4' }
        ];

        for (const r of defaultRanks) {
            const [existing] = await connection.query('SELECT id FROM ranks WHERE level = ?', [r.level]);
            if (existing.length === 0) {
                await connection.query(`
                    INSERT INTO ranks (id, level, name, name_ar, badge_icon, min_direct_sales, min_team_turnover, reward_bonus, color_hex)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [genUuid(), r.level, r.name, r.name_ar, r.badge_icon, r.min_direct, r.min_turnover, r.reward, r.color]);
                console.log(`   Seeded rank: ${r.name_ar} (Level ${r.level})`);
            }
        }

        // 13. Seed platform settings for affiliate controls
        console.log('13. Seeding affiliate settings into platform_settings...');
        const newSettings = [
            { key: 'affiliate_require_pack_purchase', value: '1', type: 'boolean', category: 'affiliate' },
            { key: 'affiliate_min_withdrawal', value: '50', type: 'number', category: 'affiliate' },
            { key: 'affiliate_gen1_rate', value: '10', type: 'number', category: 'affiliate' },
            { key: 'affiliate_gen2_rate', value: '4', type: 'number', category: 'affiliate' },
            { key: 'affiliate_gen3_rate', value: '3', type: 'number', category: 'affiliate' },
            { key: 'affiliate_gen4_rate', value: '2', type: 'number', category: 'affiliate' },
            { key: 'affiliate_gen5_rate', value: '1', type: 'number', category: 'affiliate' }
        ];

        for (const s of newSettings) {
            const [existing] = await connection.query('SELECT id FROM platform_settings WHERE `key` = ?', [s.key]);
            if (existing.length === 0) {
                await connection.query(`
                    INSERT INTO platform_settings (id, \`key\`, value, type, category)
                    VALUES (?, ?, ?, ?, ?)
                `, [genUuid(), s.key, s.value, s.type, s.category]);
                console.log(`   Seeded setting: ${s.key} = ${s.value}`);
            }
        }

        console.log('--- Phase 1 Migration Completed Successfully! ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        connection.release();
    }
}

runMigration();
