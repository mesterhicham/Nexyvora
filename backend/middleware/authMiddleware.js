const jwt = require('jsonwebtoken');
const db = require('../config/db');

const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verify user existence, status, and token_version against live database
        const [users] = await db.query(
            `SELECT u.id, u.role, u.status, u.token_version, ur.role AS ur_role 
             FROM users u 
             LEFT JOIN user_roles ur ON u.id = ur.user_id 
             WHERE u.id = ? LIMIT 1`,
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'الحساب غير موجود / User account not found' });
        }

        const user = users[0];

        if (user.status === 'suspended' || user.status === 'banned') {
            return res.status(403).json({ error: 'تم تعليق هذا الحساب. يرجى الاتصال بالإدارة / Account is suspended or banned' });
        }

        // Strict token_version check: must be explicitly present in decoded payload
        if (decoded.token_version === undefined || decoded.token_version === null) {
            return res.status(401).json({
                error: 'رمز الجلسة قديم أو غير مكتمل المواصفات الأمنية، يرجى إعادة تسجيل الدخول / Token missing version identifier, please re-authenticate',
                code: 'TOKEN_VERSION_MISSING'
            });
        }

        const userTokenVersion = user.token_version || 1;
        if (Number(decoded.token_version) !== Number(userTokenVersion)) {
            return res.status(401).json({
                error: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً / Session revoked, please log in again',
                code: 'SESSION_REVOKED'
            });
        }

        // Live role derived strictly from the database (user_roles prioritized, then users.role, default 'student')
        // CRITICAL: Under no circumstances trust or fallback to decoded.role from user's JWT
        const liveRole = (user.ur_role || user.role || 'student').trim().toLowerCase();

        // Attach live user info to request
        req.user = {
            id: user.id,
            email: decoded.email,
            role: liveRole,
            status: user.status,
            token_version: user.token_version
        };

        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

const optionalAuth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await db.query(
            `SELECT u.id, u.role, u.status, u.token_version, ur.role AS ur_role 
             FROM users u 
             LEFT JOIN user_roles ur ON u.id = ur.user_id 
             WHERE u.id = ? LIMIT 1`,
            [decoded.id]
        );

        if (users.length > 0 && users[0].status !== 'suspended' && users[0].status !== 'banned') {
            const user = users[0];
            const userTokenVersion = user.token_version || 1;
            if (decoded.token_version !== undefined && decoded.token_version !== null && Number(decoded.token_version) === Number(userTokenVersion)) {
                const liveRole = (user.ur_role || user.role || 'student').trim().toLowerCase();
                req.user = {
                    id: user.id,
                    email: decoded.email,
                    role: liveRole,
                    status: user.status,
                    token_version: user.token_version
                };
            }
        }
    } catch (err) {
        // Invalid or expired token; proceed without req.user
    }
    next();
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: insufficient permissions' });
        }
        next();
    };
};

module.exports = { auth, authorize, optionalAuth };

