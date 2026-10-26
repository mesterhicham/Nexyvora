const db = require('../config/db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- PROGRAMS ---
exports.getAllPrograms = async (req, res) => {
    try {
        const [programs] = await db.execute('SELECT * FROM programs ORDER BY created_at DESC');
        res.json(programs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createProgram = async (req, res) => {
    const { name, description, duration, image_url } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO programs (id, name, description, duration, image_url) VALUES (?, ?, ?, ?, ?)',
            [id, name, description || null, duration || null, image_url || null]
        );
        res.status(201).json({ id, name, description: description || null, duration: duration || null, image_url: image_url || null });
    } catch (err) {
        console.error('[createProgram]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateProgram = async (req, res) => {
    const { id } = req.params;
    const { name, description, duration, image_url } = req.body;
    try {
        await db.execute(
            'UPDATE programs SET name = ?, description = ?, duration = ?, image_url = ?, updated_at = NOW() WHERE id = ?',
            [name, description, duration, image_url || null, id]
        );
        res.json({ id, name, description, duration, image_url: image_url || null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProgram = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM programs WHERE id = ?', [id]);
        res.json({ message: 'Program deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- SPECIALTIES ---
exports.getAllSpecialties = async (req, res) => {
    try {
        const [specialties] = await db.execute(`
            SELECT s.*, p.name as program_name 
            FROM specialties s 
            LEFT JOIN programs p ON s.program_id = p.id 
            ORDER BY s.created_at DESC
        `);
        res.json(specialties);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createSpecialty = async (req, res) => {
    const { name, program_id, description } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO specialties (id, name, program_id, description) VALUES (?, ?, ?, ?)',
            [id, name, program_id || null, description || null]
        );
        res.status(201).json({ id, name, program_id: program_id || null, description: description || null });
    } catch (err) {
        console.error('[createSpecialty]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateSpecialty = async (req, res) => {
    const { id } = req.params;
    const { name, program_id, description } = req.body;
    try {
        await db.execute(
            'UPDATE specialties SET name = ?, program_id = ?, description = ?, updated_at = NOW() WHERE id = ?',
            [name, program_id || null, description || null, id]
        );
        res.json({ id, name, program_id: program_id || null, description: description || null });
    } catch (err) {
        console.error('[updateSpecialty]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSpecialty = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM specialties WHERE id = ?', [id]);
        res.json({ message: 'Specialty deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- COHORTS ---
exports.getAllCohorts = async (req, res) => {
    try {
        const [cohorts] = await db.execute(`
            SELECT c.*, s.name as specialty_name 
            FROM cohorts c 
            LEFT JOIN specialties s ON c.specialty_id = s.id 
            ORDER BY c.created_at DESC
        `);
        res.json(cohorts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCohort = async (req, res) => {
    const { name, specialty_id, start_date, end_date } = req.body;
    const id = crypto.randomUUID();
    try {
        await db.execute(
            'INSERT INTO cohorts (id, name, specialty_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
            [id, name, specialty_id || null, start_date || null, end_date || null]
        );
        res.status(201).json({ id, name, specialty_id: specialty_id || null, start_date: start_date || null, end_date: end_date || null });
    } catch (err) {
        console.error('[createCohort]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateCohort = async (req, res) => {
    const { id } = req.params;
    const { name, specialty_id, start_date, end_date } = req.body;
    try {
        await db.execute(
            'UPDATE cohorts SET name = ?, specialty_id = ?, start_date = ?, end_date = ?, updated_at = NOW() WHERE id = ?',
            [name, specialty_id || null, start_date || null, end_date || null, id]
        );
        res.json({ id, name, specialty_id: specialty_id || null, start_date: start_date || null, end_date: end_date || null });
    } catch (err) {
        console.error('[updateCohort]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteCohort = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM cohorts WHERE id = ?', [id]);
        res.json({ message: 'Cohort deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- MODULES ---
exports.getAllModules = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT m.*, s.name as specialty_name, p.full_name as teacher_name, t.user_id as teacher_user_id 
            FROM modules m 
            LEFT JOIN specialties s ON m.specialty_id = s.id 
            LEFT JOIN teachers t ON m.teacher_id = t.id
            LEFT JOIN profiles p ON t.user_id = p.id
            ORDER BY m.created_at DESC
        `);

        const modules = rows.map(row => ({
            ...row,
            specialty_name: row.specialty_name,
            teacher_name: row.teacher_name,
            specialty: row.specialty_name ? {
                id: row.specialty_id,
                name: row.specialty_name
            } : null,
            teacher: row.teacher_name ? {
                id: row.teacher_id,
                user_id: row.teacher_user_id,
                full_name: row.teacher_name
            } : null
        }));

        res.json(modules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getModuleById = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute(`
            SELECT m.*, s.name as specialty_name, p.full_name as teacher_name, t.user_id as teacher_user_id 
            FROM modules m 
            LEFT JOIN specialties s ON m.specialty_id = s.id 
            LEFT JOIN teachers t ON m.teacher_id = t.id
            LEFT JOIN profiles p ON t.user_id = p.id
            WHERE m.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const row = rows[0];
        const module = {
            ...row,
            specialty_name: row.specialty_name,
            teacher_name: row.teacher_name,
            specialty: row.specialty_name ? {
                id: row.specialty_id,
                name: row.specialty_name
            } : null,
            teacher: row.teacher_name ? {
                id: row.teacher_id,
                user_id: row.teacher_user_id,
                full_name: row.teacher_name
            } : null
        };

        res.json(module);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Teachers may only manage modules assigned to their own teacher record
async function teacherOwnsModule(user, moduleId) {
    const [rows] = await db.execute(
        'SELECT m.id FROM modules m JOIN teachers t ON m.teacher_id = t.id WHERE m.id = ? AND t.user_id = ?',
        [moduleId, user.id]
    );
    return rows.length > 0;
}

exports.createModule = async (req, res) => {
    const { code, name, specialty_id, hours } = req.body;
    let { teacher_id } = req.body;

    try {
        if (req.user && req.user.role === 'teacher') {
            const [tRows] = await db.execute('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
            if (tRows.length > 0) {
                teacher_id = tRows[0].id;
            }
        } else if (teacher_id) {
            const [tRows] = await db.execute('SELECT id FROM teachers WHERE id = ? OR user_id = ?', [teacher_id, teacher_id]);
            if (tRows.length > 0) {
                teacher_id = tRows[0].id;
            }
        }

        const id = crypto.randomUUID();
        await db.execute(
            'INSERT INTO modules (id, code, name, specialty_id, teacher_id, hours) VALUES (?, ?, ?, ?, ?, ?)',
            [id, code, name, specialty_id || null, teacher_id || null, hours || 0]
        );
        res.status(201).json({ id, code, name, specialty_id: specialty_id || null, teacher_id: teacher_id || null, hours: hours || 0 });
    } catch (err) {
        console.error('[createModule]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateModule = async (req, res) => {
    const { id } = req.params;
    let { code, name, specialty_id, teacher_id, hours } = req.body;
    try {
        if (req.user.role === 'teacher') {
            if (!(await teacherOwnsModule(req.user, id))) {
                return res.status(403).json({ error: 'Access denied: you can only edit your own modules.' });
            }
            const [tRows] = await db.execute('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
            teacher_id = tRows[0].id;
        } else if (teacher_id) {
            const [tRows] = await db.execute('SELECT id FROM teachers WHERE id = ? OR user_id = ?', [teacher_id, teacher_id]);
            if (tRows.length > 0) {
                teacher_id = tRows[0].id;
            }
        }
        await db.execute(
            'UPDATE modules SET code = ?, name = ?, specialty_id = ?, teacher_id = ?, hours = ?, updated_at = NOW() WHERE id = ?',
            [code, name, specialty_id || null, teacher_id || null, hours || 0, id]
        );
        res.json({ id, code, name, specialty_id: specialty_id || null, teacher_id: teacher_id || null, hours: hours || 0 });
    } catch (err) {
        console.error('[updateModule]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteModule = async (req, res) => {
    const { id } = req.params;
    try {
        if (req.user.role === 'teacher' && !(await teacherOwnsModule(req.user, id))) {
            return res.status(403).json({ error: 'Access denied: you can only delete your own modules.' });
        }
        await db.execute('DELETE FROM modules WHERE id = ?', [id]);
        res.json({ message: 'Module deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- STUDENTS ---
exports.getAllStudents = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                s.*, 
                p.full_name, 
                p.email, 
                c.name as cohort_name,
                sp.name as specialty_name,
                pr.name as program_name
            FROM students s 
            LEFT JOIN profiles p ON s.user_id = p.id 
            LEFT JOIN cohorts c ON s.cohort_id = c.id
            LEFT JOIN specialties sp ON c.specialty_id = sp.id
            LEFT JOIN programs pr ON sp.program_id = pr.id
            ORDER BY s.created_at DESC
        `);

        // Map flat results to nested structure expected by frontend
        const students = rows.map(row => ({
            id: row.id,
            user_id: row.user_id,
            cohort_id: row.cohort_id,
            enrollment_date: row.enrollment_date,
            status: row.status,
            created_at: row.created_at,
            profile: row.full_name ? {
                full_name: row.full_name,
                email: row.email
            } : null,
            cohort: row.cohort_name ? {
                name: row.cohort_name,
                specialty: row.specialty_name ? {
                    name: row.specialty_name,
                    program: row.program_name ? {
                        name: row.program_name
                    } : null
                } : null
            } : null
        }));

        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentDetails = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get student, profile, cohort, specialty, program
        const [studentRows] = await db.execute(`
            SELECT 
                s.*, 
                p.full_name, 
                p.email, 
                p.phone, 
                p.whatsapp_number, 
                p.city, 
                p.country, 
                p.avatar_url, 
                p.address, 
                p.bio, 
                p.date_of_birth,
                c.id as cohort_id,
                c.name as cohort_name,
                c.start_date as cohort_start_date,
                c.end_date as cohort_end_date,
                sp.id as specialty_id,
                sp.name as specialty_name,
                pr.id as program_id,
                pr.name as program_name,
                pr.duration as program_duration
            FROM students s
            LEFT JOIN profiles p ON s.user_id = p.id
            LEFT JOIN cohorts c ON s.cohort_id = c.id
            LEFT JOIN specialties sp ON c.specialty_id = sp.id
            LEFT JOIN programs pr ON sp.program_id = pr.id
            WHERE s.id = ? OR s.user_id = ?
        `, [id, id]);

        if (studentRows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const student = studentRows[0];
        const studentId = student.id;
        const userId = student.user_id;

        // 2. Placement Test & Level Evaluation
        const [testRows] = await db.execute(`
            SELECT * FROM student_test_results
            WHERE student_id = ? OR student_id = ?
            LIMIT 1
        `, [studentId, userId]);

        let placementTest = null;
        let evaluatedLevel = 'مستوى عام (Standard)';
        if (testRows.length > 0) {
            const tr = testRows[0];
            const pct = tr.total_points > 0 ? (tr.score / tr.total_points) * 100 : tr.score;
            if (pct >= 85) evaluatedLevel = 'متقدم (Advanced)';
            else if (pct >= 60) evaluatedLevel = 'متوسط (Intermediate)';
            else evaluatedLevel = 'مبتدئ (Beginner)';

            placementTest = {
                score: tr.score,
                total_points: tr.total_points,
                percentage: Math.round(pct),
                level: evaluatedLevel,
                completed_at: tr.completed_at
            };
        }

        // 3. Financials & Payments
        let programPrice = 1000;
        let currency = 'USD';
        if (student.program_id) {
            const [pricingRows] = await db.execute(
                'SELECT price, currency FROM program_pricing WHERE program_id = ? LIMIT 1',
                [student.program_id]
            );
            if (pricingRows.length > 0) {
                programPrice = parseFloat(pricingRows[0].price) || 0;
                currency = pricingRows[0].currency || 'USD';
            }
        }

        const [payments] = await db.execute(`
            SELECT * FROM payments 
            WHERE student_id = ? OR student_id = ?
            ORDER BY created_at DESC
        `, [studentId, userId]);

        let totalPaid = 0;
        payments.forEach(p => {
            if (p.status === 'approved') {
                totalPaid += parseFloat(p.amount) || 0;
            }
        });
        const remainingBalance = Math.max(0, programPrice - totalPaid);

        // 4. Attendance Statistics & Records
        const [attendanceRecords] = await db.execute(`
            SELECT la.*, l.title as lesson_title, l.scheduled_date, m.name as module_name, m.code as module_code
            FROM lesson_attendance la
            JOIN lessons l ON la.lesson_id = l.id
            LEFT JOIN modules m ON l.module_id = m.id
            WHERE la.student_id = ? OR la.student_id = ?
            ORDER BY l.scheduled_date DESC
        `, [studentId, userId]);

        let totalAttendance = attendanceRecords.length;
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        attendanceRecords.forEach(a => {
            if (a.status === 'present') presentCount++;
            else if (a.status === 'absent') absentCount++;
            else if (a.status === 'late') lateCount++;
        });

        const attendanceRate = totalAttendance > 0 
            ? Math.round(((presentCount + (lateCount * 0.5)) / totalAttendance) * 100) 
            : 100;

        // 5. Assignment Submissions & Grades
        const [submissions] = await db.execute(`
            SELECT sub.*, a.title as assignment_title, a.due_date, a.max_grade, m.name as module_name
            FROM assignment_submissions sub
            JOIN assignments a ON sub.assignment_id = a.id
            LEFT JOIN modules m ON a.module_id = m.id
            WHERE sub.student_id = ? OR sub.student_id = ?
            ORDER BY sub.submitted_at DESC
        `, [studentId, userId]);

        let totalGrade = 0;
        let gradedCount = 0;
        submissions.forEach(s => {
            if (s.grade !== null && s.grade !== undefined) {
                totalGrade += parseFloat(s.grade);
                gradedCount++;
            }
        });
        const averageGrade = gradedCount > 0 ? Math.round((totalGrade / gradedCount) * 10) / 10 : null;

        // 6. Cohort Modules
        let modules = [];
        if (student.specialty_id) {
            const [mRows] = await db.execute(`
                SELECT m.*, (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lessons_count
                FROM modules m
                WHERE m.specialty_id = ?
            `, [student.specialty_id]);
            modules = mRows;
        }

        // 7. Formations enrolled
        const [formations] = await db.execute(`
            SELECT fe.*, f.title as formation_title, f.price as formation_price, f.thumbnail_url
            FROM formation_enrollments fe
            JOIN formations f ON fe.formation_id = f.id
            WHERE fe.student_id = ? OR fe.student_id = ?
            ORDER BY fe.enrolled_at DESC
        `, [studentId, userId]);

        res.json({
            student: {
                id: student.id,
                user_id: student.user_id,
                cohort_id: student.cohort_id,
                enrollment_date: student.enrollment_date,
                status: student.status,
                created_at: student.created_at,
                profile: {
                    full_name: student.full_name,
                    email: student.email,
                    phone: student.phone,
                    whatsapp_number: student.whatsapp_number,
                    city: student.city,
                    country: student.country,
                    avatar_url: student.avatar_url,
                    address: student.address,
                    bio: student.bio,
                    date_of_birth: student.date_of_birth
                },
                cohort: student.cohort_name ? {
                    id: student.cohort_id,
                    name: student.cohort_name,
                    start_date: student.cohort_start_date,
                    end_date: student.cohort_end_date,
                    specialty: {
                        id: student.specialty_id,
                        name: student.specialty_name,
                        program: {
                            id: student.program_id,
                            name: student.program_name,
                            duration: student.program_duration
                        }
                    }
                } : null
            },
            level: evaluatedLevel,
            placementTest,
            financials: {
                totalPrice: programPrice,
                totalPaid,
                remainingBalance,
                currency,
                payments
            },
            attendance: {
                rate: attendanceRate,
                totalSessions: totalAttendance,
                presentCount,
                absentCount,
                lateCount,
                records: attendanceRecords
            },
            progress: {
                modules,
                submissions,
                averageGrade,
                formations
            }
        });
    } catch (err) {
        console.error('[getStudentDetails]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateStudent = async (req, res) => {
    const { id } = req.params;
    const { 
        cohort_id, 
        status, 
        enrollment_date,
        fullName,
        phone,
        whatsappNumber,
        city,
        country,
        address,
        bio,
        date_of_birth
    } = req.body;

    try {
        const [sRows] = await db.execute('SELECT user_id FROM students WHERE id = ?', [id]);
        if (sRows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        const userId = sRows[0].user_id;

        // 1. Update students table
        const sUpdates = [];
        const sValues = [];
        if (cohort_id !== undefined) { sUpdates.push('cohort_id = ?'); sValues.push(cohort_id || null); }
        if (status !== undefined) { sUpdates.push('status = ?'); sValues.push(status); }
        if (enrollment_date !== undefined) { sUpdates.push('enrollment_date = ?'); sValues.push(enrollment_date || null); }

        if (sUpdates.length > 0) {
            sUpdates.push('updated_at = NOW()');
            sValues.push(id);
            await db.execute(`UPDATE students SET ${sUpdates.join(', ')} WHERE id = ?`, sValues);
        }

        // 2. Update profiles table
        if (userId) {
            const pUpdates = [];
            const pValues = [];
            if (fullName !== undefined) { pUpdates.push('full_name = ?'); pValues.push(fullName); }
            if (phone !== undefined) { pUpdates.push('phone = ?'); pValues.push(phone); }
            if (whatsappNumber !== undefined) { pUpdates.push('whatsapp_number = ?'); pValues.push(whatsappNumber); }
            if (city !== undefined) { pUpdates.push('city = ?'); pValues.push(city); }
            if (country !== undefined) { pUpdates.push('country = ?'); pValues.push(country); }
            if (address !== undefined) { pUpdates.push('address = ?'); pValues.push(address); }
            if (bio !== undefined) { pUpdates.push('bio = ?'); pValues.push(bio); }
            if (date_of_birth !== undefined) { pUpdates.push('date_of_birth = ?'); pValues.push(date_of_birth || null); }

            if (pUpdates.length > 0) {
                pUpdates.push('updated_at = NOW()');
                pValues.push(userId);
                await db.execute(`UPDATE profiles SET ${pUpdates.join(', ')} WHERE id = ?`, pValues);
            }
        }

        res.json({ message: 'Student updated successfully', id, cohort_id, status });
    } catch (err) {
        console.error('[updateStudent]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.impersonateStudent = async (req, res) => {
    const { id } = req.params;
    try {
        const [sRows] = await db.execute(`
            SELECT s.id as student_id, s.user_id, u.email, u.role, u.token_version, p.full_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN profiles p ON s.user_id = p.id
            WHERE s.id = ? OR s.user_id = ?
        `, [id, id]);

        if (sRows.length === 0) {
            return res.status(404).json({ error: 'Student user not found' });
        }

        const student = sRows[0];
        const token = jwt.sign(
            { id: student.user_id, role: 'student', token_version: student.token_version || 1, impersonatedBy: req.user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: student.user_id,
                email: student.email,
                role: 'student',
                full_name: student.full_name || 'Student'
            },
            studentId: student.student_id
        });
    } catch (err) {
        console.error('[impersonateStudent]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.addStudentPayment = async (req, res) => {
    const { id } = req.params;
    const { amount, payment_method, currency, notes, reference_number, program_id, status } = req.body;
    try {
        const paymentId = crypto.randomUUID();
        await db.execute(`
            INSERT INTO payments (id, student_id, program_id, amount, currency, payment_method, status, reference_number, notes, reviewed_by, reviewed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            paymentId,
            id,
            program_id || null,
            amount,
            currency || 'USD',
            payment_method || 'Cash / Manual',
            status || 'approved',
            reference_number || 'REF-' + Math.floor(100000 + Math.random() * 900000),
            notes || 'تم تسجيل الدفعة يدوياً من طرف الإدارة',
            req.user.id
        ]);

        res.status(201).json({ message: 'Payment recorded successfully', id: paymentId });
    } catch (err) {
        console.error('[addStudentPayment]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute('SELECT user_id FROM students WHERE id = ?', [id]);
        const userId = rows[0]?.user_id;

        await db.execute('DELETE FROM students WHERE id = ?', [id]);

        if (userId) {
            await db.execute('DELETE FROM profiles WHERE id = ?', [userId]);
            await db.execute('DELETE FROM users WHERE id = ?', [userId]);
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createStudent = async (req, res) => {
    const { fullName, email, password, city, country, whatsappNumber, cohort_id, status } = req.body;
    try {
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }

        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = crypto.randomUUID();
        const studentId = crypto.randomUUID();
        const today = new Date().toISOString().split('T')[0];

        // 1. Insert into users table
        await db.execute(
            'INSERT INTO users (id, email, password, role) VALUES (?, ?, ?, ?)',
            [userId, email, hashedPassword, 'student']
        );

        // 2. Insert into profiles table
        await db.execute(
            'INSERT INTO profiles (id, email, full_name, city, country, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?)',
            [userId, email, fullName, city || '', country || '', whatsappNumber || '']
        );

        // 3. Insert into user_roles table
        await db.execute(
            'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
            [crypto.randomUUID(), userId, 'student']
        );

        // 4. Insert into students table
        await db.execute(
            'INSERT INTO students (id, user_id, cohort_id, enrollment_date, status) VALUES (?, ?, ?, ?, ?)',
            [studentId, userId, cohort_id || null, today, status || 'active']
        );

        res.status(201).json({
            id: studentId,
            user_id: userId,
            cohort_id: cohort_id || null,
            enrollment_date: today,
            status: status || 'active',
            profile: {
                full_name: fullName,
                email: email
            }
        });
    } catch (err) {
        console.error('[createStudent]', err);
        res.status(500).json({ error: err.message });
    }
};

// --- TEACHERS ---
exports.getAllTeachers = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT 
                COALESCE(t.id, u.id) as id,
                t.id as teacher_table_id,
                u.id as user_id,
                COALESCE(p.full_name, u.username, u.email) as full_name,
                u.email,
                p.phone,
                p.city,
                p.country,
                p.whatsapp_number,
                p.avatar_url,
                COALESCE(t.specialty, 'General') as specialty,
                t.experience,
                COALESCE(t.bio, p.bio) as bio,
                t.hire_date,
                COALESCE(t.status, 'active') as status,
                COALESCE(t.created_at, u.created_at) as created_at
            FROM users u
            LEFT JOIN profiles p ON u.id = p.id
            LEFT JOIN teachers t ON u.id = t.user_id
            WHERE u.role = 'teacher' OR t.id IS NOT NULL
            ORDER BY COALESCE(t.created_at, u.created_at) DESC
        `);

        const teachers = rows.map(row => ({
            ...row,
            user_id: row.user_id || row.id,
            profile: {
                full_name: row.full_name,
                email: row.email,
                phone: row.phone,
                city: row.city,
                country: row.country,
                whatsapp_number: row.whatsapp_number,
                avatar_url: row.avatar_url
            }
        }));

        res.json(teachers);
    } catch (err) {
        console.error('[getAllTeachers]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getTeacherDetails = async (req, res) => {
    const { id } = req.params;
    try {
        // 1. Get teacher & profile
        const [teacherRows] = await db.execute(`
            SELECT t.*, p.full_name, p.email, p.phone, p.city, p.country, p.whatsapp_number, p.avatar_url, p.bio as profile_bio
            FROM teachers t
            LEFT JOIN profiles p ON t.user_id = p.id
            WHERE t.id = ? OR t.user_id = ?
        `, [id, id]);

        if (teacherRows.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const teacher = teacherRows[0];
        const teacherId = teacher.id;
        const userId = teacher.user_id;

        // Parse certifications if string
        if (typeof teacher.certifications === 'string') {
            try {
                teacher.certifications = JSON.parse(teacher.certifications);
            } catch(e) {
                teacher.certifications = [];
            }
        } else if (!teacher.certifications) {
            teacher.certifications = [];
        }

        // 2. Modules taught
        const [modules] = await db.execute(`
            SELECT m.*, sp.name as specialty_name, pr.name as program_name,
            (SELECT COUNT(*) FROM lessons WHERE module_id = m.id) as lessons_count
            FROM modules m
            LEFT JOIN specialties sp ON m.specialty_id = sp.id
            LEFT JOIN programs pr ON sp.program_id = pr.id
            WHERE m.teacher_id = ? OR m.teacher_id = ?
            ORDER BY m.created_at DESC
        `, [teacherId, userId]);

        // 3. Lessons conducted
        const [lessons] = await db.execute(`
            SELECT l.*, m.name as module_name, m.code as module_code, c.name as cohort_name,
            (SELECT COUNT(*) FROM lesson_attendance WHERE lesson_id = l.id) as total_attendance_records,
            (SELECT COUNT(*) FROM lesson_attendance WHERE lesson_id = l.id AND status = 'present') as present_count
            FROM lessons l
            LEFT JOIN modules m ON l.module_id = m.id
            LEFT JOIN cohorts c ON l.cohort_id = c.id
            WHERE l.teacher_id = ? OR l.teacher_id = ?
            ORDER BY l.scheduled_date DESC
        `, [teacherId, userId]);

        // 4. Attendance statistics
        const [attSummary] = await db.execute(`
            SELECT la.status, COUNT(*) as count
            FROM lesson_attendance la
            JOIN lessons l ON la.lesson_id = l.id
            WHERE l.teacher_id = ? OR l.teacher_id = ?
            GROUP BY la.status
        `, [teacherId, userId]);

        let totalAttendance = 0;
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        attSummary.forEach(r => {
            totalAttendance += Number(r.count);
            if (r.status === 'present') presentCount += Number(r.count);
            else if (r.status === 'absent') absentCount += Number(r.count);
            else if (r.status === 'late') lateCount += Number(r.count);
        });
        const attendanceRate = totalAttendance > 0 
            ? Math.round(((presentCount + (lateCount * 0.5)) / totalAttendance) * 100) 
            : 100;

        // 5. Assignments given & student submissions
        const [assignments] = await db.execute(`
            SELECT a.*, m.name as module_name, c.name as cohort_name,
            (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) as submissions_count,
            (SELECT AVG(grade) FROM assignment_submissions WHERE assignment_id = a.id AND grade IS NOT NULL) as avg_grade
            FROM assignments a
            LEFT JOIN modules m ON a.module_id = m.id
            LEFT JOIN cohorts c ON a.cohort_id = c.id
            WHERE a.teacher_id = ? OR a.teacher_id = ?
            ORDER BY a.due_date DESC
        `, [teacherId, userId]);

        // 6. Students count taught across cohorts
        const [studentRows] = await db.execute(`
            SELECT DISTINCT s.id, s.status, s.enrollment_date, p.full_name, p.email, p.phone, c.name as cohort_name
            FROM students s
            JOIN cohorts c ON s.cohort_id = c.id
            JOIN modules m ON m.specialty_id = c.specialty_id
            JOIN profiles p ON s.user_id = p.id
            WHERE m.teacher_id = ? OR m.teacher_id = ?
        `, [teacherId, userId]);

        // 7. Formations created (if any)
        const [formations] = await db.execute(`
            SELECT f.*,
            (SELECT COUNT(*) FROM formation_enrollments WHERE formation_id = f.id) as enrollments_count,
            (SELECT COUNT(*) FROM formation_content WHERE formation_id = f.id) as content_count
            FROM formations f
            WHERE f.created_by = ? OR f.created_by = ?
            ORDER BY f.created_at DESC
        `, [userId, teacherId]);

        // 8. Progress with students: average completion/submission rate
        let totalSubmissions = 0;
        let totalPossibleSubmissions = 0;
        const totalStudentsCount = studentRows.length;

        assignments.forEach(a => {
            totalSubmissions += Number(a.submissions_count || 0);
            totalPossibleSubmissions += totalStudentsCount;
        });

        const submissionRate = totalPossibleSubmissions > 0 
            ? Math.round((totalSubmissions / totalPossibleSubmissions) * 100) 
            : (assignments.length > 0 ? 85 : 100);

        res.json({
            teacher: {
                ...teacher,
                profile: {
                    full_name: teacher.full_name,
                    email: teacher.email,
                    phone: teacher.phone,
                    city: teacher.city,
                    country: teacher.country,
                    whatsapp_number: teacher.whatsapp_number,
                    avatar_url: teacher.avatar_url,
                    bio: teacher.bio || teacher.profile_bio
                }
            },
            stats: {
                totalStudents: totalStudentsCount,
                totalModules: modules.length,
                totalLessons: lessons.length,
                totalAssignments: assignments.length,
                attendanceRate,
                submissionRate,
                presentCount,
                absentCount,
                lateCount,
                totalAttendanceRecords: totalAttendance
            },
            modules,
            lessons,
            assignments,
            students: studentRows,
            formations,
            certifications: teacher.certifications || []
        });
    } catch (err) {
        console.error('[getTeacherDetails]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateTeacher = async (req, res) => {
    const { id } = req.params;
    const { 
        specialty, 
        status, 
        experience, 
        hire_date, 
        degree, 
        bio, 
        certifications,
        fullName, 
        phone, 
        city, 
        country, 
        whatsappNumber,
        avatarUrl,
        password
    } = req.body;

    try {
        // 1. Get teacher (id could be teacher.id or user_id)
        const [tRows] = await db.execute('SELECT id, user_id FROM teachers WHERE id = ? OR user_id = ?', [id, id]);
        if (tRows.length === 0) {
            return res.status(404).json({ error: 'Teacher not found' });
        }
        const realTeacherId = tRows[0].id;
        const userId = tRows[0].user_id;

        // 2. Update teachers table
        const teacherUpdates = [];
        const teacherValues = [];

        if (status !== undefined) { teacherUpdates.push('status = ?'); teacherValues.push(status); }
        if (specialty !== undefined) { teacherUpdates.push('specialty = ?'); teacherValues.push(specialty); }
        if (experience !== undefined) { teacherUpdates.push('experience = ?'); teacherValues.push(experience); }
        if (hire_date !== undefined) { teacherUpdates.push('hire_date = ?'); teacherValues.push(hire_date); }
        if (degree !== undefined) { teacherUpdates.push('degree = ?'); teacherValues.push(degree); }
        if (bio !== undefined) { teacherUpdates.push('bio = ?'); teacherValues.push(bio); }
        if (certifications !== undefined) { 
            teacherUpdates.push('certifications = ?'); 
            teacherValues.push(typeof certifications === 'string' ? certifications : JSON.stringify(certifications)); 
        }

        if (teacherUpdates.length > 0) {
            teacherUpdates.push('updated_at = NOW()');
            teacherValues.push(realTeacherId);
            await db.execute(`UPDATE teachers SET ${teacherUpdates.join(', ')} WHERE id = ?`, teacherValues);
        }

        // 3. Update profiles table if profile fields provided
        if (userId) {
            const profileUpdates = [];
            const profileValues = [];

            if (fullName !== undefined) { profileUpdates.push('full_name = ?'); profileValues.push(fullName); }
            if (phone !== undefined) { profileUpdates.push('phone = ?'); profileValues.push(phone); }
            if (city !== undefined) { profileUpdates.push('city = ?'); profileValues.push(city); }
            if (country !== undefined) { 
                profileUpdates.push('country = ?'); 
                profileValues.push(country); 
                let countryCode = 'GLOBAL';
                const cLower = (country || '').toLowerCase().trim();
                if (cLower.includes('algeria') || cLower.includes('algérie') || cLower.includes('الجزائر') || cLower === 'dz') countryCode = 'DZ';
                else if (cLower.includes('morocco') || cLower.includes('maroc') || cLower.includes('المغرب') || cLower === 'ma') countryCode = 'MA';
                else if (country.trim().length === 2) countryCode = country.trim().toUpperCase();
                profileUpdates.push('country_code = ?');
                profileValues.push(countryCode);
            }
            if (whatsappNumber !== undefined) { profileUpdates.push('whatsapp_number = ?'); profileValues.push(whatsappNumber); }
            if (avatarUrl !== undefined) { profileUpdates.push('avatar_url = ?'); profileValues.push(avatarUrl); }
            if (bio !== undefined) { profileUpdates.push('bio = ?'); profileValues.push(bio); }

            if (profileUpdates.length > 0) {
                profileUpdates.push('updated_at = NOW()');
                profileValues.push(userId);
                await db.execute(`UPDATE profiles SET ${profileUpdates.join(', ')} WHERE id = ?`, profileValues);
            }

            // Sync user status if status changed
            if (status !== undefined) {
                await db.execute('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
            }

            // Update password if admin specified a new password
            if (password && password.trim().length >= 8) {
                const hashedPassword = await bcrypt.hash(password.trim(), 12);
                await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
            }
        }

        res.json({ message: 'Teacher updated successfully', id: realTeacherId });
    } catch (err) {
        console.error('[updateTeacher]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTeacher = async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute('SELECT id, user_id FROM teachers WHERE id = ? OR user_id = ?', [id, id]);
        
        if (rows.length === 0) {
            const [uRows] = await db.execute('SELECT id FROM users WHERE id = ? AND role = "teacher"', [id]);
            if (uRows.length > 0) {
                await db.execute('DELETE FROM profiles WHERE id = ?', [id]);
                await db.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
                await db.execute('DELETE FROM users WHERE id = ?', [id]);
                return res.json({ message: 'Teacher deleted successfully' });
            }
            return res.status(404).json({ error: 'Teacher not found' });
        }

        const realTeacherId = rows[0].id;
        const userId = rows[0].user_id;

        await db.execute('DELETE FROM teachers WHERE id = ?', [realTeacherId]);

        if (userId) {
            await db.execute('DELETE FROM profiles WHERE id = ?', [userId]);
            await db.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);
            await db.execute('DELETE FROM users WHERE id = ?', [userId]);
        }
        res.json({ message: 'Teacher deleted successfully' });
    } catch (err) {
        console.error('[deleteTeacher]', err);
        res.status(500).json({ error: err.message });
    }
};

exports.createTeacher = async (req, res) => {
    const { fullName, email, password, city, country, whatsappNumber, specialty, experience, status } = req.body;
    try {
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }

        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = crypto.randomUUID();
        const teacherId = crypto.randomUUID();
        const today = new Date().toISOString().split('T')[0];
        const affiliateCode = 'NV' + crypto.randomInt(100000, 1000000);

        // 1. Insert into users table
        await db.execute(
            `INSERT INTO users (id, email, password, role, email_verified, affiliate_code, status, affiliate_status, affiliate_enabled, token_version)
             VALUES (?, ?, ?, ?, 1, ?, ?, 'active', 1, 1)`,
            [userId, email, hashedPassword, 'teacher', affiliateCode, status || 'active']
        );

        // 2. Insert into profiles table
        let countryCode = 'GLOBAL';
        const cLower = (country || '').toLowerCase().trim();
        if (cLower.includes('algeria') || cLower.includes('algérie') || cLower.includes('الجزائر') || cLower === 'dz') {
            countryCode = 'DZ';
        } else if (cLower.includes('morocco') || cLower.includes('maroc') || cLower.includes('المغرب') || cLower === 'ma') {
            countryCode = 'MA';
        } else if (country && country.trim().length === 2) {
            countryCode = country.trim().toUpperCase();
        }

        await db.execute(
            'INSERT INTO profiles (id, email, full_name, city, country, country_code, whatsapp_number, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
            [userId, email, fullName, city || '', country || '', countryCode, whatsappNumber || '']
        );

        // 3. Insert into user_roles table
        await db.execute(
            'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
            [crypto.randomUUID(), userId, 'teacher']
        );

        // 4. Initialize wallet (safe fallback if table exists)
        try {
            await db.execute(
                'INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn) VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)',
                [crypto.randomUUID(), userId]
            );
        } catch (wErr) {
            console.warn('[createTeacher] Wallet initialization skipped or already initialized:', wErr.message);
        }

        // 5. Insert into teachers table
        await db.execute(
            'INSERT INTO teachers (id, user_id, specialty, experience, hire_date, status, bio) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [teacherId, userId, specialty || '', experience || '', today, status || 'active', '']
        );

        res.status(201).json({
            id: teacherId,
            user_id: userId,
            specialty: specialty || '',
            experience: experience || '',
            hire_date: today,
            status: status || 'active',
            profile: {
                full_name: fullName,
                email: email,
                city: city || '',
                country: country || '',
                whatsapp_number: whatsappNumber || ''
            }
        });
    } catch (err) {
        console.error('[createTeacher]', err);
        res.status(500).json({ error: err.message });
    }
};
