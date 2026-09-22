const { db } = require('../config/db');

const queryPromise = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) {
                console.error("SQL Error full:", err); // ← log full error
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

// 1. GET ALL NOTICES FOR A COURSE
exports.getNotices = async (req, res) => {
    const { courseId } = req.params;
    try {
        const rows = await queryPromise(
            "SELECT * FROM course_notices WHERE course_id = ? ORDER BY created_at DESC",
            [courseId]
        );
        res.json({ success: true, notices: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. CREATE NOTICE
exports.createNotice = async (req, res) => {
    const { course_id, title, message } = req.body;
    if (!course_id || !title || !message) {
        return res.status(400).json({ success: false, message: "course_id, title and message are required." });
    }
    try {
        const result = await queryPromise(
            "INSERT INTO course_notices (course_id, title, message) VALUES (?, ?, ?)",
            [course_id, title, message]
        );
        const newNotice = await queryPromise(
            "SELECT * FROM course_notices WHERE notice_id = ?",
            [result.insertId]
        );
        res.json({ success: true, message: "Notice created!", notice: newNotice[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. UPDATE NOTICE
exports.updateNotice = async (req, res) => {
    const { noticeId } = req.params;
    const { title, message } = req.body;
    if (!title || !message) {
        return res.status(400).json({ success: false, message: "Title and message are required." });
    }
    try {
        await queryPromise(
            "UPDATE course_notices SET title = ?, message = ? WHERE notice_id = ?",
            [title, message, noticeId]
        );
        res.json({ success: true, message: "Notice updated." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. DELETE NOTICE
exports.deleteNotice = async (req, res) => {
    const { noticeId } = req.params;
    try {
        await queryPromise("DELETE FROM course_notices WHERE notice_id = ?", [noticeId]);
        res.json({ success: true, message: "Notice deleted." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};