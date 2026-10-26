const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { auth, authorize } = require('../middleware/authMiddleware');
const { requireApprovedTeacher } = require('../middleware/teacherMiddleware');

// All academic routes require authentication
router.use(auth);

// Programs
router.get('/programs', academicController.getAllPrograms);
router.post('/programs', authorize('admin'), academicController.createProgram);
router.put('/programs/:id', authorize('admin'), academicController.updateProgram);
router.delete('/programs/:id', authorize('admin'), academicController.deleteProgram);

// Specialties
router.get('/specialties', academicController.getAllSpecialties);
router.post('/specialties', authorize('admin'), academicController.createSpecialty);
router.put('/specialties/:id', authorize('admin'), academicController.updateSpecialty);
router.delete('/specialties/:id', authorize('admin'), academicController.deleteSpecialty);

// Cohorts
router.get('/cohorts', academicController.getAllCohorts);
router.post('/cohorts', authorize('admin'), academicController.createCohort);
router.put('/cohorts/:id', authorize('admin'), academicController.updateCohort);
router.delete('/cohorts/:id', authorize('admin'), academicController.deleteCohort);

// Modules
router.get('/modules', academicController.getAllModules);
router.get('/modules/:id', academicController.getModuleById);
router.post('/modules', authorize('admin', 'teacher'), requireApprovedTeacher, academicController.createModule);
router.put('/modules/:id', authorize('admin', 'teacher'), requireApprovedTeacher, academicController.updateModule);
router.delete('/modules/:id', authorize('admin', 'teacher'), requireApprovedTeacher, academicController.deleteModule);

// Students - Admin/Teacher only
router.get('/students', authorize('admin', 'teacher'), academicController.getAllStudents);
router.get('/students/:id/details', authorize('admin'), academicController.getStudentDetails);
router.post('/students', authorize('admin'), academicController.createStudent);
router.put('/students/:id', authorize('admin'), academicController.updateStudent);
router.delete('/students/:id', authorize('admin'), academicController.deleteStudent);
router.post('/students/:id/impersonate', authorize('admin'), academicController.impersonateStudent);
router.post('/students/:id/payments', authorize('admin'), academicController.addStudentPayment);

// Teachers - Admin/Teacher only
router.get('/teachers', authorize('admin', 'teacher'), academicController.getAllTeachers);
router.get('/teachers/:id/details', authorize('admin'), academicController.getTeacherDetails);
router.post('/teachers', authorize('admin'), academicController.createTeacher);
router.put('/teachers/:id', authorize('admin'), academicController.updateTeacher);
router.delete('/teachers/:id', authorize('admin'), academicController.deleteTeacher);

module.exports = router;
