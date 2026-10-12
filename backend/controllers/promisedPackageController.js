const db = require('../config/db');
const crypto = require('crypto');

function genUuid() {
    return crypto.randomUUID();
}

/**
 * Get all promised package grants with summary statistics
 * GET /api/admin/promised-packages
 */
exports.getPromisedPackages = async (req, res) => {
    try {
        const { search, type, status } = req.query;

        let query = `
            SELECT 
                pp.id,
                pp.user_id,
                pp.package_id,
                pp.granted_by,
                pp.type,
                pp.type AS package_type,
                pp.status,
                pp.user_package_id,
                pp.notes,
                pp.granted_at,
                pp.revoked_at,
                pp.created_at,
                pp.updated_at,
                COALESCE(p_user.full_name, u.username, u.email) AS user_name,
                u.email AS user_email,
                COALESCE(p_user.whatsapp_number, p_user.phone, '') AS user_phone,
                u.role AS user_role,
                p.name AS package_name,
                p.name_ar AS package_name_ar,
                p.slug AS package_slug,
                p.price AS package_price,
                COALESCE(p.badge_text, '') AS badge_color,
                p.level AS package_level,
                COALESCE(p_admin.full_name, admin.username, admin.email, 'Admin') AS granted_by_name
            FROM promised_packages pp
            JOIN users u ON pp.user_id = u.id
            LEFT JOIN profiles p_user ON u.id = p_user.id
            JOIN packages p ON pp.package_id = p.id
            LEFT JOIN users admin ON pp.granted_by = admin.id
            LEFT JOIN profiles p_admin ON admin.id = p_admin.id
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            query += ` AND (p_user.full_name LIKE ? OR u.username LIKE ? OR u.email LIKE ? OR p.name LIKE ? OR p.name_ar LIKE ?)`;
            const s = `%${search}%`;
            params.push(s, s, s, s, s);
        }

        if (type && type !== 'all') {
            query += ` AND pp.type = ?`;
            params.push(type);
        }

        if (status && status !== 'all') {
            query += ` AND pp.status = ?`;
            params.push(status);
        }

        query += ` ORDER BY pp.created_at DESC`;

        const [grants] = await db.query(query, params);

        // Calculate statistics
        const [statsRows] = await db.query(`
            SELECT
                COUNT(*) AS total_grants,
                SUM(CASE WHEN type = 'marketing' THEN 1 ELSE 0 END) AS marketing_grants,
                SUM(CASE WHEN type = 'investment' THEN 1 ELSE 0 END) AS investment_grants,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_grants
            FROM promised_packages
        `);

        const stats = {
            total: statsRows[0]?.total_grants || 0,
            marketing: statsRows[0]?.marketing_grants || 0,
            investment: statsRows[0]?.investment_grants || 0,
            activated: statsRows[0]?.active_grants || 0
        };

        res.json({
            success: true,
            stats,
            grants
        });
    } catch (err) {
        console.error('[getPromisedPackages] Error:', err);
        res.status(500).json({ error: 'Failed to fetch promised packages: ' + err.message });
    }
};

/**
 * Grant a package to a user (Promised Package)
 * POST /api/admin/promised-packages/grant
 * Body: { user_id, package_id, package_type, notes }
 * 
 * Rules:
 * - amount_paid = 0.00
 * - is_promised = 1
 * - payment_method = 'promised_grant'
 * - NO upline commissions distributed
 * - Enrolls user in formations matching package level
 * - Activates affiliate account if needed
 */
exports.grantPackage = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { user_id, package_id, package_type = 'marketing', type, notes } = req.body;
        const granted_by = req.user?.id || 'admin';
        const grantType = type || package_type || 'marketing';

        if (!user_id || !package_id) {
            await connection.rollback();
            return res.status(400).json({ error: 'User and Package are required' });
        }

        // 1. Verify User exists
        const [users] = await connection.query(`
            SELECT u.id, u.email, u.username, COALESCE(p.full_name, u.username, u.email) AS name
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.id = ?
        `, [user_id]);
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'User not found' });
        }
        const targetUser = users[0];

        // 2. Verify Package exists
        const [packages] = await connection.query('SELECT * FROM packages WHERE id = ?', [package_id]);
        if (packages.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Package not found' });
        }
        const targetPackage = packages[0];

        // 3. Mark existing active package as not current
        await connection.query(
            'UPDATE user_packages SET is_current = 0 WHERE user_id = ? AND is_current = 1',
            [user_id]
        );

        const userPackageId = genUuid();
        const promisedPackageId = genUuid();

        // 4. Insert into user_packages with amount_paid = 0.00, is_promised = 1, is_current = 1
        await connection.query(`
            INSERT INTO user_packages (
                id, user_id, package_id, status, amount_paid, 
                payment_method, is_current, is_promised, notes, purchased_at
            ) VALUES (?, ?, ?, 'active', 0.00, 'promised_grant', 1, 1, ?, CURRENT_TIMESTAMP)
        `, [userPackageId, user_id, package_id, notes ? `Promised Package: ${notes}` : 'Promised Package Support Grant']);

        // 5. Insert into promised_packages table
        await connection.query(`
            INSERT INTO promised_packages (
                id, user_id, package_id, user_package_id, granted_by,
                type, status, notes, granted_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, CURRENT_TIMESTAMP)
        `, [promisedPackageId, user_id, package_id, userPackageId, granted_by, grantType, notes || null]);

        // 6. Ensure user affiliate account is active
        await connection.query(`
            UPDATE users 
            SET affiliate_status = 'active', affiliate_enabled = 1 
            WHERE id = ?
        `, [user_id]);

        // 7. Auto-enroll user in formations matching this package tier
        try {
            const [coursesToEnroll] = await connection.query(`
                SELECT DISTINCT pc.formation_id
                FROM package_courses pc
                JOIN packages p ON pc.package_id = p.id
                WHERE p.level <= ?
            `, [targetPackage.level]);

            for (const c of coursesToEnroll) {
                const [exists] = await connection.query(
                    'SELECT id FROM formation_enrollments WHERE student_id = ? AND formation_id = ?',
                    [user_id, c.formation_id]
                );
                if (exists.length === 0) {
                    await connection.query(`
                        INSERT INTO formation_enrollments (id, student_id, formation_id, payment_status, enrolled_at)
                        VALUES (?, ?, ?, 'approved', CURRENT_TIMESTAMP)
                    `, [genUuid(), user_id, c.formation_id]);
                }
            }
        } catch (formationErr) {
            console.warn('[grantPackage] Formation enroll skipped:', formationErr.message);
        }

        // 8. Send Notification to User
        try {
            const notifId = genUuid();
            const packNameDisplay = targetPackage.name_ar || targetPackage.name;
            const notifMsg = `تهانينا! تم منحك باقة ${packNameDisplay} كدعم قيادي خاص من الإدارة. يمكنك الآن الاستفادة من جميع دورات وميزات الباقة وتطوير فريقك.`;

            await connection.query(`
                INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
                VALUES (?, ?, 'system', 'منح باقة دعم خاصة', ?, 0, CURRENT_TIMESTAMP)
            `, [notifId, user_id, notifMsg]);
        } catch (notifErr) {
            console.warn('[grantPackage] Notification skipped:', notifErr.message);
        }

        // COMMIT TRANSACTION (Strictly zero commissions created and amount_paid = 0)
        await connection.commit();

        res.json({
            success: true,
            message: `Successfully granted ${targetPackage.name} to ${targetUser.name}`,
            grant_id: promisedPackageId,
            user_package_id: userPackageId
        });
    } catch (err) {
        await connection.rollback();
        console.error('[grantPackage] Error:', err);
        res.status(500).json({ error: 'Failed to grant package: ' + err.message });
    } finally {
        connection.release();
    }
};

/**
 * Revoke a promised package
 * PUT /api/admin/promised-packages/:id/revoke
 */
exports.revokePackage = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;

        const [grants] = await connection.query(
            'SELECT * FROM promised_packages WHERE id = ? FOR UPDATE',
            [id]
        );

        if (grants.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Promised package grant not found' });
        }

        const grant = grants[0];
        if (grant.status === 'revoked') {
            await connection.rollback();
            return res.status(400).json({ error: 'Package is already revoked' });
        }

        // Mark grant as revoked
        await connection.query(
            'UPDATE promised_packages SET status = "revoked", revoked_at = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );

        // Deactivate associated user_package if it was generated
        if (grant.user_package_id) {
            await connection.query(
                'UPDATE user_packages SET status = "expired", is_current = 0 WHERE id = ?',
                [grant.user_package_id]
            );
        }

        // Notify user
        try {
            const notifId = genUuid();
            await connection.query(`
                INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
                VALUES (?, ?, 'system', 'تحديث بشأن باقة الدعم', 'تم إلغاء تفعيل باقة الدعم الممنوحة لك من قبل الإدارة.', 0, CURRENT_TIMESTAMP)
            `, [notifId, grant.user_id]);
        } catch (notifErr) {
            console.warn('[revokePackage] Notification error:', notifErr.message);
        }

        await connection.commit();
        res.json({ success: true, message: 'Package successfully revoked' });
    } catch (err) {
        await connection.rollback();
        console.error('[revokePackage] Error:', err);
        res.status(500).json({ error: 'Failed to revoke package: ' + err.message });
    } finally {
        connection.release();
    }
};

/**
 * Delete a promised package record
 * DELETE /api/admin/promised-packages/:id
 */
exports.deletePromisedPackage = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const { id } = req.params;

        const [grants] = await connection.query('SELECT * FROM promised_packages WHERE id = ?', [id]);
        if (grants.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Grant record not found' });
        }

        const grant = grants[0];

        // Deactivate user_package if active
        if (grant.user_package_id) {
            await connection.query('DELETE FROM user_packages WHERE id = ?', [grant.user_package_id]);
        }

        // Delete from promised_packages
        await connection.query('DELETE FROM promised_packages WHERE id = ?', [id]);

        await connection.commit();
        res.json({ success: true, message: 'Record deleted successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('[deletePromisedPackage] Error:', err);
        res.status(500).json({ error: 'Failed to delete record: ' + err.message });
    } finally {
        connection.release();
    }
};
