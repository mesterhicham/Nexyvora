import { Student, Teacher, Program, Specialty, Cohort, Module, Lesson, Assignment, Diploma, Announcement, Grade, Attendance } from '@/types';

export const students: Student[] = [
  { id: '1', name: 'Ahmed Ben Ali', email: 'ahmed.benali@academy.edu', program: 'Specialized Technician', specialty: 'Software Development', cohort: 'DEV-2024-A', enrollmentDate: '2024-01-15', status: 'active' },
  { id: '2', name: 'Fatima Zahra', email: 'fatima.zahra@academy.edu', program: 'Technician', specialty: 'Network Administration', cohort: 'NET-2024-A', enrollmentDate: '2024-01-15', status: 'active' },
  { id: '3', name: 'Omar Hassan', email: 'omar.hassan@academy.edu', program: 'Specialized Technician', specialty: 'Database Management', cohort: 'DB-2024-A', enrollmentDate: '2024-01-15', status: 'active' },
  { id: '4', name: 'Layla Mansour', email: 'layla.mansour@academy.edu', program: 'Technician', specialty: 'Web Development', cohort: 'WEB-2024-A', enrollmentDate: '2024-01-15', status: 'active' },
  { id: '5', name: 'Youssef Karim', email: 'youssef.karim@academy.edu', program: 'Specialized Technician', specialty: 'Cybersecurity', cohort: 'SEC-2024-A', enrollmentDate: '2023-09-01', status: 'graduated' },
  { id: '6', name: 'Nadia Bouazizi', email: 'nadia.bouazizi@academy.edu', program: 'Technician', specialty: 'Software Development', cohort: 'DEV-2023-B', enrollmentDate: '2023-09-01', status: 'graduated' },
  { id: '7', name: 'Khalid Mehdi', email: 'khalid.mehdi@academy.edu', program: 'Specialized Technician', specialty: 'Cloud Computing', cohort: 'CLOUD-2024-A', enrollmentDate: '2024-01-15', status: 'active' },
  { id: '8', name: 'Sara Idrissi', email: 'sara.idrissi@academy.edu', program: 'Technician', specialty: 'Mobile Development', cohort: 'MOB-2024-A', enrollmentDate: '2024-01-15', status: 'active' },
];

export const teachers: Teacher[] = [
  { id: '1', name: 'Dr. Mohamed Alami', email: 'mohamed.alami@academy.edu', specialty: 'Software Development', modules: ['Advanced Programming', 'Data Structures'], joinDate: '2020-09-01', status: 'active' },
  { id: '2', name: 'Prof. Amina Tazi', email: 'amina.tazi@academy.edu', specialty: 'Database Management', modules: ['SQL Fundamentals', 'Database Design'], joinDate: '2019-09-01', status: 'active' },
  { id: '3', name: 'Dr. Hassan Benjelloun', email: 'hassan.benjelloun@academy.edu', specialty: 'Network Administration', modules: ['Network Fundamentals', 'System Administration'], joinDate: '2021-01-15', status: 'active' },
  { id: '4', name: 'Prof. Khadija Elhaddad', email: 'khadija.elhaddad@academy.edu', specialty: 'Cybersecurity', modules: ['Security Fundamentals', 'Ethical Hacking'], joinDate: '2022-09-01', status: 'active' },
  { id: '5', name: 'Dr. Rachid Ouahbi', email: 'rachid.ouahbi@academy.edu', specialty: 'Web Development', modules: ['Frontend Development', 'Backend Development'], joinDate: '2020-01-15', status: 'active' },
];

export const programs: Program[] = [
  { id: '1', name: 'Technician', duration: '2 years', description: 'Foundational technical training program covering essential IT skills and practical knowledge.', specialties: 4, students: 120 },
  { id: '2', name: 'Specialized Technician', duration: '2 years', description: 'Advanced technical program with specialized training in cutting-edge technologies.', specialties: 6, students: 180 },
];

