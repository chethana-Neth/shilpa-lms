const { db } = require('../config/db');

const queryPromise = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) { console.error("SQL Error:", err.sqlMessage); reject(err); }
            else resolve(result);
        });
    });
};

// 1. SUBMIT OR UPDATE RATING (enrolled students only)
exports.submitRating = async (req, res) => {
    const { course_id, student_id, rating } = req.body;

    if (!course_id || !student_id || !rating) {
        return res.status(400).json({ success: false, message: "course_id, student_id and rating are required." });
    }
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "Rating must be between 1 and 5." });
    }

    try {
        // Check student is actually enrolled
        const enrollment = await queryPromise(
            "SELECT enroll_id FROM enrollments WHERE student_id = ? AND course_id = ?",
            [student_id, course_id]
        );
        if (enrollment.length === 0) {
            return res.status(403).json({ success: false, message: "You must be enrolled to rate this course." });
        }

        // Insert or update (one rating per student per course)
        await queryPromise(
            `INSERT INTO course_ratings (course_id, student_id, rating) 
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
            [course_id, student_id, rating]
        );

        // Return updated average
        const stats = await queryPromise(
            "SELECT COUNT(*) as count, AVG(rating) as average FROM course_ratings WHERE course_id = ?",
            [course_id]
        );

        res.json({
            success: true,
            message: "Rating submitted!",
            average: parseFloat(stats[0].average).toFixed(1),
            count: stats[0].count
        });
    } catch (error) {
        console.error("Submit rating error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET STUDENT'S EXISTING RATING FOR A COURSE
exports.getMyRating = async (req, res) => {
    const { courseId, studentId } = req.params;
    try {
        const rows = await queryPromise(
            "SELECT rating FROM course_ratings WHERE course_id = ? AND student_id = ?",
            [courseId, studentId]
        );
        res.json({ success: true, rating: rows[0]?.rating || 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. GET ALL RATINGS FOR A COURSE (average + count)
exports.getCourseRatings = async (req, res) => {
    const { courseId } = req.params;
    try {
        const stats = await queryPromise(
            "SELECT COUNT(*) as count, COALESCE(AVG(rating), 0) as average FROM course_ratings WHERE course_id = ?",
            [courseId]
        );
        res.json({
            success: true,
            average: parseFloat(stats[0].average).toFixed(1),
            count: stats[0].count
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};