const db = require('../config/db');
const crypto = require('crypto');

// --- PROGRAM PRICING ---
exports.getProgramPricing = async (req, res) => {
    try {
        const [pricing] = await db.execute(`
      SELECT pp.*, p.name as program_name, p.duration, p.description 
      FROM program_pricing pp
      JOIN programs p ON pp.program_id = p.id
    `);
        res.json(pricing);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.upsertPricing = async (req, res) => {
    const { program_id, price, currency, is_active } = req.body;
    try {
        await db.execute(
            `INSERT INTO program_pricing (id, program_id, price, currency, is_active, updated_at) 
       VALUES (?, ?, ?, ?, ?, NOW()) 
       ON DUPLICATE KEY UPDATE price = VALUES(price), currency = VALUES(currency), is_active = VALUES(is_active), updated_at = NOW()`,
            [crypto.randomUUID(), program_id, price, currency || 'USD', is_active ? 1 : 0]
        );
        res.json({ program_id, price, currency, is_active });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- PAYMENTS ---
exports.getStudentPayments = async (req, res) => {
    try {
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ? OR id = ?', [req.user.id, req.user.id]);
        if (student.length === 0) return res.json([]);

        const [payments] = await db.execute(`
      SELECT py.*, p.name as program_name 
      FROM payments py
      LEFT JOIN programs p ON py.program_id = p.id
      WHERE py.student_id = ?
      ORDER BY py.created_at DESC
    `, [student[0].id]);
        res.json(payments);
    } catch (err) {
        console.error('[getStudentPayments error]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAllPayments = async (req, res) => {
    try {
        const [payments] = await db.execute(`
      SELECT 
        py.*, 
        p.name as program_name, 
        COALESCE(pr.full_name, u.email, 'Student') as full_name, 
        COALESCE(pr.email, u.email) as email 
      FROM payments py
      LEFT JOIN programs p ON py.program_id = p.id
      LEFT JOIN students s ON py.student_id = s.id
      LEFT JOIN profiles pr ON s.user_id = pr.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY py.created_at DESC
    `);
        res.json(payments);
    } catch (err) {
        console.error('[getAllPayments error]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.submitPayment = async (req, res) => {
    const { programId, amount, referenceNumber, notes, receiptUrl } = req.body;
    try {
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ? OR id = ?', [req.user.id, req.user.id]);
        let studentId;
        if (student.length === 0) {
            studentId = crypto.randomUUID();
            await db.execute(
                'INSERT INTO students (id, user_id, status, enrollment_date) VALUES (?, ?, ?, NOW())',
                [studentId, req.user.id, 'active']
            );
        } else {
            studentId = student[0].id;
        }

        let validProgramId = null;
        if (programId) {
            const [progRows] = await db.execute('SELECT id FROM programs WHERE id = ?', [programId]);
            if (progRows.length > 0) {
                validProgramId = progRows[0].id;
            }
        }
        if (!validProgramId) {
            const [firstProg] = await db.execute('SELECT id FROM programs LIMIT 1');
            if (firstProg.length > 0) {
                validProgramId = firstProg[0].id;
            }
        }

        const id = crypto.randomUUID();
        await db.execute(
            'INSERT INTO payments (id, student_id, program_id, amount, payment_method, reference_number, notes, receipt_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, studentId, validProgramId, amount, 'manual', referenceNumber || '', notes || '', receiptUrl || '', 'pending']
        );
        res.status(201).json({ id, status: 'pending' });
    } catch (err) {
        console.error('[submitPayment error]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updatePaymentStatus = async (req, res) => {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    try {
        await db.execute(
            'UPDATE payments SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW() WHERE id = ?',
            [status, adminNotes || '', req.user.id, id]
        );
        res.json({ id, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
