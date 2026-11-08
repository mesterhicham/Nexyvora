const db = require('../config/db');

/**
 * Migration 33: align every database with what the code expects.
 *
 *  1. Columns / tables that production gained by hand but no migration or schema file created
 *     (fresh installs and dev databases were missing them, causing "Unknown column" errors):
 *       news.media_* / views_count / is_featured, teachers.bio / degree / certifications / updated_at,
 *       programs.image_url, profiles.whatsapp_verified, modules.updated_at,
 *       assignment_submissions.submission_text / status, programs / specialties / cohorts.updated_at,
 *       the rank presentation columns, and the tables lessons, lesson_attendance,
 *       lesson_content, assignments and assignment_submissions.
 *  2. Free-text columns still stored as utf8 / utf8mb3 are converted to utf8mb4, so emoji or
 *     4-byte characters in reasons, notes, support messages... no longer fail with
 *     "Illegal mix of collations" / "Incorrect string value".
 *     Only free-text columns are touched: not indexed, no default, and not identifier-like
 *     (ids, references, codes, emails, statuses...), so keys, foreign keys and joins are unaffected.
 */

async function columnExists(conn, table, column) {
    const [rows] = await conn.query(
        'SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
        [table, column]
    );
    return rows.length > 0;
}

async function tableExists(conn, table) {
    const [rows] = await conn.query(
        'SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1',
        [table]
    );
    return rows.length > 0;
}

