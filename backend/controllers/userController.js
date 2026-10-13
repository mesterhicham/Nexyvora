const db = require('../config/db');

// --- COMMON ---
exports.getProfile = async (req, res) => {
    try {
        const [profiles] = await db.execute('SELECT * FROM profiles WHERE id = ?', [req.user.id]);
        if (profiles.length === 0) return res.status(404).json({ error: 'Profile not found' });
        res.json(profiles[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { full_name, phone, address, city, country, bio, date_of_birth, avatar_url } = req.body;
    try {
        let countryCode = undefined;
        if (country) {
            const cLower = country.toLowerCase().trim();
            if (cLower.includes('algeria') || cLower.includes('algérie') || cLower.includes('الجزائر') || cLower === 'dz') {
                countryCode = 'DZ';
            } else if (cLower.includes('morocco') || cLower.includes('maroc') || cLower.includes('المغرب') || cLower === 'ma') {
                countryCode = 'MA';
            } else if (country.trim().length === 2) {
                countryCode = country.trim().toUpperCase();
            } else {
                countryCode = 'GLOBAL';
            }
        }

        await db.execute(
            `UPDATE profiles SET 
                full_name = ?, phone = ?, address = ?, city = ?, country = ?, 
                country_code = COALESCE(?, country_code),
                bio = ?, date_of_birth = ?, avatar_url = ?, updated_at = NOW() 
             WHERE id = ?`,
            [full_name, phone, address, city, country, countryCode || null, bio, date_of_birth, avatar_url, req.user.id]
        );
        res.json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAccount = async (req, res) => {
    try {
        await db.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
        res.json({ message: 'Account deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- ADMIN DASHBOARD ---
exports.getAdminStats = async (req, res) => {
    try {
        // 1. Users & Students stats
        const [usersCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [studentsCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student' OR role != 'admin'");
        const [teachersCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'teacher' OR id IN (SELECT user_id FROM teachers)");
        const [businessPartnersCount] = await db.query("SELECT COUNT(DISTINCT user_id) as count FROM user_packages WHERE status = 'active'");

        // 2. Academic metrics
        const [programsCount] = await db.query('SELECT COUNT(*) as count FROM programs');
        const [cohortsCount] = await db.query('SELECT COUNT(*) as count FROM cohorts');
        const [modulesCount] = await db.query('SELECT COUNT(*) as count FROM modules');
        const [formationsCount] = await db.query('SELECT COUNT(*) as count FROM formations');

        // 3. Sales & Revenue
        const [packageSales] = await db.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(amount_paid), 0) as total 
            FROM user_packages 
            WHERE status IN ('active', 'upgraded')
        `);
        const [formationSales] = await db.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
            FROM formation_payments 
            WHERE status = 'completed' OR status = 'approved'
        `);
        const [completedDeposits] = await db.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE type = 'deposit' AND status = 'completed'
        `);
        const [pendingDeposits] = await db.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
            FROM transactions 
            WHERE type = 'deposit' AND status = 'pending'
        `);

        // Real platform sales = Package purchases/upgrades + Course/Formation sales.
        // Wallet deposits are liabilities (customer wallet funds), NOT platform sales.
        const totalSales = Number(packageSales[0].total) + Number(formationSales[0].total);
        const totalSalesCount = Number(packageSales[0].count) + Number(formationSales[0].count);

        const totalDeposits = Number(completedDeposits[0].total);
        const totalDepositsCount = Number(completedDeposits[0].count);
        const pendingDepositsTotal = Number(pendingDeposits[0].total);
        const pendingDepositsCount = Number(pendingDeposits[0].count);

        // 4. Withdrawals
        const [approvedWithdrawals] = await db.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
            FROM withdrawal_requests 
            WHERE status = 'approved' OR status = 'completed'
        `);
        const [pendingWithdrawals] = await db.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
            FROM withdrawal_requests 
            WHERE status = 'pending'
        `);
        const [rejectedWithdrawals] = await db.query(`
            SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total 
            FROM withdrawal_requests 
            WHERE status = 'rejected'
        `);

        const totalWithdrawals = Number(approvedWithdrawals[0].total);
        const totalWithdrawalsCount = Number(approvedWithdrawals[0].count);

        // 5. Wallets & Commissions
        const [wallets] = await db.query(`
            SELECT 
                COALESCE(SUM(balance), 0) as total_balances,
                COALESCE(SUM(total_earned), 0) as total_commissions,
                COALESCE(SUM(pending_balance), 0) as total_pending
            FROM user_wallets
        `);

        // 6. Recent Activities / Recent Transactions
        const [recentTransactions] = await db.query(`
            SELECT t.*, COALESCE(p.full_name, u.email) as user_name
            FROM transactions t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            ORDER BY t.created_at DESC
            LIMIT 6
        `);

        // 7. Recent Pending Withdrawals
        const [recentPendingWithdrawals] = await db.query(`
            SELECT w.*, COALESCE(p.full_name, u.email) as user_name
            FROM withdrawal_requests w
            LEFT JOIN users u ON w.user_id = u.id
            LEFT JOIN profiles p ON u.id = p.id
            WHERE w.status = 'pending'
            ORDER BY w.created_at DESC
            LIMIT 5
        `);

        // 8. Monthly stats (last 6 months) for chart
        const [monthly] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%b %Y') as month,
                DATE_FORMAT(created_at, '%Y-%m') as sort_key,
                COUNT(*) as count
            FROM users
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY month, sort_key
            ORDER BY sort_key ASC
        `);

        let monthlyEnrollments = monthly;
        if (!monthlyEnrollments || monthlyEnrollments.length === 0) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
            monthlyEnrollments = months.map(m => ({ month: m, count: 0 }));
        }

        res.json({
            // Core totals
            totalMembers: usersCount[0].count,
            students: studentsCount[0].count,
            activeStudents: studentsCount[0].count,
            teachers: teachersCount[0].count,
            businessPartners: businessPartnersCount[0].count,

            // Sales & Financials
            totalSales,
            totalSalesCount,
            packageSales: Number(packageSales[0].total),
            packageSalesCount: Number(packageSales[0].count),
            courseSales: Number(formationSales[0].total),

            // Deposits (Tracked cleanly & separately from sales)
            totalDeposits,
            totalDepositsCount,
            pendingDeposits: pendingDepositsTotal,
            pendingDepositsCount,

            // Withdrawals
            totalWithdrawals,
            totalWithdrawalsCount,
            pendingWithdrawals: Number(pendingWithdrawals[0].total),
            pendingWithdrawalsCount: Number(pendingWithdrawals[0].count),
            rejectedWithdrawals: Number(rejectedWithdrawals[0].total),

            // Net & Wallets
            netPlatformProfit: Math.max(0, totalSales - totalWithdrawals),
            totalMemberBalances: Number(wallets[0].total_balances),
            totalCommissionsPaid: Number(wallets[0].total_commissions),

            // Academic
            programs: programsCount[0].count,
            cohorts: cohortsCount[0].count,
            modules: modulesCount[0].count,
            formations: formationsCount[0].count,
            revenue: totalSales,

            // Lists & Charts
            recentTransactions,
            recentPendingWithdrawals,
            monthlyEnrollments
        });
    } catch (err) {
        console.error('[getAdminStats]', err);
        res.status(500).json({ error: err.message });
    }
};

// --- STUDENT DASHBOARD ---
exports.getStudentStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const [student] = await db.execute('SELECT id, cohort_id FROM students WHERE user_id = ?', [userId]);

        if (student.length === 0) return res.status(404).json({ error: 'Student record not found' });

        const studentId = student[0].id;
        const cohortId = student[0].cohort_id;

        const [modulesCount] = await db.execute(`
      SELECT COUNT(*) as count FROM modules m
      JOIN cohorts c ON m.specialty_id = c.specialty_id
      WHERE c.id = ?
    `, [cohortId]);

        const [payments] = await db.execute('SELECT SUM(amount) as total FROM payments WHERE student_id = ? AND status = "approved"', [studentId]);

        res.json({
            enrolledModules: modulesCount[0].count,
            totalPaid: payments[0].total || 0,
            cohortId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- TEACHER DASHBOARD ---
exports.getTeacherStats = async (req, res) => {
    try {
        const userId = req.user.id;
        const [teacher] = await db.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);

        if (teacher.length === 0) return res.status(404).json({ error: 'Teacher record not found' });

        const teacherId = teacher[0].id;

        const [modules] = await db.execute('SELECT COUNT(*) as count FROM modules WHERE teacher_id = ?', [teacherId]);
        const [upcomingMeetings] = await db.execute('SELECT COUNT(*) as count FROM zoom_meetings WHERE host_id = ? AND scheduled_at > NOW()', [userId]);

        res.json({
            assignedModules: modules[0].count,
            upcomingMeetings: upcomingMeetings[0].count
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
