const { db } = require('../config/db');

const queryPromise = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) { console.error("SQL Error:", err.sqlMessage); reject(err); }
            else resolve(result);
        });
    });
};

// 1. MARK A LECTURE AS COMPLETE FOR A STUDENT
exports.markComplete = async (req, res) => {
    const { student_id, lecture_id } = req.body;

    if (!student_id || !lecture_id) {
        return res.status(400).json({ success: false, message: "student_id and lecture_id are required." });
    }

    try {
        await queryPromise(
            "INSERT IGNORE INTO lecture_progress (student_id, lecture_id) VALUES (?, ?)",
            [student_id, lecture_id]
        );
        res.json({ success: true, message: "Lecture marked complete." });
    } catch (error) {
        console.error("Mark complete error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET COMPLETED LECTURE IDS FOR A STUDENT IN A COURSE
exports.getCompletedLectures = async (req, res) => {
    const { studentId, courseId } = req.params;

    try {
        const rows = await queryPromise(
            `SELECT lp.lecture_id 
             FROM lecture_progress lp
             JOIN lectures l ON l.lecture_id = lp.lecture_id
             JOIN chapters ch ON ch.chapter_id = l.chapter_id
             WHERE lp.student_id = ? AND ch.course_id = ?`,
            [studentId, courseId]
        );
        res.json({ success: true, completedLectureIds: rows.map(r => r.lecture_id) });
    } catch (error) {
        console.error("Get completed lectures error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};