const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { logAdminAction } = require('./auditLogService');

const IMPERSONATION_TTL = '1h';

class ImpersonationError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

/**
 * Issue a short-lived impersonation token for a non-admin user.
 * The token carries `impersonated_by` so sensitive actions can be blocked,
 * and every issuance is written to admin_audit_logs (refused if auditing fails).
 */
async function issueImpersonationToken(req, targetUserId) {
    if (req.user?.impersonated_by) {
        throw new ImpersonationError('لا يمكن بدء انتحال من داخل جلسة انتحال / Cannot impersonate from an impersonation session', 403);
    }

    const [users] = await db.query(
        `SELECT u.id, u.email, u.role, u.username, u.token_version, u.affiliate_code,
                ur.role AS ur_role,
                p.full_name, p.avatar_url, p.country, p.country_code, p.city, p.whatsapp_number
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN profiles p ON u.id = p.id
         WHERE u.id = ? LIMIT 1`,
        [targetUserId]
    );
    if (users.length === 0) {
        throw new ImpersonationError('User not found', 404);
    }

    const target = users[0];
    const liveRole = String(target.ur_role || target.role || 'student').trim().toLowerCase();
    if (target.id === req.user.id) {
        throw new ImpersonationError('Cannot impersonate yourself', 400);
    }
    if (liveRole === 'admin') {
        throw new ImpersonationError('لا يمكن انتحال حساب مدير / Admin accounts cannot be impersonated', 403);
    }

    const audited = await logAdminAction(req, 'impersonate_user', target.id, { target_email: target.email, role: liveRole });
    if (!audited) {
        throw new ImpersonationError('Audit log unavailable, impersonation refused', 503);
    }

    const token = jwt.sign(
        {
            id: target.id,
            email: target.email,
            role: liveRole,
            token_version: target.token_version || 1,
            impersonated_by: req.user.id,
        },
        process.env.JWT_SECRET,
        { expiresIn: IMPERSONATION_TTL }
    );

    const { ur_role, token_version, ...publicUser } = target;
    return { token, user: { ...publicUser, role: liveRole } };
}

module.exports = { issueImpersonationToken, ImpersonationError, IMPERSONATION_TTL };
