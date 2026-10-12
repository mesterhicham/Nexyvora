const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/emailService');

exports.register = async (req, res) => {
    console.log('[DEBUG] Register Body:', req.body);
    const { email, password, fullName, city, country, whatsappNumber, role, specialty, experience, referralCode, ref } = req.body;
    
    // Validate role: only allow student or teacher self-registration
    const assignedRole = (role === 'teacher' || role === 'student') ? role : 'student';

    try {
        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required.' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }

        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

        // Check referral code (if provided)
        let referrerId = null;
        const codeToCheck = (referralCode || ref || '').trim();
        if (codeToCheck) {
            const [referrer] = await db.execute('SELECT id FROM users WHERE affiliate_code = ?', [codeToCheck]);
            if (referrer.length > 0) {
                referrerId = referrer[0].id;
            }
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const userId = crypto.randomUUID();
        const affiliateCode = 'NV' + Math.floor(100000 + Math.random() * 900000);

        // 1. Insert into users table with affiliate_code and referrer_id
        await db.execute(
            'INSERT INTO users (id, email, password, role, affiliate_code, referrer_id, affiliate_status, affiliate_enabled) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, email, hashedPassword, assignedRole, affiliateCode, referrerId, 'active', 1]
        );

        // 2. Initialize user wallet
        await db.execute(
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

        await db.execute(
            'INSERT INTO profiles (id, email, full_name, city, country, country_code, whatsapp_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [userId, email, fullName, city || '', country || '', countryCode, whatsappNumber || '']
        );

        // 4. Insert into user_roles table
        await db.execute(
            'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
            [crypto.randomUUID(), userId, assignedRole]
        );

        // 5. Role-specific record creation
        if (assignedRole === 'teacher') {
            await db.execute(
                'INSERT INTO teachers (id, user_id, specialty, experience, status) VALUES (?, ?, ?, ?, ?)',
                [crypto.randomUUID(), userId, specialty || '', experience || '', 'pending']
            );
        } else {
            await db.execute(
                'INSERT INTO students (id, user_id, status) VALUES (?, ?, ?)',
                [crypto.randomUUID(), userId, 'active']
            );
        }

        res.status(201).json({ 
            message: 'User registered successfully. ' + (assignedRole === 'teacher' ? 'Your account is pending admin approval.' : ''),
            affiliateCode
        });
    } catch (err) {
        console.error('[register]', err);
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Registration failed.' : err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                affiliateCode: user.affiliate_code,
                referrerId: user.referrer_id
            }
        });
    } catch (err) {
        console.error('[login]', err);
        res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Login failed.' : err.message });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
        const user = users[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Current password incorrect' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- ADMIN SETUP (First Admin) ---
exports.checkAdminExists = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT id FROM user_roles WHERE role = 'admin' LIMIT 1");
        res.json({ hasAdmin: rows.length > 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.setupFirstAdmin = async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await db.execute("SELECT id FROM user_roles WHERE role = 'admin' LIMIT 1");
        if (rows.length > 0) {
            return res.status(400).json({ error: 'An admin already exists in the system.' });
        }

        await db.execute("UPDATE users SET role = 'admin' WHERE id = ?", [userId]);
        await db.execute(
            "INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, 'admin') ON DUPLICATE KEY UPDATE role = 'admin'",
            [crypto.randomUUID(), userId]
        );

        res.json({ success: true, message: 'First admin created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- WHATSAPP OTP ---
const otpStore = new Map(); // phone -> { code, expiresAt }

exports.sendWhatsAppOtp = async (req, res) => {
    const { phone_number } = req.body;
    if (!phone_number || phone_number.length < 8) {
        return res.status(400).json({ error: 'Valid phone number is required' });
    }

    try {
        // Generate random 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        otpStore.set(phone_number.trim(), { code, expiresAt });
        console.log(`[WhatsApp OTP] Code for ${phone_number}: ${code}`);

        res.json({
            success: true,
            message: 'OTP sent successfully',
            devOtp: process.env.NODE_ENV !== 'production' ? code : undefined
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.verifyWhatsAppOtp = async (req, res) => {
    const { phone_number, code } = req.body;
    if (!phone_number || !code) {
        return res.status(400).json({ error: 'Phone number and code are required' });
    }

    const cleanPhone = phone_number.trim();
    const stored = otpStore.get(cleanPhone);

    if (!stored) {
        return res.status(400).json({ error: 'No OTP requested for this number or expired' });
    }

    if (Date.now() > stored.expiresAt) {
        otpStore.delete(cleanPhone);
        return res.status(400).json({ error: 'OTP has expired. Please request a new code.' });
    }

    if (stored.code !== code.toString().trim()) {
        return res.status(400).json({ error: 'Invalid verification code' });
    }

    // OTP verified
    otpStore.delete(cleanPhone);

    try {
        // If user is authenticated, update their profile
        if (req.user?.id) {
            await db.execute('UPDATE profiles SET whatsapp_verified = 1 WHERE id = ?', [req.user.id]);
        } else {
            await db.execute('UPDATE profiles SET whatsapp_verified = 1 WHERE whatsapp_number = ?', [cleanPhone]);
        }

        res.json({ success: true, verified: true });
    } catch (err) {
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
        try {
            const [recent] = await db.query(
                'SELECT created_at FROM verification_otps WHERE identifier = ? AND type = ? AND created_at > NOW() - INTERVAL 60 SECOND ORDER BY created_at DESC LIMIT 1',
                [cleanEmail, type]
            );
            if (recent.length > 0) {
                return res.status(429).json({ 
                    error: 'يرجى الانتظار دقيقة واحدة قبل طلب رمز تحقق جديد / Please wait a minute before requesting another code' 
                });
            }
        } catch (tableErr) {
            // In case table not yet created
            console.warn('[sendEmailOtp] table check warning:', tableErr.message);
        }

        // Generate 6-digit code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const otpId = crypto.randomUUID();

        // Save in verification_otps table
        try {
            await db.query(
                `INSERT INTO verification_otps (id, identifier, type, code, expires_at, is_verified, attempts)
                 VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 0, 0)`,
                [otpId, cleanEmail, type, code]
            );
        } catch (dbErr) {
            console.error('[sendEmailOtp] DB insert error:', dbErr.message);
        }

        // Dispatch Email using emailService
        const recipientName = name || cleanEmail.split('@')[0];
        const templateSlug = type === 'password_reset' ? 'password-reset' : 'registration-otp';

        const emailResult = await emailService.sendTemplate(templateSlug, {
            to: cleanEmail,
            toName: recipientName,
            variables: {
                name: recipientName,
                user_name: recipientName,
                otp_code: code,
                platform_name: 'Nextvora Platform',
                expires_in: '15',
                reset_link: code
            }
        });

        console.log(`[Email OTP] Sent ${code} to ${cleanEmail} for ${type}. Delivery result:`, emailResult);

        res.json({
            success: true,
            message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني بنجاح / Verification code sent to your email',
            devOtp: process.env.NODE_ENV !== 'production' ? code : undefined
        });
    } catch (err) {
        console.error('[sendEmailOtp] Error:', err);
        res.status(500).json({ error: err.message });
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

        if (otpRecord.code !== cleanCode) {
            await db.query('UPDATE verification_otps SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id]);
            return res.status(400).json({ error: 'كود التحقق غير صحيح / Incorrect verification code' });
        }

        // Mark OTP as verified
        await db.query('UPDATE verification_otps SET is_verified = 1 WHERE id = ?', [otpRecord.id]);

        // Update email_verified in users and profiles if user exists
        try {
            await db.query('UPDATE users SET email_verified = 1 WHERE email = ?', [cleanEmail]);
            await db.query('UPDATE profiles SET email_verified = 1 WHERE email = ?', [cleanEmail]);
        } catch (colErr) {
            console.warn('[verifyEmailOtp] User update warning:', colErr.message);
        }

        res.json({
            success: true,
            verified: true,
            message: 'تم التحقق من البريد الإلكتروني بنجاح / Email verified successfully'
        });
    } catch (err) {
        console.error('[verifyEmailOtp] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Forgot Password - Send OTP
 */
exports.forgotPasswordOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'البريد الإلكتروني مطلوب / Email is required' });
    }

    const cleanEmail = email.trim().toLowerCase();

    try {
        const [users] = await db.query('SELECT id, email FROM users WHERE email = ?', [cleanEmail]);
        if (users.length === 0) {
            // For security, can respond with generic message or explicit error
            return res.status(404).json({ error: 'لم يتم العثور على حساب مسجل بهذا البريد الإلكتروني / No account found with this email' });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const otpId = crypto.randomUUID();

        await db.query(
            `INSERT INTO verification_otps (id, identifier, type, code, expires_at, is_verified, attempts)
             VALUES (?, ?, 'password_reset', ?, DATE_ADD(NOW(), INTERVAL 15 MINUTE), 0, 0)`,
            [otpId, cleanEmail, code]
        );

        await emailService.sendTemplate('registration-otp', {
            to: cleanEmail,
            variables: {
                name: cleanEmail.split('@')[0],
                user_name: cleanEmail.split('@')[0],
                otp_code: code,
                platform_name: 'Nextvora Platform',
                expires_in: '15'
            }
        });

        res.json({
            success: true,
            message: 'تم إرسال كود استعادة كلمة المرور إلى بريدك الإلكتروني / Password reset code sent to your email',
            devOtp: process.env.NODE_ENV !== 'production' ? code : undefined
        });
    } catch (err) {
        console.error('[forgotPasswordOtp] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * Reset Password with OTP
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

    try {
        const [rows] = await db.query(
            `SELECT id, code, attempts, expires_at FROM verification_otps
             WHERE identifier = ? AND type = 'password_reset' AND is_verified = 0 AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [cleanEmail]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'كود التحقق غير صالح أو انتهت صلاحيته / Reset code is invalid or expired' });
        }

        const otpRecord = rows[0];

        if (otpRecord.code !== cleanCode) {
            await db.query('UPDATE verification_otps SET attempts = attempts + 1 WHERE id = ?', [otpRecord.id]);
            return res.status(400).json({ error: 'كود التحقق غير صحيح / Incorrect verification code' });
        }

        // Mark OTP as used
        await db.query('UPDATE verification_otps SET is_verified = 1 WHERE id = ?', [otpRecord.id]);

        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, cleanEmail]);

        res.json({
            success: true,
            message: 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول / Password reset successfully. You can now login.'
        });
    } catch (err) {
        console.error('[resetPasswordWithOtp] Error:', err);
        res.status(500).json({ error: err.message });
    }
};


