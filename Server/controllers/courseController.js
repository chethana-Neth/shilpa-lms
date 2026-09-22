const { db } = require('../config/db');
const fs = require('fs');
const path = require('path');

const queryPromise = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) {
                console.error("SQL Error:", err.sqlMessage);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

// 1. FETCH ALL COURSES
exports.getAllCourses = (req, res) => {
    const sql = `
        SELECT c.*, u.username as educatorName, COUNT(e.enroll_id) as enrolledStudentsCount
        FROM courses c
        JOIN users u ON c.educator_id = u.id
        LEFT JOIN enrollments e ON c._id = e.course_id
        GROUP BY c._id`;

    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        const coursesWithRatings = results.map(course => ({
            ...course,
            educator_id: Number(course.educator_id),
            courseRatings: []
        }));

        res.json({ success: true, courses: coursesWithRatings });
    });
};

// 2. FETCH SINGLE COURSE DETAILS (includes meetDateTime and tuteUrl)
exports.getCourseDetails = (req, res) => {
    const { id } = req.params;

    const sql = `SELECT c.*, u.username as educatorName 
                 FROM courses c 
                 JOIN users u ON c.educator_id = u.id 
                 WHERE c._id = ?`;

    db.query(sql, [id], (err, courseResult) => {
        if (err || courseResult.length === 0)
            return res.status(404).json({ success: false, message: "Course not found" });

        const course = courseResult[0];

        db.query("SELECT * FROM chapters WHERE course_id = ? ORDER BY chapterOrder ASC", [id], (err, chapters) => {
            if (err) return res.status(500).json({ success: false, message: err.message });

            const chapterIds = chapters.map(ch => ch.chapter_id);

            if (chapterIds.length === 0) {
                return res.json({ success: true, courseData: { ...course, courseContent: [] } });
            }

            // SELECT * automatically includes the new tuteUrl column once it's added to the table
            db.query("SELECT * FROM lectures WHERE chapter_id IN (?) ORDER BY lectureOrder ASC", [chapterIds], (err, lectures) => {
                if (err) return res.status(500).json({ success: false, message: err.message });

                const courseContent = chapters.map(chapter => ({
                    ...chapter,
                    meetLink: chapter.meetLink,
                    meetDateTime: chapter.meetDateTime,
                    chapterContent: lectures.filter(l => l.chapter_id === chapter.chapter_id)
                }));

                res.json({ success: true, courseData: { ...course, courseContent } });
            });
        });
    });
};

// 3. ADD NEW COURSE
exports.addCourse = async (req, res) => {
    try {
        console.log("addCourse called");
        console.log("req.body:", req.body);
        console.log("req.files:", req.files);

        const { educator_id, courseTitle, courseDescription, coursePrice, discount, chapters } = req.body;

        if (!educator_id || !courseTitle || coursePrice === undefined || !chapters) {
            console.error("Missing fields — multipart body was not parsed correctly");
            return res.status(400).json({
                success: false,
                message: "Missing required fields. Ensure the route uses the correct upload middleware."
            });
        }

        let parsedChapters;
        try {
            parsedChapters = JSON.parse(chapters);
        } catch (e) {
            return res.status(400).json({ success: false, message: "Invalid chapters JSON." });
        }

       
        const filesArray = req.files || [];
        const thumbnailFile = filesArray.find(f => f.fieldname === 'courseThumbnail');
        const courseThumbnail = thumbnailFile ? thumbnailFile.filename : '';

        // Map: client-side lectureId -> uploaded PDF filename
        const tuteFileMap = {};
        filesArray.forEach(f => {
            const match = f.fieldname.match(/^tute_(.+)$/);
            if (match) {
                tuteFileMap[match[1]] = f.filename;
            }
        });

        const sqlCourse = `INSERT INTO courses 
            (educator_id, courseTitle, courseDescription, coursePrice, discount, courseThumbnail, isPublished) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const courseResult = await queryPromise(sqlCourse, [
            Number(educator_id),
            courseTitle,
            courseDescription,
            Number(coursePrice),
            Number(discount),
            courseThumbnail,
            1
        ]);

        const newCourseId = courseResult.insertId;

        for (const chapter of parsedChapters) {
            const chapResult = await queryPromise(
                "INSERT INTO chapters (course_id, chapterTitle, chapterOrder, meetLink, meetDateTime) VALUES (?, ?, ?, ?, ?)",
                [newCourseId, chapter.chapterTitle, chapter.chapterOrder, chapter.meetLink || null, chapter.meetDateTime || null]
            );
            const newChapterId = chapResult.insertId;

            if (chapter.chapterContent && chapter.chapterContent.length > 0) {
                for (const lecture of chapter.chapterContent) {
                    
                    const tuteUrl = tuteFileMap[lecture.lectureId] || null;

                    await queryPromise(
                        `INSERT INTO lectures 
                         (chapter_id, lectureTitle, lectureDuration, lectureUrl, isPreviewFree, lectureOrder, tuteUrl) 
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            newChapterId,
                            lecture.lectureTitle,
                            Number(lecture.lectureDuration),
                            lecture.lectureUrl,
                            lecture.isPreviewFree ? 1 : 0,
                            lecture.lectureOrder,
                            tuteUrl
                        ]
                    );
                }
            }
        }

        res.status(200).json({ success: true, message: "Course Added Successfully!" });

    } catch (error) {
        console.error("Add Course Error:", error);
        res.status(500).json({
            success: false,
            message: "Database Error: " + (error.sqlMessage || error.message)
        });
    }
};