export const specialties: Specialty[] = [
  { id: '1', name: 'Software Development', program: 'Specialized Technician', modules: 12, students: 45 },
  { id: '2', name: 'Network Administration', program: 'Technician', modules: 10, students: 30 },
  { id: '3', name: 'Database Management', program: 'Specialized Technician', modules: 11, students: 35 },
  { id: '4', name: 'Web Development', program: 'Technician', modules: 9, students: 40 },
  { id: '5', name: 'Cybersecurity', program: 'Specialized Technician', modules: 13, students: 25 },
  { id: '6', name: 'Cloud Computing', program: 'Specialized Technician', modules: 11, students: 30 },
  { id: '7', name: 'Mobile Development', program: 'Technician', modules: 10, students: 35 },
];

export const cohorts: Cohort[] = [
  { id: '1', name: 'DEV-2024-A', program: 'Specialized Technician', specialty: 'Software Development', startDate: '2024-01-15', endDate: '2026-01-15', students: 25, status: 'active' },
  { id: '2', name: 'NET-2024-A', program: 'Technician', specialty: 'Network Administration', startDate: '2024-01-15', endDate: '2026-01-15', students: 20, status: 'active' },
  { id: '3', name: 'DB-2024-A', program: 'Specialized Technician', specialty: 'Database Management', startDate: '2024-01-15', endDate: '2026-01-15', students: 22, status: 'active' },
  { id: '4', name: 'WEB-2024-A', program: 'Technician', specialty: 'Web Development', startDate: '2024-01-15', endDate: '2026-01-15', students: 28, status: 'active' },
  { id: '5', name: 'SEC-2023-A', program: 'Specialized Technician', specialty: 'Cybersecurity', startDate: '2023-01-15', endDate: '2024-12-15', students: 18, status: 'completed' },
  { id: '6', name: 'CLOUD-2025-A', program: 'Specialized Technician', specialty: 'Cloud Computing', startDate: '2025-01-15', endDate: '2027-01-15', students: 0, status: 'upcoming' },
];

export const modules: Module[] = [
  { id: '1', name: 'Advanced Programming', code: 'DEV-301', specialty: 'Software Development', hours: 80, teacher: 'Dr. Mohamed Alami' },
  { id: '2', name: 'Data Structures', code: 'DEV-302', specialty: 'Software Development', hours: 60, teacher: 'Dr. Mohamed Alami' },
  { id: '3', name: 'SQL Fundamentals', code: 'DB-201', specialty: 'Database Management', hours: 50, teacher: 'Prof. Amina Tazi' },
  { id: '4', name: 'Database Design', code: 'DB-301', specialty: 'Database Management', hours: 70, teacher: 'Prof. Amina Tazi' },
  { id: '5', name: 'Network Fundamentals', code: 'NET-101', specialty: 'Network Administration', hours: 60, teacher: 'Dr. Hassan Benjelloun' },
  { id: '6', name: 'System Administration', code: 'NET-201', specialty: 'Network Administration', hours: 80, teacher: 'Dr. Hassan Benjelloun' },
  { id: '7', name: 'Security Fundamentals', code: 'SEC-201', specialty: 'Cybersecurity', hours: 70, teacher: 'Prof. Khadija Elhaddad' },
  { id: '8', name: 'Frontend Development', code: 'WEB-201', specialty: 'Web Development', hours: 80, teacher: 'Dr. Rachid Ouahbi' },
];

export const lessons: Lesson[] = [
  { id: '1', title: 'Introduction to Object-Oriented Programming', module: 'Advanced Programming', date: '2024-12-28', duration: '2 hours', status: 'completed' },
  { id: '2', title: 'Inheritance and Polymorphism', module: 'Advanced Programming', date: '2024-12-30', duration: '2 hours', status: 'scheduled' },
  { id: '3', title: 'Linked Lists Implementation', module: 'Data Structures', date: '2024-12-29', duration: '3 hours', status: 'completed' },
  { id: '4', title: 'Binary Trees', module: 'Data Structures', date: '2025-01-02', duration: '2 hours', status: 'scheduled' },
  { id: '5', title: 'SELECT Queries', module: 'SQL Fundamentals', date: '2024-12-28', duration: '2 hours', status: 'completed' },
];

