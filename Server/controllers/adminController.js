const User = require('../models/userModel');
const { db } = require('../config/db');

const queryPromise = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) { console.error("SQL Error:", err.sqlMessage); reject(err); }
            else resolve(result);
        });
    });
};

// Get all pending educators
const getPendingEducators = (req, res) => {
    User.getPendingEducators((err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ Status: "Error", Error: err.message });
        }
        res.json({ Status: "Success", data: results });
    });
};

// Approve educator
const approveEducator = (req, res) => {
    const { id } = req.params;
    User.updateStatus(id, 'approved', (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ Status: "Error", Error: err.message });
        }
        res.json({ Status: "Success", message: "Educator approved" });
    });
};

// Reject educator
const rejectEducator = (req, res) => {
    const { id } = req.params;
    User.updateStatus(id, 'rejected', (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ Status: "Error", Error: err.message });
        }
        res.json({ Status: "Success", message: "Educator rejected" });
    });
};

// =========================================================
// STUDENT PROGRESS ANALYTICS
// =========================================================

// Per-student, per-course: completion %, lectures completed, time spent
const getStudentProgress = async (req, res) => {
    try {
        const rows = await queryPromise(`
            SELECT 
                u.id AS student_id,
                u.username AS student_name,
                c._id AS course_id,
                c.courseTitle AS course_title,
                COUNT(DISTINCT l.lecture_id) AS total_lectures,
                COUNT(DISTINCT lp.lecture_id) AS completed_lectures,
                COALESCE(SUM(CASE WHEN lp.lecture_id IS NOT NULL THEN l.lectureDuration ELSE 0 END), 0) AS time_spent_minutes
            FROM enrollments e
            JOIN users u ON u.id = e.student_id
            JOIN courses c ON c._id = e.course_id
            JOIN chapters ch ON ch.course_id = c._id
            JOIN lectures l ON l.chapter_id = ch.chapter_id
            LEFT JOIN lecture_progress lp ON lp.lecture_id = l.lecture_id AND lp.student_id = e.student_id
            GROUP BY u.id, c._id
            ORDER BY c.courseTitle, u.username
        `);

        const studentProgress = rows.map(r => ({
            ...r,
            completion_percent: r.total_lectures > 0
                ? Math.round((r.completed_lectures / r.total_lectures) * 100)
                : 0
        }));

        res.json({ Status: "Success", data: studentProgress });
    } catch (error) {
        console.error("Get student progress error:", error);
        res.status(500).json({ Status: "Error", Error: error.message });
    }
};

// Per-course average quiz score
const getQuizPerformance = async (req, res) => {
    try {
        const rows = await queryPromise(`
            SELECT 
                c._id AS course_id,
                c.courseTitle AS course_title,
                COUNT(*) AS attempts_count,
                ROUND(AVG(qa.score / qa.total_questions * 100), 1) AS avg_score_percent
            FROM quiz_attempts qa
            JOIN quizzes q ON q.quiz_id = qa.quiz_id
            JOIN lectures l ON l.lecture_id = q.lecture_id
            JOIN chapters ch ON ch.chapter_id = l.chapter_id
            JOIN courses c ON c._id = ch.course_id
            GROUP BY c._id
            ORDER BY c.courseTitle
        `);
        res.json({ Status: "Success", data: rows });
    } catch (error) {
        console.error("Get quiz performance error:", error);
        res.status(500).json({ Status: "Error", Error: error.message });
    }
};

// Per-course average assignment grade
const getAssignmentPerformance = async (req, res) => {
    try {
        const rows = await queryPromise(`
            SELECT 
                c._id AS course_id,
                c.courseTitle AS course_title,
                COUNT(s.submission_id) AS submissions_count,
                ROUND(AVG(s.grade), 1) AS avg_grade
            FROM assignment_submissions s
            JOIN assignments a ON a.assignment_id = s.assignment_id
            JOIN lectures l ON l.lecture_id = a.lecture_id
            JOIN chapters ch ON ch.chapter_id = l.chapter_id
            JOIN courses c ON c._id = ch.course_id
            WHERE s.grade IS NOT NULL
            GROUP BY c._id
            ORDER BY c.courseTitle
        `);
        res.json({ Status: "Success", data: rows });
    } catch (error) {
        console.error("Get assignment performance error:", error);
        res.status(500).json({ Status: "Error", Error: error.message });
    }
};

module.exports = {
    getPendingEducators,
    approveEducator,
    rejectEducator,
    getStudentProgress,
    getQuizPerformance,
    getAssignmentPerformance
};