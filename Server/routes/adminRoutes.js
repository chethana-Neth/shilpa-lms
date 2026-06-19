const express = require('express');
const router = express.Router();
const { verifyJWT, isAdmin } = require('../middleware/authMiddleware');
const { 
    getPendingEducators, 
    approveEducator, 
    rejectEducator,
    getStudentProgress,
    getQuizPerformance,
    getAssignmentPerformance
} = require('../controllers/adminController');

// All routes require admin authentication
router.use(verifyJWT, isAdmin);

router.get('/pending-educators', getPendingEducators);
router.put('/approve-educator/:id', approveEducator);
router.delete('/reject-educator/:id', rejectEducator);

// Analytics
router.get('/analytics/student-progress', getStudentProgress);
router.get('/analytics/quiz-performance', getQuizPerformance);
router.get('/analytics/assignment-performance', getAssignmentPerformance);

module.exports = router;