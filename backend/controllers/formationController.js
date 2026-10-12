const db = require('../config/db');
const crypto = require('crypto');

// --- FORMATIONS ---
exports.getAllFormations = async (req, res) => {
    try {
        const [formations] = await db.execute('SELECT * FROM formations ORDER BY created_at DESC');
        res.json(formations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPublishedFormations = async (req, res) => {
    try {
        const [formations] = await db.execute('SELECT * FROM formations WHERE is_published = 1 ORDER BY created_at DESC');
        res.json(formations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createFormation = async (req, res) => {
    const { title, description, price, currency, is_published, thumbnail_url } = req.body;
    const id = crypto.randomUUID();
    const created_by = req.user.id;
    try {
        await db.execute(
            'INSERT INTO formations (id, title, description, price, currency, is_published, thumbnail_url, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, price, currency, is_published ? 1 : 0, thumbnail_url, created_by]
        );
        res.status(201).json({ id, title, description, price, currency, is_published, thumbnail_url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateFormation = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, currency, is_published, thumbnail_url } = req.body;
    try {
        await db.execute(
            'UPDATE formations SET title = ?, description = ?, price = ?, currency = ?, is_published = ?, thumbnail_url = ?, updated_at = NOW() WHERE id = ?',
            [title, description, price, currency, is_published ? 1 : 0, thumbnail_url, id]
        );
        res.json({ id, title, description, price, currency, is_published, thumbnail_url });
    } catch (err) {
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
exports.getFormationContent = async (req, res) => {
    const { id } = req.params;
    try {
        const [content] = await db.execute('SELECT * FROM formation_content WHERE formation_id = ? ORDER BY order_index ASC', [id]);
        res.json(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addFormationContent = async (req, res) => {
    const { formation_id, title, content_type, file_url, duration_seconds, order_index, quiz_id } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO formation_content (id, formation_id, title, content_type, file_url, duration_seconds, order_index, quiz_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id, formation_id, title, content_type, file_url, duration_seconds, order_index, quiz_id]
        );
        res.status(201).json({ id, formation_id, title, content_type, file_url, duration_seconds, order_index, quiz_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateFormationContent = async (req, res) => {
    const { id } = req.params;
    const { title, content_type, file_url, duration_seconds, order_index, quiz_id } = req.body;
    try {
        await db.execute(
            'UPDATE formation_content SET title = ?, content_type = ?, file_url = ?, duration_seconds = ?, order_index = ?, quiz_id = ? WHERE id = ?',
            [title, content_type, file_url, duration_seconds, order_index, quiz_id, id]
        );
        res.json({ id, title, content_type, file_url, duration_seconds, order_index, quiz_id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFormationContent = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM formation_content WHERE id = ?', [id]);
        res.json({ message: 'Content deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.reorderContent = async (req, res) => {
    const { items } = req.body;
    try {
        for (const item of items) {
            await db.execute('UPDATE formation_content SET order_index = ? WHERE id = ?', [item.order_index, item.id]);
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
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ?', [userId]);
        if (student.length === 0) return res.json([]);
        
        const [enrollments] = await db.execute(`
            SELECT fe.*, f.title as formation_title, f.thumbnail_url
            FROM formation_enrollments fe
            JOIN formations f ON fe.formation_id = f.id
            WHERE fe.student_id = ?
        `, [student[0].id]);
        res.json(enrollments);
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
        const [progress] = await db.execute('SELECT * FROM formation_progress WHERE enrollment_id = ?', [enrollmentId]);
        res.json(progress);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStudentProgress = async (req, res) => {
    const { enrollmentId, contentId, watchedSeconds, completed } = req.body;
    try {
        const [existing] = await db.execute(
            'SELECT id FROM formation_progress WHERE enrollment_id = ? AND content_id = ?',
            [enrollmentId, contentId]
        );

        if (existing.length > 0) {
            await db.execute(
                'UPDATE formation_progress SET watched_seconds = ?, completed = ?, updated_at = NOW() WHERE enrollment_id = ? AND content_id = ?',
                [watchedSeconds, completed ? 1 : 0, enrollmentId, contentId]
            );
        } else {
            const id = crypto.randomUUID();
            await db.execute(
                'INSERT INTO formation_progress (id, enrollment_id, content_id, watched_seconds, completed) VALUES (?, ?, ?, ?, ?)',
                [id, enrollmentId, contentId, watchedSeconds, completed ? 1 : 0]
            );
        }
        res.json({ message: 'Progress updated' });
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
