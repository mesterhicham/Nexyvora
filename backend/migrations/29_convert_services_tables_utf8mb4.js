const db = require('../config/db');

async function up() {
    console.log('--- Migration 29: Converting text columns to utf8mb4 for full Unicode and emoji support ---');
    let connection;
    try {
        connection = await db.getConnection();

        // 1. service_categories
        console.log('1. Altering service_categories text columns...');
        await connection.query(`
            ALTER TABLE service_categories
            MODIFY COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            MODIFY COLUMN name_ar VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            MODIFY COLUMN description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            MODIFY COLUMN description_ar TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
        `);

        // 2. service_products
        console.log('2. Altering service_products text columns...');
        await connection.query(`
            ALTER TABLE service_products
            MODIFY COLUMN name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            MODIFY COLUMN name_ar VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            MODIFY COLUMN description MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            MODIFY COLUMN description_ar MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            MODIFY COLUMN delivery_info TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            MODIFY COLUMN delivery_info_ar TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
        `);

        // 3. service_offers
        console.log('3. Altering service_offers text columns...');
        await connection.query(`
            ALTER TABLE service_offers
            MODIFY COLUMN label VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            MODIFY COLUMN label_ar VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL
        `);

        // 4. service_orders
        console.log('4. Altering service_orders text columns...');
        await connection.query(`
            ALTER TABLE service_orders
            MODIFY COLUMN delivery_notes MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            MODIFY COLUMN admin_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
        `);

        // 5. service_order_logs
        console.log('5. Altering service_order_logs text columns...');
        await connection.query(`
            ALTER TABLE service_order_logs
            MODIFY COLUMN note TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
        `);

        // 6. custom_project_requests
        console.log('6. Altering custom_project_requests text columns...');
        await connection.query(`
            ALTER TABLE custom_project_requests
            MODIFY COLUMN project_name VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            MODIFY COLUMN description MEDIUMTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
            MODIFY COLUMN admin_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
            MODIFY COLUMN meeting_notes TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL
        `);

        console.log('--- Migration 29: All text columns successfully converted to utf8mb4! ---');
    } catch (err) {
        console.error('Migration 29 failed:', err);
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
