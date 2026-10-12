const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.use(auth);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.delete('/account', userController.deleteAccount);
router.get('/stats/admin', authorize('admin'), userController.getAdminStats);
router.get('/stats/student', authorize('student'), userController.getStudentStats);
router.get('/stats/teacher', authorize('teacher'), userController.getTeacherStats);

module.exports = router;
