const db = require('../config/db');
const crypto = require('crypto');

/**
 * Get all challenges for Admin
 */
exports.getAdminChallenges = async (req, res) => {
    try {
        const [challenges] = await db.query(`
            SELECT * FROM challenges 
            ORDER BY created_at DESC
        `);

        // Compute summary KPIs
        const total = challenges.length;
        const active = challenges.filter(c => c.status === 'active').length;
        const completed = challenges.filter(c => c.status === 'completed' || new Date(c.end_date) < new Date()).length;
        const totalRewardPool = challenges.reduce((sum, c) => sum + Number(c.reward_amount || 0), 0);

        res.json({
            challenges,
            stats: {
                total,
                active,
                completed,
                totalRewardPool
            }
        });
    } catch (err) {
        console.error('[getAdminChallenges]', err);
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
};

/**
 * Create a new challenge campaign
 */
exports.createChallenge = async (req, res) => {
    try {
        const {
            title,
            title_ar,
            description,
            description_ar,
            image_url,
            target_sales = 0,
            target_revenue = 0,
            reward_type = 'CASH',
            reward_amount = 0,
            reward_title,
            reward_title_ar,
            leg_limit_percent = 40,
            required_directs = 0,
            directs_type = 'ANY',
            start_date,
            end_date,
            status = 'active'
        } = req.body;

        if (!title || !start_date || !end_date) {
            return res.status(400).json({ error: 'Title, start date, and end date are required' });
        }

        const id = crypto.randomUUID();

        await db.query(`
            INSERT INTO challenges (
                id, title, title_ar, description, description_ar, image_url,
                target_sales, target_revenue, reward_type, reward_amount,
                reward_title, reward_title_ar, leg_limit_percent, required_directs,
                directs_type, start_date, end_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id,
            title,
            title_ar || title,
            description || '',
            description_ar || description || '',
            image_url || '',
            Number(target_sales) || 0,
            Number(target_revenue) || 0,
            reward_type || 'CASH',
            Number(reward_amount) || 0,
            reward_title || '',
            reward_title_ar || reward_title || '',
            Number(leg_limit_percent) || 40,
            Number(required_directs) || 0,
            directs_type || 'ANY',
            start_date,
            end_date,
            status || 'active'
        ]);

        const [created] = await db.query('SELECT * FROM challenges WHERE id = ?', [id]);

        res.status(201).json({
            message: 'Challenge created successfully',
            challenge: created[0]
        });
    } catch (err) {
        console.error('[createChallenge]', err);
        res.status(500).json({ error: 'Failed to create challenge' });
    }
};

/**
 * Update challenge campaign
 */
exports.updateChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            title_ar,
            description,
            description_ar,
            image_url,
            target_sales,
            target_revenue,
            reward_type,
            reward_amount,
            reward_title,
            reward_title_ar,
            leg_limit_percent,
            required_directs,
            directs_type,
            start_date,
            end_date,
            status
        } = req.body;

        const [existing] = await db.query('SELECT * FROM challenges WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        await db.query(`
            UPDATE challenges SET
                title = COALESCE(?, title),
                title_ar = COALESCE(?, title_ar),
                description = COALESCE(?, description),
                description_ar = COALESCE(?, description_ar),
                image_url = COALESCE(?, image_url),
                target_sales = COALESCE(?, target_sales),
                target_revenue = COALESCE(?, target_revenue),
                reward_type = COALESCE(?, reward_type),
                reward_amount = COALESCE(?, reward_amount),
                reward_title = COALESCE(?, reward_title),
                reward_title_ar = COALESCE(?, reward_title_ar),
                leg_limit_percent = COALESCE(?, leg_limit_percent),
                required_directs = COALESCE(?, required_directs),
                directs_type = COALESCE(?, directs_type),
                start_date = COALESCE(?, start_date),
                end_date = COALESCE(?, end_date),
                status = COALESCE(?, status)
            WHERE id = ?
        `, [
            title,
            title_ar,
            description,
            description_ar,
            image_url,
            target_sales !== undefined ? Number(target_sales) : null,
            target_revenue !== undefined ? Number(target_revenue) : null,
            reward_type,
            reward_amount !== undefined ? Number(reward_amount) : null,
            reward_title,
            reward_title_ar,
            leg_limit_percent !== undefined ? Number(leg_limit_percent) : null,
            required_directs !== undefined ? Number(required_directs) : null,
            directs_type,
            start_date,
            end_date,
            status,
            id
        ]);

        const [updated] = await db.query('SELECT * FROM challenges WHERE id = ?', [id]);

        res.json({
            message: 'Challenge updated successfully',
            challenge: updated[0]
        });
    } catch (err) {
        console.error('[updateChallenge]', err);
        res.status(500).json({ error: 'Failed to update challenge' });
    }
};

/**
 * Delete challenge
 */
exports.deleteChallenge = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM challenges WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        res.json({ message: 'Challenge deleted successfully' });
    } catch (err) {
        console.error('[deleteChallenge]', err);
        res.status(500).json({ error: 'Failed to delete challenge' });
    }
};

/**
 * Toggle challenge status (active / inactive)
 */
exports.toggleChallengeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.query('SELECT status FROM challenges WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Challenge not found' });
        }

        const newStatus = existing[0].status === 'active' ? 'inactive' : 'active';
        await db.query('UPDATE challenges SET status = ? WHERE id = ?', [newStatus, id]);

        res.json({ message: `Challenge status updated to ${newStatus}`, status: newStatus });
    } catch (err) {
        console.error('[toggleChallengeStatus]', err);
        res.status(500).json({ error: 'Failed to toggle challenge status' });
    }
};

/**
 * Get active challenges for students with personalized progress calculation
 */
exports.getStudentChallenges = async (req, res) => {
    const userId = req.user.id;

    try {
        // Fetch all active challenges
        const [challenges] = await db.query(`
            SELECT * FROM challenges 
            WHERE status = 'active'
            ORDER BY end_date ASC
        `);

        // Fetch student's direct sales details
        const [directSalesRows] = await db.query(`
            SELECT up.id, COALESCE(up.purchased_at, NOW()) AS created_at, p.level, p.price, p.slug
            FROM users u
            JOIN user_packages up ON u.id = up.user_id
            JOIN packages p ON up.package_id = p.id
            WHERE u.referrer_id = ? AND up.status = 'active'
        `, [userId]);

        // Fetch student's team turnover & commissions
        const [commissionsRows] = await db.query(`
            SELECT sale_amount, created_at, source_user_id
            FROM commissions
            WHERE recipient_id = ?
        `, [userId]);

        // Calculate progress for each challenge
        const enrichedChallenges = challenges.map(c => {
            const startDate = new Date(c.start_date);
            const endDate = new Date(c.end_date);
            const now = new Date();

            // Calculate days left
            const diffTime = endDate.getTime() - now.getTime();
            const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

            // Filter direct sales during challenge period
            const matchingDirects = directSalesRows.filter(s => {
                const saleDate = new Date(s.created_at);
                const inRange = saleDate >= startDate && saleDate <= endDate;
                if (!inRange) return false;

                if (c.directs_type && c.directs_type !== 'ANY') {
                    return s.slug?.toUpperCase() === c.directs_type?.toUpperCase();
                }
                return true;
            });

            const currentDirectSales = matchingDirects.length;

            // Filter team revenue during challenge period
            const matchingCommissions = commissionsRows.filter(cm => {
                const comDate = new Date(cm.created_at);
                return comDate >= startDate && comDate <= endDate;
            });

            const currentRevenue = matchingCommissions.reduce((sum, cm) => sum + Number(cm.sale_amount || 0), 0);

            // Compute overall progress %
            let salesPercent = 0;
            let revenuePercent = 0;
            let directsPercent = 0;

            if (c.target_sales > 0) {
                salesPercent = Math.min(100, Math.round((currentDirectSales / c.target_sales) * 100));
            } else {
                salesPercent = 100;
            }

            if (c.target_revenue > 0) {
                revenuePercent = Math.min(100, Math.round((currentRevenue / Number(c.target_revenue)) * 100));
            } else {
                revenuePercent = 100;
            }

            if (c.required_directs > 0) {
                directsPercent = Math.min(100, Math.round((currentDirectSales / c.required_directs) * 100));
            } else {
                directsPercent = 100;
            }

            // The overall progress is the limiting requirement (minimum of non-zero targets)
            const activePercents = [];
            if (c.target_sales > 0) activePercents.push(salesPercent);
            if (c.target_revenue > 0) activePercents.push(revenuePercent);
            if (c.required_directs > 0) activePercents.push(directsPercent);

            const overallPercent = activePercents.length > 0 
                ? Math.min(...activePercents) 
                : 100;

            const isCompleted = overallPercent >= 100;

            return {
                ...c,
                daysLeft,
                currentDirectSales,
                currentRevenue,
                progressPercent: overallPercent,
                isCompleted
            };
        });

        res.json({
            challenges: enrichedChallenges
        });
    } catch (err) {
        console.error('[getStudentChallenges]', err);
        res.status(500).json({ error: 'Failed to fetch student challenges' });
    }
};
