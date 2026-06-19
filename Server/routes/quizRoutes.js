const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Educator — create quiz for a lecture
router.post('/create', quizController.createQuiz);

// Get quiz by lecture ID (educator: ?educator=true, student: no param)
router.get('/lecture/:lectureId', quizController.getQuizByLecture);

// Get quiz by quiz ID — used by TakeQuiz.jsx student page
router.get('/take/:quizId', quizController.getQuizById);

// Student — submit quiz attempt
router.post('/submit', quizController.submitQuiz);

// Get student's previous attempt
router.get('/attempt/:quizId/:studentId', quizController.getStudentAttempt);

// Educator — get all student attempts for a quiz
router.get('/attempts/:quizId', quizController.getQuizAttempts);

// Educator — delete quiz
router.delete('/:quizId', quizController.deleteQuiz);

// Educator — update quiz (full replacement)
router.put('/:quizId', quizController.updateQuiz);

module.exports = router;