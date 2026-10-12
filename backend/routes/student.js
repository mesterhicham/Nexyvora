const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.use(auth);
router.use(authorize('admin', 'student'));

// Profile
router.get('/record', studentController.getStudentRecord);

// Lessons
router.get('/lessons', studentController.getStudentLessons);

// Attendance
router.get('/attendance', studentController.getStudentAttendance);

// Program Selection
router.post('/select-program', studentController.selectProgram);

// Assignments
router.get('/assignments', studentController.getStudentAssignments);
router.post('/submit-assignment', studentController.submitAssignment);

module.exports = router;
