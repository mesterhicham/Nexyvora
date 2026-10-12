const db = require('../config/db');
const crypto = require('crypto');

// --- LESSONS ---
exports.getTeacherLessons = async (req, res) => {
    try {
        const [lessons] = await db.execute(`
      SELECT l.*, m.name as module_name, m.code as module_code, c.name as cohort_name 
      FROM lessons l
      LEFT JOIN modules m ON l.module_id = m.id
      LEFT JOIN cohorts c ON l.cohort_id = c.id
      WHERE l.teacher_id = ?
      ORDER BY l.scheduled_date DESC
    `, [req.user.id]);
        res.json(lessons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createLesson = async (req, res) => {
    const { title, description, module_id, cohort_id, scheduled_date, duration_minutes } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO lessons (id, title, description, module_id, cohort_id, teacher_id, scheduled_date, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, module_id, cohort_id, req.user.id, scheduled_date, duration_minutes]
        );
        res.status(201).json({ id, title, description, module_id, cohort_id, scheduled_date, duration_minutes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- ATTENDANCE ---
exports.getLessonAttendance = async (req, res) => {
    const { lessonId } = req.params;
    try {
        const [attendance] = await db.execute(`
      SELECT la.*, p.full_name, p.email 
      FROM lesson_attendance la
      JOIN students s ON la.student_id = s.id
      JOIN profiles p ON s.user_id = p.id
      WHERE la.lesson_id = ?
    `, [lessonId]);
        res.json(attendance);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markAttendance = async (req, res) => {
    const records = req.body; // Array of { lesson_id, student_id, status, notes }
    try {
        for (const record of records) {
            await db.execute(
                `INSERT INTO lesson_attendance (id, lesson_id, student_id, status, notes, marked_by, marked_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW()) 
         ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), marked_by = VALUES(marked_by), marked_at = NOW()`,
                [crypto.randomUUID(), record.lesson_id, record.student_id, record.status, record.notes || '', req.user.id]
            );
        }
        res.json({ message: 'Attendance marked successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- ASSIGNMENTS ---
exports.getTeacherAssignments = async (req, res) => {
    try {
        const [assignments] = await db.execute(`
      SELECT a.*, m.name as module_name, c.name as cohort_name,
      (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submissions_count
      FROM assignments a
      LEFT JOIN modules m ON a.module_id = m.id
      LEFT JOIN cohorts c ON a.cohort_id = c.id
      WHERE a.teacher_id = ?
      ORDER BY a.due_date DESC
    `, [req.user.id]);
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createAssignment = async (req, res) => {
    const { title, description, module_id, cohort_id, due_date, max_grade } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO assignments (id, title, description, module_id, cohort_id, teacher_id, due_date, max_grade) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, module_id, cohort_id, req.user.id, due_date, max_grade]
        );
        res.status(201).json({ id, title, description, module_id, cohort_id, due_date, max_grade });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- TEACHER ANNOUNCEMENTS / NEWS ---
exports.getTeacherNews = async (req, res) => {
    try {
        const [news] = await db.execute(`
            SELECT * FROM news WHERE author_id = ? ORDER BY created_at DESC
        `, [req.user.id]);
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createTeacherNews = async (req, res) => {
    const { title, content, type, priority, target_audience, is_published } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(`
            INSERT INTO news (id, title, content, type, priority, target_audience, is_published, author_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [id, title, content, type || 'announcement', priority || 'normal', target_audience || 'all', is_published !== false ? 1 : 0, req.user.id]);

        res.status(201).json({ id, title, content, type, priority, target_audience, is_published });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTeacherNews = async (req, res) => {
    const { id } = req.params;
    const { title, content, type, priority, target_audience, is_published } = req.body;
    try {
        await db.execute(`
            UPDATE news 
            SET title = ?, content = ?, type = ?, priority = ?, target_audience = ?, is_published = ?, updated_at = NOW() 
            WHERE id = ? AND author_id = ?
        `, [title, content, type, priority, target_audience, is_published ? 1 : 0, id, req.user.id]);

        res.json({ id, title, content, type, priority, target_audience, is_published });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTeacherNews = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM news WHERE id = ? AND author_id = ?', [id, req.user.id]);
        res.json({ message: 'Announcement deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- FORMATION PROGRESS DASHBOARD ---
exports.getFormationProgressDashboard = async (req, res) => {
    try {
        const [enrollments] = await db.execute(`
            SELECT fe.id, fe.formation_id, fe.student_id, fe.enrolled_at, fe.payment_status,
                   f.id as form_id, f.title as formation_title,
                   s.id as std_id, s.user_id as student_user_id,
                   p.full_name as student_name, p.email as student_email
            FROM formation_enrollments fe
            JOIN formations f ON fe.formation_id = f.id
            JOIN students s ON fe.student_id = s.id
            LEFT JOIN profiles p ON s.user_id = p.id
            WHERE fe.payment_status = 'approved'
        `);

        const [allContent] = await db.execute('SELECT id, formation_id FROM formation_content');
        const [allProgress] = await db.execute('SELECT * FROM formation_progress');

        const formattedEnrollments = enrollments.map(e => ({
            id: e.id,
            formation_id: e.formation_id,
            student_id: e.student_id,
            enrolled_at: e.enrolled_at,
            payment_status: e.payment_status,
            formation: { id: e.form_id, title: e.formation_title },
            student: {
                id: e.std_id,
                user_id: e.student_user_id,
                profile: { full_name: e.student_name, email: e.student_email }
            }
        }));

        res.json({
            enrollments: formattedEnrollments,
            allContent,
            allProgress
        });
    } catch (err) {
        console.error('[getFormationProgressDashboard]', err);
        res.status(500).json({ error: err.message });
    }
};

