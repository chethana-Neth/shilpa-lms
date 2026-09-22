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

// =========================================================
// REVENUE ANALYTICS
// =========================================================


const getRevenueAnalytics = async (req, res) => {
    try {
        const { groupBy = 'monthly', startDate, endDate } = req.query;

        // Default range: last 6 months if none provided
        let rangeEnd = endDate || new Date().toISOString().slice(0, 10);
        const defaultStart = new Date();
        defaultStart.setMonth(defaultStart.getMonth() - 6);
        let rangeStart = startDate || defaultStart.toISOString().slice(0, 10);

        // Guard against a reversed range (e.g. Start Date picked after End Date,
        // or Start Date left later than "today" while End Date is blank)
        if (new Date(rangeStart) > new Date(rangeEnd)) {
            [rangeStart, rangeEnd] = [rangeEnd, rangeStart];
        }

        let query;
        if (groupBy === 'weekly') {
            // Groups by ISO year-week, e.g. 2026-W27
            query = `
                SELECT 
                    DATE_FORMAT(paid_at, '%x-W%v') AS period,
                    MIN(DATE(paid_at)) AS period_start,
                    SUM(amount) AS revenue,
                    COUNT(*) AS transactions
                FROM payments
                WHERE status = 'success'
                  AND paid_at BETWEEN ? AND ?
                GROUP BY YEARWEEK(paid_at, 1)
                ORDER BY period_start ASC
            `;
        } else {
            // Groups by calendar month, e.g. 2026-06
            query = `
                SELECT 
                    DATE_FORMAT(paid_at, '%Y-%m') AS period,
                    MIN(DATE(paid_at)) AS period_start,
                    SUM(amount) AS revenue,
                    COUNT(*) AS transactions
                FROM payments
                WHERE status = 'success'
                  AND paid_at BETWEEN ? AND ?
                GROUP BY period
                ORDER BY period_start ASC
            `;
        }

        const rows = await queryPromise(query, [rangeStart, `${rangeEnd} 23:59:59`]);

        const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue), 0);
        const totalTransactions = rows.reduce((sum, r) => sum + Number(r.transactions), 0);

        res.json({
            Status: "Success",
            data: rows,
            summary: { totalRevenue, totalTransactions },
            groupBy,
            startDate: rangeStart,
            endDate: rangeEnd
        });
    } catch (error) {
        console.error("Get revenue analytics error:", error);
        res.status(500).json({ Status: "Error", Error: error.message });
    }
};

// =========================================================
// USER MANAGEMENT
// =========================================================

// GET ALL USERS (students + educators, excludes admins)
const getAllUsers = async (req, res) => {
    try {
        const rows = await queryPromise(`
            SELECT 
                u.id,
                u.username,
                u.email,
                u.status,
                u.created_at,
                r.role_name AS role,
                COUNT(DISTINCT e.enroll_id) AS enrollment_count,
                COALESCE(SUM(p.amount), 0) AS total_paid,
                MAX(e.enrolled_at) AS last_enrolled_at,
                MAX(e.expires_at) AS latest_expiry,
                CASE 
                    WHEN MAX(e.expires_at) IS NULL THEN 'never'
                    WHEN NOW() > DATE_ADD(MAX(e.expires_at), INTERVAL 3 DAY) THEN 'expired'
                    WHEN NOW() > MAX(e.expires_at) THEN 'grace'
                    ELSE 'active'
                END AS enrollment_status
            FROM users u
            LEFT JOIN user_roles ur ON ur.user_id = u.id
            LEFT JOIN roles r ON r.id = ur.role_id
            LEFT JOIN enrollments e ON e.student_id = u.id
            LEFT JOIN payments p ON p.student_id = u.id AND p.status = 'success'
            WHERE r.role_name != 'Admin'
            GROUP BY u.id
            ORDER BY u.created_at DESC
        `);
        res.json({ Status: "Success", data: rows });
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ Status: "Error", Error: error.message });
    }
};

