const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Student authenticated routes (must precede /:id)
router.get('/user/my-package', auth, packageController.getMyPackage);
router.get('/my-package', auth, packageController.getMyPackage);
router.post('/purchase', auth, packageController.purchaseOrUpgradePackage);

// Admin routes
router.post('/admin/:packageId/courses', auth, authorize('admin'), packageController.assignCoursesToPackage);
router.put('/admin/:id', auth, authorize('admin'), packageController.updatePackage);

// Public route to view packages
router.get('/', packageController.getAllPackages);
router.get('/:id', packageController.getPackageDetails);

module.exports = router;
