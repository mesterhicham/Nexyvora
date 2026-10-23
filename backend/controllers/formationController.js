const db = require('../config/db');
const crypto = require('crypto');

// --- FORMATIONS ---
exports.getAllFormations = async (req, res) => {
    try {
        const [formations] = await db.query(`
            SELECT f.*, 
                   p.name AS package_name, 
                   p.name_ar AS package_name_ar, 
                   p.level AS package_level, 
                   p.price AS package_price
            FROM formations f
            LEFT JOIN packages p ON f.package_id = p.id
            ORDER BY f.created_at DESC
        `);
        res.json(formations);
    } catch (err) {
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
                   p.price AS package_price
            FROM formations f
            LEFT JOIN packages p ON f.package_id = p.id
            WHERE f.is_published = 1
            ORDER BY f.created_at DESC
        `);
        res.json(formations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createFormation = async (req, res) => {
    const { title, description, price, currency, is_published, thumbnail_url, package_id } = req.body;
    const id = crypto.randomUUID();
    const created_by = req.user ? req.user.id : null;
    const cleanPackageId = (package_id && package_id !== 'none' && package_id !== 'null') ? package_id : null;
    const finalPrice = cleanPackageId ? 0 : (Number(price) || 0);

    try {
        await db.query(
            'INSERT INTO formations (id, title, description, price, currency, is_published, thumbnail_url, package_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, title, description, finalPrice, currency || 'USD', is_published ? 1 : 0, thumbnail_url || null, cleanPackageId, created_by]
        );

        if (cleanPackageId) {
            await db.query(
                'INSERT IGNORE INTO package_courses (id, package_id, formation_id) VALUES (?, ?, ?)',
                [crypto.randomUUID(), cleanPackageId, id]
            );
        }

        res.status(201).json({ id, title, description, price: finalPrice, currency: currency || 'USD', is_published, thumbnail_url, package_id: cleanPackageId });
    } catch (err) {
        console.error('[createFormation error]:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateFormation = async (req, res) => {
    const { id } = req.params;
    const { title, description, price, currency, is_published, thumbnail_url, package_id } = req.body;
    const cleanPackageId = (package_id !== undefined) ? ((package_id && package_id !== 'none' && package_id !== 'null') ? package_id : null) : undefined;
    const finalPrice = (cleanPackageId !== undefined && cleanPackageId !== null) ? 0 : (Number(price) || 0);

    try {
        let updateQuery = 'UPDATE formations SET title = ?, description = ?, price = ?, currency = ?, is_published = ?, thumbnail_url = ?';
        const params = [title, description, finalPrice, currency || 'USD', is_published ? 1 : 0, thumbnail_url || null];

        if (cleanPackageId !== undefined) {
            updateQuery += ', package_id = ?';
            params.push(cleanPackageId);
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

        res.json({ id, title, description, price: finalPrice, currency: currency || 'USD', is_published, thumbnail_url, package_id: cleanPackageId });
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
            SELECT 
                fe.*, 
                f.title as formation_title, 
                f.thumbnail_url,
                COALESCE((SELECT COUNT(*) FROM formation_content fc WHERE fc.formation_id = fe.formation_id), 0) as total_contents,
                COALESCE((
                    SELECT COUNT(*) 
                    FROM formation_progress fp 
                    JOIN formation_content fc ON fp.content_id = fc.id 
                    WHERE fp.enrollment_id = fe.id AND fp.completed = 1 AND fc.formation_id = fe.formation_id
                ), 0) as completed_contents
            FROM formation_enrollments fe
            JOIN formations f ON fe.formation_id = f.id
            WHERE fe.student_id = ?
        `, [student[0].id]);

        const enriched = enrollments.map(e => {
            const total = Number(e.total_contents) || 0;
            const completed = Number(e.completed_contents) || 0;
            const isCompleted = total > 0 && completed >= total;
            const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
            return {
                ...e,
                total_contents: total,
                completed_contents: completed,
                is_completed: isCompleted,
                progress_percent: percent
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
