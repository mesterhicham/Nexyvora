const db = require('../config/db');

async function up() {
    console.log('--- Migration 21: Adding UNIQUE constraint to transactions.reference_id ---');
    let connection;
    try {
        connection = await db.getConnection();

        // 1. Convert any empty strings to NULL so multiple empty values don't violate uniqueness
        await connection.query("UPDATE transactions SET reference_id = NULL WHERE reference_id = ''");

        // 2. Check if index already exists
        const [indexes] = await connection.query("SHOW INDEX FROM transactions WHERE Key_name = 'uq_transactions_reference'");
        if (indexes.length === 0) {
            await connection.query("ALTER TABLE transactions ADD UNIQUE KEY uq_transactions_reference (reference_id)");
            console.log('   Successfully added UNIQUE KEY uq_transactions_reference on transactions(reference_id).');
        } else {
            console.log('   Index uq_transactions_reference already exists.');
        }
        console.log('--- Migration 21 completed successfully ---');
    } catch (err) {
        console.error('Migration 21 failed:', err.message);
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

if (require.main === module) {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = { up };
