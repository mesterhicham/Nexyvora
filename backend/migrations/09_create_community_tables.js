const pool = require('../config/db');
const crypto = require('crypto');

async function run() {
  console.log('--- Migration 09: Creating Community Tables ---');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. community_posts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS community_posts (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        channel VARCHAR(50) DEFAULT 'general',
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        likes_count INT DEFAULT 0,
        comments_count INT DEFAULT 0,
        is_pinned TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_channel (channel),
        INDEX idx_created (created_at DESC),
        CONSTRAINT fk_comm_posts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
    console.log('Created or ensured community_posts table.');

    // 2. community_comments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS community_comments (
        id VARCHAR(36) PRIMARY KEY,
        post_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_post_created (post_id, created_at ASC),
        CONSTRAINT fk_comm_comm_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
        CONSTRAINT fk_comm_comm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
    console.log('Created or ensured community_comments table.');

    // 3. community_likes
    await connection.query(`
      CREATE TABLE IF NOT EXISTS community_likes (
        id VARCHAR(36) PRIMARY KEY,
        post_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uk_post_user (post_id, user_id),
        CONSTRAINT fk_comm_likes_post FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
        CONSTRAINT fk_comm_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8;
    `);
    console.log('Created or ensured community_likes table.');

    // 4. Seed initial official welcoming posts if empty
    const [existing] = await connection.query('SELECT COUNT(*) AS cnt FROM community_posts');
    if (existing[0].cnt === 0) {
      // Find an admin user to be author
      const [adminUser] = await connection.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      const authorId = adminUser.length > 0 ? adminUser[0].id : null;

      if (authorId) {
        const welcomePostId = crypto.randomUUID();
        await connection.query(`
          INSERT INTO community_posts (id, user_id, channel, title, content, likes_count, comments_count, is_pinned, created_at)
          VALUES (?, ?, 'general', 'مرحبا بكم في مجتمع رواد الاعمال Nextvora الرسمي!', 'يسرنا ان نرحب بكم في مجتمع Nextvora Academy التفاعلي.\nهنا ملتقى الطلاب، المسوقين ورواد الاعمال لمشاركة الاستراتيجيات، مناقشة احدث تقنيات الذكاء الاصطناعي والتجارة الالكترونية، وتبادل قصص النجاح.\nتاكدوا من متابعة قنوات النقاش ومشاركة تجاربكم اليومية!', 12, 2, 1, NOW())
        `, [welcomePostId, authorId]);

        const strategyPostId = crypto.randomUUID();
        await connection.query(`
          INSERT INTO community_posts (id, user_id, channel, title, content, likes_count, comments_count, is_pinned, created_at)
          VALUES (?, ?, 'ai_automation', 'افضل 5 استراتيجيات لبناء وكالات الاتمتة بالذكاء الاصطناعي (AI Automation Agency)', 'خلال مسار الـ AI Builder، ركزنا على بناء حلول ذكية لخدمة العملاء واتمتة العمليات باستخدام احدث الادوات. هل بداتم في تطبيق مشاريعكم العملية؟ شاركونا تجاربكم والنتائج التي حققتموها!', 8, 1, 0, NOW())
        `, [strategyPostId, authorId]);

        console.log('Seeded welcome community posts.');
      }
    }

    await connection.commit();
    console.log('--- Migration 09 Completed Successfully ---');
  } catch (err) {
    await connection.rollback();
    console.error('Migration 09 failed:', err);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