// 4. DELETE COURSE (with cascade delete for assignments/quizzes)
exports.deleteCourse = async (req, res) => {
    const { id } = req.params;

    try {
        const courseRows = await queryPromise(
            "SELECT courseThumbnail FROM courses WHERE _id = ?", [id]
        );

        if (courseRows.length === 0) {
            return res.status(404).json({ success: false, message: "Course not found." });
        }

        const thumbnailFilename = courseRows[0].courseThumbnail;

        const chapters = await queryPromise(
            "SELECT chapter_id FROM chapters WHERE course_id = ?", [id]
        );
        
        if (chapters.length > 0) {
            const chapterIds = chapters.map(ch => ch.chapter_id);
            const lectures = await queryPromise(
                "SELECT lecture_id FROM lectures WHERE chapter_id IN (?)", [chapterIds]
            );
            const lectureIds = lectures.map(l => l.lecture_id);
            
            for (const lectureId of lectureIds) {
                const assignments = await queryPromise(
                    "SELECT assignment_id FROM assignments WHERE lecture_id = ?", [lectureId]
                );
                for (const assign of assignments) {
                    const submissions = await queryPromise(
                        "SELECT file_path FROM assignment_submissions WHERE assignment_id = ?", [assign.assignment_id]
                    );
                    for (const sub of submissions) {
                        if (sub.file_path) {
                            const fp = path.join(__dirname, '..', 'uploads', sub.file_path);
                            fs.unlink(fp, err => { if (err && err.code !== 'ENOENT') console.error(err); });
                        }
                    }
                    await queryPromise("DELETE FROM assignment_submissions WHERE assignment_id = ?", [assign.assignment_id]);
                    
                    const assignData = await queryPromise(
                        "SELECT file_path FROM assignments WHERE assignment_id = ?", [assign.assignment_id]
                    );
                    if (assignData[0]?.file_path) {
                        const fp = path.join(__dirname, '..', 'uploads', assignData[0].file_path);
                        fs.unlink(fp, err => { if (err && err.code !== 'ENOENT') console.error(err); });
                    }
                    await queryPromise("DELETE FROM assignments WHERE assignment_id = ?", [assign.assignment_id]);
                }
                
                const quizzes = await queryPromise(
                    "SELECT quiz_id FROM quizzes WHERE lecture_id = ?", [lectureId]
                );
                for (const quiz of quizzes) {
                    await queryPromise("DELETE FROM quiz_attempts WHERE quiz_id = ?", [quiz.quiz_id]);
                    await queryPromise("DELETE FROM quizzes WHERE quiz_id = ?", [quiz.quiz_id]);
                }

                // Also clean up any tutorial PDF file for this lecture
                const lectureData = await queryPromise(
                    "SELECT tuteUrl FROM lectures WHERE lecture_id = ?", [lectureId]
                );
                if (lectureData[0]?.tuteUrl) {
                    const fp = path.join(__dirname, '..', 'uploads', lectureData[0].tuteUrl);
                    fs.unlink(fp, err => { if (err && err.code !== 'ENOENT') console.error(err); });
                }
            }
            
            await queryPromise("DELETE FROM lectures WHERE chapter_id IN (?)", [chapterIds]);
        }
        
        await queryPromise("DELETE FROM chapters WHERE course_id = ?", [id]);
        await queryPromise("DELETE FROM courses WHERE _id = ?", [id]);

        if (thumbnailFilename) {
            const filePath = path.join(__dirname, '..', 'uploads', thumbnailFilename);
            fs.unlink(filePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error("Failed to delete thumbnail file:", err.message);
                }
            });
        }

        res.json({ success: true, message: "Course deleted successfully." });

    } catch (error) {
        console.error("Delete Course Error:", error);
        res.status(500).json({
            success: false,
            message: "Database Error: " + (error.sqlMessage || error.message)
        });
    }
};

