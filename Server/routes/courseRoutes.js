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
        // Date.now() alone isn't unique enough once multiple files (thumbnail +
        // several tutorial PDFs) can arrive in the same request/millisecond.
        // Adding a random suffix prevents them from overwriting each other.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Fetch all courses
router.get('/', courseController.getAllCourses);

// Add Course
// upload.any() accepts the courseThumbnail plus any number of per-lecture
// tutorial PDFs (field-named tute_<lectureId> by the frontend). The controller
// separates them out of req.files by fieldname.
router.post('/add-course', upload.any(), courseController.addCourse);

// Fetch single course all details
router.get('/:id', courseController.getCourseDetails);

// Delete course by id
router.delete('/:id', courseController.deleteCourse);

// Update course by id
// upload.any() accepts the courseThumbnail plus any number of per-lecture
// tutorial PDFs (field-named tute_existing_<id> or tute_new_<clientId>).
router.put('/:id', upload.any(), courseController.updateCourse);

module.exports = router;
