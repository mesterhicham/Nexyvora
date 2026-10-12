const db = require('../config/db');
const crypto = require('crypto');

function genUuid() {
    return crypto.randomUUID();
}

/**
 * Helper to get date range for a given year and month (1-indexed)
 */
function getMonthDateRange(year, month) {
    const y = Number(year);
    const m = Number(month);
    const startDate = `${y}-${String(m).padStart(2, '0')}-01 00:00:00`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;
    return { startDate, endDate, lastDay };
}

/**
 * Helper to find the next available seat number from 1 to total_seats
 */
async function getNextAvailableSeat(connection, totalSeats) {
    const [seats] = await connection.query(`
        SELECT seat_number FROM founder_members 
        ORDER BY seat_number ASC
    `);
    const takenSeats = new Set(seats.map(s => Number(s.seat_number)));

    for (let i = 1; i <= totalSeats; i++) {
        if (!takenSeats.has(i)) {
            return i;
        }
    }
    return null; // All seats taken
}

/**
 * Hook to check and auto-qualify a user as Founder if criteria met
 */
async function checkAndQualifyFounder(connection, userId) {
    try {
        // Check if founder club is active
        const [settingsRows] = await connection.query('SELECT * FROM founder_settings LIMIT 1');
        if (settingsRows.length === 0 || !settingsRows[0].is_active) return null;
        const settings = settingsRows[0];

        // Check if user is already a founder
        const [existing] = await connection.query('SELECT id, seat_number FROM founder_members WHERE user_id = ?', [userId]);
        if (existing.length > 0) return existing[0];

        // Check if seats are full
        const [countRow] = await connection.query('SELECT COUNT(*) AS count FROM founder_members WHERE status = "active"');
        const activeCount = Number(countRow[0]?.count || 0);
        if (activeCount >= settings.total_seats) return null;

        // Calculate direct sales in the last 30 days
        const [salesRow] = await connection.query(`
            SELECT COALESCE(SUM(COALESCE(up.amount_paid, p.price)), 0) AS direct_sales_30d
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            JOIN users direct_u ON direct_u.id = up.user_id
            WHERE direct_u.referrer_id = ?
              AND up.status IN ('active', 'upgraded')
              AND up.purchased_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, [userId]);

        const directSales = Number(salesRow[0]?.direct_sales_30d || 0);
        if (directSales >= Number(settings.target_direct_sales)) {
            const nextSeat = await getNextAvailableSeat(connection, settings.total_seats);
            if (!nextSeat) return null;

            const memberId = genUuid();
            await connection.query(`
                INSERT INTO founder_members (id, user_id, seat_number, direct_sales_achieved, status, granted_by)
                VALUES (?, ?, ?, ?, 'active', 'system')
            `, [memberId, userId, nextSeat, directSales]);

            // Create notification
            const notifMsg = `تهانينا الاستثنائية! 👑 لقد حققت $${directSales.toFixed(2)} في المبيعات المباشرة خلال 30 يوماً وأصبحت رسمياً عضواً مؤسساً (FOUNDER) وحجزت المقعد رقم #${nextSeat} مدى الحياة! ستشارك الآن في حوض الـ 2% شهرياً.`;
            await connection.query(`
                INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
                VALUES (?, ?, 'success', '👑 مرحباً بك في نادي المؤسسين (Founders Club)', ?, 0, NOW())
            `, [genUuid(), userId, notifMsg]);

            console.log(`[FounderClub] User ${userId} successfully qualified as Founder Seat #${nextSeat}`);
            return { id: memberId, seat_number: nextSeat };
        }
        return null;
    } catch (err) {
        console.error('[checkAndQualifyFounder] Error:', err);
        return null;
    }
}

/**
 * 1. PUBLIC / AUTH: Get general Founder Club overview
 */
