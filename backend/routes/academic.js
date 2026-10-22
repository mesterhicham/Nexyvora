const express = require('express');
const router = express.Router();
const academicController = require('../controllers/academicController');
const { auth, authorize } = require('../middleware/authMiddleware');

// All academic routes require authentication
router.use(auth);

// Programs
router.get('/programs', academicController.getAllPrograms);
router.post('/programs', authorize('admin', 'teacher'), academicController.createProgram);
router.put('/programs/:id', authorize('admin', 'teacher'), academicController.updateProgram);
router.delete('/programs/:id', authorize('admin', 'teacher'), academicController.deleteProgram);

// Specialties
router.get('/specialties', academicController.getAllSpecialties);
router.post('/specialties', authorize('admin', 'teacher'), academicController.createSpecialty);
router.put('/specialties/:id', authorize('admin', 'teacher'), academicController.updateSpecialty);
router.delete('/specialties/:id', authorize('admin', 'teacher'), academicController.deleteSpecialty);

// Cohorts
router.get('/cohorts', academicController.getAllCohorts);
router.post('/cohorts', authorize('admin', 'teacher'), academicController.createCohort);
router.put('/cohorts/:id', authorize('admin', 'teacher'), academicController.updateCohort);
router.delete('/cohorts/:id', authorize('admin', 'teacher'), academicController.deleteCohort);

// Modules
router.get('/modules', academicController.getAllModules);
router.get('/modules/:id', academicController.getModuleById);
router.post('/modules', authorize('admin', 'teacher'), academicController.createModule);
router.put('/modules/:id', authorize('admin', 'teacher'), academicController.updateModule);
router.delete('/modules/:id', authorize('admin', 'teacher'), academicController.deleteModule);

// Students - Admin/Teacher only
router.get('/students', authorize('admin', 'teacher'), academicController.getAllStudents);
router.get('/students/:id/details', authorize('admin', 'teacher'), academicController.getStudentDetails);
router.post('/students', authorize('admin'), academicController.createStudent);
router.put('/students/:id', authorize('admin'), academicController.updateStudent);
router.delete('/students/:id', authorize('admin'), academicController.deleteStudent);
router.post('/students/:id/impersonate', authorize('admin'), academicController.impersonateStudent);
router.post('/students/:id/payments', authorize('admin'), academicController.addStudentPayment);

// Teachers - Admin/Teacher only
router.get('/teachers', authorize('admin', 'teacher'), academicController.getAllTeachers);
router.get('/teachers/:id/details', authorize('admin', 'teacher'), academicController.getTeacherDetails);
router.post('/teachers', authorize('admin'), academicController.createTeacher);
router.put('/teachers/:id', authorize('admin'), academicController.updateTeacher);
router.delete('/teachers/:id', authorize('admin'), academicController.deleteTeacher);

module.exports = router;
