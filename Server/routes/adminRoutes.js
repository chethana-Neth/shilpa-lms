const express = require('express');
const router = express.Router();
const { verifyJWT, isAdmin } = require('../middleware/authMiddleware');
const { 
    getPendingEducators, 
    approveEducator, 
    rejectEducator,
    getStudentProgress,
    getQuizPerformance,
    getAssignmentPerformance,
    getRevenueAnalytics,
    getAllUsers,
    toggleUserStatus,
    deleteUser,
    getStudentEnrollments,
    getEducatorCourses,
    updateUser
} = require('../controllers/adminController');

router.use(verifyJWT, isAdmin);

// Educator approval
router.get('/pending-educators', getPendingEducators);
router.put('/approve-educator/:id', approveEducator);
router.delete('/reject-educator/:id', rejectEducator);

// Analytics
router.get('/analytics/student-progress', getStudentProgress);
router.get('/analytics/quiz-performance', getQuizPerformance);
router.get('/analytics/assignment-performance', getAssignmentPerformance);
router.get('/analytics/revenue', getRevenueAnalytics);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/enrollments', getStudentEnrollments);
router.get('/users/:id/courses', getEducatorCourses);

module.exports = router;
