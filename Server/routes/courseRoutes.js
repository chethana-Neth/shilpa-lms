const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Fetch all courses
router.get('/', courseController.getAllCourses);

// Add Course
router.post('/add-course', upload.single('courseThumbnail'), courseController.addCourse);

// Fetch single course all details
router.get('/:id', courseController.getCourseDetails);

// Delete course by id
router.delete('/:id', courseController.deleteCourse);

// Update course by id
router.put('/:id', upload.single('courseThumbnail'), courseController.updateCourse);

module.exports = router;
