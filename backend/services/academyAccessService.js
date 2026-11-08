const db = require('../config/db');

/**
 * Single source of truth for Academy access, lesson sequencing and lesson payloads.
 *
 * Access rule (admin "Packages > Assign Courses" page):
 *   A course assigned to a package is available to members of that package and of every
 *   higher-tier package. A course bought individually (enrollment with a payment) stays available.
 * Sequencing rule:
 *   A lesson is unlocked only when every previous lesson of the course is completed.
 */

/** Highest level among the member's active packages, or null. */
async function getMemberMaxLevel(userId) {
    const [rows] = await db.query(`
        SELECT MAX(p.level) AS max_level
        FROM user_packages up
        JOIN packages p ON up.package_id = p.id
        WHERE up.user_id = ? AND up.status = 'active'
    `, [userId]);
    return rows[0]?.max_level != null ? Number(rows[0].max_level) : null;
}

/**
 * Published courses granted by the member's packages.
 * Primary source: package_courses (Assign Courses). Legacy formations.package_id is kept for compatibility.
 */
async function getPackageFormationIds(userId) {
    const maxLevel = await getMemberMaxLevel(userId);
    if (maxLevel === null) return new Set();
    const [rows] = await db.query(`
        SELECT DISTINCT f.id
        FROM formations f
        WHERE f.is_published = 1 AND (
            EXISTS (
                SELECT 1 FROM package_courses pc
                JOIN packages p ON p.id = pc.package_id
                WHERE pc.formation_id = f.id AND p.level <= ?
            )
            OR EXISTS (
                SELECT 1 FROM packages p2
                WHERE p2.id = f.package_id AND p2.level <= ?
            )
        )
    `, [maxLevel, maxLevel]);
    return new Set(rows.map(r => r.id));
}

/** True when an approved enrollment is currently backed by a purchase or by the member's packages. */
function isEnrollmentActive(enrollment, packageFormationIds) {
    if (!enrollment || enrollment.payment_status !== 'approved') return false;
    if (enrollment.payment_id) return true; // course bought individually
    return packageFormationIds.has(enrollment.formation_id);
}

async function canManageFormation(formationId, reqUser) {
    if (!reqUser) return false;
    if (reqUser.role === 'admin') return true;
    if (reqUser.role !== 'teacher') return false;
    const [tRows] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [reqUser.id]);
    const teacherId = tRows[0]?.id || null;
    const [fRows] = await db.query(
        'SELECT id FROM formations WHERE id = ? AND (teacher_id = ? OR teacher_id = ? OR created_by = ?)',
        [formationId, teacherId, reqUser.id, reqUser.id]
    );
    return fRows.length > 0;
}

/**
 * Resolve what the requesting user may do with a course.
 * @returns {{ canManage: boolean, allowed: boolean, enrollment: object|null }}
 */
async function resolveFormationAccess(reqUser, formationId) {
    if (await canManageFormation(formationId, reqUser)) {
        return { canManage: true, allowed: true, enrollment: null };
    }
    const [rows] = await db.query(`
        SELECT fe.* FROM formation_enrollments fe
        JOIN students s ON fe.student_id = s.id
        WHERE s.user_id = ? AND fe.formation_id = ? AND fe.payment_status = 'approved'
        ORDER BY (fe.payment_id IS NOT NULL) DESC
        LIMIT 1
    `, [reqUser.id, formationId]);
    const enrollment = rows[0] || null;
    if (!enrollment) return { canManage: false, allowed: false, enrollment: null };
    const packageIds = enrollment.payment_id ? new Set() : await getPackageFormationIds(reqUser.id);
    return { canManage: false, allowed: isEnrollmentActive(enrollment, packageIds), enrollment };
}

function parseResources(raw) {
    if (!raw) return [];
    try {
        const list = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(list) ? list.filter(r => r && r.url).map(r => ({ title: String(r.title || r.url), url: String(r.url) })) : [];
    } catch {
        return [];
    }
}

/**
 * Attach completed / locked flags to the ordered lessons of a course.
 * Locked lessons never expose their file, quiz or resources.
 */
function buildLessonStates(contents, progressRows, { unlockAll = false } = {}) {
    const completedIds = new Set(progressRows.filter(p => Number(p.completed) === 1).map(p => p.content_id));
    const watchedById = new Map(progressRows.map(p => [p.content_id, Number(p.watched_seconds) || 0]));
    let allPreviousCompleted = true;
    return contents.map((c) => {
        const completed = completedIds.has(c.id);
        const locked = unlockAll ? false : !allPreviousCompleted;
        allPreviousCompleted = allPreviousCompleted && completed;
        const base = {
            ...c,
            resources: parseResources(c.resources),
            completed,
            watched_seconds: watchedById.get(c.id) || 0,
            locked,
        };
        return locked ? { ...base, file_url: null, quiz_id: null, resources: [] } : base;
    });
}

module.exports = {
    getMemberMaxLevel,
    getPackageFormationIds,
    isEnrollmentActive,
    canManageFormation,
    resolveFormationAccess,
    parseResources,
    buildLessonStates,
};
