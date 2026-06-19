const { db } = require('../config/db');

const queryPromise = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) { console.error("SQL Error:", err.sqlMessage); reject(err); }
            else resolve(result);
        });
    });
};

// 1. CREATE QUIZ
exports.createQuiz = async (req, res) => {
    try {
        const { lecture_id, title, description, time_limit, questions } = req.body;

        if (!lecture_id || !title || !questions || questions.length === 0) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        const quizResult = await queryPromise(
            "INSERT INTO quizzes (lecture_id, title, description, time_limit) VALUES (?, ?, ?, ?)",
            [lecture_id, title, description || null, time_limit || null]
        );
        const quizId = quizResult.insertId;

        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const qResult = await queryPromise(
                "INSERT INTO quiz_questions (quiz_id, question_text, question_order) VALUES (?, ?, ?)",
                [quizId, q.question_text, i + 1]
            );
            const questionId = qResult.insertId;

            for (const option of q.options) {
                await queryPromise(
                    "INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
                    [questionId, option.option_text, option.is_correct ? 1 : 0]
                );
            }
        }

        res.json({ success: true, message: "Quiz created successfully!", quizId });
    } catch (error) {
        console.error("Create quiz error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET QUIZ BY LECTURE ID
exports.getQuizByLecture = async (req, res) => {
    const { lectureId } = req.params;
    const isEducator = req.query.educator === 'true';

    try {
        const quizzes = await queryPromise(
            "SELECT * FROM quizzes WHERE lecture_id = ?", [lectureId]
        );

        if (quizzes.length === 0) {
            return res.json({ success: true, quiz: null });
        }

        const quiz = quizzes[0];
        const questions = await queryPromise(
            "SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY question_order ASC",
            [quiz.quiz_id]
        );

        for (const q of questions) {
            const cols = isEducator ? 'option_id, option_text, is_correct' : 'option_id, option_text';
            const options = await queryPromise(
                `SELECT ${cols} FROM quiz_options WHERE question_id = ?`, [q.question_id]
            );
            q.options = options;
        }

        quiz.questions = questions;
        res.json({ success: true, quiz });
    } catch (error) {
        console.error("Get quiz by lecture error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. GET QUIZ BY ID (for student take)
exports.getQuizById = async (req, res) => {
    const { quizId } = req.params;

    try {
        const quizzes = await queryPromise(
            "SELECT * FROM quizzes WHERE quiz_id = ?", [quizId]
        );

        if (quizzes.length === 0) {
            return res.status(404).json({ success: false, quiz: null, message: "Quiz not found." });
        }

        const quiz = quizzes[0];
        const questions = await queryPromise(
            "SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY question_order ASC",
            [quiz.quiz_id]
        );

        for (const q of questions) {
            const options = await queryPromise(
                "SELECT option_id, option_text FROM quiz_options WHERE question_id = ?",
                [q.question_id]
            );
            q.options = options;
        }

        quiz.questions = questions;
        res.json({ success: true, quiz });
    } catch (error) {
        console.error("Get quiz by id error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. SUBMIT QUIZ ATTEMPT
exports.submitQuiz = async (req, res) => {
    const { quiz_id, student_id, answers } = req.body;

    if (!quiz_id || !student_id || !answers) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    try {
        let score = 0;

        for (const answer of answers) {
            const options = await queryPromise(
                "SELECT is_correct FROM quiz_options WHERE option_id = ?",
                [answer.selected_option_id]
            );
            if (options.length > 0 && options[0].is_correct) {
                score++;
            }
        }

        const totalQuestions = answers.length;

        await queryPromise(
            "INSERT INTO quiz_attempts (quiz_id, student_id, score, total_questions) VALUES (?, ?, ?, ?)",
            [quiz_id, student_id, score, totalQuestions]
        );

        res.json({
            success: true,
            message: "Quiz submitted!",
            score,
            total: totalQuestions,
            percentage: Math.round((score / totalQuestions) * 100)
        });
    } catch (error) {
        console.error("Submit quiz error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. GET STUDENT'S PREVIOUS ATTEMPT
exports.getStudentAttempt = async (req, res) => {
    const { quizId, studentId } = req.params;
    try {
        const attempts = await queryPromise(
            "SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ORDER BY completed_at DESC LIMIT 1",
            [quizId, studentId]
        );
        res.json({ success: true, attempt: attempts[0] || null });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. GET ALL ATTEMPTS FOR A QUIZ (Educator)
exports.getQuizAttempts = async (req, res) => {
    const { quizId } = req.params;
    try {
        const attempts = await queryPromise(
            `SELECT qa.*, u.username as studentName, u.email as studentEmail
             FROM quiz_attempts qa
             JOIN users u ON qa.student_id = u.id
             WHERE qa.quiz_id = ?
             ORDER BY qa.completed_at DESC`,
            [quizId]
        );
        res.json({ success: true, attempts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7. DELETE QUIZ - CASCADE (Educator)
exports.deleteQuiz = async (req, res) => {
    const { quizId } = req.params;
    try {
        // 1. Delete quiz attempts
        await queryPromise("DELETE FROM quiz_attempts WHERE quiz_id = ?", [quizId]);
        // 2. Get all questions
        const questions = await queryPromise("SELECT question_id FROM quiz_questions WHERE quiz_id = ?", [quizId]);
        for (const q of questions) {
            await queryPromise("DELETE FROM quiz_options WHERE question_id = ?", [q.question_id]);
        }
        // 3. Delete questions
        await queryPromise("DELETE FROM quiz_questions WHERE quiz_id = ?", [quizId]);
        // 4. Delete quiz
        await queryPromise("DELETE FROM quizzes WHERE quiz_id = ?", [quizId]);

        res.json({ success: true, message: "Quiz and all related data deleted." });
    } catch (error) {
        console.error("Delete quiz error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 8. UPDATE QUIZ (full replacement)
exports.updateQuiz = async (req, res) => {
    const { quizId } = req.params;
    const { title, description, time_limit, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
        return res.status(400).json({ success: false, message: "Title and at least one question required." });
    }

    try {
        // Update quiz header
        await queryPromise(
            "UPDATE quizzes SET title = ?, description = ?, time_limit = ? WHERE quiz_id = ?",
            [title, description || null, time_limit || null, quizId]
        );

        // Delete existing questions and options
        const existingQuestions = await queryPromise(
            "SELECT question_id FROM quiz_questions WHERE quiz_id = ?", [quizId]
        );
        for (const q of existingQuestions) {
            await queryPromise("DELETE FROM quiz_options WHERE question_id = ?", [q.question_id]);
        }
        await queryPromise("DELETE FROM quiz_questions WHERE quiz_id = ?", [quizId]);

        // Re-insert questions and options
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const qResult = await queryPromise(
                "INSERT INTO quiz_questions (quiz_id, question_text, question_order) VALUES (?, ?, ?)",
                [quizId, q.question_text, i + 1]
            );
            const questionId = qResult.insertId;
            for (const opt of q.options) {
                await queryPromise(
                    "INSERT INTO quiz_options (question_id, option_text, is_correct) VALUES (?, ?, ?)",
                    [questionId, opt.option_text, opt.is_correct ? 1 : 0]
                );
            }
        }

        res.json({ success: true, message: "Quiz updated successfully!" });
    } catch (error) {
        console.error("Update quiz error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};