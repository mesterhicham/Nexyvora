const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { auth, authorize } = require('../middleware/authMiddleware');

router.use(auth);
router.use(authorize('admin', 'teacher'));

// Lessons
router.get('/lessons', teacherController.getTeacherLessons);
router.post('/lessons', teacherController.createLesson);

// Attendance
router.get('/attendance/:lessonId', teacherController.getLessonAttendance);
router.post('/attendance', teacherController.markAttendance);

// Assignments
router.get('/assignments', teacherController.getTeacherAssignments);
router.post('/assignments', teacherController.createAssignment);

// Announcements
router.get('/announcements', teacherController.getTeacherNews);
router.post('/announcements', teacherController.createTeacherNews);
router.put('/announcements/:id', teacherController.updateTeacherNews);
router.delete('/announcements/:id', teacherController.deleteTeacherNews);

// Formation Progress Dashboard
router.get('/formation-progress', teacherController.getFormationProgressDashboard);

module.exports = router;
