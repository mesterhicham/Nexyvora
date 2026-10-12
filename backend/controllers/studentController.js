const db = require('../config/db');
const crypto = require('crypto');

// --- STUDENT RECORD ---
exports.getStudentRecord = async (req, res) => {
    try {
        const [students] = await db.execute(`
            SELECT 
                s.*, 
                p.full_name, 
                p.email, 
                c.name as cohort_name,
                sp.name as specialty_name,
                sp.id as specialty_id,
                pr.name as program_name,
                pr.id as program_id
            FROM students s 
            LEFT JOIN profiles p ON s.user_id = p.id 
            LEFT JOIN cohorts c ON s.cohort_id = c.id
            LEFT JOIN specialties sp ON c.specialty_id = sp.id
            LEFT JOIN programs pr ON sp.program_id = pr.id
            WHERE s.user_id = ?
        `, [req.user.id]);
        if (students.length === 0) return res.status(404).json({ error: 'Student record not found' });
        
        const row = students[0];
        res.json({
            id: row.id,
            user_id: row.user_id,
            cohort_id: row.cohort_id,
            enrollment_date: row.enrollment_date,
            status: row.status,
            created_at: row.created_at,
            profile: row.full_name ? {
                full_name: row.full_name,
                email: row.email
            } : null,
            cohort: row.cohort_name ? {
                name: row.cohort_name,
                specialty: row.specialty_name ? {
                    id: row.specialty_id,
                    name: row.specialty_name,
                    program: row.program_name ? {
                        id: row.program_id,
                        name: row.program_name
                    } : null
                } : null
            } : null
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- STUDENT LESSONS ---
exports.getStudentLessons = async (req, res) => {
    try {
        const [student] = await db.execute('SELECT cohort_id FROM students WHERE user_id = ?', [req.user.id]);
        if (student.length === 0 || !student[0].cohort_id) return res.json([]);

        const [lessons] = await db.execute(`
      SELECT l.*, m.name as module_name, m.code as module_code 
      FROM lessons l
      LEFT JOIN modules m ON l.module_id = m.id
      WHERE l.cohort_id = ?
      ORDER BY l.scheduled_date DESC
    `, [student[0].cohort_id]);
        res.json(lessons);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- STUDENT ASSIGNMENTS ---
exports.getStudentAssignments = async (req, res) => {
    try {
        const [student] = await db.execute('SELECT id, cohort_id FROM students WHERE user_id = ?', [req.user.id]);
        if (student.length === 0 || !student[0].cohort_id) return res.json([]);

        const studentId = student[0].id;

        const [assignments] = await db.execute(`
      SELECT a.*, m.name as module_name, 
      s.status as submission_status, s.grade as submission_grade, s.feedback as submission_feedback,
      s.submission_url, s.submitted_at
      FROM assignments a
      LEFT JOIN modules m ON a.module_id = m.id
      LEFT JOIN assignment_submissions s ON a.id = s.assignment_id AND s.student_id = ?
      WHERE a.cohort_id = ?
      ORDER BY a.due_date DESC
    `, [studentId, student[0].cohort_id]);
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- SUBMIT ASSIGNMENT ---
exports.submitAssignment = async (req, res) => {
    const { assignment_id, submission_url, submission_text } = req.body;
    try {
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
        if (student.length === 0) return res.status(404).json({ error: 'Student record not found' });

        const studentId = student[0].id;

        await db.execute(
            `INSERT INTO assignment_submissions (id, assignment_id, student_id, submission_url, submission_text, status, submitted_at) 
       VALUES (?, ?, ?, ?, ?, 'submitted', NOW()) 
       ON DUPLICATE KEY UPDATE submission_url = VALUES(submission_url), submission_text = VALUES(submission_text), status = 'submitted', submitted_at = NOW()`,
            [crypto.randomUUID(), assignment_id, studentId, submission_url, submission_text || '']
        );

        res.json({ message: 'Assignment submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- STUDENT ATTENDANCE ---
exports.getStudentAttendance = async (req, res) => {
    try {
        const [students] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
        if (students.length === 0) {
            return res.json({ records: [], stats: { present: 0, absent: 0, late: 0, total: 0 } });
        }

        const studentId = students[0].id;
        const [records] = await db.execute(`
            SELECT la.*,
                   l.id as lesson_id, l.title as lesson_title, l.scheduled_date as lesson_scheduled_date,
                   m.id as module_id, m.name as module_name
            FROM lesson_attendance la
            JOIN lessons l ON la.lesson_id = l.id
            LEFT JOIN modules m ON l.module_id = m.id
            WHERE la.student_id = ?
            ORDER BY la.marked_at DESC
        `, [studentId]);

        const formatted = records.map(r => ({
            id: r.id,
            student_id: r.student_id,
            lesson_id: r.lesson_id,
            status: r.status,
            marked_at: r.marked_at,
            notes: r.notes,
            lesson: {
                id: r.lesson_id,
                title: r.lesson_title,
                scheduled_date: r.lesson_scheduled_date,
                module: r.module_name ? { name: r.module_name } : null
            }
        }));

        const stats = {
            present: formatted.filter(r => r.status === 'present').length,
            absent: formatted.filter(r => r.status === 'absent').length,
            late: formatted.filter(r => r.status === 'late').length,
            total: formatted.length
        };

        res.json({ records: formatted, stats });
    } catch (err) {
        console.error('[getStudentAttendance]', err);
        res.status(500).json({ error: err.message });
    }
};

// --- SELECT PROGRAM / SPECIALTY ---
exports.selectProgram = async (req, res) => {
    const { programId, specialtyId } = req.body;
    if (!programId) return res.status(400).json({ error: 'programId is required' });

    try {
        const [students] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
        if (students.length === 0) return res.status(404).json({ error: 'Student record not found' });
        const studentId = students[0].id;

        const [existing] = await db.execute('SELECT id FROM student_test_results WHERE student_id = ?', [studentId]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Program already selected' });
        }

        const id = crypto.randomUUID();
        const answers = JSON.stringify([{ type: 'manual_selection', programId, specialtyId }]);

        await db.execute(`
            INSERT INTO student_test_results (id, student_id, answers, score, total_points, assigned_program_id, created_at)
            VALUES (?, ?, ?, 0, 0, ?, NOW())
        `, [id, studentId, answers, programId]);

        res.status(201).json({ success: true, message: 'Program selected successfully' });
    } catch (err) {
        console.error('[selectProgram]', err);
        res.status(500).json({ error: err.message });
    }
};

