const express = require('express');
const router = express.Router();
const founderController = require('../controllers/founderController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Public or student overview
router.get('/overview', founderController.getFounderOverview);

// Student route: my status, seat info, or progress
router.get('/my-status', auth, founderController.getMyFounderStatus);

// Admin routes
router.get('/admin', auth, authorize('admin'), founderController.getAdminFounders);
router.put('/admin/settings', auth, authorize('admin'), founderController.updateFounderSettings);
router.post('/admin/grant', auth, authorize('admin'), founderController.manualGrantFounder);
router.patch('/admin/members/:id/status', auth, authorize('admin'), founderController.toggleFounderStatus);
router.get('/admin/preview', auth, authorize('admin'), founderController.previewMonthlyDistribution);
router.post('/admin/distribute', auth, authorize('admin'), founderController.executeMonthlyDistribution);

module.exports = router;
