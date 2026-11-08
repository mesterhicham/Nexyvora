const db = require('../config/db');
const crypto = require('crypto');
const academyAccess = require('../services/academyAccessService');
const { isSafeHttpUrl } = require('../services/uploadUrlPolicy');

// Lesson presentation fields (migration 32)
function cleanLessonExtras(body) {
    const out = {};
    if (body.thumbnail_url !== undefined) {
        if (!isSafeHttpUrl(body.thumbnail_url)) throw new Error('Invalid thumbnail URL');
        out.thumbnail_url = body.thumbnail_url ? String(body.thumbnail_url).trim() : null;
    }
    if (body.description !== undefined) {
        out.description = body.description ? String(body.description).trim() : null;
    }
    if (body.resources !== undefined) {
        const list = Array.isArray(body.resources) ? body.resources : [];
        const cleaned = list
            .filter(r => r && r.url && isSafeHttpUrl(r.url))
            .slice(0, 20)
            .map(r => ({ title: String(r.title || r.url).trim().slice(0, 200), url: String(r.url).trim() }));
        out.resources = cleaned.length ? JSON.stringify(cleaned) : null;
    }
    return out;
}

// --- FORMATIONS ---
exports.getAllFormations = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : null;
        const userRole = req.user ? req.user.role : null;

        let whereClause = '';
        const params = [];

        if (userRole === 'teacher') {
            const [tRows] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [userId]);
            const teacherId = tRows[0]?.id || null;
            whereClause = 'WHERE (f.teacher_id = ? OR f.teacher_id = ? OR f.created_by = ?)';
            params.push(teacherId, userId, userId);
        }

        const [formations] = await db.query(`
            SELECT f.*, 
                   p.name AS package_name, 
                   p.name_ar AS package_name_ar, 
                   p.level AS package_level, 
                   p.price AS package_price,
                   t.id AS teacher_record_id,
                   tp.full_name AS teacher_name,
                   tp.avatar_url AS teacher_avatar,
                   tu.email AS teacher_email,
                   COALESCE((SELECT COUNT(*) FROM formation_content fc WHERE fc.formation_id = f.id), 0) AS content_count,
                   COALESCE((SELECT COUNT(*) FROM formation_enrollments fe WHERE fe.formation_id = f.id), 0) AS enrollment_count
            FROM formations f
            LEFT JOIN packages p ON f.package_id = p.id
            LEFT JOIN teachers t ON f.teacher_id = t.id OR f.teacher_id = t.user_id
            LEFT JOIN profiles tp ON t.user_id = tp.id
            LEFT JOIN users tu ON t.user_id = tu.id
            ${whereClause}
            ORDER BY f.created_at DESC
        `, params);
        res.json(formations);
    } catch (err) {
        console.error('[getAllFormations error]:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getPublishedFormations = async (req, res) => {
    try {
        const [formations] = await db.query(`
            SELECT f.*, 
                   p.name AS package_name, 
                   p.name_ar AS package_name_ar, 
                   p.level AS package_level, 
                   p.price AS package_price,
                   tp.full_name AS teacher_name,
                   tp.avatar_url AS teacher_avatar
            FROM formations f
            LEFT JOIN packages p ON f.package_id = p.id
            LEFT JOIN teachers t ON f.teacher_id = t.id OR f.teacher_id = t.user_id
            LEFT JOIN profiles tp ON t.user_id = tp.id
            WHERE f.is_published = 1
            ORDER BY f.created_at DESC
        `);
        res.json(formations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Helper: Check if user has permission to manage formation content
async function canUserManageContent(formationId, reqUser) {
    if (!reqUser) return false;
    if (reqUser.role === 'admin') return true;
    if (reqUser.role === 'teacher') {
        const [tRows] = await db.query('SELECT id FROM teachers WHERE user_id = ?', [reqUser.id]);
        const teacherId = tRows[0]?.id;
        const [fRows] = await db.query(
            'SELECT id FROM formations WHERE id = ? AND (teacher_id = ? OR teacher_id = ? OR created_by = ?)',
            [formationId, teacherId, reqUser.id, reqUser.id]
        );
        return fRows.length > 0;
    }
    return false;
}

// Helper: Auto-enroll all active students whose package qualifies for this formation
async function autoEnrollPackageStudents(formationId, packageId) {
    if (!formationId || !packageId) return;
    try {
        const [pkgRows] = await db.query('SELECT level FROM packages WHERE id = ?', [packageId]);
        if (pkgRows.length === 0) return;
        const requiredLevel = Number(pkgRows[0].level);

        // Find all users with active package at or above this level
        const [users] = await db.query(`
            SELECT DISTINCT up.user_id
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            WHERE up.status = 'active' AND p.level >= ?
        `, [requiredLevel]);

        for (const u of users) {
            let [st] = await db.query('SELECT id FROM students WHERE user_id = ?', [u.user_id]);
            let stId;
            if (st.length === 0) {
                stId = crypto.randomUUID();
                await db.query('INSERT INTO students (id, user_id, status) VALUES (?, ?, "active")', [stId, u.user_id]);
            } else {
                stId = st[0].id;
            }

            const [enr] = await db.query('SELECT id FROM formation_enrollments WHERE student_id = ? AND formation_id = ?', [stId, formationId]);
            if (enr.length === 0) {
                await db.query(
                    'INSERT INTO formation_enrollments (id, formation_id, student_id, payment_status, enrolled_at) VALUES (?, ?, ?, "approved", NOW())',
                    [crypto.randomUUID(), formationId, stId]
                );
            }
        }
    } catch (err) {
        console.error('[autoEnrollPackageStudents error]:', err);
    }
}

// Helper: Auto-enroll single student into all published formations their package qualifies for
async function autoEnrollStudentForPackages(userId, studentId) {
    try {
        // Courses assigned to the member's packages (admin "Assign Courses") and to lower tiers
        const formationIds = await academyAccess.getPackageFormationIds(userId);
        const coveredFormations = [...formationIds].map(id => ({ id }));

        for (const cf of coveredFormations) {
            const [exists] = await db.query(
                'SELECT id FROM formation_enrollments WHERE student_id = ? AND formation_id = ?',
                [studentId, cf.id]
            );
            if (exists.length === 0) {
                await db.query(
                    'INSERT INTO formation_enrollments (id, formation_id, student_id, payment_status, enrolled_at) VALUES (?, ?, ?, "approved", NOW())',
                    [crypto.randomUUID(), cf.id, studentId]
                );
            }
        }
    } catch (e) {
        console.error('[autoEnrollStudentForPackages error]:', e);
    }
}

exports.createFormation = async (req, res) => {
    const { title, description, price, currency, is_published, thumbnail_url, package_id, teacher_id } = req.body;
    const id = crypto.randomUUID();
    const created_by = req.user ? req.user.id : null;
    const cleanPackageId = (package_id && package_id !== 'none' && package_id !== 'null') ? package_id : null;
    const finalPrice = cleanPackageId ? 0 : (Number(price) || 0);
    // Default to published (1) unless explicitly false/0
    const finalPublished = (is_published === undefined || is_published === null || is_published === true || is_published === 1) ? 1 : 0;

    let cleanTeacherId = null;
    if (teacher_id && teacher_id !== 'none' && teacher_id !== 'null') {
        const [tRows] = await db.query('SELECT id FROM teachers WHERE id = ? OR user_id = ?', [teacher_id, teacher_id]);
        cleanTeacherId = tRows[0]?.id || teacher_id;
    }

    try {
        await db.query(
            'INSERT INTO formations (id, title, description, price, currency, is_published, thumbnail_url, package_id, teacher_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, finalPrice, currency || 'USD', finalPublished, thumbnail_url || null, cleanPackageId, cleanTeacherId, created_by]
        );

        if (cleanPackageId) {
            await db.query(
                'INSERT IGNORE INTO package_courses (id, package_id, formation_id) VALUES (?, ?, ?)',
                [crypto.randomUUID(), cleanPackageId, id]
            );

            if (finalPublished === 1) {
                await autoEnrollPackageStudents(id, cleanPackageId);
            }
        }

        res.status(201).json({ id, title, description, price: finalPrice, currency: currency || 'USD', is_published: finalPublished === 1, thumbnail_url, package_id: cleanPackageId, teacher_id: cleanTeacherId });
    } catch (err) {
        console.error('[createFormation error]:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateFormation = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, currency, is_published, thumbnail_url, package_id, teacher_id } = req.body;
    const cleanPackageId = (package_id !== undefined) ? ((package_id && package_id !== 'none' && package_id !== 'null') ? package_id : null) : undefined;
    const finalPrice = (cleanPackageId !== undefined && cleanPackageId !== null) ? 0 : (Number(price) || 0);
    const finalPublished = (is_published === true || is_published === 1) ? 1 : 0;

    let cleanTeacherId = undefined;
    if (teacher_id !== undefined) {
        if (teacher_id && teacher_id !== 'none' && teacher_id !== 'null') {
            const [tRows] = await db.query('SELECT id FROM teachers WHERE id = ? OR user_id = ?', [teacher_id, teacher_id]);
            cleanTeacherId = tRows[0]?.id || teacher_id;
        } else {
            cleanTeacherId = null;
        }
    }

    try {
        let updateQuery = 'UPDATE formations SET title = ?, description = ?, price = ?, currency = ?, is_published = ?, thumbnail_url = ?';
        const params = [title, description, finalPrice, currency || 'USD', finalPublished, thumbnail_url || null];

        if (cleanPackageId !== undefined) {
            updateQuery += ', package_id = ?';
            params.push(cleanPackageId);
        }
        if (cleanTeacherId !== undefined) {
            updateQuery += ', teacher_id = ?';
            params.push(cleanTeacherId);
        }

        updateQuery += ', updated_at = NOW() WHERE id = ?';
        params.push(id);

        await db.query(updateQuery, params);

        if (cleanPackageId !== undefined) {
            await db.query('DELETE FROM package_courses WHERE formation_id = ?', [id]);
            if (cleanPackageId) {
                await db.query(
                    'INSERT IGNORE INTO package_courses (id, package_id, formation_id) VALUES (?, ?, ?)',
                    [crypto.randomUUID(), cleanPackageId, id]
                );
            }
        }

        // If published and has package, auto-sync enrollments
        if (finalPublished === 1) {
            let targetPkgId = cleanPackageId;
            if (targetPkgId === undefined) {
                const [rows] = await db.query('SELECT package_id FROM formations WHERE id = ?', [id]);
                targetPkgId = rows[0]?.package_id;
            }
            if (targetPkgId) {
                await autoEnrollPackageStudents(id, targetPkgId);
            }
        }

        res.json({ id, title, description, price: finalPrice, currency: currency || 'USD', is_published: finalPublished === 1, thumbnail_url, package_id: cleanPackageId, teacher_id: cleanTeacherId });
    } catch (err) {
        console.error('[updateFormation error]:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFormation = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM formations WHERE id = ?', [id]);
        res.json({ message: 'Formation deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- CONTENT ---
// Helper: Return the user's approved enrollment for a formation (or null)
async function getApprovedEnrollment(userId, formationId) {
    const [rows] = await db.execute(
        `SELECT fe.id FROM formation_enrollments fe
         JOIN students s ON fe.student_id = s.id
         WHERE s.user_id = ? AND fe.formation_id = ? AND fe.payment_status = 'approved'
         LIMIT 1`,
        [userId, formationId]
    );
    return rows[0] || null;
}

// Helper: Return the enrollment if it belongs to the current user (admins may access any)
async function getOwnedEnrollment(reqUser, enrollmentId) {
    if (reqUser.role === 'admin') {
        const [rows] = await db.execute('SELECT * FROM formation_enrollments WHERE id = ?', [enrollmentId]);
        return rows[0] || null;
    }
    const [rows] = await db.execute(
        `SELECT fe.* FROM formation_enrollments fe
         JOIN students s ON fe.student_id = s.id
         WHERE fe.id = ? AND s.user_id = ?`,
        [enrollmentId, reqUser.id]
    );
    return rows[0] || null;
}

exports.getFormationContent = async (req, res) => {
    const { id } = req.params;
    try {
        const [content] = await db.execute('SELECT * FROM formation_content WHERE formation_id = ? ORDER BY order_index ASC, created_at ASC', [id]);
        const access = await academyAccess.resolveFormationAccess(req.user, id);

        if (access.canManage) {
            return res.json(academyAccess.buildLessonStates(content, [], { unlockAll: true }));
        }

        if (!access.allowed) {
            // Without active access only the curriculum outline is visible (no files, quizzes or resources)
            return res.json(content.map(c => ({
                ...c, file_url: null, quiz_id: null, resources: [], locked: true, completed: false, watched_seconds: 0
            })));
        }

        // Sequential unlocking is decided here, never by the client
        const [progress] = await db.execute('SELECT * FROM formation_progress WHERE enrollment_id = ?', [access.enrollment.id]);
        res.json(academyAccess.buildLessonStates(content, progress));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addFormationContent = async (req, res) => {
    const { formation_id, title, content_type, file_url, duration_seconds, order_index, quiz_id } = req.body;
    
    // Permission check
    const canManage = await canUserManageContent(formation_id, req.user);
    if (!canManage) {
        return res.status(403).json({ error: 'غير مصرح لك بإضافة محتوى لهذا التكوين' });
    }

    const id = crypto.randomUUID();
    const finalDuration = (duration_seconds !== undefined && duration_seconds !== null && duration_seconds !== '') ? Number(duration_seconds) : null;
    const finalOrder = (order_index !== undefined && order_index !== null && order_index !== '') ? Number(order_index) : 0;
    const finalQuizId = (quiz_id !== undefined && quiz_id !== null && quiz_id !== '' && quiz_id !== 'none' && quiz_id !== 'null') ? quiz_id : null;
    const finalFileUrl = file_url || null;

    try {
        const extras = cleanLessonExtras(req.body);
        await db.execute(
            'INSERT INTO formation_content (id, formation_id, title, content_type, file_url, duration_seconds, order_index, quiz_id, thumbnail_url, description, resources) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, formation_id, title, content_type, finalFileUrl, finalDuration, finalOrder, finalQuizId, extras.thumbnail_url ?? null, extras.description ?? null, extras.resources ?? null]
        );
        res.status(201).json({ id, formation_id, title, content_type, file_url: finalFileUrl, duration_seconds: finalDuration, order_index: finalOrder, quiz_id: finalQuizId, ...extras, resources: academyAccess.parseResources(extras.resources) });
    } catch (err) {
        console.error('[addFormationContent error]:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateFormationContent = async (req, res) => {
    const { id } = req.params;
    const { title, content_type, file_url, duration_seconds, order_index, quiz_id } = req.body;
    try {
        const [cRows] = await db.execute('SELECT formation_id FROM formation_content WHERE id = ?', [id]);
        if (cRows.length === 0) return res.status(404).json({ error: 'Content not found' });
        
        const canManage = await canUserManageContent(cRows[0].formation_id, req.user);
        if (!canManage) {
            return res.status(403).json({ error: 'غير مصرح لك بتعديل محتوى هذا التكوين' });
        }

        const finalDuration = (duration_seconds !== undefined && duration_seconds !== null && duration_seconds !== '') ? Number(duration_seconds) : null;
        const finalOrder = (order_index !== undefined && order_index !== null && order_index !== '') ? Number(order_index) : 0;
        const finalQuizId = (quiz_id !== undefined && quiz_id !== null && quiz_id !== '' && quiz_id !== 'none' && quiz_id !== 'null') ? quiz_id : null;
        const finalFileUrl = file_url || null;

        const extras = cleanLessonExtras(req.body);
        const extraKeys = Object.keys(extras);
        await db.execute(
            `UPDATE formation_content SET title = ?, content_type = ?, file_url = ?, duration_seconds = ?, order_index = ?, quiz_id = ?${extraKeys.map(k => `, ${k} = ?`).join('')} WHERE id = ?`,
            [title, content_type, finalFileUrl, finalDuration, finalOrder, finalQuizId, ...extraKeys.map(k => extras[k]), id]
        );
        res.json({ id, title, content_type, file_url: finalFileUrl, duration_seconds: finalDuration, order_index: finalOrder, quiz_id: finalQuizId, ...extras, ...(extras.resources !== undefined ? { resources: academyAccess.parseResources(extras.resources) } : {}) });
    } catch (err) {
        console.error('[updateFormationContent error]:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFormationContent = async (req, res) => {
    const { id } = req.params;
    try {
        const [cRows] = await db.execute('SELECT formation_id FROM formation_content WHERE id = ?', [id]);
        if (cRows.length === 0) return res.status(404).json({ error: 'Content not found' });
        
        const canManage = await canUserManageContent(cRows[0].formation_id, req.user);
        if (!canManage) {
            return res.status(403).json({ error: 'غير مصرح لك بحذف محتوى هذا التكوين' });
        }

        await db.execute('DELETE FROM formation_content WHERE id = ?', [id]);
        res.json({ message: 'Content deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.reorderContent = async (req, res) => {
    const { items, formationId } = req.body;
    try {
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'items must be an array' });
        }
        if (req.user.role !== 'admin') {
            if (!formationId || !(await canUserManageContent(formationId, req.user))) {
                return res.status(403).json({ error: 'غير مصرح لك بإعادة ترتيب محتوى هذا التكوين' });
            }
        }
        for (const item of items) {
            if (formationId) {
                await db.execute('UPDATE formation_content SET order_index = ? WHERE id = ? AND formation_id = ?', [item.order_index, item.id, formationId]);
            } else {
                await db.execute('UPDATE formation_content SET order_index = ? WHERE id = ?', [item.order_index, item.id]);
            }
        }
        res.json({ message: 'Content reordered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- ENROLLMENTS & PAYMENTS ---
exports.getAllEnrollments = async (req, res) => {
    try {
        const [enrollments] = await db.execute(`
            SELECT fe.*, f.title as formation_title, p.full_name as student_name
            FROM formation_enrollments fe
            JOIN formations f ON fe.formation_id = f.id
            JOIN students s ON fe.student_id = s.id
            JOIN profiles p ON s.user_id = p.id
            ORDER BY fe.enrolled_at DESC
        `);
        res.json(enrollments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentEnrollments = async (req, res) => {
    const userId = req.user.id;
    try {
        let [student] = await db.execute('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (student.length === 0) {
            const newStudentId = crypto.randomUUID();
            await db.execute('INSERT INTO students (id, user_id, status) VALUES (?, ?, "active")', [newStudentId, userId]);
            student = [{ id: newStudentId }];
        }
        const studentId = student[0].id;
        
        // Auto-enroll student into all published formations their active package grants access to
        await autoEnrollStudentForPackages(userId, studentId);

        const [enrollments] = await db.execute(`
            SELECT 
                fe.*, 
                f.title as formation_title, 
                f.thumbnail_url,
                f.package_id,
                p.name AS package_name,
                p.name_ar AS package_name_ar,
                p.level AS package_level,
                COALESCE((SELECT COUNT(*) FROM formation_content fc WHERE fc.formation_id = fe.formation_id), 0) as total_contents,
                COALESCE((
                    SELECT COUNT(*) 
                    FROM formation_progress fp 
                    JOIN formation_content fc ON fp.content_id = fc.id 
                    WHERE fp.enrollment_id = fe.id AND fp.completed = 1 AND fc.formation_id = fe.formation_id
                ), 0) as completed_contents
            FROM formation_enrollments fe
            JOIN formations f ON fe.formation_id = f.id
            LEFT JOIN packages p ON f.package_id = p.id
            WHERE fe.student_id = ?
            ORDER BY fe.enrolled_at DESC
        `, [studentId]);

        const packageFormationIds = await academyAccess.getPackageFormationIds(userId);
        const visible = enrollments.filter(e =>
            e.payment_status !== 'approved' || academyAccess.isEnrollmentActive(e, packageFormationIds)
        );

        const enriched = visible.map(e => {
            const total = Number(e.total_contents) || 0;
            const completed = Number(e.completed_contents) || 0;
            const isCompleted = total > 0 && completed >= total;
            const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
            return {
                ...e,
                total_contents: total,
                completed_contents: completed,
                is_completed: isCompleted,
                progress_percent: percent,
                access_source: e.payment_id ? 'purchase' : 'package'
            };
        });

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.claimCertificate = async (req, res) => {
    const userId = req.user.id;
    const { enrollmentId } = req.params;
    try {
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (student.length === 0) return res.status(404).json({ error: 'Student not found' });

        const [enrollment] = await db.execute(
            'SELECT fe.*, f.title as formation_title FROM formation_enrollments fe JOIN formations f ON fe.formation_id = f.id WHERE fe.id = ? AND fe.student_id = ? AND fe.payment_status = "approved"',
            [enrollmentId, student[0].id]
        );
        if (enrollment.length === 0) return res.status(404).json({ error: 'Approved enrollment not found' });
        const packageIds = enrollment[0].payment_id ? new Set() : await academyAccess.getPackageFormationIds(userId);
        if (!academyAccess.isEnrollmentActive(enrollment[0], packageIds)) {
            return res.status(403).json({ error: 'هذه الدورة غير متاحة في باقتك الحالية / This course is not included in your current package', code: 'COURSE_NOT_IN_PACKAGE' });
        }

        const [counts] = await db.execute(`
            SELECT 
                COALESCE((SELECT COUNT(*) FROM formation_content WHERE formation_id = ?), 0) as total_contents,
                COALESCE((
                    SELECT COUNT(*) 
                    FROM formation_progress fp 
                    JOIN formation_content fc ON fp.content_id = fc.id 
                    WHERE fp.enrollment_id = ? AND fp.completed = 1 AND fc.formation_id = ?
                ), 0) as completed_contents
        `, [enrollment[0].formation_id, enrollmentId, enrollment[0].formation_id]);

        const total = Number(counts[0].total_contents) || 0;
        const completed = Number(counts[0].completed_contents) || 0;

        if (total === 0 || completed < total) {
            return res.status(403).json({
                error: 'لا يمكن الحصول على الشهادة إلا بعد الإنتهاء من كامل دروس ومحتويات الدورة التكوينية بنسبة 100%.',
                total_contents: total,
                completed_contents: completed,
                is_completed: false
            });
        }

        res.json({
            can_claim: true,
            is_completed: true,
            total_contents: total,
            completed_contents: completed,
            formation_title: enrollment[0].formation_title,
            enrollment_id: enrollmentId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateEnrollmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        await db.execute('UPDATE formation_enrollments SET payment_status = ? WHERE id = ?', [status, id]);
        res.json({ message: 'Enrollment status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const [payments] = await db.execute(`
            SELECT fp.*, f.title as formation_title, p.full_name as student_name, p.email as student_email
            FROM formation_payments fp
            JOIN formations f ON fp.formation_id = f.id
            JOIN students s ON fp.student_id = s.id
            JOIN profiles p ON s.user_id = p.id
            ORDER BY fp.created_at DESC
        `);
        res.json(payments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status, admin_notes } = req.body;
    const reviewed_by = req.user.id;
    try {
        await db.execute(
            'UPDATE formation_payments SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
            [status, admin_notes, reviewed_by, id]
        );
        
        if (status === 'approved') {
            const [payment] = await db.execute('SELECT formation_id, student_id FROM formation_payments WHERE id = ?', [id]);
            if (payment.length > 0) {
                await db.execute(
                    'UPDATE formation_enrollments SET payment_status = "approved" WHERE formation_id = ? AND student_id = ?',
                    [payment[0].formation_id, payment[0].student_id]
                );
            }
        }
        res.json({ message: 'Payment status updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- STATS ---
exports.getFormationStats = async (req, res) => {
    try {
        const [stats] = await db.execute(`
            SELECT 
                f.id, 
                f.title, 
                f.price,
                f.currency,
                COUNT(fe.id) as total_enrollments,
                SUM(CASE WHEN fe.payment_status = 'approved' THEN 1 ELSE 0 END) as approved_enrollments,
                SUM(CASE WHEN fe.payment_status = 'approved' THEN f.price ELSE 0 END) as total_revenue
            FROM formations f
            LEFT JOIN formation_enrollments fe ON f.id = fe.formation_id
            GROUP BY f.id
        `);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// --- STUDENT PROGRESS ---
exports.getStudentProgress = async (req, res) => {
    const { enrollmentId } = req.params;
    try {
        const enrollment = await getOwnedEnrollment(req.user, enrollmentId);
        if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

        const [progress] = await db.execute('SELECT * FROM formation_progress WHERE enrollment_id = ?', [enrollmentId]);
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStudentProgress = async (req, res) => {
    const { enrollmentId, contentId, watchedSeconds, completed } = req.body;
    try {
        const enrollment = await getOwnedEnrollment(req.user, enrollmentId);
        if (!enrollment || enrollment.payment_status !== 'approved') {
            return res.status(404).json({ error: 'Approved enrollment not found' });
        }
        if (req.user.role !== 'admin') {
            const packageIds = enrollment.payment_id ? new Set() : await academyAccess.getPackageFormationIds(req.user.id);
            if (!academyAccess.isEnrollmentActive(enrollment, packageIds)) {
                return res.status(403).json({ error: 'هذه الدورة غير متاحة في باقتك الحالية / This course is not included in your current package', code: 'COURSE_NOT_IN_PACKAGE' });
            }
        }

        const [contents] = await db.execute(
            'SELECT * FROM formation_content WHERE formation_id = ? ORDER BY order_index ASC, created_at ASC',
            [enrollment.formation_id]
        );
        const [progressRows] = await db.execute('SELECT * FROM formation_progress WHERE enrollment_id = ?', [enrollmentId]);
        const lessons = academyAccess.buildLessonStates(contents, progressRows);
        const lesson = lessons.find(l => l.id === contentId);
        if (!lesson) {
            return res.status(400).json({ error: 'Content does not belong to this formation' });
        }
        if (lesson.locked) {
            return res.status(403).json({ error: 'أكمل الدرس السابق أولاً / Complete the previous lesson first', code: 'LESSON_LOCKED' });
        }

        const watched = Math.max(0, Math.floor(Number(watchedSeconds) || 0));
        const markComplete = completed === true || completed === 1 || completed === 'true';

        // Videos complete only once (almost) fully watched; PDF / text / quiz complete with "Mark as read"
        if (markComplete && lesson.content_type === 'video') {
            const duration = Number(lesson.duration_seconds) || 0;
            const bestWatched = Math.max(watched, lesson.watched_seconds || 0);
            if (duration > 0 && bestWatched < Math.floor(duration * 0.9)) {
                return res.status(400).json({ error: 'يجب مشاهدة الفيديو كاملاً لإكماله / Watch the whole video to complete it', code: 'VIDEO_NOT_WATCHED' });
            }
        }

        // Progress never goes backwards: completion and watched time only increase
        await db.execute(`
            INSERT INTO formation_progress (id, enrollment_id, content_id, watched_seconds, completed, completed_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                watched_seconds = GREATEST(watched_seconds, VALUES(watched_seconds)),
                completed_at = IF(completed = 0 AND VALUES(completed) = 1, NOW(), completed_at),
                completed = GREATEST(completed, VALUES(completed)),
                updated_at = NOW()
        `, [crypto.randomUUID(), enrollmentId, contentId, watched, markComplete ? 1 : 0, markComplete ? new Date() : null]);

        res.json({ message: 'Progress updated', completed: markComplete || lesson.completed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- PAYMENT SUBMISSION (ENROLL) ---
exports.submitPayment = async (req, res) => {
    const userId = req.user.id;
    const { formationId, amount, currency, paymentMethod, referenceNumber, notes } = req.body;
    
    try {
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (student.length === 0) return res.status(404).json({ error: 'Student not found' });
        
        const studentId = student[0].id;
        const paymentId = crypto.randomUUID();
        const enrollmentId = crypto.randomUUID();

        // 1. Create Payment record
        await db.execute(
            'INSERT INTO formation_payments (id, formation_id, student_id, amount, currency, payment_method, reference_number, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "pending")',
            [paymentId, formationId, studentId, amount, currency, paymentMethod, referenceNumber || null, notes || null]
        );

        // 2. Create Enrollment record (initially pending)
        await db.execute(
            'INSERT INTO formation_enrollments (id, formation_id, student_id, payment_status, payment_id) VALUES (?, ?, ?, "pending", ?)',
            [enrollmentId, formationId, studentId, paymentId]
        );

        res.status(201).json({ paymentId, enrollmentId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