const MISSING_COLUMNS = [
    ['news', 'media_url', 'TEXT NULL'],
    ['news', 'media_name', 'VARCHAR(255) NULL'],
    ['news', 'media_size', 'BIGINT NULL'],
    ['news', 'media_type', 'VARCHAR(50) NULL'],
    ['news', 'views_count', 'INT NOT NULL DEFAULT 0'],
    ['news', 'is_featured', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['teachers', 'bio', 'TEXT NULL'],
    ['teachers', 'degree', 'VARCHAR(255) NULL'],
    ['teachers', 'certifications', 'LONGTEXT NULL'],
    ['teachers', 'updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
    ['programs', 'image_url', 'VARCHAR(500) NULL'],
    ['profiles', 'whatsapp_verified', 'TINYINT(1) NOT NULL DEFAULT 0'],
    ['modules', 'updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
    ['assignment_submissions', 'submission_text', 'TEXT NULL'],
    ['assignment_submissions', 'status', "VARCHAR(50) NOT NULL DEFAULT 'submitted'"],
    ['programs', 'updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
    ['specialties', 'updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
    ['cohorts', 'updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
    ['ranks', 'tagline', 'VARCHAR(255) NULL'],
    ['ranks', 'tagline_ar', 'VARCHAR(255) NULL'],
    ['ranks', 'logo_url', 'TEXT NULL'],
    ['ranks', 'required_rank_id', 'VARCHAR(36) NULL'],
    ['ranks', 'required_rank_count', 'INT NULL DEFAULT 0'],
    ['ranks', 'condition_operator', "ENUM('AND','OR') NULL DEFAULT 'AND'"],
    ['ranks', 'gift_name', 'VARCHAR(255) NULL'],
    ['ranks', 'gift_name_ar', 'VARCHAR(255) NULL'],
    ['ranks', 'gift_image_url', 'TEXT NULL'],
    ['ranks', 'is_active', 'TINYINT(1) NULL DEFAULT 1'],
    ['leader_achievers', 'leaders_count_at_time', 'INT NULL DEFAULT 0'],
    ['leader_achievers', 'transaction_id', 'VARCHAR(36) NULL'],
];

const MISSING_TABLES = {
    assignments: `
        CREATE TABLE IF NOT EXISTS assignments (
            id VARCHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            module_id VARCHAR(36) NULL,
            cohort_id VARCHAR(36) NULL,
            teacher_id VARCHAR(36) NULL,
            due_date DATETIME NULL,
            max_grade DECIMAL(5,2) DEFAULT 100.00,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_asg_teacher (teacher_id),
            KEY idx_asg_module (module_id),
            KEY idx_asg_cohort (cohort_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    assignment_submissions: `
        CREATE TABLE IF NOT EXISTS assignment_submissions (
            id VARCHAR(36) NOT NULL,
            assignment_id VARCHAR(36) NOT NULL,
            student_id VARCHAR(36) NOT NULL,
            submission_url TEXT NULL,
            submission_text TEXT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'submitted',
            notes TEXT NULL,
            grade DECIMAL(5,2) NULL,
            feedback TEXT NULL,
            submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            graded_at TIMESTAMP NULL DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY uq_asg_student (assignment_id, student_id),
            KEY idx_sub_asg (assignment_id),
            KEY idx_sub_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    lesson_content: `
        CREATE TABLE IF NOT EXISTS lesson_content (
            id VARCHAR(36) NOT NULL,
            lesson_id VARCHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content_type VARCHAR(50) DEFAULT 'file',
            content_url TEXT NOT NULL,
            order_index INT DEFAULT 0,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_content_lesson (lesson_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    lessons: `
        CREATE TABLE IF NOT EXISTS lessons (
            id VARCHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            module_id VARCHAR(36) NULL,
            cohort_id VARCHAR(36) NULL,
            teacher_id VARCHAR(36) NULL,
            scheduled_date DATETIME NULL,
            duration_minutes INT DEFAULT 60,
            status VARCHAR(50) DEFAULT 'scheduled',
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_lessons_teacher (teacher_id),
            KEY idx_lessons_module (module_id),
            KEY idx_lessons_cohort (cohort_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    lesson_attendance: `
        CREATE TABLE IF NOT EXISTS lesson_attendance (
            id VARCHAR(36) NOT NULL,
            lesson_id VARCHAR(36) NOT NULL,
            student_id VARCHAR(36) NOT NULL,
            status ENUM('present','absent','late','excused') NOT NULL DEFAULT 'present',
            notes TEXT NULL,
            marked_by VARCHAR(36) NULL,
            marked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_lesson_student (lesson_id, student_id),
            KEY idx_att_lesson (lesson_id),
            KEY idx_att_student (student_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
};

// node migrations/33_... --dry-run  lists the changes without applying them
const DRY_RUN = process.argv.includes('--dry-run');

async function up() {
    console.log('--- Migration 33: schema drift + utf8mb4 free-text columns ---');
    let conn;
    try {
        conn = await db.getConnection();

        // 1. Missing tables and columns
        for (const [table, sql] of Object.entries(MISSING_TABLES)) {
            if (!(await tableExists(conn, table))) {
                console.log(`${DRY_RUN ? '[dry-run] would create' : 'Creating'} table ${table}...`);
                if (!DRY_RUN) await conn.query(sql);
            }
        }
        for (const [table, column, definition] of MISSING_COLUMNS) {
            if ((await tableExists(conn, table)) && !(await columnExists(conn, table, column))) {
                console.log(`${DRY_RUN ? '[dry-run] would add' : 'Adding'} ${table}.${column}...`);
                if (!DRY_RUN) await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
            }
        }

        // 2. utf8 / utf8mb3 free-text columns -> utf8mb4 (not indexed, no default, not generated)
        // Three simple information_schema reads filtered in JS (a correlated query is extremely slow on MySQL 5.7)
        const [baseTables] = await conn.query(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'"
        );
        const [indexed] = await conn.query(
            'SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()'
        );
        const [allCols] = await conn.query(`
            SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA, CHARACTER_SET_NAME, DATA_TYPE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
            ORDER BY TABLE_NAME, ORDINAL_POSITION
        `);
        const tableSet = new Set(baseTables.map(t => t.TABLE_NAME));
        const indexedSet = new Set(indexed.map(i => `${i.TABLE_NAME}.${i.COLUMN_NAME}`));
        const TEXT_TYPES = new Set(['varchar', 'text', 'mediumtext', 'longtext', 'tinytext']);
        const cols = allCols.filter(c =>
            tableSet.has(c.TABLE_NAME) &&
            ['utf8', 'utf8mb3'].includes(String(c.CHARACTER_SET_NAME || '').toLowerCase()) &&
            TEXT_TYPES.has(String(c.DATA_TYPE || '').toLowerCase()) &&
            (c.COLUMN_DEFAULT === null || c.COLUMN_DEFAULT === 'NULL') &&
            !String(c.EXTRA || '').toUpperCase().includes('GENERATED') &&
            !indexedSet.has(`${c.TABLE_NAME}.${c.COLUMN_NAME}`) &&
            // Identifier-like varchar columns keep their collation so joins can keep using indexes
            !(String(c.DATA_TYPE).toLowerCase() === 'varchar' && /(^id$|_id$|_by$|reference|code|email|status|type|currency|slug|url|token|hash)/i.test(c.COLUMN_NAME))
        );

        const byTable = new Map();
        for (const c of cols) {
            if (!byTable.has(c.TABLE_NAME)) byTable.set(c.TABLE_NAME, []);
            byTable.get(c.TABLE_NAME).push(c);
        }

        let converted = 0;
        for (const [table, list] of byTable) {
            const clauses = list.map(c =>
                `MODIFY COLUMN \`${c.COLUMN_NAME}\` ${c.COLUMN_TYPE} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ${c.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`
            );
            if (DRY_RUN) {
                console.log(`[dry-run] ${table}: ${list.map(c => c.COLUMN_NAME).join(', ')}`);
            } else {
                await conn.query(`ALTER TABLE \`${table}\` ${clauses.join(', ')}`);
            }
            converted += list.length;
        }
        console.log(`${DRY_RUN ? '[dry-run] would convert' : 'Converted'} ${converted} free-text column(s) in ${byTable.size} table(s) to utf8mb4.`);
        console.log('--- Migration 33 completed ---');
    } catch (err) {
        console.error('Migration 33 failed:', err);
        throw err;
    } finally {
        if (conn) conn.release();
    }
}

if (require.main === module) {
    up().then(() => {
        console.log('Done.');
        process.exit(0);
    }).catch(err => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { up };
