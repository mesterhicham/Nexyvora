const pool = require('../config/db');
const crypto = require('crypto');

async function run() {
  console.log('--- Aligning Ranks Table with 5 Qualified Leadership Ranks ---');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Clear existing ranks to rebuild clean 0..5 levels
    await connection.query('DELETE FROM ranks');

    const cleanRanks = [
      {
        id: crypto.randomUUID(),
        level: 0,
        name: 'Member',
        name_ar: 'عضو مسجل',
        badge_icon: 'User',
        min_direct_sales: 0,
        min_team_turnover: 0.00,
        reward_bonus: 0.00,
        unlocked_generations: 0,
        color_hex: '#64748b'
      },
      {
        id: crypto.randomUUID(),
        level: 1,
        name: 'Bronze Leader',
        name_ar: 'الرتبة 1: قائد برونزي',
        badge_icon: 'Award',
        min_direct_sales: 3,
        min_team_turnover: 1000.00,
        reward_bonus: 50.00,
        unlocked_generations: 2, // تفتح جيل 1+2
        color_hex: '#cd7f32'
      },
      {
        id: crypto.randomUUID(),
        level: 2,
        name: 'Silver Leader',
        name_ar: 'الرتبة 2: قائد فضي',
        badge_icon: 'Shield',
        min_direct_sales: 7,
        min_team_turnover: 3000.00,
        reward_bonus: 150.00,
        unlocked_generations: 3, // تفتح 1+2+3
        color_hex: '#94a3b8'
      },
      {
        id: crypto.randomUUID(),
        level: 3,
        name: 'Gold Leader',
        name_ar: 'الرتبة 3: قائد ذهبي',
        badge_icon: 'Crown',
        min_direct_sales: 15,
        min_team_turnover: 8000.00,
        reward_bonus: 400.00,
        unlocked_generations: 4, // تفتح 1+2+3+4
        color_hex: '#eab308'
      },
      {
        id: crypto.randomUUID(),
        level: 4,
        name: 'Platinum Leader',
        name_ar: 'الرتبة 4: قائد بلاتيني',
        badge_icon: 'Gem',
        min_direct_sales: 25,
        min_team_turnover: 20000.00,
        reward_bonus: 1000.00,
        unlocked_generations: 6, // تفتح 1+2+3+4+5+6
        color_hex: '#06b6d4'
      },
      {
        id: crypto.randomUUID(),
        level: 5,
        name: 'Diamond VIP',
        name_ar: 'الرتبة 5: الماسي VIP',
        badge_icon: 'Sparkles',
        min_direct_sales: 50,
        min_team_turnover: 50000.00,
        reward_bonus: 3000.00,
        unlocked_generations: 10, // تفتح جميع الأجيال (1-10)
        color_hex: '#8b5cf6'
      },
    ];

    for (const r of cleanRanks) {
      await connection.query(`
        INSERT INTO ranks (id, level, name, name_ar, badge_icon, min_direct_sales, min_team_turnover, reward_bonus, unlocked_generations, color_hex, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [r.id, r.level, r.name, r.name_ar, r.badge_icon, r.min_direct_sales, r.min_team_turnover, r.reward_bonus, r.unlocked_generations, r.color_hex]);
    }

    await connection.commit();
    console.log('Seeded clean 6 ranks (0 to 5) successfully.');
  } catch (err) {
    await connection.rollback();
    console.error('Failed to align ranks:', err);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