// 5. UPDATE COURSE - Incremental update (preserve IDs, keep quizzes/assignments)
exports.updateCourse = async (req, res) => {
    const { id } = req.params;

    try {
        const { courseTitle, courseDescription, coursePrice, discount, chapters } = req.body;

        if (!courseTitle || coursePrice === undefined || !chapters) {
            return res.status(400).json({ success: false, message: "Missing required fields." });
        }

        let parsedChapters;
        try {
            parsedChapters = JSON.parse(chapters);
        } catch (e) {
            return res.status(400).json({ success: false, message: "Invalid chapters JSON." });
        }

        
        const filesArray = req.files || [];
        const thumbnailFile = filesArray.find(f => f.fieldname === 'courseThumbnail');

        const tuteFileMap = {};
        filesArray.forEach(f => {
            const match = f.fieldname.match(/^tute_(existing_.+|new_.+)$/);
            if (match) {
                tuteFileMap[match[1]] = f.filename;
            }
        });

        // 1. Update course main info (with optional thumbnail)
        if (thumbnailFile) {
            const courseRows = await queryPromise(
                "SELECT courseThumbnail FROM courses WHERE _id = ?", [id]
            );
            if (courseRows.length > 0 && courseRows[0].courseThumbnail) {
                const oldFilePath = path.join(__dirname, '..', 'uploads', courseRows[0].courseThumbnail);
                fs.unlink(oldFilePath, (err) => {
                    if (err && err.code !== 'ENOENT') console.error("Failed to delete old thumbnail:", err.message);
                });
            }
            await queryPromise(
                `UPDATE courses SET courseTitle=?, courseDescription=?, coursePrice=?, discount=?, courseThumbnail=? WHERE _id=?`,
                [courseTitle, courseDescription, Number(coursePrice), Number(discount), thumbnailFile.filename, id]
            );
        } else {
            await queryPromise(
                `UPDATE courses SET courseTitle=?, courseDescription=?, coursePrice=?, discount=? WHERE _id=?`,
                [courseTitle, courseDescription, Number(coursePrice), Number(discount), id]
            );
        }

        // 2. Get existing chapters for this course
        const existingChapters = await queryPromise(
            "SELECT chapter_id, chapterTitle, chapterOrder, meetLink, meetDateTime FROM chapters WHERE course_id = ?",
            [id]
        );

        const keptChapterIds = [];

        // 3. Process each chapter from frontend
        for (const newChapter of parsedChapters) {
            let chapterId = newChapter.chapter_id;

            if (chapterId && existingChapters.some(ch => ch.chapter_id === chapterId)) {
                // Update existing chapter
                await queryPromise(
                    `UPDATE chapters SET chapterTitle=?, chapterOrder=?, meetLink=?, meetDateTime=? WHERE chapter_id=? AND course_id=?`,
                    [newChapter.chapterTitle, newChapter.chapterOrder, newChapter.meetLink || null, newChapter.meetDateTime || null, chapterId, id]
                );
                keptChapterIds.push(chapterId);
            } else {
                // Insert new chapter
                const result = await queryPromise(
                    `INSERT INTO chapters (course_id, chapterTitle, chapterOrder, meetLink, meetDateTime) VALUES (?,?,?,?,?)`,
                    [id, newChapter.chapterTitle, newChapter.chapterOrder, newChapter.meetLink || null, newChapter.meetDateTime || null]
                );
                chapterId = result.insertId;
                keptChapterIds.push(chapterId);
            }

            // 4. Process lectures inside this chapter
            const existingLectures = await queryPromise(
                "SELECT lecture_id, tuteUrl FROM lectures WHERE chapter_id = ?",
                [chapterId]
            );
            const keptLectureIds = [];

            for (const newLecture of (newChapter.chapterContent || [])) {
                if (newLecture.lecture_id && existingLectures.some(l => l.lecture_id === newLecture.lecture_id)) {
                    // Existing lecture: figure out its tuteUrl - either a freshly
                    // uploaded replacement, or keep whatever it already had.
                    const uploadedTuteFilename = tuteFileMap[`existing_${newLecture.lecture_id}`];
                    const currentRow = existingLectures.find(l => l.lecture_id === newLecture.lecture_id);
                    const finalTuteUrl = uploadedTuteFilename || currentRow.tuteUrl || null;

                    // If a new PDF replaced an old one, clean up the old file
                    if (uploadedTuteFilename && currentRow.tuteUrl && currentRow.tuteUrl !== uploadedTuteFilename) {
                        const oldPdfPath = path.join(__dirname, '..', 'uploads', currentRow.tuteUrl);
                        fs.unlink(oldPdfPath, err => { if (err && err.code !== 'ENOENT') console.error(err); });
                    }

                    await queryPromise(
                        `UPDATE lectures SET lectureTitle=?, lectureDuration=?, lectureUrl=?, isPreviewFree=?, lectureOrder=?, tuteUrl=? WHERE lecture_id=?`,
                        [
                            newLecture.lectureTitle,
                            Number(newLecture.lectureDuration),
                            newLecture.lectureUrl,
                            newLecture.isPreviewFree ? 1 : 0,
                            newLecture.lectureOrder,
                            finalTuteUrl,
                            newLecture.lecture_id
                        ]
                    );
                    keptLectureIds.push(newLecture.lecture_id);
                } else {
                    // New lecture: look up its PDF via the client-side id the frontend generated
                    const uploadedTuteFilename = newLecture.clientId
                        ? tuteFileMap[`new_${newLecture.clientId}`] || null
                        : null;

                    const result = await queryPromise(
                        `INSERT INTO lectures (chapter_id, lectureTitle, lectureDuration, lectureUrl, isPreviewFree, lectureOrder, tuteUrl) VALUES (?,?,?,?,?,?,?)`,
                        [
                            chapterId,
                            newLecture.lectureTitle,
                            Number(newLecture.lectureDuration),
                            newLecture.lectureUrl,
                            newLecture.isPreviewFree ? 1 : 0,
                            newLecture.lectureOrder,
                            uploadedTuteFilename
                        ]
                    );
                    keptLectureIds.push(result.insertId);
                }
            }

            // 5. Delete lectures that are no longer present (and clean up their assignments/quizzes/PDFs)
            const toDeleteLectures = existingLectures.filter(l => !keptLectureIds.includes(l.lecture_id));
            for (const del of toDeleteLectures) {
                // Delete assignments and submissions
                const assignments = await queryPromise("SELECT assignment_id FROM assignments WHERE lecture_id = ?", [del.lecture_id]);
                for (const assign of assignments) {
                    const submissions = await queryPromise("SELECT file_path FROM assignment_submissions WHERE assignment_id = ?", [assign.assignment_id]);
                    for (const sub of submissions) {
                        if (sub.file_path) {
                            const fp = path.join(__dirname, '..', 'uploads', sub.file_path);
                            fs.unlink(fp, err => { if (err && err.code !== 'ENOENT') console.error(err); });
                        }
                    }
                    await queryPromise("DELETE FROM assignment_submissions WHERE assignment_id = ?", [assign.assignment_id]);
                    
                    const assignData = await queryPromise("SELECT file_path FROM assignments WHERE assignment_id = ?", [assign.assignment_id]);
                    if (assignData[0]?.file_path) {
                        const fp = path.join(__dirname, '..', 'uploads', assignData[0].file_path);
                        fs.unlink(fp, err => { if (err && err.code !== 'ENOENT') console.error(err); });
                    }
                    await queryPromise("DELETE FROM assignments WHERE assignment_id = ?", [assign.assignment_id]);
                }

                // Delete quizzes and attempts
                const quizzes = await queryPromise("SELECT quiz_id FROM quizzes WHERE lecture_id = ?", [del.lecture_id]);
                for (const quiz of quizzes) {
                    await queryPromise("DELETE FROM quiz_attempts WHERE quiz_id = ?", [quiz.quiz_id]);
                    await queryPromise("DELETE FROM quizzes WHERE quiz_id = ?", [quiz.quiz_id]);
                }

                // Clean up this lecture's tutorial PDF, if any
                if (del.tuteUrl) {
                    const fp = path.join(__dirname, '..', 'uploads', del.tuteUrl);
                    fs.unlink(fp, err => { if (err && err.code !== 'ENOENT') console.error(err); });
                }

                // Finally delete the lecture
                await queryPromise("DELETE FROM lectures WHERE lecture_id = ?", [del.lecture_id]);
            }
        }

        // 6. Delete chapters that were completely removed
        const toDeleteChapters = existingChapters.filter(ch => !keptChapterIds.includes(ch.chapter_id));
        for (const delChapter of toDeleteChapters) {
            // Delete all lectures inside (with their assignments/quizzes/PDFs)
            const lecturesInChapter = await queryPromise("SELECT lecture_id, tuteUrl FROM lectures WHERE chapter_id = ?", [delChapter.chapter_id]);
            for (const lec of lecturesInChapter) {
                // Reuse cleanup logic (assignments + quizzes)
                const assignments = await queryPromise("SELECT assignment_id FROM assignments WHERE lecture_id = ?", [lec.lecture_id]);
                for (const assign of assignments) {
                    await queryPromise("DELETE FROM assignment_submissions WHERE assignment_id = ?", [assign.assignment_id]);
                    await queryPromise("DELETE FROM assignments WHERE assignment_id = ?", [assign.assignment_id]);
                }
                const quizzes = await queryPromise("SELECT quiz_id FROM quizzes WHERE lecture_id = ?", [lec.lecture_id]);
                for (const quiz of quizzes) {
                    await queryPromise("DELETE FROM quiz_attempts WHERE quiz_id = ?", [quiz.quiz_id]);
                    await queryPromise("DELETE FROM quizzes WHERE quiz_id = ?", [quiz.quiz_id]);
                }
                if (lec.tuteUrl) {
                    const fp = path.join(__dirname, '..', 'uploads', lec.tuteUrl);
                    fs.unlink(fp, err => { if (err && err.code !== 'ENOENT') console.error(err); });
                }
                await queryPromise("DELETE FROM lectures WHERE lecture_id = ?", [lec.lecture_id]);
            }
            await queryPromise("DELETE FROM chapters WHERE chapter_id = ?", [delChapter.chapter_id]);
        }

        res.json({ success: true, message: "Course updated successfully." });

    } catch (error) {
        console.error("Update Course Error:", error);
        res.status(500).json({
            success: false,
            message: "Database Error: " + (error.sqlMessage || error.message)
        });
    }
};
