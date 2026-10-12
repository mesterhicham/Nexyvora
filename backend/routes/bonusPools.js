const express = require('express');
const router = express.Router();
const bonusPoolController = require('../controllers/bonusPoolController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Student route
router.get('/student', auth, bonusPoolController.getStudentBonusPools);

// Admin routes
router.get('/admin', auth, authorize('admin'), bonusPoolController.getAdminBonusPools);
router.post('/admin', auth, authorize('admin'), bonusPoolController.createBonusPool);
router.put('/admin/:id', auth, authorize('admin'), bonusPoolController.updateBonusPool);
router.delete('/admin/:id', auth, authorize('admin'), bonusPoolController.deleteBonusPool);
router.get('/admin/history', auth, authorize('admin'), bonusPoolController.getDistributionHistory);
router.get('/admin/:id/preview', auth, authorize('admin'), bonusPoolController.previewPoolDistribution);
router.post('/admin/:id/execute', auth, authorize('admin'), bonusPoolController.executePoolDistribution);

module.exports = router;
