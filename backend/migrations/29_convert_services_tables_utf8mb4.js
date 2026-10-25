const db = require('../config/db');

async function up() {
    console.log('--- Migration 29: Converting Services & Custom Projects Tables to utf8mb4 ---');
    let connection;
    try {
        connection = await db.getConnection();
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        const tables = [
            'service_categories',
            'service_products',
            'service_offers',
            'service_orders',
            'service_order_logs',
            'service_commissions',
            'custom_project_requests'
        ];

        for (const tbl of tables) {
            console.log(`Converting ${tbl} to utf8mb4_unicode_ci...`);
            await connection.query(`ALTER TABLE \`${tbl}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        }

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('--- Migration 29: Completed Successfully ---');
    } catch (err) {
        console.error('Migration 29 failed:', err);
        throw err;
    } finally {
        if (connection) {
            await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
            connection.release();
        }
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
