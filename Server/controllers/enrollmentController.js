const crypto = require('crypto');
const { db } = require('../config/db');

const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID;
const MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET;

//  Insert payment record 
const insertPaymentRecord = (studentId, courseId, orderId, amount, currency, status = 'success') => {
    return new Promise((resolve, reject) => {
        db.query(
            `INSERT INTO payments (student_id, course_id, order_id, amount, currency, status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [studentId, courseId, orderId, amount, currency, status],
            (err, result) => {
                if (err) {
                    console.error("Payment insert error:", err.sqlMessage);
                    reject(err);
                } else {
                    console.log(`Payment recorded: payment_id=${result.insertId}`);
                    resolve(result);
                }
            }
        );
    });
};

// Insert or renew enrollment record with expiry date 
const insertOrRenewEnrollment = (studentId, courseId) => {
    return new Promise((resolve, reject) => {
        db.query(
            "SELECT enroll_id FROM enrollments WHERE student_id = ? AND course_id = ?",
            [studentId, courseId],
            (err, results) => {
                if (err) return reject(err);
                if (results.length > 0) {
                    db.query(
                        `UPDATE enrollments 
                         SET expires_at = IF(expires_at > NOW(), DATE_ADD(expires_at, INTERVAL 30 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY))
                         WHERE student_id = ? AND course_id = ?`,
                        [studentId, courseId],
                        (err2, result) => {
                            if (err2) reject(err2);
                            else resolve(result);
                        }
                    );
                } else {
                    db.query(
                        "INSERT INTO enrollments (student_id, course_id, enrolled_at, expires_at) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY))",
                        [studentId, courseId],
                        (err2, result) => {
                            if (err2) reject(err2);
                            else resolve(result);
                        }
                    );
                }
            }
        );
    });
};

// HASH FORMULA 
const generateHash = (orderId, amount, currency) => {
    const hashedSecret = crypto
        .createHash('md5')
        .update(MERCHANT_SECRET)
        .digest('hex')
        .toUpperCase();

    const hash = crypto
        .createHash('md5')
        .update(MERCHANT_ID + orderId + amount + currency + hashedSecret)
        .digest('hex')
        .toUpperCase();

    return hash;
};

// 1. GENERATE HASH
exports.getPaymentHash = (req, res) => {
    try {
        const { orderId, amount, currency } = req.body;

        if (!orderId || !amount || !currency) {
            return res.status(400).json({ success: false, message: "Missing orderId, amount or currency." });
        }

        const hash = generateHash(orderId, amount, currency);
        res.json({ success: true, hash, merchantId: MERCHANT_ID });

    } catch (error) {
        console.error("Hash generation error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. PAYHERE NOTIFY URL 
exports.payhereNotify = async (req, res) => {
    try {
        const {
            merchant_id,
            order_id,
            payhere_amount,
            payhere_currency,
            status_code,
            md5sig
        } = req.body;

        console.log("PayHere notify received:", req.body);

        const hashedSecret = crypto
            .createHash('md5')
            .update(MERCHANT_SECRET)
            .digest('hex')
            .toUpperCase();

        const localMd5Sig = crypto
            .createHash('md5')
            .update(
                merchant_id +
                order_id +
                payhere_amount +
                payhere_currency +
                status_code +
                hashedSecret
            )
            .digest('hex')
            .toUpperCase();

        if (localMd5Sig !== md5sig) {
            console.error("PayHere hash mismatch — possible fraud attempt");
            return res.sendStatus(400);
        }

        const parts = order_id.split('_');
        const courseId = parts[1];
        const userId = parts[2];

        if (status_code === '2') {
            console.log(`Payment confirmed — enrolling/renewing user ${userId} in course ${courseId}`);
            await insertPaymentRecord(userId, courseId, order_id, payhere_amount, payhere_currency, 'success');
            await insertOrRenewEnrollment(userId, courseId);
        } else if (status_code === '0') {
            await insertPaymentRecord(userId, courseId, order_id, payhere_amount, payhere_currency, 'pending');
        } else {
            const statusMap = { '-1': 'cancelled', '-2': 'failed', '-3': 'chargebacked' };
            const status = statusMap[status_code] || 'failed';
            await insertPaymentRecord(userId, courseId, order_id, payhere_amount, payhere_currency, status);
        }

        res.sendStatus(200);

    } catch (error) {
        console.error("Notify error:", error);
        res.sendStatus(500);
    }
};

// 3. MANUAL CONFIRM (localhost fallback)
exports.confirmEnrollment = async (req, res) => {
    const { courseId, userId, orderId, amount } = req.body;

    if (!courseId || !userId) {
        return res.status(400).json({ success: false, message: "Missing courseId or userId." });
    }

    try {
        await insertPaymentRecord(
            userId,
            courseId,
            orderId || `MANUAL_${courseId}_${userId}_${Date.now()}`,
            amount || 0,
            'LKR',
            'success'
        );

        await insertOrRenewEnrollment(userId, courseId);

        res.json({ success: true, message: "Enrollment confirmed / renewed." });

    } catch (error) {
        console.error("Confirm enrollment error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. CHECK IF STUDENT IS ENROLLED AND ACCESS IS ACTIVE (with grace period)
exports.checkEnrollment = (req, res) => {
    const { userId, courseId } = req.params;

    db.query(
        `SELECT expires_at FROM enrollments WHERE student_id = ? AND course_id = ?`,
        [userId, courseId],
        (err, results) => {
            if (err) return res.status(500).json({ success: false });
            if (results.length === 0) {
                return res.json({ success: true, enrolled: false, canRenew: false });
            }

            const expiresAt = new Date(results[0].expires_at);
            const now = new Date();
            const graceEnd = new Date(expiresAt);
            graceEnd.setDate(graceEnd.getDate() + 3); // 3 days grace

            if (now > graceEnd) {
                return res.json({ success: true, enrolled: false, canRenew: true, expired: true });
            }

            const inGrace = now > expiresAt;
            return res.json({
                success: true,
                enrolled: true,
                inGrace: inGrace,
                expiresAt: expiresAt,
                daysRemaining: Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24))
            });
        }
    );
};

// 5. GET ALL ENROLLED COURSES FOR A STUDENT WITH EXPIRY INFO
// Now includes full courseContent (chapters + lectures) so MyEnrollments
// shows correct duration and lecture count, and Player.jsx has content to render.
exports.getEnrolledCourses = (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT 
            c.*, 
            e.enrolled_at,
            e.expires_at,
            DATEDIFF(e.expires_at, NOW()) AS days_remaining,
            CASE 
                WHEN NOW() > DATE_ADD(e.expires_at, INTERVAL 3 DAY) THEN 'expired'
                WHEN NOW() > e.expires_at THEN 'grace'
                ELSE 'active'
            END AS status
        FROM courses c
        JOIN enrollments e ON c._id = e.course_id
        WHERE e.student_id = ?
        ORDER BY e.enrolled_at DESC`;

    db.query(sql, [userId], async (err, courseResults) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        if (courseResults.length === 0) {
            return res.json({ success: true, courses: [] });
        }

        // Helper: wrap db.query in a promise
        const query = (sql, params) => new Promise((resolve, reject) => {
            db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
        });

        try {
            const coursesWithContent = await Promise.all(
                courseResults.map(async (course) => {
                    // Fetch chapters for this course
                    const chapters = await query(
                        "SELECT * FROM chapters WHERE course_id = ? ORDER BY chapterOrder ASC",
                        [course._id]
                    );

                    if (chapters.length === 0) {
                        return { ...course, courseRatings: [], courseContent: [] };
                    }

                    // Fetch all lectures for those chapters in one query
                    const chapterIds = chapters.map(ch => ch.chapter_id);
                    const lectures = await query(
                        "SELECT * FROM lectures WHERE chapter_id IN (?) ORDER BY lectureOrder ASC",
                        [chapterIds]
                    );

                    // Group lectures under their chapter
                    const courseContent = chapters.map(chapter => ({
                        ...chapter,
                        chapterContent: lectures.filter(l => l.chapter_id === chapter.chapter_id)
                    }));

                    return {
                        ...course,
                        courseRatings: [],
                        courseContent
                    };
                })
            );

            res.json({ success: true, courses: coursesWithContent });

        } catch (error) {
            console.error("Error fetching course content for enrollments:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    });
};

// 6. GET ALL STUDENTS ENROLLED IN EDUCATOR'S COURSES
exports.getStudentsEnrolled = (req, res) => {
    const { educatorId } = req.params;

    const sql = `
        SELECT 
            u.id as studentId,
            u.username as studentName,
            u.email as studentEmail,
            c.courseTitle,
            c._id as courseId,
            e.enrolled_at as purchaseDate,
            e.expires_at,
            p.amount as amountPaid,
            p.currency,
            p.order_id as orderId,
            p.status as paymentStatus
        FROM enrollments e
        JOIN users u ON e.student_id = u.id
        JOIN courses c ON e.course_id = c._id
        LEFT JOIN payments p ON p.student_id = e.student_id 
            AND p.course_id = e.course_id 
            AND p.status = 'success'
        WHERE c.educator_id = ?
        ORDER BY e.enrolled_at DESC`;

    db.query(sql, [educatorId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, enrolledStudents: results });
    });
};

// 7. GET PAYMENT HISTORY FOR A STUDENT
exports.getPaymentHistory = (req, res) => {
    const { userId } = req.params;

    const sql = `
        SELECT 
            p.*,
            c.courseTitle,
            c.courseThumbnail
        FROM payments p
        JOIN courses c ON p.course_id = c._id
        WHERE p.student_id = ?
        ORDER BY p.paid_at DESC`;

    db.query(sql, [userId], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, payments: results });
    });
};