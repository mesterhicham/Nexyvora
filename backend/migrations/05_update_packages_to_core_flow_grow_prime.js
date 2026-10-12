const pool = require('../config/db');

async function run() {
  console.log('--- Migrating Packages to CORE, FLOW, GROW, PRIME ---');
  const connection = await pool.getConnection();

  try {
    await connection.query(`
      ALTER TABLE packages 
      MODIFY name VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      MODIFY name_ar VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      MODIFY description TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      MODIFY description_ar TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      MODIFY features TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
      MODIFY badge_text VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('Modified text columns in packages to utf8mb4.');
    const packagesData = [
      {
        level: 1,
        name: 'CORE',
        name_ar: 'CORE — الأساس',
        slug: 'core-50',
        price: 50.00,
        unlocked_generations: 2,
        badge_text: 'اشتراك العضوية',
        description: 'Core membership & project overview access',
        description_ar: 'اشتراك العضوية في الأكاديمية والوصول إلى الفيديوهات التعريفية بالمشروع وتفعيل رابط الإحالة.',
        features: JSON.stringify([
          'اشتراك العضوية في المنصة',
          'فيديوهات تعريفية بالمشروع (يحددها الأدمن)',
          'تفعيل كود ورابط الإحالة الخاص بك',
          'أرباح تسويق بالعمولة (الجيل 1 و 2)',
          'محفظة مالية لسحب العمولات'
        ])
      },
      {
        level: 2,
        name: 'FLOW',
        name_ar: 'FLOW — الانطلاقة (المستوى 1)',
        slug: 'flow-150',
        price: 150.00,
        unlocked_generations: 3,
        badge_text: 'المستوى 1: الأكثر طلباً',
        description: 'Level 1: E-Commerce & Digital Business powered by AI',
        description_ar: 'المستوى 1: التجارة الإلكترونية والبيزنس الرقمي من الصفر إلى الاحتراف بالذكاء الاصطناعي.',
        features: JSON.stringify([
          'إنشاء متجر إلكتروني متكامل بالذكاء الاصطناعي',
          'إنشاء علامة تجارية وهوية بصرية كاملة',
          'إنشاء المحتوى وفيديوهات UGC بالذكاء الاصطناعي',
          'إدارة المحتوى عبر المنصات (Instagram, TikTok, Facebook)',
          'البحث عن المنتجات الرابحة (Product Research)',
          'إنشاء وتصميم الإعلانات الممولة',
          'إدارة الحملات (Meta, TikTok, Snapchat Ads)',
          'تحليل النتائج وتحسين الحملات الإعلانية',
          'أرباح تسويق بالعمولة حتى الجيل 3'
        ])
      },
      {
        level: 3,
        name: 'GROW',
        name_ar: 'GROW — النمو (المستوى 2)',
        slug: 'grow-500',
        price: 500.00,
        unlocked_generations: 4,
        badge_text: 'المستوى 2: قيمة ممتازة',
        description: 'Level 2: AI Agents, Workflows & Automation',
        description_ar: 'المستوى 2: بناء وكلاء الذكاء الاصطناعي وأنظمة الأتمتة والمنتجات الرقمية.',
        features: JSON.stringify([
          'يشمل جميع محتويات المستوى 1 (FLOW)',
          'إنشاء وكلاء الذكاء الاصطناعي (AI Agents)',
          'وكلاء للتسويق، خدمة العملاء، والبحث وصناعة المحتوى',
          'إنشاء أنظمة الأتمتة الذكية (AI Workflows)',
          'ربط المنصات وأتمتة التجارة الإلكترونية',
          'مواكبة أحدث أدوات ونماذج الذكاء الاصطناعي',
          'البرمجة بمساعدة الذكاء الاصطناعي وإصلاح الأكواد',
          'إنشاء تطبيقات ومشاريع SaaS باستخدام AI',
          'أرباح تسويق بالعمولة حتى الجيل 4'
        ])
      },
      {
        level: 4,
        name: 'PRIME',
        name_ar: 'PRIME — التميز (المستوى 3)',
        slug: 'prime-1000',
        price: 1000.00,
        unlocked_generations: 5,
        badge_text: 'المستوى 3: VIP النخبة',
        description: 'Level 3: AI Builder, SaaS & 1-on-1 Mentorship',
        description_ar: 'المستوى 3: بناء المواقع والتطبيقات والـ SaaS بالذكاء الاصطناعي + مرافقة شخصية.',
        features: JSON.stringify([
          'يشمل جميع محتويات المستوى 1 و 2 (FLOW + GROW)',
          'البرمجة المتقدمة (ChatGPT, Codex, Google AI Studio, Antigravity, VS Code)',
          'إنشاء المواقع والتطبيقات ولوحات التحكم والأنظمة والـ APIs',
          'بناء SaaS كامل: الفكرة ← UX/UI ← البرمجة ← الإطلاق ← تحقيق الدخل',
          '👨‍🏫 مرافقة شخصية: جلستان شهرياً لدراسة وتوجيه مشروعك',
          '♾️ وصول Premium كامل لجميع الدورات والتحديثات والـ Workflows',
          'أرباح تسويق بالعمولة حتى الجيل 5 بالكامل'
        ])
      }
    ];

    for (const pkg of packagesData) {
      const [res] = await connection.query(`
        UPDATE packages
        SET name = ?,
            name_ar = ?,
            slug = ?,
            price = ?,
            unlocked_generations = ?,
            badge_text = ?,
            description = ?,
            description_ar = ?,
            features = ?
        WHERE level = ?
      `, [
        pkg.name,
        pkg.name_ar,
        pkg.slug,
        pkg.price,
        pkg.unlocked_generations,
        pkg.badge_text,
        pkg.description,
        pkg.description_ar,
        pkg.features,
        pkg.level
      ]);
      console.log(`Updated package Level ${pkg.level} (${pkg.name} $${pkg.price}): affected ${res.affectedRows} row(s)`);
    }

    const [rows] = await connection.query('SELECT level, name, name_ar, slug, price, unlocked_generations, badge_text FROM packages ORDER BY level ASC');
    console.log('Resulting Packages in DB:', rows);
    console.log('--- Migration Completed Successfully ---');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    connection.release();
    process.exit(0);
  }
}

run();
