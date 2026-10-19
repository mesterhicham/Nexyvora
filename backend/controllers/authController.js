const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

/**
 * Register user (Atomic Transaction)
 */
exports.register = async (req, res) => {
    const { email, password, fullName, city, country, whatsappNumber, referralCode, ref } = req.body;
    
    // Security Protection: Block any attempt to specify roles or elevated privileges publicly
    const rawBody = req.body || {};
    const bodyKeys = Object.keys(rawBody).map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const sensitiveKeys = ['role', 'roles', 'isadmin', 'status', 'userstatus', 'tokenversion', 'permissions', 'accountrole'];
    for (const key of sensitiveKeys) {
        if (bodyKeys.includes(key)) {
            const originalKey = Object.keys(rawBody).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === key);
            const rawVal = rawBody[originalKey];
            const strVal = String(rawVal || '').trim().toLowerCase();
            // Allow only benign explicit specification of 'student' for 'role'
            if (key === 'role' && strVal === 'student') {
                continue;
            }
            return res.status(403).json({ 
                error: 'حسابات الأساتذة والمديرين والأدوار الخاصة لا يمكن إنشاؤها عبر التسجيل العام. / Non-student roles or sensitive privilege attributes cannot be specified via public registration.' 
            });
        }
    }

    // Role is strictly enforced by the server
    const assignedRole = 'student';

    if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [existing] = await connection.query('SELECT id FROM users WHERE email = ? FOR UPDATE', [cleanEmail]);
        if (existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Check referral code (MANDATORY)
        const codeToCheck = (referralCode || ref || '').trim();
        if (!codeToCheck) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'كود الإحالة (Referral Code) إجباري للتسجيل في المنصة.' 
            });
        }

        let referrerId = null;
        const [referrer] = await connection.query('SELECT id, status FROM users WHERE affiliate_code = ?', [codeToCheck]);
        if (referrer.length === 0) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'كود الإحالة المدخل غير صحيح أو غير مسجل في النظام. يرجى إدخال كود إحالة صالح.' 
            });
        }
        referrerId = referrer[0].id;

        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = crypto.randomUUID();
        const affiliateCode = 'NV' + crypto.randomInt(100000, 1000000);

        // 1. Insert into users table
        await connection.query(
            `INSERT INTO users (id, email, password, role, affiliate_code, referrer_id, status, affiliate_status, affiliate_enabled, token_version)
             VALUES (?, ?, ?, ?, ?, ?, 'active', 'active', 1, 1)`,
            [userId, cleanEmail, hashedPassword, assignedRole, affiliateCode, referrerId]
        );

        // 2. Initialize user wallet
        await connection.query(
            'INSERT INTO user_wallets (id, user_id, balance, pending_balance, total_earned, total_withdrawn) VALUES (?, ?, 0.00, 0.00, 0.00, 0.00)',
            [crypto.randomUUID(), userId]
        );

        // 3. Insert into profiles table with country_code
        let countryCode = 'GLOBAL';
        const cLower = (country || '').toLowerCase().trim();
        if (cLower.includes('algeria') || cLower.includes('algérie') || cLower.includes('الجزائر') || cLower === 'dz') {
            countryCode = 'DZ';
        } else if (cLower.includes('morocco') || cLower.includes('maroc') || cLower.includes('المغرب') || cLower === 'ma') {
            countryCode = 'MA';
        } else if (country && country.trim().length === 2) {
            countryCode = country.trim().toUpperCase();
        }

        await connection.query(
            'INSERT INTO profiles (id, email, full_name, city, country, country_code, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, cleanEmail, fullName.trim(), city || '', country || '', countryCode, whatsappNumber || '']
        );

        // 4. Insert into user_roles table
        await connection.query(
            'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
            [crypto.randomUUID(), userId, assignedRole]
        );

        // 5. Public sign-up creates student record exclusively
        await connection.query(
            'INSERT INTO students (id, user_id, status) VALUES (?, ?, ?)',
            [crypto.randomUUID(), userId, 'active']
        );

        await connection.commit();

        res.status(201).json({ 
            success: true,
            message: 'User registered successfully. ' + (assignedRole === 'teacher' ? 'Your account is pending admin approval.' : ''),
            affiliateCode,
            user: {
                id: userId,
                email: cleanEmail,
                role: assignedRole
            }
        });
    } catch (err) {
        await connection.rollback();
        console.error('[register] Error:', err.message);
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Registration failed.' : err.message });
    } finally {
        connection.release();
    }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const cleanEmail = email.trim().toLowerCase();
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];

        // Check account status
        if (user.status === 'suspended' || user.status === 'banned') {
            return res.status(403).json({ error: 'تم تعليق هذا الحساب. يرجى مراجعة إدارة المنصة / Account is suspended or banned' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign(
            { id: user.id, role: user.role, token_version: user.token_version || 1 },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        const [profiles] = await db.query(
            'SELECT full_name, city, country, country_code, whatsapp_number, avatar_url FROM profiles WHERE id = ?',
            [user.id]
        );
        const prof = profiles[0] || {};

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                affiliateCode: user.affiliate_code,
                referrerId: user.referrer_id,
                full_name: prof.full_name || '',
                city: prof.city || '',
                country: prof.country || '',
                country_code: prof.country_code || '',
                whatsappNumber: prof.whatsapp_number || '',
                avatar_url: prof.avatar_url || ''
            }
        });
    } catch (err) {
        console.error('[login] Error:', err.message);
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Login failed.' : err.message });
    }
};