exports.getFounderOverview = async (req, res) => {
    try {
        const [settingsRows] = await db.query('SELECT * FROM founder_settings LIMIT 1');
        const settings = settingsRows[0] || {
            total_seats: 100,
            target_direct_sales: 5000,
            pool_percentage: 2,
            calculation_basis: 'net_margin',
            current_rollover: 0,
            is_active: 1
        };

        const [countRow] = await db.query('SELECT COUNT(*) AS count FROM founder_members WHERE status = "active"');
        const seatsTaken = Number(countRow[0]?.count || 0);
        const seatsRemaining = Math.max(0, Number(settings.total_seats) - seatsTaken);
        const isSoldOut = seatsRemaining === 0;

        // Recent 8 founders for showcase (with masked emails or profiles)
        const [recentFounders] = await db.query(`
            SELECT 
                fm.seat_number,
                fm.qualified_at,
                fm.direct_sales_achieved,
                COALESCE(p.full_name, CONCAT('عضو #', fm.seat_number)) AS name,
                p.avatar_url,
                p.country
            FROM founder_members fm
            JOIN users u ON fm.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            WHERE fm.status = 'active'
            ORDER BY fm.seat_number ASC
            LIMIT 100
        `);

        // Total distributed to founders to date
        const [payoutsRow] = await db.query('SELECT COALESCE(SUM(amount), 0) AS total_paid FROM founder_payouts WHERE status = "paid"');
        const totalDistributed = Number(payoutsRow[0]?.total_paid || 0);

        res.json({
            settings: {
                totalSeats: Number(settings.total_seats),
                targetDirectSales: Number(settings.target_direct_sales),
                poolPercentage: Number(settings.pool_percentage),
                calculationBasis: settings.calculation_basis,
                currentRollover: Number(settings.current_rollover),
                isActive: Boolean(settings.is_active)
            },
            seatsTaken,
            seatsRemaining,
            isSoldOut,
            totalDistributed,
            founders: recentFounders
        });
    } catch (err) {
        console.error('[getFounderOverview]', err);
        res.status(500).json({ error: 'Failed to fetch founder overview' });
    }
};

/**
 * 2. STUDENT: Get my Founder status, progress, seat info, or sales progress
 */
