const pool = require('../config/db');
const crypto = require('crypto');

async function run() {
  console.log('--- Seeding Academy Intro Settings ---');
  const connection = await pool.getConnection();

  try {
    const settings = [
      {
        key: 'academy_intro_title',
        value: 'فيديو تعريفي بمشروع ورؤية أكاديمية Nextvora',
        type: 'text',
        category: 'academy'
      },
      {
        key: 'academy_intro_description',
        value: 'مرحباً بك في أكاديمية Nextvora! دليلك الشامل للانطلاق في التجارة الإلكترونية، الأتمتة بالذكاء الاصطناعي، وبناء المنتجات الرقمية والـ SaaS من الصفر حتى تحقيق الحرية المالية.',
        type: 'text',
        category: 'academy'
      },
      {
        key: 'academy_intro_video_url',
        value: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        type: 'text',
        category: 'academy'
      },
      {
        key: 'academy_intro_author',
        value: 'إدارة Nextvora',
        type: 'text',
        category: 'academy'
      },
      {
        key: 'academy_intro_badge',
        value: 'دليل البداية للمشروع',
        type: 'text',
        category: 'academy'
      }
    ];

    for (const s of settings) {
      await connection.query(
        'INSERT INTO platform_settings (id, `key`, `value`, `type`, `category`, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()',
        [crypto.randomUUID(), s.key, s.value, s.type, s.category]
      );
    }

    console.log('Seeded academy intro settings successfully.');
  } catch (err) {
    console.error('Error seeding settings:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
