const express = require('express');
const router = express.Router();
const promisedPackageController = require('../controllers/promisedPackageController');
const { auth, authorize } = require('../middleware/authMiddleware');

// All promised package routes are admin-only
router.use(auth);
router.use(authorize('admin'));

router.get('/', promisedPackageController.getPromisedPackages);
router.post('/grant', promisedPackageController.grantPackage);
router.put('/:id/revoke', promisedPackageController.revokePackage);
router.delete('/:id', promisedPackageController.deletePromisedPackage);

module.exports = router;
