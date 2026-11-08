const pool = require('../config/db');
const crypto = require('crypto');

async function run() {
  console.log('--- Migration 34: Add Promo Columns, Adjust Levels & Insert AI PLUS Package ---');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Add promo columns to packages table if they do not exist
    const [cols] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'packages' 
        AND COLUMN_NAME = 'promo_price'
    `);

    if (cols.length === 0) {
      await connection.query(`
        ALTER TABLE \`packages\`
          ADD COLUMN \`promo_price\` DECIMAL(10,2) DEFAULT NULL AFTER \`price\`,
          ADD COLUMN \`promo_start_at\` DATETIME DEFAULT NULL AFTER \`promo_price\`,
          ADD COLUMN \`promo_end_at\` DATETIME DEFAULT NULL AFTER \`promo_start_at\`,
          ADD COLUMN \`is_promo_active\` TINYINT(1) DEFAULT 0 AFTER \`promo_end_at\`
      `);
      console.log('Added promo columns (promo_price, promo_start_at, promo_end_at, is_promo_active) to packages.');
    } else {
      console.log('Promo columns already exist on packages table.');
    }

    // 2. Adjust levels safely to avoid unique constraint collisions:
    // Community: Level 1
    // FLOW: Level 2
    // AI PLUS will be Level 3
    // GROW: Level 4 (was 3)
    // PRIME: Level 5 (was 4)

    // Check if PRIME is level 4 and GROW is level 3
    // First, shift PRIME to temporary level or 5 if 5 is free
    await connection.query(`
      UPDATE \`packages\` 
      SET \`level\` = 5 
      WHERE \`slug\` = 'prime-1000' OR (\`price\` >= 1000 AND \`level\` = 4)
    `);
    console.log('Updated PRIME package to level 5.');

    await connection.query(`
      UPDATE \`packages\` 
      SET \`level\` = 4 
      WHERE \`slug\` = 'grow-500' OR (\`price\` > 150 AND \`price\` <= 500 AND \`level\` = 3)
    `);
    console.log('Updated GROW package to level 4.');

    // 3. Insert or update AI PLUS package (Level 3)
    const [existingAiPlus] = await connection.query(`
      SELECT id FROM \`packages\` WHERE \`slug\` = 'ai-plus'
    `);

    const aiPlusFeatures = JSON.stringify([
      'AI AGENT PERSONNEL: وكيل ذكاء اصطناعي شخصي',
      'إمكانية إنشاء وبيع وكلاء الذكاء الاصطناعي من منظومة Nexyvora AI',
      'دورة تكوينية شاملة لإنشاء AI Agent من الصفر حتى الاستخدام والتسويق والبيع',
      'الاستفادة من جميع الدورات والمحتويات في باقة FLOW و Community',
      'أرباح تسويق بالعمولة للجيل 1 والجيل 2 (2 Marketing Generations)',
      'محفظة رقمية لسحب الأرباح فوراً'
    ]);

    // 7 days promo window from now
    const now = new Date();
    const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const formatMysqlDate = (d) => d.toISOString().slice(0, 19).replace('T', ' ');

    if (existingAiPlus.length === 0) {
      const aiPlusId = crypto.randomUUID();
      await connection.query(`
        INSERT INTO \`packages\` (
          id, name, name_ar, slug, price, promo_price, promo_start_at, promo_end_at, is_promo_active,
          level, unlocked_generations, description, description_ar, features, badge_text, is_active
        ) VALUES (
          ?, 'AI PLUS', 'AI PLUS — باقة الذكاء الاصطناعي المتقدمة', 'ai-plus',
          350.00, 200.00, ?, ?, 1,
          3, 2,
          'Exclusive AI Agent creation, personal AI agent, sales license, and complete training course with 2 generations of affiliate earnings.',
          'باقة الذكاء الاصطناعي الحصرية: وكيل ذكاء اصطناعي شخصي، رخصة إنشاء وبيع الوكلاء، دورة شاملة، والاستفادة من جميع دورات FLOW و Community مع جيلين من التسويق.',
          ?, 'عرض محدود 7 أيام 🔥', 1
        )
      `, [aiPlusId, formatMysqlDate(now), formatMysqlDate(end), aiPlusFeatures]);
      console.log('Created AI PLUS package successfully (Level 3, $350 / Promo $200).');
    } else {
      await connection.query(`
        UPDATE \`packages\` SET
          name = 'AI PLUS',
          name_ar = 'AI PLUS — باقة الذكاء الاصطناعي المتقدمة',
          price = 350.00,
          promo_price = 200.00,
          promo_start_at = ?,
          promo_end_at = ?,
          is_promo_active = 1,
          level = 3,
          unlocked_generations = 2,
          features = ?,
          badge_text = 'عرض محدود 7 أيام 🔥',
          is_active = 1
        WHERE slug = 'ai-plus'
      `, [formatMysqlDate(now), formatMysqlDate(end), aiPlusFeatures]);
      console.log('Updated existing AI PLUS package.');
    }

    await connection.commit();

    const [allPkgs] = await connection.query(`
      SELECT id, slug, name, name_ar, price, promo_price, is_promo_active, promo_start_at, promo_end_at, level, unlocked_generations 
      FROM \`packages\` 
      ORDER BY \`level\` ASC
    `);
    console.log('All packages currently in DB:');
    console.table(allPkgs);

    console.log('--- Migration 34 Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    await connection.rollback();
    console.error('Migration 34 failed:', err);
    process.exit(1);
  } finally {
    connection.release();
  }
}

run();
