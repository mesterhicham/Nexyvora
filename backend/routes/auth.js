const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, optionalAuth } = require('../middleware/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/change-password', auth, authController.changePassword);

// First Admin Setup
router.get('/check-admin', authController.checkAdminExists);
router.post('/setup-admin', optionalAuth, authController.setupFirstAdmin);
router.post('/setup-first-admin', optionalAuth, authController.setupFirstAdmin);

// WhatsApp OTP
router.post('/whatsapp/send-otp', authController.sendWhatsAppOtp);
router.post('/whatsapp/verify-otp', authController.verifyWhatsAppOtp);

// Email OTP & Password Reset
router.post('/email/send-otp', authController.sendEmailOtp);
router.post('/email/verify-otp', authController.verifyEmailOtp);
router.post('/forgot-password-otp', authController.forgotPasswordOtp);
router.post('/reset-password-otp', authController.resetPasswordWithOtp);

module.exports = router;