/**
 * Change Password (Session Invalidation)
 */
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: 'User not found' });
        const user = users[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Current password incorrect' });

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        // Invalidate previous sessions by incrementing token_version
        await db.query(
            'UPDATE users SET password = ?, token_version = COALESCE(token_version, 1) + 1 WHERE id = ?',
            [hashedPassword, req.user.id]
        );

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('[changePassword] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// --- ADMIN SETUP (First Admin) ---
exports.checkAdminExists = async (req, res) => {
    try {
        const [rolesAdmin] = await db.query("SELECT id FROM user_roles WHERE role = 'admin' LIMIT 1");
        const [usersAdmin] = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
        const hasAdmin = rolesAdmin.length > 0 || usersAdmin.length > 0;
        res.json({ hasAdmin });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * Setup first admin (Strictly protected by ADMIN_SETUP_SECRET, timingSafeEqual, and row locking)
 */
exports.setupFirstAdmin = async (req, res) => {
    const { setupSecret, setup_secret } = req.body || {};
    const clientSecret = setupSecret || setup_secret;
    const requiredSecret = process.env.ADMIN_SETUP_SECRET;

    // Requirement 1: If ADMIN_SETUP_SECRET is not configured or too weak, strictly reject web setup
    if (!requiredSecret || requiredSecret.trim().length < 8) {
        return res.status(403).json({ 
            error: 'إنشاء المدير الأول عبر الويب معطل لأن ADMIN_SETUP_SECRET غير مهيأ. استخدم سكريبت الطرفية setup-admin.js / Admin setup via web is disabled because ADMIN_SETUP_SECRET is not configured.' 
        });
    }

    // Requirement 2: Timing-safe comparison of the secret
    const sentBuf = Buffer.from((clientSecret || '').trim());
    const expectedBuf = Buffer.from(requiredSecret.trim());
    if (sentBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sentBuf, expectedBuf)) {
        return res.status(403).json({ error: 'رمز التثبيت السري غير صحيح / Invalid setup secret key' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Concurrency protection: Lock admin check across BOTH user_roles AND users tables
        const [rolesAdmin] = await connection.query("SELECT id FROM user_roles WHERE role = 'admin' LIMIT 1 FOR UPDATE");
        const [usersAdmin] = await connection.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1 FOR UPDATE");
        if (rolesAdmin.length > 0 || usersAdmin.length > 0) {
            await connection.rollback();
            return res.status(403).json({ 
                error: 'يوجد مدير بالفعل في النظام. مسار الإعداد مغلق نهائياً / An admin already exists in the system. Setup route is permanently closed.',
                code: 'ADMIN_ALREADY_EXISTS'
            });
        }

        const userId = req.user?.id;
        if (!userId) {
            await connection.rollback();
            return res.status(401).json({ error: 'Authentication required' });
        }

        await connection.query("UPDATE users SET role = 'admin', status = 'active', token_version = COALESCE(token_version, 1) + 1 WHERE id = ?", [userId]);
        await connection.query(
            "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin') ON DUPLICATE KEY UPDATE role = 'admin'",
            [crypto.randomUUID(), userId]
        );

        await connection.commit();
        res.json({ success: true, message: 'First admin created successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('[setupFirstAdmin] error:', err.message);
        res.status(500).json({ error: 'Failed to setup admin' });
    } finally {
        connection.release();
    }
};

// --- WHATSAPP OTP ---
exports.sendWhatsAppOtp = async (req, res) => {
    const { phone_number } = req.body;
    if (!phone_number || phone_number.length < 8) {
        return res.status(400).json({ error: 'Valid phone number is required' });
    }

    const cleanPhone = phone_number.trim();

    // Check if WhatsApp gateway/provider is configured
    const hasWhatsAppConfig = process.env.WHATSAPP_API_KEY || process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_PHONE_ID;
    if (!hasWhatsAppConfig) {
        return res.status(503).json({ 
            error: 'خدمة التحقق عبر WhatsApp غير مهيأة حالياً على الخادم. يرجى استخدام التحقق عبر البريد الإلكتروني / WhatsApp verification gateway is currently not configured on this server. Please use email verification.' 
        });
    }

    try {
        // Rate limit cooldown (60 seconds)
        const [recent] = await db.query(
            'SELECT created_at FROM verification_otps WHERE identifier = ? AND type = "whatsapp" AND created_at > NOW() - INTERVAL 60 SECOND ORDER BY created_at DESC LIMIT 1',
            [cleanPhone]
        );
        if (recent.length > 0) {
            return res.status(429).json({ error: 'يرجى الانتظار 60 ثانية قبل طلب رمز جديد / Please wait 60s before requesting another code' });
        }

        // Cryptographically secure 6-digit code
        const code = crypto.randomInt(100000, 1000000).toString();
        const codeHash = crypto.createHash('sha256').update(code).digest('hex');
        const otpId = crypto.randomUUID();

        // Store SHA-256 hash only
        await db.query(
            `INSERT INTO verification_otps (id, identifier, type, code, expires_at, is_verified, attempts)
             VALUES (?, ?, 'whatsapp', ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), 0, 0)`,
            [otpId, cleanPhone, codeHash]
        );

        res.json({
            success: true,
            message: 'OTP sent successfully'
        });
    } catch (err) {
        console.error('[sendWhatsAppOtp] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

exports.verifyWhatsAppOtp = async (req, res) => {
    const { phone_number, code } = req.body;
    if (!phone_number || !code) {
        return res.status(400).json({ error: 'Phone number and code are required' });
    }

    const cleanPhone = phone_number.trim();
    const cleanCode = code.toString().trim();
    const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    try {
        const [rows] = await db.query(
            `SELECT id, code, attempts, expires_at FROM verification_otps
             WHERE identifier = ? AND type = 'whatsapp' AND is_verified = 0 AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [cleanPhone]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'رمز التحقق غير صالح أو انتهت صلاحيته / No OTP requested for this number or expired' });
        }

        const otpRecord = rows[0];

        // Max 5 attempts
        if (otpRecord.attempts >= 5) {
            return res.status(429).json({ error: 'تم تجاوز عدد المحاولات المسموح بها / Too many failed attempts. Please request a new code.' });
        }

        if (otpRecord.code !== inputHash) {
            await db.query('UPDATE verification_otps SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id]);
            return res.status(400).json({ error: 'رمز التحقق غير صحيح / Invalid verification code' });
        }

        // Mark OTP verified
        await db.query('UPDATE verification_otps SET is_verified = 1 WHERE id = ?', [otpRecord.id]);

        // If user is authenticated, update their profile
        if (req.user?.id) {
            await db.query('UPDATE profiles SET whatsapp_verified = 1 WHERE id = ?', [req.user.id]);
        } else {
            await db.query('UPDATE profiles SET whatsapp_verified = 1 WHERE whatsapp_number = ?', [cleanPhone]);
        }

        res.json({ success: true, verified: true });
    } catch (err) {
        console.error('[verifyWhatsAppOtp] Error:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// --- EMAIL OTP & PASSWORD RESET ---

/**
 * Send Email OTP for registration / verification
 */
exports.sendEmailOtp = async (req, res) => {
    const { email, type = 'registration', name = '' } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'البريد الإلكتروني غير صحيح / Valid email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
        // Rate limiting check (cooldown 60s)
        const [recent] = await db.query(
            'SELECT created_at FROM verification_otps WHERE identifier = ? AND type = ? AND created_at > NOW() - INTERVAL 60 SECOND ORDER BY created_at DESC LIMIT 1',
            [cleanEmail, type]
        );
        if (recent.length > 0) {
            return res.status(429).json({ 
                error: 'يرجى الانتظار دقيقة واحدة قبل طلب رمز تحقق جديد / Please wait a minute before requesting another code' 
            });
        }

        // Generate cryptographically secure 6-digit code
        const code = crypto.randomInt(100000, 1000000).toString();
        const codeHash = crypto.createHash('sha256').update(code).digest('hex');
        const otpId = crypto.randomUUID();

        // 1. Save in verification_otps table first
        await db.query(
            `INSERT INTO verification_otps (id, identifier, type, code, expires_at, is_verified, attempts)
             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 0, 0)`,
            [otpId, cleanEmail, type, codeHash]
        );

        // 2. Dispatch Email using emailService only after DB insert succeeds
        const recipientName = name || cleanEmail.split('@')[0];
        const templateSlug = type === 'password_reset' ? 'password-reset' : 'registration-otp';

        await emailService.sendTemplate(templateSlug, {
            to: cleanEmail,
            toName: recipientName,
            variables: {
                name: recipientName,
                user_name: recipientName,
                otp_code: code,
                platform_name: 'Nexyvora Platform',
                expires_in: '15',
                reset_link: code
            }
        });

        res.json({
            success: true,
            message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني بنجاح / Verification code sent to your email'
        });
    } catch (err) {
        console.error('[sendEmailOtp] Error:', err.message);
        res.status(500).json({ error: 'Failed to send verification code' });
    }
};

/**
 * Verify Email OTP
 */
exports.verifyEmailOtp = async (req, res) => {
    const { email, code, type = 'registration' } = req.body;
    if (!email || !code) {
        return res.status(400).json({ error: 'البريد الإلكتروني وكود التحقق مطلوبان / Email and verification code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();
    const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    try {
        const [rows] = await db.query(
            `SELECT id, code, attempts, expires_at FROM verification_otps
             WHERE identifier = ? AND type = ? AND is_verified = 0 AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [cleanEmail, type]
        );

        if (rows.length === 0) {
            return res.status(400).json({ 
                error: 'كود التحقق غير صالح أو انتهت صلاحيته. يرجى طلب كود جديد / Verification code is invalid or expired.' 
            });
        }

        const otpRecord = rows[0];

        if (otpRecord.attempts >= 5) {
            return res.status(400).json({ 
                error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. يرجى طلب كود جديد / Too many incorrect attempts. Please request a new code.' 
            });
        }

        if (otpRecord.code !== inputHash) {
            await db.query('UPDATE verification_otps SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id]);
            return res.status(400).json({ error: 'كود التحقق غير صحيح / Incorrect verification code' });
        }

        // Mark OTP as verified (one-time use)
        await db.query('UPDATE verification_otps SET is_verified = 1 WHERE id = ?', [otpRecord.id]);

        // Update email_verified in users and profiles if user exists
        try {
            await db.query('UPDATE users SET email_verified = 1 WHERE email = ?', [cleanEmail]);
            await db.query('UPDATE profiles SET email_verified = 1 WHERE email = ?', [cleanEmail]);
        } catch (colErr) {
            // Non-critical if table column not present
        }

        res.json({
            success: true,
            verified: true,
            message: 'تم التحقق من البريد الإلكتروني بنجاح / Email verified successfully'
        });
    } catch (err) {
        console.error('[verifyEmailOtp] Error:', err.message);
        res.status(500).json({ error: 'Verification failed' });
    }
};

/**
 * Forgot Password - Send OTP (Prevents email enumeration by returning a generic response)
 */
exports.forgotPasswordOtp = async (req, res) => {
    const { email } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب / Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
        const [users] = await db.query('SELECT id, email FROM users WHERE email = ?', [cleanEmail]);
        
        // If user exists, generate OTP and dispatch email
        if (users.length > 0) {
            const code = crypto.randomInt(100000, 1000000).toString();
            const codeHash = crypto.createHash('sha256').update(code).digest('hex');
            const otpId = crypto.randomUUID();

            await db.query(
                `INSERT INTO verification_otps (id, identifier, type, code, expires_at, is_verified, attempts)
                 VALUES (?, ?, 'password_reset', ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 0, 0)`,
                [otpId, cleanEmail, codeHash]
            );

            await emailService.sendTemplate('password-reset', {
                to: cleanEmail,
                toName: cleanEmail.split('@')[0],
                variables: {
                    name: cleanEmail.split('@')[0],
                    user_name: cleanEmail.split('@')[0],
                    otp_code: code,
                    platform_name: 'Nexyvora Platform',
                    expires_in: '15'
                }
            });
        }

        // Always return generic response to prevent email enumeration
        res.json({
            success: true,
            message: 'إذا كان البريد الإلكتروني مسجلاً في منصتنا، فقد تم إرسال كود استعادة كلمة المرور إليه / If this email is registered, a password reset code has been sent.'
        });
    } catch (err) {
        console.error('[forgotPasswordOtp] Error:', err.message);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
};

/**
 * Reset Password with OTP (Atomic Transaction with attempt limit and token_version bump)
 */
exports.resetPasswordWithOtp = async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
        return res.status(400).json({ error: 'جميع الحقول مطلوبة / All fields are required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'يجب أن لا تقل كلمة المرور عن 8 أحرف / Password must be at least 8 characters' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.toString().trim();
    const inputHash = crypto.createHash('sha256').update(cleanCode).digest('hex');

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.query(
            `SELECT id, code, attempts, expires_at FROM verification_otps
             WHERE identifier = ? AND type = 'password_reset' AND is_verified = 0 AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
            [cleanEmail]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'كود التحقق غير صالح أو انتهت صلاحيته / Reset code is invalid or expired' });
        }

        const otpRecord = rows[0];

        if (otpRecord.attempts >= 5) {
            await connection.rollback();
            return res.status(429).json({ error: 'تم تجاوز الحد الأقصى للمحاولات الخاطئة. يرجى طلب كود جديد / Too many incorrect attempts' });
        }

        if (otpRecord.code !== inputHash) {
            await connection.query('UPDATE verification_otps SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id]);
            await connection.commit();
            return res.status(400).json({ error: 'كود التحقق غير صحيح / Incorrect verification code' });
        }

        // Mark OTP as used (one-time use)
        await connection.query('UPDATE verification_otps SET is_verified = 1 WHERE id = ?', [otpRecord.id]);

        // Hash and update password, increment token_version to invalidate existing sessions
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await connection.query(
            'UPDATE users SET password = ?, token_version = COALESCE(token_version, 1) + 1 WHERE email = ?',
            [hashedPassword, cleanEmail]
        );

        await connection.commit();

        // Safely dispatch password-changed security alert email in background
        emailService.sendTemplate('password-changed', {
            to: cleanEmail,
            toName: cleanEmail.split('@')[0],
            variables: {
                name: cleanEmail.split('@')[0],
                date: new Date().toISOString().replace('T', ' ').substring(0, 19),
                platform_name: 'Nexyvora Platform'
            }
        }).catch(e => console.error('[resetPasswordWithOtp] Security alert email dispatch error:', e.message));

        res.json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول / Password reset successfully. You can now login.'
        });
    } catch (err) {
        await connection.rollback();
        console.error('[resetPasswordWithOtp] Error:', err.message);
        res.status(500).json({ error: 'Failed to reset password' });
    } finally {
        connection.release();
    }
};

/**
 * Validate referral code in real-time
 */
exports.validateReferralCode = async (req, res) => {
    try {
        const { code } = req.params;
        const cleanCode = (code || '').trim();
        if (!cleanCode) {
            return res.status(400).json({ valid: false, error: 'كود الإحالة مطلوب' });
        }

        const [rows] = await db.query(
            `SELECT u.id, u.affiliate_code, p.full_name, u.email, u.status 
             FROM users u 
             LEFT JOIN profiles p ON p.id = u.id 
             WHERE u.affiliate_code = ?`,
            [cleanCode]
        );

        if (rows.length === 0) {
            return res.status(404).json({ valid: false, error: 'كود الإحالة غير موجود أو غير صالح' });
        }

        const sponsor = rows[0];
        const sponsorName = sponsor.full_name || sponsor.email.split('@')[0];

        return res.json({
            valid: true,
            affiliateCode: sponsor.affiliate_code,
            sponsorName
        });
    } catch (err) {
        console.error('[Validate Referral Error]:', err.message);
        return res.status(500).json({ valid: false, error: 'حدث خطأ أثناء فحص كود الإحالة' });
    }
};
