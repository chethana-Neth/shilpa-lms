const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');

// Student — mark a lecture complete
router.post('/complete', progressController.markComplete);

// Get completed lecture ids for a student in a course
router.get('/completed/:studentId/:courseId', progressController.getCompletedLectures);

module.exports = router;