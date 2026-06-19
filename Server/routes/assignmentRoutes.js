const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const assignmentController = require('../controllers/assignmentController');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Educator — create assignment
router.post('/create', upload.single('assignmentFile'), assignmentController.createAssignment);

// Get assignment by lecture ID
router.get('/lecture/:lectureId', assignmentController.getAssignmentByLecture);

// Get assignment by assignment ID — used by SubmitAssignment.jsx
router.get('/get/:assignmentId', assignmentController.getAssignmentById);

// Student — submit assignment
router.post('/submit', upload.single('submissionFile'), assignmentController.submitAssignment);

// Get student's submission
router.get('/submission/:assignmentId/:studentId', assignmentController.getStudentSubmission);

// Educator — get all submissions
router.get('/submissions/:assignmentId', assignmentController.getAssignmentSubmissions);

// Educator — grade a submission
router.put('/grade/:submissionId', assignmentController.gradeSubmission);

// Educator — delete assignment
router.delete('/:assignmentId', assignmentController.deleteAssignment);

// Educator — update assignment
router.put('/:assignmentId', upload.single('assignmentFile'), assignmentController.updateAssignment);

module.exports = router;