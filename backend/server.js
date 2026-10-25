const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const academicRoutes = require('./routes/academic');
const userRoutes = require('./routes/user');
const uploadRoutes = require('./routes/upload');
const teacherRoutes = require('./routes/teacher');
const studentRoutes = require('./routes/student');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/payment');
const testRoutes = require('./routes/test');
const formationRoutes = require('./routes/formation');
const chatRoutes = require('./routes/chat');
const packageRoutes = require('./routes/package');
const affiliateRoutes = require('./routes/affiliate');
const communityRoutes = require('./routes/community');
const bonusPoolRoutes = require('./routes/bonusPools');
const founderRoutes = require('./routes/founder');
const currencyRoutes = require('./routes/currency');
const supportRoutes = require('./routes/support');
const promisedPackageRoutes = require('./routes/promisedPackage');
const ipnLogRoutes = require('./routes/ipnLog');
const serviceRoutes = require('./routes/services');
const paymentRenewalWorker = require('./workers/paymentRenewalWorker');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Nginx)
app.set('trust proxy', 1);

// ─── Security Headers ───────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

const isProd = process.env.NODE_ENV === 'production';

// ─── CORS - Restrict to known origins ───────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : ['http://localhost:8080', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // In non-production, allow local development hostnames & LAN testing
        if (!isProd && /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

// ─── Body size limit & Raw Body capture for webhook signature verification ──
app.use(express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// ─── Rate Limiting ───────────────────────────────────────────────────────────

// General limiter for all API routes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 1500 : 50000,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { error: 'Too many requests, please try again later.' },
});

// Strict limiter for auth routes (login/register)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 30 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { error: 'Too many authentication attempts, please try again later.' },
});

// Strict limiter for OTP generation & password resets to prevent spam and brute-force
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isProd ? 10 : 200,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: { error: 'Too many verification code attempts, please try again in 15 minutes.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/whatsapp/send-otp', otpLimiter);
app.use('/api/auth/email/send-otp', otpLimiter);
app.use('/api/auth/forgot-password-otp', otpLimiter);
app.use('/api/auth/reset-password-otp', otpLimiter);
app.use('/api/auth/whatsapp/verify-otp', otpLimiter);
app.use('/api/auth/email/verify-otp', otpLimiter);

// ─── Static Files (Public Assets Only) ───────────────────────────────────────
// Only files saved under uploads/public are accessible directly.
// Private files under uploads/private MUST be accessed through authenticated /api/upload/secure/:filename
app.use('/uploads', express.static(path.join(__dirname, 'uploads', 'public')));

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/user', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/test', testRoutes);
app.use('/api/formation', formationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/bonus-pools', bonusPoolRoutes);
app.use('/api/founders', founderRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/admin/promised-packages', promisedPackageRoutes);
app.use('/api/admin/ipn-logs', ipnLogRoutes);
app.use('/api/services', serviceRoutes);

// ─── Root & Health ────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ name: 'Nexyvora API', status: 'running' });
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    const isDev = process.env.NODE_ENV !== 'production';
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: isDev ? err.message : 'An internal server error occurred.',
    });
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[Nexyvora] Server running on http://0.0.0.0:${PORT} (${process.env.NODE_ENV || 'development'})`);
        // Start background payment renewal worker in standalone mode
        paymentRenewalWorker.start();
    });
}

process.on('uncaughtException', (err) => {
    console.error('[Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[Unhandled Rejection]', reason);
});

module.exports = app;