exports.getMyFounderStatus = async (req, res) => {
    const userId = req.user.id;
    try {
        const [settingsRows] = await db.query('SELECT * FROM founder_settings LIMIT 1');
        const settings = settingsRows[0] || {
            total_seats: 100,
            target_direct_sales: 5000,
            pool_percentage: 2,
            calculation_basis: 'net_margin',
            current_rollover: 0,
            is_active: 1
        };

        const [countRow] = await db.query('SELECT COUNT(*) AS count FROM founder_members WHERE status = "active"');
        const seatsTaken = Number(countRow[0]?.count || 0);
        const seatsRemaining = Math.max(0, Number(settings.total_seats) - seatsTaken);
        const isSoldOut = seatsRemaining === 0;

        // Check if user is already a founder
        const [memberRows] = await db.query(`
            SELECT fm.*, u.email, p.full_name, p.avatar_url
            FROM founder_members fm
            JOIN users u ON fm.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            WHERE fm.user_id = ?
        `, [userId]);

        if (memberRows.length > 0) {
            const member = memberRows[0];
            // Fetch payouts history
            const [payouts] = await db.query(`
                SELECT 
                    fp.*, 
                    fd.period_year, 
                    fd.period_month, 
                    fd.total_pool_amount,
                    fd.founders_count
                FROM founder_payouts fp
                JOIN founder_distributions fd ON fp.distribution_id = fd.id
                WHERE fp.user_id = ?
                ORDER BY fp.created_at DESC
            `, [userId]);

            const totalEarned = payouts.reduce((acc, p) => acc + Number(p.amount), 0);

            return res.json({
                isFounder: true,
                member: {
                    seatNumber: member.seat_number,
                    qualifiedAt: member.qualified_at,
                    directSalesAchieved: Number(member.direct_sales_achieved),
                    status: member.status,
                    grantedBy: member.granted_by
                },
                seatsTaken,
                seatsRemaining,
                totalSeats: Number(settings.total_seats),
                poolPercentage: Number(settings.pool_percentage),
                totalEarned,
                payouts
            });
        }

        // User is not a founder -> Calculate direct sales in the last 30 days
        const [salesRow] = await db.query(`
            SELECT COALESCE(SUM(COALESCE(up.amount_paid, p.price)), 0) AS direct_sales_30d
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            JOIN users direct_u ON direct_u.id = up.user_id
            WHERE direct_u.referrer_id = ?
              AND up.status IN ('active', 'upgraded')
              AND up.purchased_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, [userId]);

        const directSales = Number(salesRow[0]?.direct_sales_30d || 0);
        const target = Number(settings.target_direct_sales || 5000);
        const progressPct = Number(Math.min(100, (directSales / target) * 100).toFixed(1));
        const amountRemaining = Math.max(0, Number((target - directSales).toFixed(2)));

        // Get list of direct active sales in last 30 days
        const [directSalesList] = await db.query(`
            SELECT 
                up.id,
                up.purchased_at,
                COALESCE(up.amount_paid, p.price) AS amount,
                p.name AS package_name,
                p.name_ar AS package_name_ar,
                COALESCE(prof.full_name, direct_u.email) AS buyer_name
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            JOIN users direct_u ON direct_u.id = up.user_id
            LEFT JOIN profiles prof ON direct_u.id = prof.id
            WHERE direct_u.referrer_id = ?
              AND up.status IN ('active', 'upgraded')
              AND up.purchased_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ORDER BY up.purchased_at DESC
        `, [userId]);

        res.json({
            isFounder: false,
            directSalesLast30Days: directSales,
            targetSales: target,
            progressPct,
            amountRemaining,
            seatsTaken,
            seatsRemaining,
            totalSeats: Number(settings.total_seats),
            isSoldOut,
            poolPercentage: Number(settings.pool_percentage),
            recentDirectSales: directSalesList
        });
    } catch (err) {
        console.error('[getMyFounderStatus]', err);
        res.status(500).json({ error: 'Failed to fetch my founder status' });
    }
};

/**
 * 3. ADMIN: Get all Founder management data
 */
exports.getAdminFounders = async (req, res) => {
    try {
        const [settingsRows] = await db.query('SELECT * FROM founder_settings LIMIT 1');
        const settings = settingsRows[0] || {
            total_seats: 100,
            target_direct_sales: 5000,
            pool_percentage: 2,
            calculation_basis: 'net_margin',
            current_rollover: 0,
            is_active: 1
        };

        // All founder members
        const [members] = await db.query(`
            SELECT 
                fm.*,
                u.email,
                u.role,
                COALESCE(p.full_name, u.email) AS full_name,
                p.avatar_url,
                p.country,
                (SELECT COALESCE(SUM(amount), 0) FROM founder_payouts WHERE user_id = fm.user_id AND status = 'paid') AS total_payouts
            FROM founder_members fm
            JOIN users u ON fm.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            ORDER BY fm.seat_number ASC
        `);

        // Stats
        const totalSeats = Number(settings.total_seats);
        const takenSeats = members.filter(m => m.status === 'active').length;
        const remainingSeats = Math.max(0, totalSeats - takenSeats);

        // Past distributions
        const [distributions] = await db.query(`
            SELECT 
                fd.*,
                COALESCE(p.full_name, u.email) AS executor_name
            FROM founder_distributions fd
            LEFT JOIN users u ON fd.executed_by = u.id
            LEFT JOIN profiles p ON u.id = p.id
            ORDER BY fd.period_year DESC, fd.period_month DESC
        `);

        // Total distributed all-time
        const totalDistributed = distributions
            .filter(d => d.status === 'distributed')
            .reduce((acc, d) => acc + Number(d.total_pool_amount), 0);

        // List of students who are not founders (for manual grant dropdown)
        const [nonFounders] = await db.query(`
            SELECT u.id, u.email, COALESCE(p.full_name, u.email) AS full_name
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            WHERE u.role = 'student'
              AND u.id NOT IN (SELECT user_id FROM founder_members)
            ORDER BY full_name ASC
            LIMIT 200
        `);

        res.json({
            settings: {
                id: settings.id,
                totalSeats,
                targetDirectSales: Number(settings.target_direct_sales),
                poolPercentage: Number(settings.pool_percentage),
                calculationBasis: settings.calculation_basis,
                currentRollover: Number(settings.current_rollover),
                isActive: Boolean(settings.is_active)
            },
            stats: {
                totalSeats,
                takenSeats,
                remainingSeats,
                totalDistributed
            },
            members,
            distributions,
            candidateStudents: nonFounders
        });
    } catch (err) {
        console.error('[getAdminFounders]', err);
        res.status(500).json({ error: 'Failed to fetch admin founder data' });
    }
};

/**
 * 4. ADMIN: Update founder settings
 */
exports.updateFounderSettings = async (req, res) => {
    const { totalSeats, targetDirectSales, poolPercentage, calculationBasis, isActive, currentRollover } = req.body;

    try {
        const [settingsRows] = await db.query('SELECT id FROM founder_settings LIMIT 1');
        if (settingsRows.length === 0) {
            await db.query(`
                INSERT INTO founder_settings (id, total_seats, target_direct_sales, pool_percentage, calculation_basis, current_rollover, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                genUuid(),
                Number(totalSeats || 100),
                Number(targetDirectSales || 5000),
                Number(poolPercentage || 2),
                calculationBasis || 'net_margin',
                Number(currentRollover || 0),
                isActive !== undefined ? (isActive ? 1 : 0) : 1
            ]);
        } else {
            const updates = [];
            const params = [];

            if (totalSeats !== undefined) {
                updates.push('total_seats = ?');
                params.push(Number(totalSeats));
            }
            if (targetDirectSales !== undefined) {
                updates.push('target_direct_sales = ?');
                params.push(Number(targetDirectSales));
            }
            if (poolPercentage !== undefined) {
                updates.push('pool_percentage = ?');
                params.push(Number(poolPercentage));
            }
            if (calculationBasis !== undefined) {
                updates.push('calculation_basis = ?');
                params.push(calculationBasis);
            }
            if (isActive !== undefined) {
                updates.push('is_active = ?');
                params.push(isActive ? 1 : 0);
            }
            if (currentRollover !== undefined) {
                updates.push('current_rollover = ?');
                params.push(Number(currentRollover));
            }

            if (updates.length > 0) {
                params.push(settingsRows[0].id);
                await db.query(`UPDATE founder_settings SET ${updates.join(', ')} WHERE id = ?`, params);
            }
        }

        res.json({ message: 'تم تحديث إعدادات نادي المؤسسين بنجاح' });
    } catch (err) {
        console.error('[updateFounderSettings]', err);
        res.status(500).json({ error: 'Failed to update founder settings' });
    }
};

