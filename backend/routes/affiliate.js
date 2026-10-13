const express = require('express');
const router = express.Router();
const affiliateController = require('../controllers/affiliateController');
const { auth } = require('../middleware/authMiddleware');

// All affiliate routes require authentication
router.use(auth);

// Wallet & Commissions
router.get('/wallet', affiliateController.getWallet);
router.get('/commissions', affiliateController.getCommissionsHistory);

// Withdrawals
router.post('/withdraw', affiliateController.requestWithdrawal);
router.get('/withdrawals', affiliateController.getMyWithdrawals);

// Wallet Deposits
router.post('/deposit', affiliateController.requestDeposit);
router.get('/deposits', affiliateController.getMyDeposits);
router.get('/deposits/:id/attempts', affiliateController.getDepositAttempts);
// Payment methods for deposits and withdrawals
const paymentMethodController = require('../controllers/paymentMethodController');
router.get('/payment-methods', paymentMethodController.getActiveMethodsForStudents);

// Payout settings (bank / paypal / payoneer)
router.get('/payout-settings', affiliateController.getPayoutSettings);
router.post('/payout-settings', affiliateController.updatePayoutSettings);

// 10-Generation Network Team & Tree
router.get('/team', affiliateController.getMyTeamNetwork);
router.get('/team-tree', affiliateController.getUserTeamTree);

// Ranks & Progress
router.get('/ranks', affiliateController.getRanksAndProgress);

// Challenges & Performance Rewards
const challengeController = require('../controllers/challengeController');
router.get('/challenges', challengeController.getStudentChallenges);

module.exports = router;
