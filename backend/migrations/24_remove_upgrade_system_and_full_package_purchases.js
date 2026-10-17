const pool = require('../config/db');

async function run() {
  console.log('--- Migration 24: Enforce Full Package Purchases & Generations Setup ---');
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Update unlocked generations and features according to new system:
    // Community ($30): 0 generations
    await connection.query(`
      UPDATE packages 
      SET unlocked_generations = 0,
          price = 30.00,
          badge_text = 'عضوية المجتمع',
          description_ar = 'عضوية مجتمع منصة Nexyvora الرسمية. تتيح لك الوصول للمجتمع التفاعلي، اللقاءات الحية، والربح من عمولات التسجيل المباشرة.'
      WHERE slug = 'community-30' OR price <= 30
    `);
    console.log('Updated Community ($30) package.');

    // FLOW ($150): 2 generations (Gen 1 & 2)
    const flowFeatures = JSON.stringify([
      'إنشاء متجر إلكتروني متكامل بالذكاء الاصطناعي',
      'إنشاء علامة تجارية وهوية بصرية كاملة',
      'إنشاء المحتوى وفيديوهات UGC بالذكاء الاصطناعي',
      'إدارة المحتوى عبر المنصات (Instagram, TikTok, Facebook)',
      'البحث عن المنتجات الرابحة (Product Research)',
      'إنشاء وتصميم الحملات الإعلانية الممولة',
      'أرباح تسويق بالعمولة (الجيل 1 والجيل 2)',
      'محفظة مالية لسحب الأرباح فوراً'
    ]);
    await connection.query(`
      UPDATE packages 
      SET unlocked_generations = 2,
          price = 150.00,
          features = ?
      WHERE slug = 'flow-150' OR (price > 30 AND price <= 150)
    `, [flowFeatures]);
    console.log('Updated FLOW ($150) package: 2 generations (G1, G2).');

    // GROW ($500): 3 generations (Gen 1, 2 & 3)
    const growFeatures = JSON.stringify([
      'يشمل جميع محتويات المستوى 1 (FLOW)',
      'إنشاء وكلاء الذكاء الاصطناعي (AI Agents)',
      'وكلاء للتسويق، خدمة العملاء، والبحث وصناعة المحتوى',
      'إنشاء أنظمة الأتمتة الذكية (AI Workflows)',
      'ربط المنصات وأتمتة التجارة الإلكترونية',
      'البرمجة بمساعدة الذكاء الاصطناعي وإصلاح الأكواد',
      'إنشاء تطبيقات ومشاريع SaaS باستخدام AI',
      'أرباح تسويق بالعمولة حتى الجيل 3 (الجيل 1، 2، 3)',
      'أولوية الدعم الفني والمتابعة'
    ]);
    await connection.query(`
      UPDATE packages 
      SET unlocked_generations = 3,
          price = 500.00,
          features = ?
      WHERE slug = 'grow-500' OR (price > 150 AND price <= 500)
    `, [growFeatures]);
    console.log('Updated GROW ($500) package: 3 generations (G1, G2, G3).');

    // PRIME ($1,000): 4 generations (Gen 1, 2, 3 & 4)
    const primeFeatures = JSON.stringify([
      'يشمل جميع محتويات المستوى 1 و 2 (FLOW + GROW)',
      'البرمجة المتقدمة وبناء الـ SaaS بالذكاء الاصطناعي',
      'إنشاء المواقع والتطبيقات والأنظمة والـ APIs المتكاملة',
      'بناء SaaS كامل: الفكرة ← UX/UI ← البرمجة ← الإطلاق ← تحقيق الدخل',
      '👨‍🏫 مرافقة واستشارات شخصية لتوجيه مشروعك',
      '♾️ وصول Premium كامل لجميع الدورات والتحديثات',
      'أرباح تسويق بالعمولة حتى الجيل 4 (الجيل 1، 2، 3، 4 كاملة)',
      'شارات VIP ومجتمع النخبة المغلق'
    ]);
    await connection.query(`
      UPDATE packages 
      SET unlocked_generations = 4,
          price = 1000.00,
          features = ?
      WHERE slug = 'prime-1000' OR price >= 1000
    `, [primeFeatures]);
    console.log('Updated PRIME ($1,000) package: 4 generations (G1, G2, G3, G4).');

    // 2. Make sure all historical 'upgraded' packages remain active records in independent history
    // We update is_current so that the package with the highest level is is_current = 1,
    // but previous packages remain status = 'active' so they count as fully owned purchases.
    await connection.query(`
      UPDATE user_packages 
      SET status = 'active' 
      WHERE status = 'upgraded'
    `);
    console.log('Normalized historical user_packages status to active.');

    // 3. For each user, set is_current = 1 for their highest level package, and 0 for others
    const [usersWithPacks] = await connection.query(`
      SELECT DISTINCT user_id FROM user_packages WHERE status = 'active'
    `);
    for (const u of usersWithPacks) {
      const [highest] = await connection.query(`
        SELECT up.id 
        FROM user_packages up
        JOIN packages p ON up.package_id = p.id
        WHERE up.user_id = ? AND up.status = 'active'
        ORDER BY p.level DESC, up.purchased_at DESC
        LIMIT 1
      `, [u.user_id]);
      if (highest.length > 0) {
        await connection.query('UPDATE user_packages SET is_current = 0 WHERE user_id = ?', [u.user_id]);
        await connection.query('UPDATE user_packages SET is_current = 1 WHERE id = ?', [highest[0].id]);
      }
    }
    console.log('Updated is_current flags for highest packages per user.');

    await connection.commit();

    const [finalPkgs] = await connection.query('SELECT id, slug, name, name_ar, price, level, unlocked_generations FROM packages ORDER BY level ASC');
    console.log('Packages table after update:', finalPkgs);
    console.log('--- Migration 24 Completed Successfully ---');
    process.exit(0);
  } catch (err) {
    await connection.rollback();
    console.error('Migration 24 failed:', err);
    process.exit(1);
  } finally {
    connection.release();
  }
}

run();