/**
 * 5. ADMIN: Manually grant a founder seat to a user
 */
exports.manualGrantFounder = async (req, res) => {
    const { userId, notes, customSeatNumber } = req.body;
    if (!userId) {
        return res.status(400).json({ error: 'يرجى اختيار العضو' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [settingsRows] = await connection.query('SELECT * FROM founder_settings LIMIT 1');
        const settings = settingsRows[0] || { total_seats: 100 };

        // Check if user already exists
        const [existing] = await connection.query('SELECT id, seat_number FROM founder_members WHERE user_id = ?', [userId]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: `هذا العضو مسجل بالفعل كمؤسس في المقعد رقم #${existing[0].seat_number}` });
        }

        // Determine seat number
        let seatToAssign;
        if (customSeatNumber) {
            const requested = Number(customSeatNumber);
            if (requested < 1 || requested > settings.total_seats) {
                await connection.rollback();
                return res.status(400).json({ error: `رقم المقعد يجب أن يكون بين 1 و ${settings.total_seats}` });
            }
            // Check if requested seat is taken
            const [taken] = await connection.query('SELECT id FROM founder_members WHERE seat_number = ?', [requested]);
            if (taken.length > 0) {
                await connection.rollback();
                return res.status(400).json({ error: `المقعد رقم #${requested} محجوز بالفعل` });
            }
            seatToAssign = requested;
        } else {
            seatToAssign = await getNextAvailableSeat(connection, settings.total_seats);
            if (!seatToAssign) {
                await connection.rollback();
                return res.status(400).json({ error: 'عذراً، لقد اكتملت جميع المقاعد المتاحة (100 مقعد)' });
            }
        }

        // Calculate user direct sales in last 30 days for reference
        const [salesRow] = await connection.query(`
            SELECT COALESCE(SUM(COALESCE(up.amount_paid, p.price)), 0) AS direct_sales_30d
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            JOIN users direct_u ON direct_u.id = up.user_id
            WHERE direct_u.referrer_id = ?
              AND up.status IN ('active', 'upgraded')
              AND up.purchased_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, [userId]);
        const salesAchieved = Number(salesRow[0]?.direct_sales_30d || 0);

        const newId = genUuid();
        await connection.query(`
            INSERT INTO founder_members (id, user_id, seat_number, direct_sales_achieved, status, granted_by, notes)
            VALUES (?, ?, ?, ?, 'active', 'admin_manual', ?)
        `, [newId, userId, seatToAssign, salesAchieved, notes || 'تم المنح يدوياً بواسطة الإدارة']);

        // Send notification to user
        const notifMsg = `تهانينا! 👑 تم منحك مقعد العضوية الشرفية في نادي المؤسسين (Founders Club) برقم المقعد #${seatToAssign}. ستشارك الآن في حوض الـ 2% شهرياً!`;
        await connection.query(`
            INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
            VALUES (?, ?, 'success', '👑 تم تعيينك كعضو مؤسس (Founder)', ?, 0, NOW())
        `, [genUuid(), userId, notifMsg]);

        await connection.commit();
        res.status(201).json({ message: `تم منح العضو مقعد المؤسس رقم #${seatToAssign} بنجاح`, seatNumber: seatToAssign });
    } catch (err) {
        await connection.rollback();
        console.error('[manualGrantFounder]', err);
        res.status(500).json({ error: 'Failed to grant founder seat' });
    } finally {
        connection.release();
    }
};

/**
 * 6. ADMIN: Revoke or toggle founder seat status
 */
exports.toggleFounderStatus = async (req, res) => {
    const { id } = req.params;
    const { status, deleteMember } = req.body;

    try {
        if (deleteMember) {
            await db.query('DELETE FROM founder_members WHERE id = ?', [id]);
            return res.json({ message: 'تم حذف عضوية المؤسس وإعادة إتاحة المقعد' });
        }

        const newStatus = status === 'suspended' ? 'suspended' : 'active';
        await db.query('UPDATE founder_members SET status = ? WHERE id = ?', [newStatus, id]);
        res.json({ message: `تم تغيير حالة مقعد المؤسس إلى ${newStatus === 'active' ? 'نشط' : 'معلق'}` });
    } catch (err) {
        console.error('[toggleFounderStatus]', err);
        res.status(500).json({ error: 'Failed to update founder status' });
    }
};

/**
 * 7. ADMIN: Preview monthly 2% Founder Pool distribution
 */
exports.previewMonthlyDistribution = async (req, res) => {
    const now = new Date();
    const periodYear = Number(req.query.year || now.getFullYear());
    const periodMonth = Number(req.query.month || (now.getMonth() + 1));

    try {
        const { startDate, endDate } = getMonthDateRange(periodYear, periodMonth);

        // Fetch settings
        const [settingsRows] = await db.query('SELECT * FROM founder_settings LIMIT 1');
        const settings = settingsRows[0] || { pool_percentage: 2, current_rollover: 0 };

        // 1. Gross sales of active packages in period
        const [grossRows] = await db.query(`
            SELECT COALESCE(SUM(COALESCE(up.amount_paid, p.price)), 0) AS gross_sales
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            WHERE up.status IN ('active', 'upgraded')
              AND up.purchased_at >= ? AND up.purchased_at <= ?
        `, [startDate, endDate]);
        const grossSales = Number(grossRows[0]?.gross_sales || 0);

        // 2. Commissions paid in period
        const [commRows] = await db.query(`
            SELECT COALESCE(SUM(commission_amount), 0) AS total_commissions
            FROM commissions
            WHERE created_at >= ? AND created_at <= ? AND status != 'cancelled'
        `, [startDate, endDate]);
        const totalCommissions = Number(commRows[0]?.total_commissions || 0);

        // 3. Net Margin
        const netMargin = Math.max(0, Number((grossSales - totalCommissions).toFixed(2)));
        const poolPercentage = Number(settings.pool_percentage || 2.0);
        const poolBaseAmount = Number(((netMargin * poolPercentage) / 100).toFixed(2));
        const rolloverIn = Number(settings.current_rollover || 0);
        const totalPoolAmount = Number((poolBaseAmount + rolloverIn).toFixed(2));

        // 4. Eligible active founders
        const [founders] = await db.query(`
            SELECT 
                fm.id AS member_id,
                fm.seat_number,
                fm.qualified_at,
                u.id AS user_id,
                u.email,
                COALESCE(p.full_name, u.email) AS full_name,
                p.avatar_url
            FROM founder_members fm
            JOIN users u ON fm.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            WHERE fm.status = 'active'
            ORDER BY fm.seat_number ASC
        `);

        const foundersCount = founders.length;
        let sharePerFounder = 0;
        let rolloverOut = 0;

        if (foundersCount > 0) {
            sharePerFounder = Number((totalPoolAmount / foundersCount).toFixed(2));
            const remainder = Number((totalPoolAmount - (sharePerFounder * foundersCount)).toFixed(2));
            rolloverOut = remainder;
        } else {
            rolloverOut = totalPoolAmount;
        }

        // Check if already distributed
        const [existing] = await db.query(`
            SELECT * FROM founder_distributions
            WHERE period_year = ? AND period_month = ?
        `, [periodYear, periodMonth]);

        res.json({
            periodYear,
            periodMonth,
            startDate,
            endDate,
            grossSales,
            totalCommissions,
            netMargin,
            poolPercentage,
            poolBaseAmount,
            rolloverIn,
            totalPoolAmount,
            foundersCount,
            sharePerFounder,
            rolloverOut,
            isAlreadyDistributed: existing.length > 0 && existing[0].status === 'distributed',
            existingDistribution: existing[0] || null,
            founders: founders.map(f => ({
                ...f,
                share: sharePerFounder
            }))
        });
    } catch (err) {
        console.error('[previewMonthlyDistribution]', err);
        res.status(500).json({ error: 'Failed to calculate distribution preview' });
    }
};

/**
 * 8. ADMIN: Execute monthly 2% Founder Pool distribution
 */
exports.executeMonthlyDistribution = async (req, res) => {
    const { periodYear, periodMonth, notes } = req.body;
    const adminId = req.user.id;

    if (!periodYear || !periodMonth) {
        return res.status(400).json({ error: 'يرجى تحديد السنة والشهر' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Check if already distributed
        const [existingDist] = await connection.query(`
            SELECT id, status FROM founder_distributions
            WHERE period_year = ? AND period_month = ?
            FOR UPDATE
        `, [periodYear, periodMonth]);

        if (existingDist.length > 0 && existingDist[0].status === 'distributed') {
            await connection.rollback();
            return res.status(400).json({ error: `تم صرف أرباح حوض المؤسسين لشهر ${periodMonth}/${periodYear} مسبقاً` });
        }

        // Fetch settings
        const [settingsRows] = await connection.query('SELECT * FROM founder_settings LIMIT 1 FOR UPDATE');
        const settings = settingsRows[0] || { pool_percentage: 2, current_rollover: 0 };

        const { startDate, endDate } = getMonthDateRange(periodYear, periodMonth);

        // 1. Gross sales
        const [grossRows] = await connection.query(`
            SELECT COALESCE(SUM(COALESCE(up.amount_paid, p.price)), 0) AS gross_sales
            FROM user_packages up
            JOIN packages p ON up.package_id = p.id
            WHERE up.status IN ('active', 'upgraded')
              AND up.purchased_at >= ? AND up.purchased_at <= ?
        `, [startDate, endDate]);
        const grossSales = Number(grossRows[0]?.gross_sales || 0);

        // 2. Commissions
        const [commRows] = await connection.query(`
            SELECT COALESCE(SUM(commission_amount), 0) AS total_commissions
            FROM commissions
            WHERE created_at >= ? AND created_at <= ? AND status != 'cancelled'
        `, [startDate, endDate]);
        const totalCommissions = Number(commRows[0]?.total_commissions || 0);

        // 3. Net Margin & Pool
        const netMargin = Math.max(0, Number((grossSales - totalCommissions).toFixed(2)));
        const poolPercentage = Number(settings.pool_percentage || 2.0);
        const poolBaseAmount = Number(((netMargin * poolPercentage) / 100).toFixed(2));
        const rolloverIn = Number(settings.current_rollover || 0);
        const totalPoolAmount = Number((poolBaseAmount + rolloverIn).toFixed(2));

        // 4. Eligible active founders
        const [founders] = await connection.query(`
            SELECT fm.id AS member_id, fm.seat_number, fm.user_id, u.email
            FROM founder_members fm
            JOIN users u ON fm.user_id = u.id
            WHERE fm.status = 'active'
            ORDER BY fm.seat_number ASC
        `);

        const foundersCount = founders.length;
        const distributionId = existingDist.length > 0 ? existingDist[0].id : genUuid();

        let sharePerFounder = 0;
        let rolloverOut = 0;
        let status = 'distributed';

        if (foundersCount > 0) {
            sharePerFounder = Number((totalPoolAmount / foundersCount).toFixed(2));
            const totalPaid = Number((sharePerFounder * foundersCount).toFixed(2));
            rolloverOut = Number((totalPoolAmount - totalPaid).toFixed(2));

            // Credit each founder
            for (const founder of founders) {
                // Ensure wallet exists
                let [wallets] = await connection.query('SELECT * FROM user_wallets WHERE user_id = ? FOR UPDATE', [founder.user_id]);
                if (wallets.length === 0) {
                    const wId = genUuid();
                    await connection.query(`
                        INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn)
                        VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)
                    `, [wId, founder.user_id]);
                    wallets = [{ id: wId, user_id: founder.user_id, balance: 0, total_earned: 0 }];
                }

                const currentBal = Number(wallets[0].balance);
                const newBal = Number((currentBal + sharePerFounder).toFixed(2));

                await connection.query(`
                    UPDATE user_wallets
                    SET balance = balance + ?, total_earned = total_earned + ?
                    WHERE user_id = ?
                `, [sharePerFounder, sharePerFounder, founder.user_id]);

                // Create ledger transaction
                const trxId = genUuid();
                const desc = `أرباح حوض المؤسسين (2%) - شهر ${periodMonth}/${periodYear} (المقعد #${founder.seat_number})`;
                await connection.query(`
                    INSERT INTO transactions (id, user_id, type, amount, currency, balance_before, balance_after, status, reference_id, description, metadata)
                    VALUES (?, ?, 'bonus', ?, 'USD', ?, ?, 'completed', ?, ?, ?)
                `, [
                    trxId,
                    founder.user_id,
                    sharePerFounder,
                    currentBal,
                    newBal,
                    `FND-${periodYear}-${periodMonth}-S${founder.seat_number}`,
                    desc,
                    JSON.stringify({ founderPool: true, periodYear, periodMonth, seatNumber: founder.seat_number })
                ]);

                // Record payout
                const payoutId = genUuid();
                await connection.query(`
                    INSERT INTO founder_payouts (id, distribution_id, user_id, seat_number, amount, status, transaction_id)
                    VALUES (?, ?, ?, ?, ?, 'paid', ?)
                `, [payoutId, distributionId, founder.user_id, founder.seat_number, sharePerFounder, trxId]);

                // Notification
                const notifMsg = `مبروك! 👑 تم إيداع أرباحك من حوض المؤسسين (2%) بقيمة $${sharePerFounder.toFixed(2)} USD لشهر ${periodMonth}/${periodYear} في محفظتك بنجاح (المقعد #${founder.seat_number}).`;
                await connection.query(`
                    INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
                    VALUES (?, ?, 'success', '👑 صرف أرباح حوض المؤسسين الشهري', ?, 0, NOW())
                `, [genUuid(), founder.user_id, notifMsg]);
            }

            // Update rollover in settings
            await connection.query('UPDATE founder_settings SET current_rollover = ?', [rolloverOut]);
        } else {
            // No founders: roll over everything
            rolloverOut = totalPoolAmount;
            status = 'rolled_over';
            await connection.query('UPDATE founder_settings SET current_rollover = ?', [rolloverOut]);
        }

        // Insert or update distribution record
        if (existingDist.length > 0) {
            await connection.query(`
                UPDATE founder_distributions SET
                    gross_sales = ?,
                    total_commissions = ?,
                    net_margin = ?,
                    pool_percentage = ?,
                    pool_base_amount = ?,
                    rollover_in = ?,
                    total_pool_amount = ?,
                    founders_count = ?,
                    share_per_founder = ?,
                    rollover_out = ?,
                    status = ?,
                    notes = ?,
                    executed_by = ?,
                    executed_at = NOW()
                WHERE id = ?
            `, [
                grossSales, totalCommissions, netMargin, poolPercentage, poolBaseAmount,
                rolloverIn, totalPoolAmount, foundersCount, sharePerFounder, rolloverOut,
                status, notes || null, adminId, distributionId
            ]);
        } else {
            await connection.query(`
                INSERT INTO founder_distributions (
                    id, period_year, period_month, gross_sales, total_commissions, net_margin,
                    pool_percentage, pool_base_amount, rollover_in, total_pool_amount,
                    founders_count, share_per_founder, rollover_out, status, notes, executed_by, executed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
                distributionId, periodYear, periodMonth, grossSales, totalCommissions, netMargin,
                poolPercentage, poolBaseAmount, rolloverIn, totalPoolAmount,
                foundersCount, sharePerFounder, rolloverOut, status, notes || null, adminId
            ]);
        }

        await connection.commit();

        res.json({
            message: foundersCount > 0 
                ? `تم توزيع أرباح حوض المؤسسين بنجاح بمقدار $${sharePerFounder.toFixed(2)} لكل مؤسس من إجمالي $${totalPoolAmount.toFixed(2)}`
                : `لم يتأهل أي مؤسس، تم ترحيل رصيد الحوض بالكامل ($${rolloverOut.toFixed(2)}) للشهر التالي بنجاح`,
            distributionId,
            sharePerFounder,
            totalPoolAmount,
            foundersCount,
            status
        });
    } catch (err) {
        await connection.rollback();
        console.error('[executeMonthlyDistribution]', err);
        res.status(500).json({ error: 'Failed to execute founder distribution' });
    } finally {
        connection.release();
    }
};

// Export hook so package approval can trigger it
exports.checkAndQualifyFounder = checkAndQualifyFounder;
