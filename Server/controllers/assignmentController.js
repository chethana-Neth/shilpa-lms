const { db } = require('../config/db');
const path = require('path');
const fs = require('fs');

const queryPromise = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) { console.error("SQL Error:", err.sqlMessage); reject(err); }
            else resolve(result);
        });
    });
};

// 1. CREATE ASSIGNMENT
exports.createAssignment = async (req, res) => {
    try {
        const { lecture_id, title, instructions, deadline } = req.body;
        const filePath = req.file ? req.file.filename : null;

        if (!lecture_id || !title) {
            return res.status(400).json({ success: false, message: "lecture_id and title are required." });
        }

        const result = await queryPromise(
            `INSERT INTO assignments (lecture_id, title, instructions, file_path, deadline) 
             VALUES (?, ?, ?, ?, ?)`,
            [lecture_id, title, instructions || null, filePath, deadline || null]
        );

        res.json({ success: true, message: "Assignment created!", assignmentId: result.insertId });
    } catch (error) {
        console.error("Create assignment error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET ASSIGNMENT BY LECTURE ID
exports.getAssignmentByLecture = async (req, res) => {
    const { lectureId } = req.params;
    try {
        const assignments = await queryPromise(
            "SELECT * FROM assignments WHERE lecture_id = ?", [lectureId]
        );
        res.json({ success: true, assignment: assignments[0] || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. GET ASSIGNMENT BY ID
exports.getAssignmentById = async (req, res) => {
    const { assignmentId } = req.params;
    try {
        const assignments = await queryPromise(
            "SELECT * FROM assignments WHERE assignment_id = ?", [assignmentId]
        );
        if (assignments.length === 0) {
            return res.status(404).json({ success: false, message: "Assignment not found." });
        }
        res.json({ success: true, assignment: assignments[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. SUBMIT ASSIGNMENT (Student)
exports.submitAssignment = async (req, res) => {
    try {
        const { assignment_id, student_id, text_answer } = req.body;
        const filePath = req.file ? req.file.filename : null;

        if (!assignment_id || !student_id) {
            return res.status(400).json({ success: false, message: "Missing assignment_id or student_id." });
        }
        if (!text_answer && !filePath) {
            return res.status(400).json({ success: false, message: "Please provide a text answer or upload a file." });
        }

        const existing = await queryPromise(
            "SELECT submission_id FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?",
            [assignment_id, student_id]
        );

        if (existing.length > 0) {
            await queryPromise(
                `UPDATE assignment_submissions 
                 SET text_answer = ?, file_path = ?, submitted_at = CURRENT_TIMESTAMP 
                 WHERE assignment_id = ? AND student_id = ?`,
                [text_answer || null, filePath || null, assignment_id, student_id]
            );
            return res.json({ success: true, message: "Assignment resubmitted successfully!" });
        }

        await queryPromise(
            `INSERT INTO assignment_submissions (assignment_id, student_id, text_answer, file_path) 
             VALUES (?, ?, ?, ?)`,
            [assignment_id, student_id, text_answer || null, filePath]
        );

        res.json({ success: true, message: "Assignment submitted successfully!" });
    } catch (error) {
        console.error("Submit assignment error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. GET STUDENT'S SUBMISSION
exports.getStudentSubmission = async (req, res) => {
    const { assignmentId, studentId } = req.params;
    try {
        const submissions = await queryPromise(
            "SELECT * FROM assignment_submissions WHERE assignment_id = ? AND student_id = ?",
            [assignmentId, studentId]
        );
        res.json({ success: true, submission: submissions[0] || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. GET ALL SUBMISSIONS FOR AN ASSIGNMENT (Educator)
exports.getAssignmentSubmissions = async (req, res) => {
    const { assignmentId } = req.params;
    try {
        const submissions = await queryPromise(
            `SELECT s.*, u.username as studentName, u.email as studentEmail
             FROM assignment_submissions s
             JOIN users u ON s.student_id = u.id
             WHERE s.assignment_id = ?
             ORDER BY s.submitted_at DESC`,
            [assignmentId]
        );
        res.json({ success: true, submissions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7. GRADE SUBMISSION
exports.gradeSubmission = async (req, res) => {
    const { submissionId } = req.params;
    const { grade, feedback } = req.body;
    try {
        await queryPromise(
            "UPDATE assignment_submissions SET grade = ?, feedback = ? WHERE submission_id = ?",
            [grade, feedback || null, submissionId]
        );
        res.json({ success: true, message: "Grade saved." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 8. DELETE ASSIGNMENT - CASCADE with file cleanup
exports.deleteAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    try {
        // 1. Get all submission files to delete them from disk
        const submissions = await queryPromise(
            "SELECT file_path FROM assignment_submissions WHERE assignment_id = ?", [assignmentId]
        );
        for (const sub of submissions) {
            if (sub.file_path) {
                const fp = path.join(__dirname, '..', 'uploads', sub.file_path);
                fs.unlink(fp, err => { if (err && err.code !== 'ENOENT') console.error(err); });
            }
        }
        // 2. Delete submissions
        await queryPromise("DELETE FROM assignment_submissions WHERE assignment_id = ?", [assignmentId]);

        // 3. Delete assignment file
        const assignments = await queryPromise(
            "SELECT file_path FROM assignments WHERE assignment_id = ?", [assignmentId]
        );
        if (assignments.length > 0 && assignments[0].file_path) {
            const fp = path.join(__dirname, '..', 'uploads', assignments[0].file_path);
            fs.unlink(fp, err => { if (err && err.code !== 'ENOENT') console.error(err); });
        }
        // 4. Delete assignment
        await queryPromise("DELETE FROM assignments WHERE assignment_id = ?", [assignmentId]);

        res.json({ success: true, message: "Assignment and all submissions deleted." });
    } catch (error) {
        console.error("Delete assignment error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 9. UPDATE ASSIGNMENT
exports.updateAssignment = async (req, res) => {
    const { assignmentId } = req.params;
    const { title, instructions, deadline } = req.body;
    let filePath = null;

    if (req.file) {
        filePath = req.file.filename;
        // Delete old file if exists
        const old = await queryPromise("SELECT file_path FROM assignments WHERE assignment_id = ?", [assignmentId]);
        if (old.length && old[0].file_path) {
            const oldPath = path.join(__dirname, '..', 'uploads', old[0].file_path);
            fs.unlink(oldPath, err => { if (err && err.code !== 'ENOENT') console.error(err); });
        }
    }

    try {
        const updates = [];
        const values = [];
        if (title) { updates.push("title = ?"); values.push(title); }
        if (instructions !== undefined) { updates.push("instructions = ?"); values.push(instructions); }
        if (deadline !== undefined) { updates.push("deadline = ?"); values.push(deadline); }
        if (filePath) { updates.push("file_path = ?"); values.push(filePath); }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: "No fields to update." });
        }

        values.push(assignmentId);
        await queryPromise(
            `UPDATE assignments SET ${updates.join(", ")} WHERE assignment_id = ?`,
            values
        );

        res.json({ success: true, message: "Assignment updated successfully." });
    } catch (error) {
        console.error("Update assignment error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};