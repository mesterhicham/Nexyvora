const db = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- PLATFORM SETTINGS ---
exports.getSettings = async (req, res) => {
    try {
        const [settings] = await db.execute('SELECT * FROM platform_settings');
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSetting = async (req, res) => {
    const { key, value } = req.body;
    try {
        const id = crypto.randomUUID();
        await db.execute(
            'INSERT INTO platform_settings (id, `key`, `value`, updated_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()',
            [id, key, value]
        );
        res.json({ key, value });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- HOLIDAYS ---
exports.getHolidays = async (req, res) => {
    try {
        const [holidays] = await db.execute('SELECT * FROM holidays ORDER BY start_date ASC');
        res.json(holidays);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createHoliday = async (req, res) => {
    const { name, description, start_date, end_date, type, is_recurring } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO holidays (id, name, description, start_date, end_date, type, is_recurring) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, name, description || '', start_date, end_date, type, is_recurring ? 1 : 0]
        );
        res.status(201).json({ id, name, description, start_date, end_date, type, is_recurring });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateHoliday = async (req, res) => {
    const { id } = req.params;
    const { name, description, start_date, end_date, type, is_recurring } = req.body;
    try {
        await db.execute(
            'UPDATE holidays SET name = ?, description = ?, start_date = ?, end_date = ?, type = ?, is_recurring = ?, updated_at = NOW() WHERE id = ?',
            [name, description, start_date, end_date, type, is_recurring ? 1 : 0, id]
        );
        res.json({ id, name, description, start_date, end_date, type, is_recurring });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteHoliday = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM holidays WHERE id = ?', [id]);
        res.json({ message: 'Holiday deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- NEWS & CONTENT CENTER ---
exports.getNews = async (req, res) => {
    try {
        const isAdmin = req.user && req.user.role === 'admin';
        const userRole = req.user ? req.user.role : 'all';
        const { type, featured } = req.query;

        let query = `
            SELECT n.*, 
                   COALESCE(p.full_name, u.email, 'Nextvora Admin') as author_name
            FROM news n
            LEFT JOIN users u ON n.author_id = u.id
            LEFT JOIN profiles p ON n.author_id = p.id
        `;
        const conditions = [];
        const params = [];

        if (!isAdmin) {
            conditions.push('(n.is_published = 1)');
            conditions.push('(n.target_audience = "all" OR n.target_audience = ?)');
            params.push(userRole);
            conditions.push('(n.expires_at IS NULL OR n.expires_at > NOW())');
        }

        if (type && type !== 'all') {
            conditions.push('n.type = ?');
            params.push(type);
        }

        if (featured === 'true' || featured === '1') {
            conditions.push('n.is_featured = 1');
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY n.is_featured DESC, n.created_at DESC';

        const [news] = await db.execute(query, params);
        res.json(news);
    } catch (err) {
        console.error('[getNews error]:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.createNews = async (req, res) => {
    const { 
        title, 
        content, 
        type, 
        priority, 
        target_audience, 
        is_published, 
        expires_at,
        media_url,
        media_name,
        media_size,
        media_type,
        is_featured
    } = req.body;
    const id = crypto.randomUUID();
    const authorId = req.user ? req.user.id : null;
    try {
        await db.execute(
            `INSERT INTO news (
                id, title, content, type, priority, target_audience, 
                is_published, expires_at, author_id,
                media_url, media_name, media_size, media_type, is_featured
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, 
                title, 
                content, 
                type || 'news', 
                priority || 'normal', 
                target_audience || 'all', 
                is_published ? 1 : 0, 
                expires_at || null,
                authorId,
                media_url || null,
                media_name || null,
                media_size || null,
                media_type || null,
                is_featured ? 1 : 0
            ]
        );
        res.status(201).json({ 
            id, 
            title, 
            content, 
            type: type || 'news', 
            priority: priority || 'normal', 
            target_audience: target_audience || 'all', 
            is_published: !!is_published, 
            expires_at,
            media_url,
            media_name,
            media_size,
            media_type,
            is_featured: !!is_featured,
            views_count: 0
        });
    } catch (err) {
        console.error('[createNews error]:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateNews = async (req, res) => {
    const { id } = req.params;
    const { 
        title, 
        content, 
        type, 
        priority, 
        target_audience, 
        is_published, 
        expires_at,
        media_url,
        media_name,
        media_size,
        media_type,
        is_featured
    } = req.body;
    try {
        await db.execute(
            `UPDATE news SET 
                title = ?, 
                content = ?, 
                type = ?, 
                priority = ?, 
                target_audience = ?, 
                is_published = ?, 
                expires_at = ?,
                media_url = ?,
                media_name = ?,
                media_size = ?,
                media_type = ?,
                is_featured = ?,
                updated_at = NOW() 
            WHERE id = ?`,
            [
                title, 
                content, 
                type, 
                priority, 
                target_audience, 
                is_published ? 1 : 0, 
                expires_at || null,
                media_url || null,
                media_name || null,
                media_size || null,
                media_type || null,
                is_featured ? 1 : 0,
                id
            ]
        );
        res.json({ 
            id, 
            title, 
            content, 
            type, 
            priority, 
            target_audience, 
            is_published: !!is_published, 
            expires_at,
            media_url,
            media_name,
            media_size,
            media_type,
            is_featured: !!is_featured
        });
    } catch (err) {
        console.error('[updateNews error]:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.recordNewsView = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('UPDATE news SET views_count = views_count + 1 WHERE id = ?', [id]);
        res.json({ success: true, id });
    } catch (err) {
        console.error('[recordNewsView error]:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteNews = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM news WHERE id = ?', [id]);
        res.json({ message: 'News deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- USERS MANAGEMENT ---
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                u.id, 
                u.email, 
                COALESCE(u.username, SUBSTRING_INDEX(u.email, '@', 1)) AS username,
                COALESCE(u.status, 'active') AS status,
                COALESCE(r.role, u.role, 'student') AS role,
                u.affiliate_code,
                u.affiliate_enabled,
                u.wallet_pin,
                u.created_at,
                p.full_name,
                p.city,
                p.country,
                COALESCE(p.whatsapp_number, p.phone, '') AS phone,
                p.avatar_url,
                -- Sponsor
                sp.id AS sponsor_id,
                COALESCE(spp.full_name, sp.email) AS sponsor_name,
                COALESCE(sp.username, SUBSTRING_INDEX(sp.email, '@', 1)) AS sponsor_username,
                -- Package
                pkg.id AS package_id,
                COALESCE(pkg.name_ar, pkg.name, 'No Package') AS package_name,
                pkg.level AS package_level,
                -- Wallet
                COALESCE(w.balance, 0) AS wallet_balance,
                COALESCE(w.total_earned, 0) AS total_profit,
                COALESCE(w.pending_balance, 0) AS pending_balance
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            LEFT JOIN user_roles r ON u.id = r.user_id
            LEFT JOIN users sp ON u.referrer_id = sp.id
            LEFT JOIN profiles spp ON sp.id = spp.id
            LEFT JOIN user_packages up ON (u.id = up.user_id AND up.is_current = 1 AND up.status = 'active')
            LEFT JOIN packages pkg ON up.package_id = pkg.id
            LEFT JOIN user_wallets w ON u.id = w.user_id
            WHERE (u.role IS NULL OR u.role != 'teacher')
              AND (r.role IS NULL OR r.role != 'teacher')
              AND u.id NOT IN (SELECT user_id FROM teachers WHERE user_id IS NOT NULL)
            ORDER BY u.created_at DESC
        `);

        // Filter out any teacher role as a safety check
        const nonTeacherRows = rows.filter(r => r.role !== 'teacher');

        const users = nonTeacherRows.map((r, idx) => {
            const isAdmin = r.role === 'admin';
            const hasPackage = Boolean(r.package_id);
            const isPartner = !isAdmin && (hasPackage || r.role === 'affiliate' || r.role === 'marketer');
            const accountRole = isAdmin ? 'ADMIN' : (isPartner ? 'BUSINESS PARTNER' : 'STUDENT');

            return {
                id: r.id,
                email: r.email,
                username: r.username,
                full_name: r.full_name || r.username,
                role: r.role,
                account_role: accountRole,
                status: r.status || 'active',
                phone: r.phone || '',
                city: r.city || '',
                country: r.country || '',
                affiliate_code: r.affiliate_code || '',
                wallet_pin: r.wallet_pin || '',
                created_at: r.created_at,
                avatar_url: r.avatar_url,
                display_id: `#${100 + nonTeacherRows.length - idx}`,
                sponsor: r.sponsor_id ? {
                    id: r.sponsor_id,
                    name: r.sponsor_name,
                    username: r.sponsor_username
                } : null,
                package: {
                    id: r.package_id || null,
                    name: r.package_name,
                    level: r.package_level || 0
                },
                wallet: {
                    balance: Number(r.wallet_balance || 0),
                    profit: Number(r.total_profit || 0),
                    pending: Number(r.pending_balance || 0)
                }
            };
        });

        const stats = {
            all: users.length,
            business_partners: users.filter(u => u.account_role === 'BUSINESS PARTNER').length,
            students: users.filter(u => u.account_role === 'STUDENT').length,
            admins: users.filter(u => u.account_role === 'ADMIN').length
        };

        res.json({ users, stats });
    } catch (err) {
        console.error('[getAllUsers]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, username, password, wallet_pin, package_id, status, role } = req.body;

    try {
        const updates = [];
        const params = [];

        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        if (username) {
            updates.push('username = ?');
            params.push(username);
        }
        if (password && password.trim().length > 0) {
            const hash = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            params.push(hash);
        }
        if (wallet_pin !== undefined) {
            updates.push('wallet_pin = ?');
            params.push(wallet_pin);
        }
        if (status) {
            updates.push('status = ?');
            params.push(status);
        }
        if (role) {
            updates.push('role = ?');
            params.push(role);
        }

        if (updates.length > 0) {
            params.push(id);
            await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
        }

        if (email) {
            await db.query('UPDATE profiles SET email = ? WHERE id = ?', [email, id]);
        }

        // Package management
        if (package_id !== undefined) {
            if (!package_id || package_id === 'none') {
                await db.query('UPDATE user_packages SET is_current = 0, status = "cancelled" WHERE user_id = ? AND is_current = 1', [id]);
            } else {
                const [pkgs] = await db.query('SELECT * FROM packages WHERE id = ?', [package_id]);
                if (pkgs.length > 0) {
                    const pkg = pkgs[0];
                    await db.query('UPDATE user_packages SET is_current = 0 WHERE user_id = ? AND is_current = 1', [id]);
                    await db.query(`
                        INSERT INTO user_packages (id, user_id, package_id, amount_paid, payment_method, status, is_current, purchased_at)
                        VALUES (?, ?, ?, ?, 'admin_grant', 'active', 1, NOW())
                    `, [crypto.randomUUID(), id, pkg.id, pkg.price]);
                }
            }
        }

        res.json({ message: 'User updated successfully' });
    } catch (err) {
        console.error('[updateUser]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.impersonateUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [users] = await db.query(
            `SELECT u.id, u.email, u.role, u.username, u.affiliate_code, p.full_name, p.avatar_url 
             FROM users u 
             LEFT JOIN profiles p ON u.id = p.id 
             WHERE u.id = ?`, 
            [id]
        );
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        const user = users[0];
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token, user, message: 'Impersonation token generated' });
    } catch (err) {
        console.error('[impersonateUser]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateUserRole = async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ error: 'Valid role is required (admin, teacher, student)' });
    }

    try {
        // Update users table
        await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, id]);

        // Upsert user_roles
        const [existingRole] = await db.execute('SELECT id FROM user_roles WHERE user_id = ?', [id]);
        if (existingRole.length > 0) {
            await db.execute('UPDATE user_roles SET role = ? WHERE user_id = ?', [role, id]);
        } else {
            await db.execute(
                'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
                [crypto.randomUUID(), id, role]
            );
        }

        // Ensure teacher/student records exist
        if (role === 'teacher') {
            const [t] = await db.execute('SELECT id FROM teachers WHERE user_id = ?', [id]);
            if (t.length === 0) {
                await db.execute(
                    'INSERT INTO teachers (id, user_id, status) VALUES (?, ?, ?)',
                    [crypto.randomUUID(), id, 'approved']
                );
            }
        } else if (role === 'student') {
            const [s] = await db.execute('SELECT id FROM students WHERE user_id = ?', [id]);
            if (s.length === 0) {
                await db.execute(
                    'INSERT INTO students (id, user_id, status) VALUES (?, ?, ?)',
                    [crypto.randomUUID(), id, 'active']
                );
            }
        }

        res.json({ message: 'User role updated successfully', role });
    } catch (err) {
        console.error('[updateUserRole]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    if (id === req.user.id) {
        return res.status(400).json({ error: 'You cannot delete your own admin account.' });
    }

    try {
        await db.execute('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('[deleteUser]', err);
        res.status(500).json({ error: err.message });
    }
};

// --- PAYMENT ACCOUNT SETTINGS ---
exports.getPaymentAccountSettings = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT value FROM platform_settings WHERE `key` = 'payment_account_settings' LIMIT 1");
        if (rows.length === 0 || !rows[0].value) {
            return res.json(null);
        }
        let data = rows[0].value;
        if (typeof data === 'string') {
            try { data = JSON.parse(data); } catch (e) {}
        }
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.savePaymentAccountSettings = async (req, res) => {
    const settings = req.body;
    try {
        const valStr = JSON.stringify(settings);
        const [existing] = await db.execute("SELECT id FROM platform_settings WHERE `key` = 'payment_account_settings'");
        if (existing.length > 0) {
            await db.execute(
                "UPDATE platform_settings SET value = ?, updated_at = NOW() WHERE `key` = 'payment_account_settings'",
                [valStr]
            );
        } else {
            await db.execute(
                "INSERT INTO platform_settings (id, `key`, value, type, category) VALUES (?, 'payment_account_settings', ?, 'json', 'payment')",
                [crypto.randomUUID(), valStr]
            );
        }
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- ZOOM MEETINGS HELPERS ---
exports.getTeacherMeetings = async (req, res) => {
    try {
        const [meetings] = await db.execute(`
            SELECT zm.*, c.name as cohort_name, m.name as module_name, p.full_name as host_name, p.email as host_email
            FROM zoom_meetings zm
            LEFT JOIN cohorts c ON zm.cohort_id = c.id
            LEFT JOIN modules m ON zm.module_id = m.id
            LEFT JOIN profiles p ON zm.host_id = p.id
            WHERE zm.host_id = ?
            ORDER BY zm.scheduled_at DESC
        `, [req.user.id]);

        const formatted = meetings.map(m => ({
            ...m,
            cohort: m.cohort_name ? { id: m.cohort_id, name: m.cohort_name } : null,
            module: m.module_name ? { id: m.module_id, name: m.module_name } : null,
            host: { full_name: m.host_name, email: m.host_email }
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentMeetings = async (req, res) => {
    try {
        const [st] = await db.execute('SELECT cohort_id FROM students WHERE user_id = ?', [req.user.id]);
        if (st.length === 0 || !st[0].cohort_id) return res.json([]);

        const [meetings] = await db.execute(`
            SELECT zm.*, c.name as cohort_name, m.name as module_name, p.full_name as host_name, p.email as host_email
            FROM zoom_meetings zm
            LEFT JOIN cohorts c ON zm.cohort_id = c.id
            LEFT JOIN modules m ON zm.module_id = m.id
            LEFT JOIN profiles p ON zm.host_id = p.id
            WHERE zm.cohort_id = ?
            ORDER BY zm.scheduled_at DESC
        `, [st[0].cohort_id]);

        const formatted = meetings.map(m => ({
            ...m,
            cohort: m.cohort_name ? { id: m.cohort_id, name: m.cohort_name } : null,
            module: m.module_name ? { id: m.module_id, name: m.module_name } : null,
            host: { full_name: m.host_name, email: m.host_email }
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleRoomOpen = async (req, res) => {
    const { id } = req.params;
    const { room_open } = req.body;
    try {
        await db.execute(`
            UPDATE zoom_meetings 
            SET room_open = ?, room_opened_at = IF(?, NOW(), NULL), updated_at = NOW() 
            WHERE id = ?
        `, [room_open ? 1 : 0, room_open ? 1 : 0, id]);
        res.json({ success: true, room_open });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

