const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

router.post('/submit', ratingController.submitRating);
router.get('/my-rating/:courseId/:studentId', ratingController.getMyRating);
router.get('/course/:courseId', ratingController.getCourseRatings);

module.exports = router;