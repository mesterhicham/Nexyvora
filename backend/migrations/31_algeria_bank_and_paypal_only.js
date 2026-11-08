const db = require('../config/db');

/**
 * Migration 31: Algeria payment policy.
 * Algerian members pay by local bank transfer (BNA / BaridiMob / CCP) or by card through PayPal.
 * Crypto / USDT stays forbidden (also enforced in code for deposits, withdrawals and package purchases).
 */
async function up() {
    console.log('--- Migration 31: Algeria = local bank + PayPal card, no crypto ---');
    const [result] = await db.query(`
        UPDATE country_currency_rules
        SET paypal_enabled = 1,
            bank_transfer_enabled = 1,
            usdt_enabled = 0
        WHERE country_code = 'DZ'
    `);
    console.log(`Updated ${result.affectedRows} DZ rule row(s).`);
    console.log('--- Migration 31 completed ---');
}

if (require.main === module) {
    up().then(() => {
        console.log('Done.');
        process.exit(0);
    }).catch(err => {
        console.error('Migration 31 failed:', err);
        process.exit(1);
    });
}

module.exports = { up };
