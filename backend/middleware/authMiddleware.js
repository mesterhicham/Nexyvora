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
            'SELECT id, role, status, token_version FROM users WHERE id = ?',
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

        // Attach live user info to request
        req.user = {
            ...decoded,
            role: user.role || decoded.role,
            status: user.status
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
            'SELECT id, role, status, token_version FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length > 0 && users[0].status !== 'suspended' && users[0].status !== 'banned') {
            const user = users[0];
            const userTokenVersion = user.token_version || 1;
            if (decoded.token_version !== undefined && decoded.token_version !== null && Number(decoded.token_version) === Number(userTokenVersion)) {
                req.user = {
                    ...decoded,
                    role: user.role || decoded.role,
                    status: user.status
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
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Access denied: insufficient permissions' });
        }
        next();
    };
};

module.exports = { auth, authorize, optionalAuth };

