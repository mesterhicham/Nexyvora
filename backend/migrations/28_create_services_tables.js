const db = require('../config/db');
const crypto = require('crypto');

async function up() {
    console.log('--- Migration 28: Creating Services Section Tables & Seed Data ---');
    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // 1. Table: service_categories
        console.log('1. Creating service_categories table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS service_categories (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                name_ar VARCHAR(255) NOT NULL,
                name_fr VARCHAR(255) DEFAULT NULL,
                slug VARCHAR(100) NOT NULL UNIQUE,
                type ENUM('digital_product', 'saas', 'ecommerce_project', 'ai_agent') NOT NULL,
                description TEXT DEFAULT NULL,
                description_ar TEXT DEFAULT NULL,
                icon_url VARCHAR(500) DEFAULT NULL,
                sort_order INT DEFAULT 0,
                is_active TINYINT(1) DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_categories_active (is_active, sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `);

        // 2. Table: service_products
        console.log('2. Creating service_products table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS service_products (
                id VARCHAR(36) PRIMARY KEY,
                category_id VARCHAR(36) NOT NULL,
                name VARCHAR(255) NOT NULL,
                name_ar VARCHAR(255) NOT NULL,
                name_fr VARCHAR(255) DEFAULT NULL,
                slug VARCHAR(150) NOT NULL UNIQUE,
                description TEXT DEFAULT NULL,
                description_ar TEXT DEFAULT NULL,
                logo_url VARCHAR(500) DEFAULT NULL,
                images JSON DEFAULT NULL,
                features JSON DEFAULT NULL,
                delivery_info TEXT DEFAULT NULL,
                delivery_info_ar TEXT DEFAULT NULL,
                requires_email TINYINT(1) DEFAULT 0,
                status ENUM('published', 'hidden', 'unavailable') DEFAULT 'published',
                sort_order INT DEFAULT 0,
                created_by VARCHAR(36) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_products_cat_status (category_id, status),
                INDEX idx_products_slug (slug),
                CONSTRAINT fk_service_products_cat FOREIGN KEY (category_id) REFERENCES service_categories(id) ON DELETE CASCADE,
                CONSTRAINT fk_service_products_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `);

        // 3. Table: service_offers
        console.log('3. Creating service_offers table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS service_offers (
                id VARCHAR(36) PRIMARY KEY,
                product_id VARCHAR(36) NOT NULL,
                label VARCHAR(100) NOT NULL,
                label_ar VARCHAR(100) NOT NULL,
                duration_months INT DEFAULT NULL,
                price DECIMAL(10,2) NOT NULL,
                cost_price DECIMAL(10,2) DEFAULT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                stock_quantity INT DEFAULT NULL,
                is_active TINYINT(1) DEFAULT 1,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_offers_product_active (product_id, is_active),
                CONSTRAINT fk_service_offers_product FOREIGN KEY (product_id) REFERENCES service_products(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `);

        // 4. Table: service_orders
        console.log('4. Creating service_orders table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS service_orders (
                id VARCHAR(36) PRIMARY KEY,
                order_number VARCHAR(30) NOT NULL UNIQUE,
                user_id VARCHAR(36) NOT NULL,
                product_id VARCHAR(36) NOT NULL,
                offer_id VARCHAR(36) NOT NULL,
                activation_email VARCHAR(255) DEFAULT NULL,
                price_at_purchase DECIMAL(10,2) NOT NULL,
                currency VARCHAR(10) DEFAULT 'USD',
                status ENUM(
                    'pending_payment', 'paid', 'processing',
                    'delivered', 'completed', 'cancelled', 'refunded'
                ) DEFAULT 'pending_payment',
                payment_method VARCHAR(50) DEFAULT 'wallet',
                payment_reference VARCHAR(255) DEFAULT NULL,
                transaction_id VARCHAR(36) DEFAULT NULL,
                delivery_notes TEXT DEFAULT NULL,
                admin_notes TEXT DEFAULT NULL,
                subscription_start DATE DEFAULT NULL,
                subscription_end DATE DEFAULT NULL,
                commission_processed TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_orders_user (user_id),
                INDEX idx_orders_status (status),
                INDEX idx_orders_product (product_id),
                CONSTRAINT fk_service_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_service_orders_product FOREIGN KEY (product_id) REFERENCES service_products(id),
                CONSTRAINT fk_service_orders_offer FOREIGN KEY (offer_id) REFERENCES service_offers(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `);

        // 5. Table: service_order_logs
        console.log('5. Creating service_order_logs table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS service_order_logs (
                id VARCHAR(36) PRIMARY KEY,
                order_id VARCHAR(36) NOT NULL,
                changed_by VARCHAR(36) DEFAULT NULL,
                old_status VARCHAR(50),
                new_status VARCHAR(50),
                note TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_order_logs (order_id, created_at),
                CONSTRAINT fk_service_order_logs_order FOREIGN KEY (order_id) REFERENCES service_orders(id) ON DELETE CASCADE,
                CONSTRAINT fk_service_order_logs_user FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `);

        // 6. Table: service_commissions (10% direct referrer only, isolated from package commissions)
        console.log('6. Creating service_commissions table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS service_commissions (
                id VARCHAR(36) PRIMARY KEY,
                order_id VARCHAR(36) NOT NULL,
                recipient_id VARCHAR(36) NOT NULL,
                buyer_id VARCHAR(36) NOT NULL,
                rate_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00,
                sale_amount DECIMAL(10,2) NOT NULL,
                commission_amount DECIMAL(10,2) NOT NULL,
                status ENUM('available', 'pending', 'reversed', 'cancelled') DEFAULT 'available',
                reversed_at TIMESTAMP NULL DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE INDEX idx_service_comm_order (order_id),
                INDEX idx_service_comm_recipient (recipient_id),
                INDEX idx_service_comm_buyer (buyer_id),
                CONSTRAINT fk_service_comm_order FOREIGN KEY (order_id) REFERENCES service_orders(id) ON DELETE CASCADE,
                CONSTRAINT fk_service_comm_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_service_comm_buyer FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `);

        // 7. Table: custom_project_requests
        console.log('7. Creating custom_project_requests table...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS custom_project_requests (
                id VARCHAR(36) PRIMARY KEY,
                request_number VARCHAR(30) NOT NULL UNIQUE,
                user_id VARCHAR(36) NOT NULL,
                project_name VARCHAR(255) NOT NULL,
                project_type ENUM('website', 'ecommerce', 'saas', 'ai_agent', 'mobile_app', 'other') NOT NULL,
                description TEXT NOT NULL,
                estimated_budget VARCHAR(100) DEFAULT NULL,
                estimated_duration VARCHAR(100) DEFAULT NULL,
                contact_email VARCHAR(255) NOT NULL,
                contact_whatsapp VARCHAR(50) DEFAULT NULL,
                attachment_url VARCHAR(500) DEFAULT NULL,
                status ENUM(
                    'new_request', 'reviewing', 'contacted',
                    'meeting_scheduled', 'proposal_sent',
                    'in_progress', 'completed', 'rejected', 'cancelled'
                ) DEFAULT 'new_request',
                admin_notes TEXT DEFAULT NULL,
                meeting_date DATETIME DEFAULT NULL,
                meeting_notes TEXT DEFAULT NULL,
                assigned_to VARCHAR(36) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_cpr_user (user_id),
                INDEX idx_cpr_status (status),
                CONSTRAINT fk_cpr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_cpr_assigned FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
        `);

        // 8. Seed default categories
        console.log('8. Seeding initial categories...');
        const initialCategories = [
            {
                id: crypto.randomUUID(),
                name: 'Digital Products & Subscriptions',
                name_ar: 'المنتجات الرقمية والاشتراكات',
                name_fr: 'Produits numériques et abonnements',
                slug: 'digital-products',
                type: 'digital_product',
                description: 'ChatGPT Plus, Claude Pro, Midjourney and premium AI & digital accounts',
                description_ar: 'اشتراكات وحسابات الذكاء الاصطناعي والأدوات الاحترافية (ChatGPT, Claude, Canva, إلخ)',
                sort_order: 1
            },
            {
                id: crypto.randomUUID(),
                name: 'SaaS Software & Tools',
                name_ar: 'برمجيات SaaS والأدوات',
                name_fr: 'Logiciels SaaS et outils',
                slug: 'saas-tools',
                type: 'saas',
                description: 'Ready-to-use cloud business software and automation tools',
                description_ar: 'أنظمة إدارة الأعمال السحابية وأدوات الأتمتة المتقدمة',
                sort_order: 2
            },
            {
                id: crypto.randomUUID(),
                name: 'Ready E-Commerce Projects',
                name_ar: 'مشاريع التجارة الإلكترونية الجاهزة',
                name_fr: 'Projets e-commerce prêts à l emploi',
                slug: 'ecommerce-projects',
                type: 'ecommerce_project',
                description: 'Complete turnkey e-commerce stores ready to launch',
                description_ar: 'متاجر إلكترونية متكاملة مع خطط إطلاق وتسويق جاهزة للبدء',
                sort_order: 3
            },
            {
                id: crypto.randomUUID(),
                name: 'AI Agents & Automation',
                name_ar: 'حلول ومساعدي الذكاء الاصطناعي',
                name_fr: 'Agents IA et automatisation',
                slug: 'ai-agents',
                type: 'ai_agent',
                description: 'Custom AI agents, customer support bots, and automated workflows',
                description_ar: 'مساعدين أذكياء مخصصين لخدمة العملاء وأتمتة المهام اليومية للشركات',
                sort_order: 4
            }
        ];

        for (const cat of initialCategories) {
            await connection.query(`
                INSERT INTO service_categories 
                (id, name, name_ar, name_fr, slug, type, description, description_ar, sort_order, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
                ON DUPLICATE KEY UPDATE 
                    name = VALUES(name),
                    name_ar = VALUES(name_ar),
                    description = VALUES(description),
                    description_ar = VALUES(description_ar);
            `, [cat.id, cat.name, cat.name_ar, cat.name_fr, cat.slug, cat.type, cat.description, cat.description_ar, cat.sort_order]);
        }

        // 9. Seed platform_settings for WhatsApp, Commission, and PayPal
        console.log('9. Seeding platform_settings for Services...');
        const initialSettings = [
            { key: 'support_whatsapp_number', value: '+212600000000', type: 'string', category: 'support' },
            { key: 'service_commission_rate', value: '10', type: 'number', category: 'services' },
            { key: 'paypal_enabled', value: '1', type: 'boolean', category: 'payment' },
            { key: 'paypal_mode', value: 'sandbox', type: 'string', category: 'payment' },
            { key: 'paypal_client_id', value: '', type: 'string', category: 'payment' },
            { key: 'paypal_client_secret', value: '', type: 'string', category: 'payment' }
        ];

        for (const s of initialSettings) {
            await connection.query(`
                INSERT INTO platform_settings (id, \`key\`, value, type, category)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE \`key\` = \`key\`;
            `, [crypto.randomUUID(), s.key, s.value, s.type, s.category]);
        }

        await connection.commit();
        console.log('--- Migration 28 completed successfully! ---');
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('Migration 28 failed:', err);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up };
