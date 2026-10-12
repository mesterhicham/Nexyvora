const pool = require('../config/db');

async function run() {
  console.log('--- Migration 11: Setup Community Package $30 and Receipt Column ---');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Add receipt_url and notes to user_packages if not exist
    const [cols] = await connection.query("SHOW COLUMNS FROM user_packages LIKE 'receipt_url'");
    if (cols.length === 0) {
      await connection.query("ALTER TABLE user_packages ADD COLUMN receipt_url VARCHAR(255) NULL AFTER payment_reference");
      console.log('Added receipt_url column to user_packages.');
    } else {
      console.log('receipt_url already exists in user_packages.');
    }

    const [noteCols] = await connection.query("SHOW COLUMNS FROM user_packages LIKE 'notes'");
    if (noteCols.length === 0) {
      await connection.query("ALTER TABLE user_packages ADD COLUMN notes TEXT NULL AFTER receipt_url");
      console.log('Added notes column to user_packages.');
    } else {
      console.log('notes already exists in user_packages.');
    }

    // 2. Update level 1 package to COMMUNITY $30
    await connection.query(`
      UPDATE packages 
      SET 
        name = 'COMMUNITY',
        name_ar = 'عضوية المجتمع — COMMUNITY',
        slug = 'community-30',
        price = 30.00,
        badge_text = 'عضوية التسجيل',
        description = 'عضوية مجتمع منصة Nexyvora الرسمية. تتيح لك الوصول للمجتمع التفاعلي وحضور اللقاءات الحية والبدء في بناء فريقك والربح من العمولات.',
        unlocked_generations = 0,
        is_active = 1
      WHERE level = 1 OR slug = 'core-50' OR price <= 50.00
    `);
    console.log('Updated Level 1 package to COMMUNITY ($30.00 USD).');

    // 3. Update platform_settings registration fee to 30 and sponsor bonus to 15
    const [feeRows] = await connection.query("SELECT id FROM platform_settings WHERE \`key\` = 'affiliate_registration_fee'");
    if (feeRows.length > 0) {
      await connection.query("UPDATE platform_settings SET value = '30' WHERE \`key\` = 'affiliate_registration_fee'");
    } else {
      await connection.query("INSERT INTO platform_settings (id, \`key\`, value, type, category) VALUES (UUID(), 'affiliate_registration_fee', '30', 'number', 'affiliate')");
    }

    const [bonusRows] = await connection.query("SELECT id FROM platform_settings WHERE \`key\` = 'affiliate_registration_sponsor_bonus'");
    if (bonusRows.length > 0) {
      await connection.query("UPDATE platform_settings SET value = '15' WHERE \`key\` = 'affiliate_registration_sponsor_bonus'");
    } else {
      await connection.query("INSERT INTO platform_settings (id, \`key\`, value, type, category) VALUES (UUID(), 'affiliate_registration_sponsor_bonus', '15', 'number', 'affiliate')");
    }
    console.log('Updated platform_settings registration fee and sponsor bonus.');

    await connection.commit();
    console.log('--- Migration 11 Completed Successfully ---');
  } catch (err) {
    await connection.rollback();
    console.error('Migration 11 failed:', err);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
