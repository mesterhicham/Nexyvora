const express = require('express');
const router = express.Router();
const ipnLogController = require('../controllers/ipnLogController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.use(auth);
router.use(authorize('admin'));

// Admin IPN Logs endpoints
router.get('/test-connection', ipnLogController.testNowPaymentsConnection);
router.get('/', ipnLogController.getAdminIpnLogs);
router.get('/:id', ipnLogController.getAdminIpnLogDetail);
router.post('/:id/renew', ipnLogController.triggerManualRenewal);

module.exports = router;