// TOGGLE USER STATUS (active <-> inactive)
const toggleUserStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const users = await queryPromise("SELECT status FROM users WHERE id = ?", [id]);
        if (users.length === 0) {
            return res.status(404).json({ Status: "Error", Error: "User not found." });
        }
        const currentStatus = users[0].status;
        const newStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
        await queryPromise("UPDATE users SET status = ? WHERE id = ?", [newStatus, id]);
        res.json({
            Status: "Success",
            message: `User ${newStatus === 'inactive' ? 'deactivated' : 'activated'}.`,
            newStatus
        });
    } catch (error) {
        console.error("Toggle user status error:", error);
        res.status(500).json({ Status: "Error", Error: error.message });
    }
};

// DELETE USER
const deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const users = await queryPromise("SELECT id FROM users WHERE id = ?", [id]);
        if (users.length === 0) {
            return res.status(404).json({ Status: "Error", Error: "User not found." });
        }
        await queryPromise("DELETE FROM user_roles WHERE user_id = ?", [id]);
        await queryPromise("DELETE FROM users WHERE id = ?", [id]);
        res.json({ Status: "Success", message: "User deleted successfully." });
    } catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ Status: "Error", Error: error.message });
    }
};

// GET STUDENT'S ENROLLED COURSES (for detail panel)
const getStudentEnrollments = async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await queryPromise(`
            SELECT 
                c._id AS course_id,
                c.courseTitle,
                c.courseThumbnail,
                e.enrolled_at,
                e.expires_at,
                CASE 
                    WHEN NOW() > DATE_ADD(e.expires_at, INTERVAL 3 DAY) THEN 'expired'
                    WHEN NOW() > e.expires_at THEN 'grace'
                    ELSE 'active'
                END AS enrollment_status
            FROM enrollments e
            JOIN courses c ON c._id = e.course_id
            WHERE e.student_id = ?
            ORDER BY e.enrolled_at DESC
        `, [id]);
        res.json({ Status: "Success", data: rows });
    } catch (error) {
        console.error("Get student enrollments error:", error);
        res.status(500).json({ Status: "Error", Error: error.message });
    }
};

// GET EDUCATOR'S COURSES (for detail panel)
const getEducatorCourses = async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await queryPromise(`
            SELECT 
                c._id AS course_id,
                c.courseTitle,
                c.courseThumbnail,
                c.coursePrice,
                c.discount,
                c.createdAt,
                COUNT(DISTINCT e.enroll_id) AS student_count,
                COALESCE(
                    COUNT(DISTINCT e.enroll_id) * 
                    (c.coursePrice - (c.discount * c.coursePrice / 100)), 0
                ) AS earnings
            FROM courses c
            LEFT JOIN enrollments e ON e.course_id = c._id
            WHERE c.educator_id = ?
            GROUP BY c._id
            ORDER BY c.createdAt DESC
        `, [id]);
        res.json({ Status: "Success", data: rows });
    } catch (error) {
        console.error("Get educator courses error:", error);
        res.status(500).json({ Status: "Error", Error: error.message });
    }
};

// UPDATE USER (username + email)
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ Status: "Error", Error: "Username and email are required." });
    }
    try {
        await queryPromise(
            "UPDATE users SET username = ?, email = ? WHERE id = ?",
            [username, email, id]
        );
        res.json({ Status: "Success", message: "User updated successfully." });
    } catch (error) {
        console.error("Update user error:", error);
        res.status(500).json({ Status: "Error", Error: error.message });
    }
};

module.exports = {
    getPendingEducators,
    approveEducator,
    rejectEducator,
    getStudentProgress,
    getQuizPerformance,
    getAssignmentPerformance,
    getRevenueAnalytics,
    getAllUsers,
    toggleUserStatus,
    deleteUser,
    getStudentEnrollments,
    getEducatorCourses,
    updateUser
};
