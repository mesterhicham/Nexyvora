const db = require('../config/db');

/**
 * Middleware ensuring teacher account has been approved by admin
 */
const requireApprovedTeacher = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Admins have full access
    if (req.user.role === 'admin') {
        return next();
    }

    if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Access denied: Teacher role required.' });
    }

    try {
        const [rows] = await db.query('SELECT status FROM teachers WHERE user_id = ?', [req.user.id]);
        const teacherStatus = (rows[0]?.status || '').toLowerCase().trim();
        
        // Accept both 'active' and 'approved' as valid working teacher statuses
        if (rows.length === 0 || (teacherStatus !== 'approved' && teacherStatus !== 'active')) {
            const currentStatus = rows[0]?.status || 'pending';
            return res.status(403).json({ 
                error: `حساب الأستاذ في حالة (${currentStatus}) وغير معتمد بعد من قِبل الإدارة / Teacher account is ${currentStatus} and pending administrator approval.`,
                code: 'TEACHER_APPROVAL_REQUIRED'
            });
        }

        next();
    } catch (err) {
        console.error('[requireApprovedTeacher] Error:', err.message);
        res.status(500).json({ error: 'Failed to verify teacher approval status.' });
    }
};

module.exports = { requireApprovedTeacher };
