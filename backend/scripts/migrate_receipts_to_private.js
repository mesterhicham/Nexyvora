/**
 * Move payment receipts that were uploaded to the PUBLIC folder into the PRIVATE folder
 * and rewrite their URLs to the authenticated /api/upload/secure/ endpoint.
 *
 * Usage (from backend/):
 *   node scripts/migrate_receipts_to_private.js           -> dry run, changes nothing
 *   node scripts/migrate_receipts_to_private.js --apply   -> moves files and updates the database
 *
 * Covered records: payments, formation_payments, user_packages (receipt_url)
 * and deposit transactions (metadata.receiptUrl).
 */
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { extractPath } = require('../services/uploadUrlPolicy');

const APPLY = process.argv.includes('--apply');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const PUBLIC_DIR = path.join(UPLOADS_DIR, 'public');
const PRIVATE_DIR = path.join(UPLOADS_DIR, 'private');
const SECURE_PREFIX = '/api/upload/secure/';

function publicFilename(url) {
    const p = extractPath(url);
    if (!p) return null;
    const idx = p.indexOf('/uploads/');
    if (idx === -1) return null;
    const name = path.basename(p.slice(idx + '/uploads/'.length));
    return /^[A-Za-z0-9._-]+$/.test(name) ? name : null;
}

async function resolveStudentUserId(studentId) {
    const [rows] = await db.query('SELECT user_id FROM students WHERE id = ? OR user_id = ? LIMIT 1', [studentId, studentId]);
    return rows[0]?.user_id || null;
}

async function collect() {
    const items = [];

    const [payments] = await db.query("SELECT id, student_id, receipt_url FROM payments WHERE receipt_url LIKE '%/uploads/%'");
    for (const r of payments) {
        items.push({ table: 'payments', id: r.id, userId: await resolveStudentUserId(r.student_id), url: r.receipt_url });
    }

    const [formationPayments] = await db.query("SELECT id, student_id, receipt_url FROM formation_payments WHERE receipt_url LIKE '%/uploads/%'");
    for (const r of formationPayments) {
        items.push({ table: 'formation_payments', id: r.id, userId: await resolveStudentUserId(r.student_id), url: r.receipt_url });
    }

    const [packages] = await db.query("SELECT id, user_id, receipt_url FROM user_packages WHERE receipt_url LIKE '%/uploads/%'");
    for (const r of packages) {
        items.push({ table: 'user_packages', id: r.id, userId: r.user_id, url: r.receipt_url });
    }

    const [txs] = await db.query("SELECT id, user_id, metadata FROM transactions WHERE metadata LIKE '%receiptUrl%'");
    for (const r of txs) {
        let meta = r.metadata;
        if (typeof meta === 'string') {
            try { meta = JSON.parse(meta); } catch { continue; }
        }
        if (meta && typeof meta.receiptUrl === 'string' && meta.receiptUrl.includes('/uploads/')) {
            items.push({ table: 'transactions', id: r.id, userId: r.user_id, url: meta.receiptUrl, meta });
        }
    }
    return items;
}

async function updateRecord(item, newUrl) {
    if (item.table === 'transactions') {
        const meta = { ...item.meta, receiptUrl: newUrl };
        await db.query('UPDATE transactions SET metadata = ? WHERE id = ?', [JSON.stringify(meta), item.id]);
    } else {
        await db.query(`UPDATE ${item.table} SET receipt_url = ? WHERE id = ?`, [newUrl, item.id]);
    }
}

async function run() {
    console.log(`=== Receipt privacy migration (${APPLY ? 'APPLY' : 'DRY RUN'}) ===`);
    if (!fs.existsSync(PRIVATE_DIR)) fs.mkdirSync(PRIVATE_DIR, { recursive: true });

    const items = await collect();
    console.log(`Found ${items.length} receipt reference(s) pointing to public uploads.`);

    const stats = { moved: 0, relinked: 0, missing: 0, skipped: 0 };
    for (const item of items) {
        const name = publicFilename(item.url);
        if (!name || !item.userId) {
            console.log(`  SKIP ${item.table}#${item.id}: cannot resolve file name or owner (${item.url})`);
            stats.skipped++;
            continue;
        }

        const target = `sec_${item.userId}_${name}`;
        const targetPath = path.join(PRIVATE_DIR, target);
        const newUrl = `${SECURE_PREFIX}${target}`;
        const sources = [path.join(PUBLIC_DIR, name), path.join(UPLOADS_DIR, name)];
        const source = sources.find(p => fs.existsSync(p));

        if (!source && !fs.existsSync(targetPath)) {
            console.log(`  MISSING ${item.table}#${item.id}: ${name} not found on disk, URL left unchanged`);
            stats.missing++;
            continue;
        }

        console.log(`  ${item.table}#${item.id}: ${name} -> private/${target}`);
        if (APPLY) {
            if (source && !fs.existsSync(targetPath)) {
                fs.renameSync(source, targetPath);
                stats.moved++;
            }
            await updateRecord(item, newUrl);
            stats.relinked++;
        }
    }

    console.log('Summary:', stats);
    if (!APPLY) console.log('Dry run only. Re-run with --apply to perform the migration.');
}

run()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
