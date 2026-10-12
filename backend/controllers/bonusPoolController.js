const db = require('../config/db');
const crypto = require('crypto');

function genUuid() {
    return crypto.randomUUID();
}

/**
 * Get date range for a given year and month (1-indexed)
 */
function getMonthDateRange(year, month) {
    const y = Number(year);
    const m = Number(month);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01 00:00:00`;
    // Last day of month
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;
    return { startDate, endDate, lastDay };
}

/**
 * 1. ADMIN: List all bonus pools with rank details
 */
exports.getAdminBonusPools = async (req, res) => {
    try {
        const [pools] = await db.query(`
            SELECT 
                bp.*,
                r.name AS rank_name,
                r.name_ar AS rank_name_ar,
                r.badge_icon AS rank_badge,
                r.color_hex AS rank_color,
                r.min_direct_sales AS rank_min_direct_sales,
                r.min_team_turnover AS rank_min_team_turnover,
                (SELECT COUNT(*) FROM bonus_pool_distributions bpd WHERE bpd.pool_id = bp.id) AS total_distributions_count
            FROM bonus_pools bp
            LEFT JOIN ranks r ON (bp.target_rank_id = r.id OR bp.target_rank_level = r.level)
            ORDER BY bp.target_rank_level DESC, bp.created_at ASC
        `);

        const [ranks] = await db.query(`
            SELECT id, level, name, name_ar, badge_icon, color_hex, min_direct_sales, min_team_turnover
            FROM ranks 
            WHERE level > 0 
            ORDER BY level ASC
        `);

        res.json({ pools, ranks });
    } catch (err) {
        console.error('[getAdminBonusPools]', err);
        res.status(500).json({ error: 'Failed to fetch bonus pools' });
    }
};

/**
 * 2. ADMIN: Create a new bonus pool
 */
exports.createBonusPool = async (req, res) => {
    const { name, name_ar, target_rank_id, pool_percentage, calculation_basis = 'net_margin' } = req.body;

    if (!name || !name_ar) {
        return res.status(400).json({ error: 'يرجى إدخال اسم الحوض بالعربية والإنجليزية' });
    }

    const pct = Number(pool_percentage);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
        return res.status(400).json({ error: 'يرجى إدخال نسبة مئوية صحيحة بين 0.1% و 100%' });
    }

    try {
        let targetLevel = 5;
        let rankIdToUse = target_rank_id || null;

        if (rankIdToUse) {
            const [rankRows] = await db.query('SELECT id, level FROM ranks WHERE id = ?', [rankIdToUse]);
            if (rankRows.length > 0) {
                targetLevel = rankRows[0].level;
            }
        } else {
            // Default to diamond
            const [diamond] = await db.query('SELECT id, level FROM ranks WHERE level = 5 LIMIT 1');
            if (diamond.length > 0) {
                rankIdToUse = diamond[0].id;
                targetLevel = diamond[0].level;
            }
        }

        const newId = genUuid();
        await db.query(`
            INSERT INTO bonus_pools (id, name, name_ar, target_rank_id, target_rank_level, pool_percentage, calculation_basis, current_rollover, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, 0.00, 1)
        `, [newId, name, name_ar, rankIdToUse, targetLevel, pct, calculation_basis]);

        res.status(201).json({ message: 'تم إنشاء الحوض المالي بنجاح', poolId: newId });
    } catch (err) {
        console.error('[createBonusPool]', err);
        res.status(500).json({ error: err.message || 'Failed to create bonus pool' });
    }
};

/**
 * 3. ADMIN: Update bonus pool conditions
 */
exports.updateBonusPool = async (req, res) => {
    const { id } = req.params;
    const { name, name_ar, target_rank_id, pool_percentage, calculation_basis, is_active, current_rollover } = req.body;

    try {
        const [existing] = await db.query('SELECT * FROM bonus_pools WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'الحوض المالي غير موجود' });
        }

        let targetLevel = existing[0].target_rank_level;
        if (target_rank_id && target_rank_id !== existing[0].target_rank_id) {
            const [rankRows] = await db.query('SELECT id, level FROM ranks WHERE id = ?', [target_rank_id]);
            if (rankRows.length > 0) {
                targetLevel = rankRows[0].level;
            }
        }

        const fieldsToUpdate = [];
        const values = [];

        if (name !== undefined) { fieldsToUpdate.push('name = ?'); values.push(name); }
        if (name_ar !== undefined) { fieldsToUpdate.push('name_ar = ?'); values.push(name_ar); }
        if (target_rank_id !== undefined) { fieldsToUpdate.push('target_rank_id = ?'); values.push(target_rank_id); }
        if (targetLevel !== undefined) { fieldsToUpdate.push('target_rank_level = ?'); values.push(targetLevel); }
        if (pool_percentage !== undefined) { fieldsToUpdate.push('pool_percentage = ?'); values.push(Number(pool_percentage)); }
        if (calculation_basis !== undefined) { fieldsToUpdate.push('calculation_basis = ?'); values.push(calculation_basis); }
        if (is_active !== undefined) { fieldsToUpdate.push('is_active = ?'); values.push(is_active ? 1 : 0); }
        if (current_rollover !== undefined) { fieldsToUpdate.push('current_rollover = ?'); values.push(Number(current_rollover)); }

        if (fieldsToUpdate.length > 0) {
            values.push(id);
            await db.query(`UPDATE bonus_pools SET ${fieldsToUpdate.join(', ')} WHERE id = ?`, values);
        }

        res.json({ message: 'تم تحديث إعدادات الحوض المالي بنجاح' });
    } catch (err) {
        console.error('[updateBonusPool]', err);
        res.status(500).json({ error: err.message || 'Failed to update bonus pool' });
    }
};

/**
 * 4. ADMIN: Delete bonus pool
 */
exports.deleteBonusPool = async (req, res) => {
    const { id } = req.params;
    try {
        const [distCount] = await db.query('SELECT COUNT(*) AS count FROM bonus_pool_distributions WHERE pool_id = ?', [id]);
        if (Number(distCount[0]?.count || 0) > 0) {
            // Cannot hard delete if there are historical distributions; deactivate instead
            await db.query('UPDATE bonus_pools SET is_active = 0 WHERE id = ?', [id]);
            return res.json({ message: 'تم إيقاف وتعطيل الحوض المالي لاحتوائه على توزيعات سابقة' });
        }

        await db.query('DELETE FROM bonus_pools WHERE id = ?', [id]);
        res.json({ message: 'تم حذف الحوض المالي بنجاح' });
    } catch (err) {
        console.error('[deleteBonusPool]', err);
        res.status(500).json({ error: 'Failed to delete bonus pool' });
    }
};

/**
 * 5. ADMIN: Preview monthly distribution calculation
 */
exports.previewPoolDistribution = async (req, res) => {
    const { id } = req.params;
    const now = new Date();
    const year = Number(req.query.year) || now.getFullYear();
    const month = Number(req.query.month) || (now.getMonth() + 1);

    try {
        // Fetch pool
        const [pools] = await db.query(`
            SELECT bp.*, r.name AS rank_name, r.name_ar AS rank_name_ar, r.min_direct_sales, r.min_team_turnover
            FROM bonus_pools bp
            LEFT JOIN ranks r ON (bp.target_rank_id = r.id OR bp.target_rank_level = r.level)
            WHERE bp.id = ?
        `, [id]);

        if (pools.length === 0) {
            return res.status(404).json({ error: 'الحوض المالي غير موجود' });
        }
        const pool = pools[0];

        const { startDate, endDate } = getMonthDateRange(year, month);

        // 1. Gross Sales in period (packages purchased/upgraded)
        const [salesRows] = await db.query(`
            SELECT COALESCE(SUM(amount_paid), 0) AS gross_sales, COUNT(*) AS sales_count
            FROM user_packages
            WHERE purchased_at >= ? AND purchased_at <= ? AND status IN ('active', 'upgraded')
        `, [startDate, endDate]);
        const grossSales = Number(salesRows[0]?.gross_sales || 0);
        const salesCount = Number(salesRows[0]?.sales_count || 0);

        // 2. Commissions paid in period
        const [commRows] = await db.query(`
            SELECT COALESCE(SUM(commission_amount), 0) AS total_commissions, COUNT(*) AS comm_count
            FROM commissions
            WHERE created_at >= ? AND created_at <= ? AND status != 'cancelled'
        `, [startDate, endDate]);
        const totalCommissions = Number(commRows[0]?.total_commissions || 0);
        const commCount = Number(commRows[0]?.comm_count || 0);

        // 3. Net Platform Margin
        const netMargin = Math.max(0, Number((grossSales - totalCommissions).toFixed(2)));

        // 4. Base Pool Calculation
        const poolPercentage = Number(pool.pool_percentage || 2.00);
        const basisAmount = pool.calculation_basis === 'gross_sales' ? grossSales : netMargin;
        const poolBaseAmount = Number(((basisAmount * poolPercentage) / 100).toFixed(2));
        const rolloverIn = Number(pool.current_rollover || 0);
        const totalPoolAmount = Number((poolBaseAmount + rolloverIn).toFixed(2));

        // 5. Eligible Leaders for target rank
        const minDirect = Number(pool.min_direct_sales || 0);
        const minTurnover = Number(pool.min_team_turnover || 0);

        const [students] = await db.query(`
            SELECT 
                u.id, 
                u.email, 
                u.affiliate_code,
                COALESCE(p.full_name, u.email) AS full_name,
                p.avatar_url,
                (
                    SELECT COUNT(DISTINCT up.id)
                    FROM users direct_u
                    JOIN user_packages up ON direct_u.id = up.user_id
                    WHERE direct_u.referrer_id = u.id AND up.status = 'active'
                ) AS direct_sales,
                (
                    SELECT COALESCE(SUM(c.sale_amount), 0)
                    FROM commissions c
                    WHERE c.recipient_id = u.id
                ) AS team_turnover
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.role = 'student' AND u.affiliate_enabled = 1
            HAVING direct_sales >= ? AND team_turnover >= ?
            ORDER BY team_turnover DESC, direct_sales DESC
        `, [minDirect, minTurnover]);

        const eligibleLeaders = students.map(s => ({
            id: s.id,
            email: s.email,
            affiliate_code: s.affiliate_code,
            full_name: s.full_name,
            avatar_url: s.avatar_url,
            direct_sales: Number(s.direct_sales || 0),
            team_turnover: Number(s.team_turnover || 0),
        }));

        const eligibleCount = eligibleLeaders.length;
        const sharePerLeader = eligibleCount > 0 ? Number((totalPoolAmount / eligibleCount).toFixed(2)) : 0;
        const totalPaid = Number((sharePerLeader * eligibleCount).toFixed(2));
        const rolloverOut = eligibleCount > 0 ? Number((totalPoolAmount - totalPaid).toFixed(2)) : totalPoolAmount;

        // Check if already distributed
        const [existingDist] = await db.query(`
            SELECT * FROM bonus_pool_distributions 
            WHERE pool_id = ? AND period_year = ? AND period_month = ?
        `, [id, year, month]);

        res.json({
            pool,
            period: { year, month, startDate, endDate },
            financials: {
                grossSales,
                salesCount,
                totalCommissions,
                commCount,
                netMargin,
                basis: pool.calculation_basis,
                poolPercentage,
                poolBaseAmount,
                rolloverIn,
                totalPoolAmount,
                eligibleCount,
                sharePerLeader,
                totalPaid,
                rolloverOut
            },
            eligibleLeaders,
            existingDistribution: existingDist[0] || null
        });
    } catch (err) {
        console.error('[previewPoolDistribution]', err);
        res.status(500).json({ error: 'Failed to preview distribution' });
    }
};

/**
 * 6. ADMIN: Execute monthly bonus pool distribution
 */
exports.executePoolDistribution = async (req, res) => {
    const { id } = req.params;
    const now = new Date();
    const year = Number(req.body.year) || now.getFullYear();
    const month = Number(req.body.month) || (now.getMonth() + 1);
    const adminId = req.user.id;
    const notes = req.body.notes || '';

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Lock and fetch pool
        const [pools] = await connection.query(`
            SELECT bp.*, r.name AS rank_name, r.name_ar AS rank_name_ar, r.min_direct_sales, r.min_team_turnover
            FROM bonus_pools bp
            LEFT JOIN ranks r ON (bp.target_rank_id = r.id OR bp.target_rank_level = r.level)
            WHERE bp.id = ?
            FOR UPDATE
        `, [id]);

        if (pools.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'الحوض المالي غير موجود' });
        }
        const pool = pools[0];

        // 2. Check if already distributed for this period
        const [existingDist] = await connection.query(`
            SELECT * FROM bonus_pool_distributions 
            WHERE pool_id = ? AND period_year = ? AND period_month = ?
            FOR UPDATE
        `, [id, year, month]);

        if (existingDist.length > 0 && existingDist[0].status === 'distributed') {
            await connection.rollback();
            return res.status(400).json({ error: `تم صرف أرباح هذا الحوض لشهر ${month}/${year} مسبقاً` });
        }

        const { startDate, endDate } = getMonthDateRange(year, month);

        // 3. Gross sales
        const [salesRows] = await connection.query(`
            SELECT COALESCE(SUM(amount_paid), 0) AS gross_sales
            FROM user_packages
            WHERE purchased_at >= ? AND purchased_at <= ? AND status IN ('active', 'upgraded')
        `, [startDate, endDate]);
        const grossSales = Number(salesRows[0]?.gross_sales || 0);

        // 4. Commissions
        const [commRows] = await connection.query(`
            SELECT COALESCE(SUM(commission_amount), 0) AS total_commissions
            FROM commissions
            WHERE created_at >= ? AND created_at <= ? AND status != 'cancelled'
        `, [startDate, endDate]);
        const totalCommissions = Number(commRows[0]?.total_commissions || 0);

        // 5. Net margin & pool amount
        const netMargin = Math.max(0, Number((grossSales - totalCommissions).toFixed(2)));
        const poolPercentage = Number(pool.pool_percentage || 2.00);
        const basisAmount = pool.calculation_basis === 'gross_sales' ? grossSales : netMargin;
        const poolBaseAmount = Number(((basisAmount * poolPercentage) / 100).toFixed(2));
        const rolloverIn = Number(pool.current_rollover || 0);
        const totalPoolAmount = Number((poolBaseAmount + rolloverIn).toFixed(2));

        // 6. Find eligible leaders
        const minDirect = Number(pool.min_direct_sales || 0);
        const minTurnover = Number(pool.min_team_turnover || 0);

        const [eligible] = await connection.query(`
            SELECT 
                u.id, 
                u.email, 
                COALESCE(p.full_name, u.email) AS full_name,
                (
                    SELECT COUNT(DISTINCT up.id)
                    FROM users direct_u
                    JOIN user_packages up ON direct_u.id = up.user_id
                    WHERE direct_u.referrer_id = u.id AND up.status = 'active'
                ) AS direct_sales,
                (
                    SELECT COALESCE(SUM(c.sale_amount), 0)
                    FROM commissions c
                    WHERE c.recipient_id = u.id
                ) AS team_turnover
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.role = 'student' AND u.affiliate_enabled = 1
            HAVING direct_sales >= ? AND team_turnover >= ?
        `, [minDirect, minTurnover]);

        const eligibleCount = eligible.length;
        const distributionId = existingDist.length > 0 ? existingDist[0].id : genUuid();

        if (eligibleCount > 0) {
            // Equal share
            const sharePerLeader = Number((totalPoolAmount / eligibleCount).toFixed(2));
            const totalPaid = Number((sharePerLeader * eligibleCount).toFixed(2));
            const remainderCents = Number((totalPoolAmount - totalPaid).toFixed(2));

            // Credit each leader's wallet
            for (const leader of eligible) {
                // Ensure wallet exists
                let [wallets] = await connection.query('SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE', [leader.id]);
                if (wallets.length === 0) {
                    const wId = genUuid();
                    await connection.query(`
                        INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                        VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)
                    `, [wId, leader.id]);
                    wallets = [{ id: wId, user_id: leader.id, balance: 0, total_earned: 0 }];
                }

                const currentBal = Number(wallets[0].balance);
                const newBal = Number((currentBal + sharePerLeader).toFixed(2));

                await connection.query(`
                    UPDATE user_wallets 
                    SET balance = balance + ?, total_earned = total_earned + ?
                    WHERE user_id = ?
                `, [sharePerLeader, sharePerLeader, leader.id]);

                // Create ledger transaction
                const trxId = genUuid();
                const desc = `مكافأة ${pool.name_ar || pool.name} - شهر ${month}/${year}`;
                await connection.query(`
                    INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description, metadata)
                    VALUES (?, ?, 'bonus', ?, 'USD', ?, ?, 'completed', ?, ?, ?)
                `, [
                    trxId,
                    leader.id,
                    sharePerLeader,
                    currentBal,
                    newBal,
                    `POOL-${year}-${month}-${pool.id.substring(0, 8)}`,
                    desc,
                    JSON.stringify({ poolId: pool.id, poolName: pool.name, year, month, sharePerLeader })
                ]);

                // Record payout
                const payoutId = genUuid();
                await connection.query(`
                    INSERT INTO bonus_pool_payouts (id, distribution_id, pool_id, user_id, amount, status, transaction_id)
                    VALUES (?, ?, ?, ?, ?, 'paid', ?)
                `, [payoutId, distributionId, pool.id, leader.id, sharePerLeader, trxId]);

                // Send notification
                const notifId = genUuid();
                const notifMsg = `تهانينا الحارة! 🎉 لقد حصلت على حصتك من ${pool.name_ar || pool.name} بقيمة $${sharePerLeader.toFixed(2)} USD لشهر ${month}/${year}. تم إيداع المبلغ في محفظتك بنجاح.`;
                await connection.query(`
                    INSERT INTO notifications (id, user_id, title, content, type, is_read, created_at)
                    VALUES (?, ?, 'مكافأة الحوض المالي الشهري', ?, 'commission', 0, CURRENT_TIMESTAMP)
                `, [notifId, leader.id, notifMsg]);
            }

            // Update pool's current rollover to remaining cents (if any)
            await connection.query('UPDATE bonus_pools SET current_rollover = ? WHERE id = ?', [remainderCents, pool.id]);

            // Save distribution record
            if (existingDist.length > 0) {
                await connection.query(`
                    UPDATE bonus_pool_distributions
                    SET gross_sales = ?, total_commissions = ?, net_margin = ?, pool_percentage = ?, pool_base_amount = ?,
                        rollover_in = ?, total_pool_amount = ?, eligible_leaders_count = ?, share_per_leader = ?,
                        rollover_out = ?, status = 'distributed', notes = ?, executed_by = ?, executed_at = NOW()
                    WHERE id = ?
                `, [
                    grossSales, totalCommissions, netMargin, poolPercentage, poolBaseAmount,
                    rolloverIn, totalPoolAmount, eligibleCount, sharePerLeader,
                    remainderCents, notes, adminId, distributionId
                ]);
            } else {
                await connection.query(`
                    INSERT INTO bonus_pool_distributions (
                        id, pool_id, period_year, period_month, gross_sales, total_commissions, net_margin,
                        pool_percentage, pool_base_amount, rollover_in, total_pool_amount,
                        eligible_leaders_count, share_per_leader, rollover_out, status, notes, executed_by, executed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'distributed', ?, ?, NOW())
                `, [
                    distributionId, pool.id, year, month, grossSales, totalCommissions, netMargin,
                    poolPercentage, poolBaseAmount, rolloverIn, totalPoolAmount,
                    eligibleCount, sharePerLeader, remainderCents, notes, adminId
                ]);
            }

            await connection.commit();
            return res.json({
                message: `تم توزيع أرباح الحوض بنجاح على ${eligibleCount} من القادة المؤهلين بقيمة $${sharePerLeader.toFixed(2)} لكل قائد.`,
                distributionId,
                eligibleCount,
                sharePerLeader,
                totalPaid
            });

        } else {
            // ZERO QUALIFIERS: ROLL OVER TO NEXT MONTH!
            const newRollover = totalPoolAmount;
            await connection.query('UPDATE bonus_pools SET current_rollover = ? WHERE id = ?', [newRollover, pool.id]);

            const rolloverNotes = notes || 'تم ترحيل كامل رصيد الحوض للشهر التالي لعدم وجود قادة مؤهلين للرتبة هذا الشهر.';

            if (existingDist.length > 0) {
                await connection.query(`
                    UPDATE bonus_pool_distributions
                    SET gross_sales = ?, total_commissions = ?, net_margin = ?, pool_percentage = ?, pool_base_amount = ?,
                        rollover_in = ?, total_pool_amount = ?, eligible_leaders_count = 0, share_per_leader = 0,
                        rollover_out = ?, status = 'rolled_over', notes = ?, executed_by = ?, executed_at = NOW()
                    WHERE id = ?
                `, [
                    grossSales, totalCommissions, netMargin, poolPercentage, poolBaseAmount,
                    rolloverIn, totalPoolAmount, newRollover, rolloverNotes, adminId, distributionId
                ]);
            } else {
                await connection.query(`
                    INSERT INTO bonus_pool_distributions (
                        id, pool_id, period_year, period_month, gross_sales, total_commissions, net_margin,
                        pool_percentage, pool_base_amount, rollover_in, total_pool_amount,
                        eligible_leaders_count, share_per_leader, rollover_out, status, notes, executed_by, executed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, 'rolled_over', ?, ?, NOW())
                `, [
                    distributionId, pool.id, year, month, grossSales, totalCommissions, netMargin,
                    poolPercentage, poolBaseAmount, rolloverIn, totalPoolAmount,
                    newRollover, rolloverNotes, adminId
                ]);
            }

            await connection.commit();
            return res.json({
                message: `تم ترحيل مبلغ الحوض بالكامل ($${newRollover.toFixed(2)} USD) إلى رصيد الشهر التالي لعدم وجود قادة مؤهلين.`,
                distributionId,
                status: 'rolled_over',
                rolledOverAmount: newRollover
            });
        }

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('[executePoolDistribution]', err);
        res.status(500).json({ error: err.message || 'Failed to execute distribution' });
    } finally {
        if (connection) connection.release();
    }
};

/**
 * 7. ADMIN: Get distributions history
 */
exports.getDistributionHistory = async (req, res) => {
    const { poolId } = req.query;
    try {
        let query = `
            SELECT 
                bpd.*,
                bp.name AS pool_name,
                bp.name_ar AS pool_name_ar,
                r.name_ar AS target_rank_name,
                r.color_hex AS target_rank_color,
                COALESCE(u.email, 'Admin') AS executed_by_email
            FROM bonus_pool_distributions bpd
            JOIN bonus_pools bp ON bpd.pool_id = bp.id
            LEFT JOIN ranks r ON (bp.target_rank_id = r.id OR bp.target_rank_level = r.level)
            LEFT JOIN users u ON bpd.executed_by = u.id
        `;
        const params = [];
        if (poolId) {
            query += ` WHERE bpd.pool_id = ?`;
            params.push(poolId);
        }
        query += ` ORDER BY bpd.period_year DESC, bpd.period_month DESC, bpd.created_at DESC`;

        const [history] = await db.query(query, params);
        res.json({ history });
    } catch (err) {
        console.error('[getDistributionHistory]', err);
        res.status(500).json({ error: 'Failed to fetch distribution history' });
    }
};

/**
 * 8. STUDENT: Get active bonus pools and personal qualification
 */
exports.getStudentBonusPools = async (req, res) => {
    const userId = req.user.id;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const { startDate, endDate, lastDay } = getMonthDateRange(year, month);
    const daysLeft = Math.max(0, lastDay - now.getDate());

    try {
        // 1. Fetch active pools
        const [pools] = await db.query(`
            SELECT 
                bp.*,
                r.name AS rank_name,
                r.name_ar AS rank_name_ar,
                r.badge_icon AS rank_badge,
                r.color_hex AS rank_color,
                r.min_direct_sales,
                r.min_team_turnover
            FROM bonus_pools bp
            LEFT JOIN ranks r ON (bp.target_rank_id = r.id OR bp.target_rank_level = r.level)
            WHERE bp.is_active = 1
            ORDER BY bp.target_rank_level DESC
        `);

        // 2. Fetch student's current progress
        const [salesRows] = await db.query(`
            SELECT COUNT(DISTINCT up.id) AS direct_sales
            FROM users u
            JOIN user_packages up ON u.id = up.user_id
            WHERE u.referrer_id = ? AND up.status = 'active'
        `, [userId]);
        const userDirectSales = Number(salesRows[0]?.direct_sales || 0);

        const [turnoverRows] = await db.query(`
            SELECT COALESCE(SUM(sale_amount), 0) AS team_turnover
            FROM commissions
            WHERE recipient_id = ?
        `, [userId]);
        const userTeamTurnover = Number(turnoverRows[0]?.team_turnover || 0);

        // 3. Current month platform financials for estimate
        const [grossRows] = await db.query(`
            SELECT COALESCE(SUM(amount_paid), 0) AS gross_sales
            FROM user_packages
            WHERE purchased_at >= ? AND purchased_at <= ? AND status IN ('active', 'upgraded')
        `, [startDate, endDate]);
        const grossSales = Number(grossRows[0]?.gross_sales || 0);

        const [commRows] = await db.query(`
            SELECT COALESCE(SUM(commission_amount), 0) AS total_commissions
            FROM commissions
            WHERE created_at >= ? AND created_at <= ? AND status != 'cancelled'
        `, [startDate, endDate]);
        const totalCommissions = Number(commRows[0]?.total_commissions || 0);
        const netMargin = Math.max(0, Number((grossSales - totalCommissions).toFixed(2)));

        // 4. Student's past payouts from all pools with transaction reference
        const [payouts] = await db.query(`
            SELECT 
                bpp.id AS payout_id,
                bpp.amount,
                bpp.status,
                bpp.created_at,
                bpp.transaction_id,
                t.reference_id,
                bp.id AS pool_id,
                bp.name AS pool_name,
                bp.name_ar AS pool_name_ar,
                bp.pool_percentage,
                bpd.period_year,
                bpd.period_month,
                bpd.total_pool_amount,
                bpd.eligible_leaders_count
            FROM bonus_pool_payouts bpp
            JOIN bonus_pools bp ON bpp.pool_id = bp.id
            JOIN bonus_pool_distributions bpd ON bpp.distribution_id = bpd.id
            LEFT JOIN transactions t ON bpp.transaction_id = t.id
            WHERE bpp.user_id = ?
            ORDER BY bpp.created_at DESC
        `, [userId]);

        const totalEarnedFromPools = payouts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

        // 5. Global platform history of all previous pool distributions
        const [globalHistory] = await db.query(`
            SELECT 
                bpd.*,
                bp.name AS pool_name,
                bp.name_ar AS pool_name_ar,
                bp.pool_percentage,
                r.name_ar AS target_rank_name,
                r.color_hex AS target_rank_color,
                (SELECT COUNT(*) FROM bonus_pool_payouts bpp WHERE bpp.distribution_id = bpd.id AND bpp.user_id = ?) AS user_received
            FROM bonus_pool_distributions bpd
            JOIN bonus_pools bp ON bpd.pool_id = bp.id
            LEFT JOIN ranks r ON (bp.target_rank_id = r.id OR bp.target_rank_level = r.level)
            ORDER BY bpd.period_year DESC, bpd.period_month DESC, bpd.created_at DESC
            LIMIT 50
        `, [userId]);

        // 6. Format pools with dynamic qualifiers count and unlock status
        const formattedPools = await Promise.all(pools.map(async (p) => {
            const minDirect = Number(p.min_direct_sales || 0);
            const minTurnover = Number(p.min_team_turnover || 0);
            const isEligible = userDirectSales >= minDirect && userTeamTurnover >= minTurnover;

            const poolPct = Number(p.pool_percentage || 2.00);
            const basis = p.calculation_basis === 'gross_sales' ? grossSales : netMargin;
            const estimatedCurrentAmount = Number((((basis * poolPct) / 100) + Number(p.current_rollover || 0)).toFixed(2));

            const directProgress = minDirect > 0 ? Math.min(100, Number(((userDirectSales / minDirect) * 100).toFixed(1))) : 100;
            const turnoverProgress = minTurnover > 0 ? Math.min(100, Number(((userTeamTurnover / minTurnover) * 100).toFixed(1))) : 100;

            // Count total qualifiers in platform for this rank
            const [qRows] = await db.query(`
                SELECT COUNT(*) AS total_qualifiers FROM (
                    SELECT u.id
                    FROM users u
                    WHERE u.role = 'student' AND u.affiliate_enabled = 1
                    HAVING (
                        SELECT COUNT(DISTINCT up.id) FROM users d_u JOIN user_packages up ON d_u.id = up.user_id WHERE d_u.referrer_id = u.id AND up.status = 'active'
                    ) >= ?
                    AND (
                        SELECT COALESCE(SUM(c.sale_amount), 0) FROM commissions c WHERE c.recipient_id = u.id
                    ) >= ?
                ) q
            `, [minDirect, minTurnover]);
            const totalQualifiers = Number(qRows[0]?.total_qualifiers || 0);

            const estimatedShare = totalQualifiers > 0 
                ? Number((estimatedCurrentAmount / totalQualifiers).toFixed(2)) 
                : estimatedCurrentAmount;

            const userPoolPayouts = payouts.filter(py => py.pool_id === p.id);
            const userEarnedInThisPool = userPoolPayouts.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

            return {
                ...p,
                estimated_current_amount: estimatedCurrentAmount,
                current_rollover: Number(p.current_rollover || 0),
                days_left: daysLeft,
                is_unlocked: isEligible,
                is_eligible: isEligible,
                total_qualifiers: totalQualifiers,
                estimated_share: estimatedShare,
                user_earned_total: userEarnedInThisPool,
                progress: {
                    user_direct_sales: userDirectSales,
                    min_direct_sales: minDirect,
                    direct_needed: Math.max(0, minDirect - userDirectSales),
                    direct_percentage: directProgress,
                    user_team_turnover: userTeamTurnover,
                    min_team_turnover: minTurnover,
                    turnover_needed: Math.max(0, minTurnover - userTeamTurnover),
                    turnover_percentage: turnoverProgress
                }
            };
        }));

        res.json({
            pools: formattedPools,
            totalEarnedFromPools,
            financialsSummary: {
                grossSales,
                totalCommissions,
                netMargin,
                daysLeft
            },
            userStats: {
                directSales: userDirectSales,
                teamTurnover: userTeamTurnover
            },
            myPayouts: payouts,
            globalHistory
        });
    } catch (err) {
        console.error('[getStudentBonusPools]', err);
        res.status(500).json({ error: 'Failed to fetch student bonus pools' });
    }
};
