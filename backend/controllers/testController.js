const db = require('../config/db');
const crypto = require('crypto');

const parseJsonSafe = (val, fallback) => {
    if (!val) return fallback;
    if (typeof val === 'object') return val;
    try {
        return JSON.parse(val);
    } catch (e) {
        return fallback;
    }
};

// --- GET ACTIVE PLACEMENT QUESTIONS (For Students) ---
exports.getPlacementQuestions = async (req, res) => {
    try {
        const [questions] = await db.execute(`
            SELECT id, question_text, options, points, order_index 
            FROM placement_test_questions 
            WHERE is_active = 1 
            ORDER BY order_index ASC, created_at ASC
        `);
        res.json(questions.map(q => ({
            ...q,
            options: parseJsonSafe(q.options, [])
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- GET ALL QUESTIONS (For Admin) ---
exports.getAllQuestions = async (req, res) => {
    try {
        const [questions] = await db.execute('SELECT * FROM placement_test_questions ORDER BY order_index ASC, created_at ASC');
        res.json(questions.map(q => ({
            ...q,
            options: parseJsonSafe(q.options, []),
            program_weight: parseJsonSafe(q.program_weight, {}),
            is_active: Boolean(q.is_active)
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- CREATE QUESTION (Admin) ---
exports.createQuestion = async (req, res) => {
    const { question_text, options, correct_option_index, points, order_index, is_active, program_weight } = req.body;
    if (!question_text || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ error: 'Question text and at least 2 options are required' });
    }

    const id = crypto.randomUUID();
    const optionsJson = JSON.stringify(options);
    const programWeightJson = JSON.stringify(program_weight || {});
    const correctIndex = parseInt(correct_option_index, 10) || 0;
    const pts = parseInt(points, 10) || 1;
    const order = parseInt(order_index, 10) || 0;
    const active = is_active !== false ? 1 : 0;

    try {
        await db.execute(
            `INSERT INTO placement_test_questions 
             (id, question_text, options, correct_option_index, points, order_index, is_active, program_weight, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [id, question_text, optionsJson, correctIndex, pts, order, active, programWeightJson]
        );

        res.status(201).json({
            id,
            question_text,
            options,
            correct_option_index: correctIndex,
            points: pts,
            order_index: order,
            is_active: Boolean(active),
            program_weight: program_weight || {}
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- UPDATE QUESTION (Admin) ---
exports.updateQuestion = async (req, res) => {
    const { id } = req.params;
    const { question_text, options, correct_option_index, points, order_index, is_active, program_weight } = req.body;

    try {
        // Quick active toggle
        if (is_active !== undefined && !question_text && !options) {
            await db.execute(
                'UPDATE placement_test_questions SET is_active = ?, updated_at = NOW() WHERE id = ?',
                [is_active ? 1 : 0, id]
            );
            return res.json({ id, is_active: Boolean(is_active) });
        }

        if (!question_text || !Array.isArray(options) || options.length < 2) {
            return res.status(400).json({ error: 'Question text and at least 2 options are required' });
        }

        const optionsJson = JSON.stringify(options);
        const programWeightJson = JSON.stringify(program_weight || {});
        const correctIndex = parseInt(correct_option_index, 10) || 0;
        const pts = parseInt(points, 10) || 1;
        const order = parseInt(order_index, 10) || 0;
        const active = is_active !== false ? 1 : 0;

        await db.execute(
            `UPDATE placement_test_questions 
             SET question_text = ?, options = ?, correct_option_index = ?, points = ?, order_index = ?, is_active = ?, program_weight = ?, updated_at = NOW() 
             WHERE id = ?`,
            [question_text, optionsJson, correctIndex, pts, order, active, programWeightJson, id]
        );

        res.json({
            id,
            question_text,
            options,
            correct_option_index: correctIndex,
            points: pts,
            order_index: order,
            is_active: Boolean(active),
            program_weight: program_weight || {}
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- DELETE QUESTION (Admin) ---
exports.deleteQuestion = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM placement_test_questions WHERE id = ?', [id]);
        res.json({ message: 'Question deleted successfully', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- GET ALL TEST RESULTS (Admin) ---
exports.getAllTestResults = async (req, res) => {
    try {
        const [results] = await db.execute(`
            SELECT 
                str.id,
                str.student_id,
                str.score,
                str.total_points,
                str.assigned_program_id,
                str.completed_at,
                str.created_at,
                COALESCE(pr.full_name, u.email) AS student_name,
                u.email,
                pr.avatar_url,
                pr.phone,
                p.name AS program_name
            FROM student_test_results str
            JOIN students s ON s.id = str.student_id
            JOIN users u ON u.id = s.user_id
            LEFT JOIN profiles pr ON pr.id = u.id
            LEFT JOIN programs p ON p.id = str.assigned_program_id
            ORDER BY str.completed_at DESC
        `);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- SUBMIT TEST (Student) ---
exports.submitTest = async (req, res) => {
    const { answers } = req.body; // Array of option indices
    try {
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
        if (student.length === 0) return res.status(404).json({ error: 'Student record not found' });
        const studentId = student[0].id;

        const [questions] = await db.execute('SELECT id, correct_option_index, points, program_weight FROM placement_test_questions WHERE is_active = 1 ORDER BY order_index ASC, created_at ASC');

        let score = 0;
        let totalPoints = 0;
        const programScores = {};

        questions.forEach((q, idx) => {
            const pts = q.points || 1;
            totalPoints += pts;
            if (answers && answers[idx] === q.correct_option_index) {
                score += pts;
                const weights = parseJsonSafe(q.program_weight, {});
                Object.keys(weights).forEach(progId => {
                    programScores[progId] = (programScores[progId] || 0) + (weights[progId] || 0);
                });
            }
        });

        // Assign program based on highest weight
        let assignedProgramId = null;
        let maxWeight = -1;
        Object.keys(programScores).forEach(progId => {
            if (programScores[progId] > maxWeight) {
                maxWeight = programScores[progId];
                assignedProgramId = progId;
            }
        });

        // If no assigned program from weights, fallback to first program
        if (!assignedProgramId) {
            const [progs] = await db.execute('SELECT id FROM programs LIMIT 1');
            assignedProgramId = progs[0]?.id || null;
        }

        const answersJson = JSON.stringify(answers || []);

        // Save or update result
        await db.execute(
            `INSERT INTO student_test_results (id, student_id, answers, score, total_points, assigned_program_id, completed_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE answers = VALUES(answers), score = VALUES(score), total_points = VALUES(total_points), assigned_program_id = VALUES(assigned_program_id), completed_at = NOW()`,
            [crypto.randomUUID(), studentId, answersJson, score, totalPoints, assignedProgramId]
        );

        res.json({ score, totalPoints, assignedProgramId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- GET INDIVIDUAL STUDENT TEST RESULT (Student) ---
exports.getStudentTestResult = async (req, res) => {
    try {
        const [student] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
        if (student.length === 0) return res.json(null);

        const [results] = await db.execute(`
            SELECT str.*, p.name AS program_name 
            FROM student_test_results str 
            LEFT JOIN programs p ON p.id = str.assigned_program_id 
            WHERE str.student_id = ?
        `, [student[0].id]);

        if (results.length === 0) return res.json(null);
        res.json(results[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- SEED SAMPLE QUESTIONS (Admin) ---
exports.seedSampleQuestions = async (req, res) => {
    try {
        const [progs] = await db.execute('SELECT id FROM programs LIMIT 1');
        const defaultProgId = progs[0]?.id || null;

        const sampleQuestions = [
            {
                question_text: "ما هو الدور الرئيسي لـ HTML في تطوير صفحات الويب؟",
                options: [
                    "تحديد البنية الهيكلية والمحتوى لصفحة الويب",
                    "تنسيق الألوان وإضافة الرسوم المتحركة فقط",
                    "برمجة منطق السيرفر وقواعد البيانات",
                    "تشفير وحماية كلمات المرور"
                ],
                correct_option_index: 0,
                points: 2,
                order_index: 1,
            },
            {
                question_text: "في لغة البرمجة، ما هي النتيجة المتوقعة للعملية: 5 + 3 * 2 ؟",
                options: ["16", "11", "13", "10"],
                correct_option_index: 1,
                points: 2,
                order_index: 2,
            },
            {
                question_text: "أي من اللغات التالية تُستخدم للاستعلام عن البيانات واسترجاعها من قواعد البيانات العلائقية؟",
                options: ["HTML", "SQL", "CSS", "JSON"],
                correct_option_index: 1,
                points: 2,
                order_index: 3,
            },
            {
                question_text: "ما هو مفهوم (Algorithm) أو الخوارزمية في علوم الحاسوب؟",
                options: [
                    "جهاز إلكتروني لتخزين البيانات",
                    "مجموعة من الخطوات المحددة والمنطقية لحل مشكلة معينة",
                    "برنامج مضاد للفيروسات",
                    "لغة تصميم خاصة بالمواقع"
                ],
                correct_option_index: 1,
                points: 2,
                order_index: 4,
            },
            {
                question_text: "أي من البروتوكولات التالية يُستخدم لنقل صفحات الويب بشكل آمن ومشفر بين المتصفح والخادم؟",
                options: ["HTTP", "HTTPS", "FTP", "SMTP"],
                correct_option_index: 1,
                points: 2,
                order_index: 5,
            },
            {
                question_text: "ما هو نظام إدارة الإصدارات (Version Control System) الأكثر استخداماً بين المطورين عالمياً؟",
                options: ["Git", "Docker", "Linux", "Apache"],
                correct_option_index: 0,
                points: 2,
                order_index: 6,
            },
            {
                question_text: "في البرمجة الكائنية (OOP)، ما هي 'الفئة' (Class)؟",
                options: [
                    "نوع من كابلات الشبكة",
                    "مخطط أو قالب لإنشاء الكائنات وتحديد خصائصها وسلوكها",
                    "قاعدة بيانات سحابية",
                    "أداة لتشغيل المقاطع الصوتية"
                ],
                correct_option_index: 1,
                points: 2,
                order_index: 7,
            },
            {
                question_text: "ما الذي يمثله اختصار CSS في تصميم وتطوير المواقع؟",
                options: [
                    "Computer Security System",
                    "Cascading Style Sheets",
                    "Creative Software Solution",
                    "Central Script Server"
                ],
                correct_option_index: 1,
                points: 2,
                order_index: 8,
            },
            {
                question_text: "ما هي وظيفة عنوان IP في شبكات الحاسوب؟",
                options: [
                    "تحديد الهوية والعنوان الفريد لكل جهاز متصل بالشبكة",
                    "حفظ كلمات المرور على المتصفح",
                    "زيادة سرعة معالج الحاسوب",
                    "تصميم واجهات المستخدم"
                ],
                correct_option_index: 0,
                points: 2,
                order_index: 9,
            },
            {
                question_text: "ما هي الحوسبة السحابية (Cloud Computing) باختصار؟",
                options: [
                    "تخزين الملفات على أقراص مدمجة فقط",
                    "توفير خدمات الحوسبة والتخزين ومعالجة البيانات عبر الإنترنت عند الطلب",
                    "نظام تشغيل مخصص للهواتف المحمولة",
                    "طريقة لتوصيل الحواسيب عبر كابلات محلية فقط"
                ],
                correct_option_index: 1,
                points: 2,
                order_index: 10,
            }
        ];

        for (const q of sampleQuestions) {
            const id = crypto.randomUUID();
            const weights = defaultProgId ? { [defaultProgId]: q.points } : {};
            await db.execute(
                `INSERT INTO placement_test_questions 
                 (id, question_text, options, correct_option_index, points, order_index, is_active, program_weight, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, 1, ?, NOW(), NOW())`,
                [id, q.question_text, JSON.stringify(q.options), q.correct_option_index, q.points, q.order_index, JSON.stringify(weights)]
            );
        }

        res.json({ message: 'Successfully seeded 10 sample placement questions!', count: sampleQuestions.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
