const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');
const { auth, authorize, optionalAuth } = require('../middleware/authMiddleware');

// Public / Authenticated user route to get current rule based on detection
router.get('/my-rule', optionalAuth, currencyController.getMyCurrencyRule);

// Protected Admin Routes
router.get('/admin/rules', auth, authorize('admin'), currencyController.getAdminRules);
router.post('/admin/rules', auth, authorize('admin'), currencyController.createAdminRule);
router.put('/admin/rules/:countryCode', auth, authorize('admin'), currencyController.updateAdminRule);
router.get('/admin/audit-logs', auth, authorize('admin'), currencyController.getAdminAuditLogs);

module.exports = router;
