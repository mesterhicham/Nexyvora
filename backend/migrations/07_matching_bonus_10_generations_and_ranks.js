const pool = require('../config/db');
const crypto = require('crypto');

async function run() {
  console.log('--- Migration 07: Matching Bonus 10 Generations, Packages & Ranks ---');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Add unlocked_generations column to ranks table if not exists
    const [rankCols] = await connection.query("SHOW COLUMNS FROM ranks LIKE 'unlocked_generations'");
    if (rankCols.length === 0) {
      await connection.query("ALTER TABLE ranks ADD COLUMN unlocked_generations INT NOT NULL DEFAULT 2 AFTER reward_bonus");
      console.log('Added unlocked_generations column to ranks table.');
    } else {
      console.log('unlocked_generations column already exists in ranks table.');
    }

    // 2. Set Unlocked Generations per Leadership Rank
    // الرتبة الأولى تفتح جيل 1+2
    await connection.query("UPDATE ranks SET unlocked_generations = 2 WHERE level = 1");
    // الرتبة الثانية تفتح 1+2+3
    await connection.query("UPDATE ranks SET unlocked_generations = 3 WHERE level = 2");
    // الرتبة الثالثة تفتح 1+2+3+4
    await connection.query("UPDATE ranks SET unlocked_generations = 4 WHERE level = 3");
    // الرتبة الرابعة تفتح 1+2+3+4+5+6
    await connection.query("UPDATE ranks SET unlocked_generations = 6 WHERE level = 4");
    // الرتبة الخامسة تفتح جميع الأجيال (1-10)
    await connection.query("UPDATE ranks SET unlocked_generations = 10 WHERE level = 5");
    console.log('Updated ranks unlocked_generations successfully.');

    // 3. Set Unlocked Generations per Package
    // 30$ Community Membership (CORE) -> 0 generations (Direct referral only)
    await connection.query("UPDATE packages SET unlocked_generations = 0 WHERE slug = 'core-50' OR price <= 50");
    // 150$ FLOW -> تفتح الجيل الأول فقط (1 generation)
    await connection.query("UPDATE packages SET unlocked_generations = 1 WHERE slug = 'flow-150' OR price = 150");
    // 500$ GROW -> تفتح الجيل الأول والثاني (2 generations)
    await connection.query("UPDATE packages SET unlocked_generations = 2 WHERE slug = 'grow-500' OR price = 500");
    // 1000$ PRIME -> تفتح الجيل الأول، الثاني، والثالث (3 generations)
    await connection.query("UPDATE packages SET unlocked_generations = 3 WHERE slug = 'prime-1000' OR price = 1000");
    console.log('Updated packages unlocked_generations successfully.');

    // 4. Update platform_settings for 10 Generations Matching Bonus
    const settings = [
      { key: 'affiliate_direct_rate', value: '10', type: 'number', category: 'affiliate' },
      { key: 'affiliate_gen1_rate', value: '5', type: 'number', category: 'affiliate' },
      { key: 'affiliate_gen2_rate', value: '4', type: 'number', category: 'affiliate' },
      { key: 'affiliate_gen3_rate', value: '3', type: 'number', category: 'affiliate' },
      { key: 'affiliate_gen4_rate', value: '2', type: 'number', category: 'affiliate' },
      { key: 'affiliate_gen5_rate', value: '1', type: 'number', category: 'affiliate' },
      { key: 'affiliate_gen6_rate', value: '1', type: 'number', category: 'affiliate' },
      { key: 'affiliate_gen7_rate', value: '1', type: 'number', category: 'affiliate' },
      { key: 'affiliate_gen8_rate', value: '0.5', type: 'number', category: 'affiliate' },
      { key: 'affiliate_gen9_rate', value: '0.5', type: 'number', category: 'affiliate' },
      { key: 'affiliate_gen10_rate', value: '0.5', type: 'number', category: 'affiliate' },
      { key: 'affiliate_calc_mode', value: 'matching_bonus', type: 'string', category: 'affiliate' },
      { key: 'affiliate_require_pack_purchase', value: '1', type: 'boolean', category: 'affiliate' },
      { key: 'affiliate_registration_fee', value: '30', type: 'number', category: 'affiliate' },
      { key: 'affiliate_registration_sponsor_bonus', value: '15', type: 'number', category: 'affiliate' },
    ];

    for (const s of settings) {
      await connection.query(
        'INSERT INTO platform_settings (id, `key`, `value`, `type`, `category`, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()',
        [crypto.randomUUID(), s.key, s.value, s.type, s.category]
      );
    }
    console.log('Seeded platform_settings for 10-Generations Matching Bonus successfully.');

    await connection.commit();
    console.log('--- Migration 07 Completed Successfully ---');
  } catch (err) {
    await connection.rollback();
    console.error('Migration 07 failed:', err);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
