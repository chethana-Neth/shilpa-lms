const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');

// Generate PayHere hash
router.post('/get-hash', enrollmentController.getPaymentHash);

// PayHere notify URL — called by PayHere servers after payment
router.post('/notify', enrollmentController.payhereNotify);

// Manual confirm — localhost fallback
router.post('/confirm', enrollmentController.confirmEnrollment);

// Check enrollment status
router.get('/check/:userId/:courseId', enrollmentController.checkEnrollment);

// Get enrolled courses for a student
router.get('/my-enrollments/:userId', enrollmentController.getEnrolledCourses);

// Get all students enrolled in educator's courses
router.get('/students/:educatorId', enrollmentController.getStudentsEnrolled);

// Get payment history for a student
router.get('/payment-history/:userId', enrollmentController.getPaymentHistory);



module.exports = router;
