const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.use(auth);

// Pricing
router.get('/pricing', paymentController.getProgramPricing);
router.post('/pricing', authorize('admin'), paymentController.upsertPricing);

// Payments (Student)
router.get('/student-payments', authorize('student'), paymentController.getStudentPayments);
router.post('/submit', authorize('student'), paymentController.submitPayment);

// Payments (Admin)
router.get('/all-payments', authorize('admin'), paymentController.getAllPayments);
router.put('/:id/status', authorize('admin'), paymentController.updatePaymentStatus);

module.exports = router;
