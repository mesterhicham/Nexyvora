const crypto = require('crypto');
const db = require('../config/db');

/**
 * Record a sensitive admin action in admin_audit_logs.
 * Returns false instead of throwing so callers can decide whether auditing is mandatory.
 */
async function logAdminAction(req, action, targetUserId = null, details = null) {
    try {
        await db.query(
            `INSERT INTO admin_audit_logs (id, admin_id, action, target_user_id, ip_address, user_agent, details)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                crypto.randomUUID(),
                req.user?.impersonated_by || req.user?.id,
                action,
                targetUserId,
                String(req.ip || '').substring(0, 64),
                String(req.headers?.['user-agent'] || '').substring(0, 255),
                details ? JSON.stringify(details) : null,
            ]
        );
        return true;
    } catch (err) {
        console.error(`[AUDIT] Failed to record admin action "${action}":`, err.message);
        return false;
    }
}

module.exports = { logAdminAction };