export const assignments: Assignment[] = [
  { id: '1', title: 'Build a Class Library System', module: 'Advanced Programming', dueDate: '2025-01-05', submissions: 18, totalStudents: 25, status: 'active' },
  { id: '2', title: 'Implement a Binary Search Tree', module: 'Data Structures', dueDate: '2025-01-10', submissions: 12, totalStudents: 25, status: 'active' },
  { id: '3', title: 'Design an E-Commerce Database', module: 'Database Design', dueDate: '2025-01-08', submissions: 20, totalStudents: 22, status: 'active' },
  { id: '4', title: 'Network Configuration Lab', module: 'Network Fundamentals', dueDate: '2024-12-20', submissions: 20, totalStudents: 20, status: 'closed' },
];

export const diplomas: Diploma[] = [
  { id: '1', serialNumber: 'DIP-2024-001', studentName: 'Youssef Karim', program: 'Specialized Technician', specialty: 'Cybersecurity', issueDate: '2024-12-15', status: 'issued' },
  { id: '2', serialNumber: 'DIP-2024-002', studentName: 'Nadia Bouazizi', program: 'Technician', specialty: 'Software Development', issueDate: '2024-12-15', status: 'issued' },
  { id: '3', serialNumber: 'DIP-2024-003', studentName: 'Samir Benani', program: 'Specialized Technician', specialty: 'Database Management', issueDate: '', status: 'pending' },
  { id: '4', serialNumber: 'DIP-2024-004', studentName: 'Houda Chami', program: 'Technician', specialty: 'Network Administration', issueDate: '', status: 'pending' },
];

export const announcements: Announcement[] = [
  { id: '1', title: 'Final Exams Schedule Published', content: 'The final examination schedule for the winter semester has been published. Please check your student portal for your individual exam times.', author: 'Administration', date: '2024-12-28', priority: 'high' },
  { id: '2', title: 'Holiday Break Reminder', content: 'The academy will be closed from January 1st to January 3rd for the New Year holiday.', author: 'Administration', date: '2024-12-27', priority: 'medium' },
  { id: '3', title: 'New Computer Lab Opening', content: 'We are pleased to announce the opening of our new state-of-the-art computer lab in Building C.', author: 'IT Department', date: '2024-12-25', priority: 'low' },
];

export const grades: Grade[] = [
  { id: '1', module: 'Advanced Programming', assignment: 'OOP Fundamentals Quiz', grade: 85, maxGrade: 100, date: '2024-12-15' },
  { id: '2', module: 'Advanced Programming', assignment: 'Class Design Project', grade: 90, maxGrade: 100, date: '2024-12-20' },
  { id: '3', module: 'Data Structures', assignment: 'Arrays and Lists', grade: 78, maxGrade: 100, date: '2024-12-18' },
  { id: '4', module: 'Database Design', assignment: 'ER Diagram Project', grade: 92, maxGrade: 100, date: '2024-12-22' },
];

export const attendanceRecords: Attendance[] = [
  { id: '1', date: '2024-12-28', module: 'Advanced Programming', status: 'present' },
  { id: '2', date: '2024-12-27', module: 'Data Structures', status: 'present' },
  { id: '3', date: '2024-12-26', module: 'Database Design', status: 'late' },
  { id: '4', date: '2024-12-25', module: 'Advanced Programming', status: 'present' },
  { id: '5', date: '2024-12-24', module: 'Data Structures', status: 'absent' },
];

export const currentUser = {
  id: '1',
  name: 'Ahmed Ben Ali',
  email: 'ahmed.benali@academy.edu',
  role: 'student' as const,
  avatar: '',
};

export const adminUser = {
  id: 'admin-1',
  name: 'Admin User',
  email: 'admin@academy.edu',
  role: 'admin' as const,
  avatar: '',
};

export const teacherUser = {
  id: 'teacher-1',
  name: 'Dr. Mohamed Alami',
  email: 'mohamed.alami@academy.edu',
  role: 'teacher' as const,
  avatar: '',
};

export const dashboardStats = {
  admin: {
    totalStudents: 300,
    totalTeachers: 25,
    totalPrograms: 2,
    totalCohorts: 12,
    activeStudents: 245,
    graduatedStudents: 55,
  },
  teacher: {
    totalModules: 4,
    totalStudents: 95,
    pendingAssignments: 12,
    upcomingLessons: 5,
  },
  student: {
    enrolledCourses: 6,
    completedAssignments: 18,
    pendingAssignments: 3,
    averageGrade: 86.5,
    attendanceRate: 94,
  },
};
