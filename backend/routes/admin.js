const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Public route to get platform settings (read-only for all visitors)
router.get('/settings', adminController.getSettings);

// Protected routes
router.use(auth);

// Meetings routes (available to authenticated users depending on role)
router.get('/zoom/teacher-meetings', authorize('admin', 'teacher'), adminController.getTeacherMeetings);
router.get('/zoom/student-meetings', authorize('admin', 'student'), adminController.getStudentMeetings);
router.post('/zoom/meetings/:id/open', authorize('admin', 'teacher'), adminController.toggleRoomOpen);

// News routes (available to authenticated users; non-admins get published items only)
router.get('/news', adminController.getNews);
router.post('/news/:id/view', adminController.recordNewsView);

// Admin-only routes
router.use(authorize('admin'));

router.post('/settings', adminController.updateSetting);

// Users Management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id', adminController.updateUser);
router.put('/users/:id/role', adminController.updateUserRole);
router.post('/users/:id/impersonate', adminController.impersonateUser);
router.delete('/users/:id', adminController.deleteUser);

// Payment & Withdrawal Gateways & Settings
const paymentMethodController = require('../controllers/paymentMethodController');
router.get('/payment-methods', paymentMethodController.getAdminPaymentMethods);
router.post('/payment-methods', paymentMethodController.createPaymentMethod);
router.put('/payment-methods/:id', paymentMethodController.updatePaymentMethod);
router.delete('/payment-methods/:id', paymentMethodController.deletePaymentMethod);
router.patch('/payment-methods/:id/status', paymentMethodController.toggleMethodStatus);
router.patch('/payment-methods/:id/deposit', paymentMethodController.toggleDeposit);
router.patch('/payment-methods/:id/withdrawal', paymentMethodController.toggleWithdrawal);
router.get('/payment-settings', paymentMethodController.getAdminPaymentMethods);

// Holidays
router.get('/holidays', adminController.getHolidays);
router.post('/holidays', adminController.createHoliday);
router.put('/holidays/:id', adminController.updateHoliday);
router.delete('/holidays/:id', adminController.deleteHoliday);

// News (Admin management)
router.post('/news', adminController.createNews);
router.put('/news/:id', adminController.updateNews);
router.delete('/news/:id', adminController.deleteNews);

// Email Settings & Templates
const emailController = require('../controllers/emailController');
router.get('/email/settings', emailController.getEmailSettings);
router.post('/email/settings', emailController.saveEmailSettings);
router.post('/email/test', emailController.testEmailSettings);
router.get('/email/templates', emailController.getEmailTemplates);
router.post('/email/templates', emailController.createEmailTemplate);
router.put('/email/templates/:id', emailController.updateEmailTemplate);
router.delete('/email/templates/:id', emailController.deleteEmailTemplate);
router.post('/email/templates/reset-defaults', emailController.resetDefaultTemplates);
router.get('/email/logs', emailController.getEmailLogs);

const adminAffiliate = require('../controllers/adminAffiliateController');

// Wallets Management
router.get('/wallets', adminAffiliate.getWallets);
router.post('/wallets/adjust', adminAffiliate.adjustWalletBalance);
router.post('/wallets/toggle-withdrawal', adminAffiliate.toggleUserWithdrawal);

// Withdrawal Monitoring
router.get('/withdrawals', adminAffiliate.getAdminWithdrawals);
router.post('/withdrawals/:id/approve', adminAffiliate.approveWithdrawal);
router.post('/withdrawals/:id/reject', adminAffiliate.rejectWithdrawal);

// Deposit Management
router.get('/deposits', adminAffiliate.getAdminDeposits);
router.post('/deposits/:id/approve', adminAffiliate.approveDeposit);
router.post('/deposits/:id/reject', adminAffiliate.rejectDeposit);

// Transactions Ledger
router.get('/transactions', adminAffiliate.getAdminTransactions);

// Team Tree
router.get('/team-tree', adminAffiliate.getAdminTeamTree);

// KYC Approvals
router.get('/kyc', adminAffiliate.getAdminKyc);
router.post('/kyc/:id/status', adminAffiliate.updateKycStatus);

// Leader Ranks & Achievers
router.get('/ranks', adminAffiliate.getAdminRanks);
router.put('/ranks/:id', adminAffiliate.updateAdminRank);
router.get('/ranks/achievers', adminAffiliate.getAdminRankAchievers);

// Generation Settings
router.get('/generation-settings', adminAffiliate.getGenerationSettings);
router.post('/generation-settings', adminAffiliate.updateGenerationSettings);

// Challenges Campaign Management
const challengeController = require('../controllers/challengeController');
router.get('/challenges', challengeController.getAdminChallenges);
router.post('/challenges', challengeController.createChallenge);
router.put('/challenges/:id', challengeController.updateChallenge);
router.delete('/challenges/:id', challengeController.deleteChallenge);
router.patch('/challenges/:id/status', challengeController.toggleChallengeStatus);

module.exports = router;
