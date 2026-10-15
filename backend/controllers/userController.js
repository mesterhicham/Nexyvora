const db = require('../config/db');
const bcrypt = require('bcryptjs');

// --- HELPER TO STANDARDIZE COUNTRY CODE ---
function resolveCountryCode(country) {
    if (!country) return null;
    const cLower = String(country).toLowerCase().trim();
    if (cLower.includes('algeria') || cLower.includes('algérie') || cLower.includes('الجزائر') || cLower === 'dz') {
        return 'DZ';
    } else if (cLower.includes('morocco') || cLower.includes('maroc') || cLower.includes('المغرب') || cLower === 'ma') {
        return 'MA';
    } else if (country.trim().length === 2) {
        return country.trim().toUpperCase();
    }
    return 'GLOBAL';
}

// --- COMMON: GET USER PROFILE ---
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Ensure user exists in users table
        const [users] = await db.execute('SELECT id, email, role, status as user_status, affiliate_code, referrer_id, kyc_status FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User account not found' });
        }
        const user = users[0];

        // Ensure profile row exists
        let [profileRows] = await db.execute('SELECT * FROM profiles WHERE id = ?', [userId]);
        if (profileRows.length === 0) {
            // Auto-heal missing profile row
            await db.execute(
                'INSERT INTO profiles (id, email, full_name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
                [userId, user.email, user.email.split('@')[0]]
            );
            [profileRows] = await db.execute('SELECT * FROM profiles WHERE id = ?', [userId]);
        }
        const profile = profileRows[0];

        // Build base profile response
        const responseData = {
            id: profile.id,
            email: user.email,
            role: user.role,
            user_status: user.user_status,
            affiliate_code: user.affiliate_code,
            referrer_id: user.referrer_id,
            kyc_status: user.kyc_status || 'unverified',
            full_name: profile.full_name || '',
            avatar_url: profile.avatar_url || null,
            phone: profile.phone || profile.whatsapp_number || '',
            whatsapp_number: profile.whatsapp_number || profile.phone || '',
            city: profile.city || '',
            country: profile.country || '',
            country_code: profile.country_code || resolveCountryCode(profile.country),
            address: profile.address || '',
            bio: profile.bio || '',
            date_of_birth: profile.date_of_birth || null,
            created_at: profile.created_at,
            updated_at: profile.updated_at
        };

        // If teacher, attach teacher details
        if (user.role === 'teacher') {
            try {
                const [teachers] = await db.execute('SELECT id, specialty, experience, degree, bio as teacher_bio, certifications, status as teacher_status FROM teachers WHERE user_id = ?', [userId]);
                if (teachers.length > 0) {
                    const t = teachers[0];
                    responseData.specialty = t.specialty || '';
                    responseData.experience = t.experience || '';
                    responseData.degree = t.degree || '';
                    responseData.teacher_bio = t.teacher_bio || '';
                    responseData.teacher_status = t.teacher_status || 'active';
                    try {
                        responseData.certifications = typeof t.certifications === 'string' ? JSON.parse(t.certifications) : (t.certifications || []);
                    } catch (e) {
                        responseData.certifications = [];
                    }
                }
            } catch (tErr) {
                console.warn('[getProfile] Teacher join warning:', tErr.message);
            }
        }

        // If student, attach student details
        if (user.role === 'student') {
            try {
                const [students] = await db.execute(`
                    SELECT s.id as student_id, s.cohort_id, s.enrollment_date, s.status as student_status,
                           c.name as cohort_name, sp.name as specialty_name, p.name as program_name
                    FROM students s
                    LEFT JOIN cohorts c ON s.cohort_id = c.id
                    LEFT JOIN specialties sp ON c.specialty_id = sp.id
                    LEFT JOIN programs p ON sp.program_id = p.id
                    WHERE s.user_id = ?
                `, [userId]);
                if (students.length > 0) {
                    const s = students[0];
                    responseData.cohort_id = s.cohort_id;
                    responseData.cohort_name = s.cohort_name;
                    responseData.specialty_name = s.specialty_name;
                    responseData.program_name = s.program_name;
                    responseData.enrollment_date = s.enrollment_date;
                    responseData.student_status = s.student_status;
                }
            } catch (sErr) {
                console.warn('[getProfile] Student join warning:', sErr.message);
            }
        }


        res.json(responseData);
    } catch (err) {
        console.error('[getProfile] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// --- COMMON: UPDATE USER PROFILE ---
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const body = req.body || {};

        // Security check: Never allow changing sensitive fields via updateProfile
        delete body.id;
        delete body.role;
        delete body.status;
        delete body.user_status;
        delete body.password;
        delete body.affiliate_code;
        delete body.referrer_id;
        delete body.email_verified;

        // Prepare profile table fields
        const profileUpdates = [];
        const profileValues = [];

        if (body.full_name !== undefined) {
            profileUpdates.push('full_name = ?');
            profileValues.push(body.full_name ? String(body.full_name).trim() : null);
        }

        if (body.phone !== undefined || body.whatsapp_number !== undefined) {
            const phoneVal = (body.phone !== undefined ? body.phone : body.whatsapp_number);
            const cleanPhone = phoneVal ? String(phoneVal).trim() : null;
            profileUpdates.push('phone = ?');
            profileValues.push(cleanPhone);
            profileUpdates.push('whatsapp_number = ?');
            profileValues.push(cleanPhone);
        }

        if (body.address !== undefined) {
            profileUpdates.push('address = ?');
            profileValues.push(body.address ? String(body.address).trim() : null);
        }

        if (body.city !== undefined) {
            profileUpdates.push('city = ?');
            profileValues.push(body.city ? String(body.city).trim() : null);
        }

        if (body.country !== undefined) {
            const cleanCountry = body.country ? String(body.country).trim() : null;
            profileUpdates.push('country = ?');
            profileValues.push(cleanCountry);
            const countryCode = resolveCountryCode(cleanCountry);
            profileUpdates.push('country_code = ?');
            profileValues.push(countryCode);
        }

        if (body.bio !== undefined) {
            profileUpdates.push('bio = ?');
            profileValues.push(body.bio ? String(body.bio).trim() : null);
        }

        if (body.date_of_birth !== undefined) {
            profileUpdates.push('date_of_birth = ?');
            profileValues.push(body.date_of_birth ? body.date_of_birth : null);
        }

        if (body.avatar_url !== undefined) {
            profileUpdates.push('avatar_url = ?');
            profileValues.push(body.avatar_url ? String(body.avatar_url).trim() : null);
        }

        if (profileUpdates.length > 0) {
            profileUpdates.push('updated_at = NOW()');
            profileValues.push(userId);

            const sql = `UPDATE profiles SET ${profileUpdates.join(', ')} WHERE id = ?`;
            await db.execute(sql, profileValues);
        }

        // If user is a teacher, also update teachers table if teacher fields provided
        if (req.user.role === 'teacher') {
            const teacherUpdates = [];
            const teacherValues = [];

            if (body.specialty !== undefined) {
                teacherUpdates.push('specialty = ?');
                teacherValues.push(body.specialty ? String(body.specialty).trim() : null);
            }
            if (body.experience !== undefined) {
                teacherUpdates.push('experience = ?');
                teacherValues.push(body.experience ? String(body.experience).trim() : null);
            }
            if (body.degree !== undefined) {
                teacherUpdates.push('degree = ?');
                teacherValues.push(body.degree ? String(body.degree).trim() : null);
            }
            if (body.bio !== undefined || body.teacher_bio !== undefined) {
                const bioVal = body.teacher_bio !== undefined ? body.teacher_bio : body.bio;
                teacherUpdates.push('bio = ?');
                teacherValues.push(bioVal ? String(bioVal).trim() : null);
            }

            if (teacherUpdates.length > 0) {
                const [existingT] = await db.execute('SELECT id FROM teachers WHERE user_id = ?', [userId]);
                if (existingT.length > 0) {
                    teacherValues.push(userId);
                    await db.execute(`UPDATE teachers SET ${teacherUpdates.join(', ')} WHERE user_id = ?`, teacherValues);
                } else {
                    await db.execute(
                        'INSERT INTO teachers (id, user_id, specialty, experience, degree, bio, status, created_at) VALUES (UUID(), ?, ?, ?, ?, ?, "active", NOW())',
                        [userId, body.specialty || null, body.experience || null, body.degree || null, body.bio || null]
                    );
                }
            }
        }

        // Return updated profile
        return exports.getProfile(req, res);
    } catch (err) {
        console.error('[updateProfile] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// --- COMMON: CHANGE PASSWORD ---
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'كلمة المرور الحالية وكلمة المرور الجديدة مطلوبتان / Current and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'يجب أن تتكون كلمة المرور الجديدة من 8 أحرف على الأقل / New password must be at least 8 characters' });
        }

        const [users] = await db.execute('SELECT id, password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'المستخدم غير موجود / User not found' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة / Current password is incorrect' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute(
            'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, userId]
        );

        res.json({ message: 'تم تغيير كلمة المرور بنجاح / Password changed successfully' });
    } catch (err) {
        console.error('[changePassword] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// --- COMMON: DELETE ACCOUNT ---
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
