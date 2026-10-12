const db = require('../config/db');

async function run() {
  try {
    const [cols] = await db.query("SHOW COLUMNS FROM packages LIKE 'unlocked_generations'");
    if (cols.length === 0) {
      await db.query("ALTER TABLE packages ADD COLUMN unlocked_generations INT NOT NULL DEFAULT 1 AFTER level");
      console.log('Added unlocked_generations column to packages.');
    } else {
      console.log('unlocked_generations column already exists.');
    }

    // Set tier generation rules as requested by user
    // 100$ -> 2 generations
    await db.query("UPDATE packages SET unlocked_generations = 2 WHERE slug = 'pack-100' OR price = 100");
    // 250$ -> 3 generations
    await db.query("UPDATE packages SET unlocked_generations = 3 WHERE slug = 'pack-250' OR price = 250");
    // 500$ -> 4 generations
    await db.query("UPDATE packages SET unlocked_generations = 4 WHERE slug = 'pack-500' OR price = 500");
    // 1000$ -> 5 generations
    await db.query("UPDATE packages SET unlocked_generations = 5 WHERE slug = 'pack-1000' OR price = 1000");

    console.log('Updated unlocked_generations values successfully.');

    const [rows] = await db.query('SELECT slug, name, price, level, unlocked_generations FROM packages ORDER BY level ASC');
    console.log(JSON.stringify(rows, null, 2));
  } catch(e) {
    console.error('Migration error:', e);
  } finally {
    process.exit(0);
  }
}

run();
