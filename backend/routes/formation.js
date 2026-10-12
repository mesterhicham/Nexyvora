const express = require('express');
const router = express.Router();
const formationController = require('../controllers/formationController');
const { auth, authorize } = require('../middleware/authMiddleware');

// Public routes
router.get('/published', formationController.getPublishedFormations);

// Admin/Teacher routes
router.get('/', auth, formationController.getAllFormations);
router.post('/', auth, authorize('admin'), formationController.createFormation);
router.put('/:id', auth, authorize('admin'), formationController.updateFormation);
router.delete('/:id', auth, authorize('admin'), formationController.deleteFormation);

// Content routes
router.get('/:id/content', auth, formationController.getFormationContent);
router.post('/content', auth, authorize('admin'), formationController.addFormationContent);
router.put('/content/:id', auth, authorize('admin'), formationController.updateFormationContent);
router.delete('/content/:id', auth, authorize('admin'), formationController.deleteFormationContent);
router.post('/content/reorder', auth, authorize('admin'), formationController.reorderContent);

// Enrollments routes
router.get('/enrollments/all', auth, authorize('admin'), formationController.getAllEnrollments);
router.get('/enrollments/mine', auth, formationController.getStudentEnrollments);
router.put('/enrollments/:id/status', auth, authorize('admin'), formationController.updateEnrollmentStatus);

// Payments routes
router.get('/payments/all', auth, authorize('admin'), formationController.getAllPayments);
router.put('/payments/:id/status', auth, authorize('admin'), formationController.updatePaymentStatus);

// Progress routes
router.get('/progress/:enrollmentId', auth, formationController.getStudentProgress);
router.post('/progress', auth, formationController.updateStudentProgress);

// Enrollment/Purchase routes
router.post('/enroll', auth, formationController.submitPayment);

// Stats routes
router.get('/stats/revenue', auth, authorize('admin'), formationController.getFormationStats);

module.exports = router;
