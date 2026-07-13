import React, { useEffect, useRef, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import uniqid from 'uniqid'
import Quill from 'quill'
import axios from 'axios'
import { toast } from 'react-toastify'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'

const EditCourse = () => {
    const { id } = useParams()
    const { backendUrl, fetchAllCourses, navigate } = useContext(AppContext)

    const quillRef = useRef(null)
    const editorRef = useRef(null)

    const [courseTitle, setCourseTitle] = useState('')
    const [coursePrice, setCoursePrice] = useState(0)
    const [discount, setDiscount] = useState(0)
    const [image, setImage] = useState(null)
    const [existingThumbnail, setExistingThumbnail] = useState('')
    const [chapters, setChapters] = useState([])
    const [showPopup, setShowPopup] = useState(false)
    const [currentChapterId, setCurrentChapterId] = useState(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [loading, setLoading] = useState(true)

    // Maps a lecture key -> the actual PDF File object selected for upload.
    // Key format: `existing_<lecture_id>` for lectures already in the DB,
    // or `new_<clientId>` for lectures added during this edit session
    // (since they don't have a lecture_id yet).
    const [tuteFiles, setTuteFiles] = useState({})

    const [lectureDetails, setLectureDetails] = useState({
        lectureTitle: '',
        lectureDuration: '',
        lectureUrl: '',
        isPreviewFree: false,
        tuteFile: null,
    })

    // Helper: consistent key for a lecture, whether it's existing or newly added
    const lectureKey = (lecture) =>
        lecture.lecture_id ? `existing_${lecture.lecture_id}` : `new_${lecture.clientId}`

    useEffect(() => {
        const loadCourse = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/courses/${id}`)
                if (!data.success) {
                    toast.error("Course not found.")
                    navigate('/educator/my-courses')
                    return
                }

                const course = data.courseData
                setCourseTitle(course.courseTitle || '')
                setCoursePrice(course.coursePrice || 0)
                setDiscount(course.discount || 0)
                setExistingThumbnail(course.courseThumbnail || '')

                if (quillRef.current) {
                    quillRef.current.root.innerHTML = course.courseDescription || ''
                } else {
                    window.__editCourseDescription = course.courseDescription || ''
                }

                // Map chapters and PRESERVE original IDs
                const mappedChapters = (course.courseContent || []).map(ch => ({
                    chapter_id: ch.chapter_id,           
                    chapterTitle: ch.chapterTitle,
                    chapterOrder: ch.chapterOrder,
                    collapsed: false,
                    meetLink: ch.meetLink || '',
                    meetDateTime: ch.meetDateTime || '',
                    chapterContent: (ch.chapterContent || []).map(lec => ({
                        lecture_id: lec.lecture_id,      
                        lectureTitle: lec.lectureTitle,
                        lectureDuration: lec.lectureDuration,
                        lectureUrl: lec.lectureUrl,
                        isPreviewFree: !!lec.isPreviewFree,
                        lectureOrder: lec.lectureOrder,
                        tuteUrl: lec.tuteUrl || null, // existing PDF filename from DB, if any
                    }))
                }))

                setChapters(mappedChapters)
            } catch (error) {
                console.error("Load course error:", error)
                toast.error("Failed to load course data.")
                navigate('/educator/my-courses')
            } finally {
                setLoading(false)
            }
        }
        loadCourse()
    }, [id, backendUrl, navigate])

    useEffect(() => {
        if (!quillRef.current && editorRef.current) {
            quillRef.current = new Quill(editorRef.current, { theme: 'snow' })
            if (window.__editCourseDescription) {
                quillRef.current.root.innerHTML = window.__editCourseDescription
                delete window.__editCourseDescription
            }
        }
    }, [loading])

    const handleChapter = (action, chapterId) => {
        if (action === 'add') {
            const title = prompt('Enter Chapter Name:')
            if (title && title.trim()) {
                const newChapter = {
                    chapter_id: null,               
                    chapterTitle: title.trim(),
                    chapterContent: [],
                    collapsed: false,
                    meetLink: '',
                    meetDateTime: '',
                    chapterOrder: chapters.length > 0
                        ? chapters[chapters.length - 1].chapterOrder + 1
                        : 1,
                }
                setChapters([...chapters, newChapter])
            }
        } else if (action === 'remove') {
            setChapters(chapters.filter(ch => ch.chapter_id !== chapterId && ch.chapterTitle !== chapterId)) // careful: use unique key
        } else if (action === 'toggle') {
            setChapters(chapters.map(ch =>
                ch.chapter_id === chapterId ? { ...ch, collapsed: !ch.collapsed } : ch
            ))
        }
    }

    const handleMeetLinkChange = (chapterId, value) => {
        setChapters(chapters.map(ch =>
            ch.chapter_id === chapterId ? { ...ch, meetLink: value } : ch
        ))
    }

    const handleMeetDateTimeChange = (chapterId, value) => {
        setChapters(chapters.map(ch =>
            ch.chapter_id === chapterId ? { ...ch, meetDateTime: value } : ch
        ))
    }

    const handleLecture = (action, chapterId, lectureIndex) => {
        if (action === 'add') {
            setCurrentChapterId(chapterId)
            setShowPopup(true)
        } else if (action === 'remove') {
            setChapters(chapters.map(ch => {
                if (ch.chapter_id === chapterId) {
                    const updated = [...ch.chapterContent]
                    const [removed] = updated.splice(lectureIndex, 1)
                    // Clean up any pending PDF selected for the removed lecture
                    if (removed) {
                        const key = lectureKey(removed)
                        setTuteFiles(prev => {
                            const next = { ...prev }
                            delete next[key]
                            return next
                        })
                    }
                    return { ...ch, chapterContent: updated }
                }
                return ch
            }))
        }
    }

    const addLecture = () => {
        if (!lectureDetails.lectureTitle.trim()) return toast.error("Lecture title is required.")
        if (!lectureDetails.lectureDuration || Number(lectureDetails.lectureDuration) <= 0)
            return toast.error("Please enter a valid lecture duration.")
        if (!lectureDetails.lectureUrl.trim()) return toast.error("Lecture URL is required.")

        const newClientId = uniqid()

        setChapters(chapters.map(ch => {
            if (ch.chapter_id === currentChapterId) {
                const newLecture = {
                    lecture_id: null,
                    clientId: newClientId, // used to match the PDF file back to this lecture on submit
                    lectureTitle: lectureDetails.lectureTitle,
                    lectureDuration: Number(lectureDetails.lectureDuration),
                    lectureUrl: lectureDetails.lectureUrl,
                    isPreviewFree: lectureDetails.isPreviewFree,
                    lectureOrder: ch.chapterContent.length > 0
                        ? ch.chapterContent[ch.chapterContent.length - 1].lectureOrder + 1
                        : 1,
                    tuteUrl: null,
                }
                return { ...ch, chapterContent: [...ch.chapterContent, newLecture] }
            }
            return ch
        }))

        if (lectureDetails.tuteFile) {
            setTuteFiles(prev => ({ ...prev, [`new_${newClientId}`]: lectureDetails.tuteFile }))
        }

        setShowPopup(false)
        setLectureDetails({ lectureTitle: '', lectureDuration: '', lectureUrl: '', isPreviewFree: false, tuteFile: null })
    }

    // Attach/replace a PDF for an already-existing (or already-added-this-session) lecture,
    // directly from the lecture row rather than the Add Lecture popup.
    const handleTuteFileSelect = (chapterId, lectureIndex, file) => {
        setChapters(chapters.map(ch => {
            if (ch.chapter_id === chapterId) {
                const updated = [...ch.chapterContent]
                const lecture = updated[lectureIndex]
                const key = lectureKey(lecture)
                setTuteFiles(prev => ({ ...prev, [key]: file }))
                return ch // tuteUrl display updates via tuteFiles map, no need to mutate lecture itself here
            }
            return ch
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!courseTitle.trim()) return toast.error("Course title is required.")
        if (chapters.length === 0) return toast.error("Please add at least one chapter.")

        try {
            setIsSubmitting(true)
            const descriptionHtml = quillRef.current.root.innerHTML
            const formData = new FormData()
            formData.append('courseTitle', courseTitle.trim())
            formData.append('courseDescription', descriptionHtml)
            formData.append('coursePrice', Number(coursePrice))
            formData.append('discount', Number(discount))
            // Send chapters with original IDs (null for new ones), including tuteUrl/clientId
            formData.append('chapters', JSON.stringify(chapters))
            if (image) formData.append('courseThumbnail', image)

            // Attach any newly selected tutorial PDFs, field-named so the backend
            // can match them back to the right lecture (existing or new).
            Object.entries(tuteFiles).forEach(([key, file]) => {
                formData.append(`tute_${key}`, file, file.name)
            })

            const { data } = await axios.put(
                `${backendUrl}/api/courses/${id}`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )

            if (data.success) {
                toast.success(data.message || "Course updated successfully!")
                await fetchAllCourses()
                navigate('/educator/my-courses')
            } else {
                toast.error(data.message || "Failed to update course.")
            }
        } catch (error) {
            console.error("EditCourse submit error:", error)
            toast.error(error.response?.data?.message || "Failed to update course.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return <div className='flex items-center justify-center h-screen text-gray-500'>Loading course data...</div>
    }

    return (
        <div className='h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
            <form onSubmit={handleSubmit} className='flex flex-col gap-4 max-w-md w-full text-gray-500'>
                <h2 className='text-xl font-semibold text-gray-800'>Edit Course</h2>

                {/* Course Title */}
                <div className='flex flex-col gap-1'>
                    <p>Course Title</p>
                    <input onChange={e => setCourseTitle(e.target.value)} value={courseTitle}
                        type="text" placeholder='Type here'
                        className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500' required />
                </div>

                {/* Course Description */}
                <div className='flex flex-col gap-1'>
                    <p>Course Description</p>
                    <div ref={editorRef} className='bg-white'></div>
                </div>

                {/* Price & Thumbnail */}
                <div className='flex items-center justify-between flex-wrap'>
                    <div className='flex flex-col gap-1'>
                        <p>Course Price</p>
                        <input onChange={e => setCoursePrice(e.target.value)} value={coursePrice}
                            type="number" min="0"
                            className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500' required />
                    </div>
                    <div className='flex md:flex-row flex-col items-center gap-3'>
                        <p>Course Thumbnail</p>
                        <label htmlFor='thumbnailImage' className='flex items-center gap-3'>
                            <img src={assets.file_upload_icon} alt="" className='p-3 bg-blue-500 rounded cursor-pointer' />
                            <input type='file' id='thumbnailImage' onChange={e => setImage(e.target.files[0])} accept="image/*" hidden />
                            {image
                                ? <img className='max-h-10' src={URL.createObjectURL(image)} alt="new thumbnail" />
                                : existingThumbnail
                                    ? <img className='max-h-10' src={`${backendUrl}/uploads/${existingThumbnail}`} alt="current thumbnail" />
                                    : null
                            }
                        </label>
                    </div>
                </div>

                {/* Discount */}
                <div className='flex flex-col gap-1'>
                    <p>Discount %</p>
                    <input onChange={e => setDiscount(e.target.value)} value={discount}
                        type="number" min="0" max="100"
                        className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500' required />
                </div>

                {/* Chapters & Lectures */}
                <div>
                    {chapters.map((chapter, chapterIndex) => (
                        <div key={chapter.chapter_id || `new-${chapterIndex}`} className='bg-white border rounded-lg mb-4'>
                            <div className='flex justify-between items-center p-4 border-b'>
                                <div className='flex items-center'>
                                    <img onClick={() => handleChapter('toggle', chapter.chapter_id)}
                                        src={assets.down_arrow_icon} width={14}
                                        className={`mr-2 cursor-pointer transition-all ${chapter.collapsed ? "-rotate-90" : ""}`} />
                                    <span className='font-semibold'>{chapterIndex + 1} {chapter.chapterTitle}</span>
                                </div>
                                <img onClick={() => handleChapter('remove', chapter.chapter_id)} src={assets.cross_icon} className='cursor-pointer' />
                            </div>

                            {!chapter.collapsed && (
                                <div className='p-4'>
                                    {chapter.chapterContent.map((lecture, lectureIndex) => {
                                        const key = lectureKey(lecture)
                                        const pendingFile = tuteFiles[key]
                                        return (
                                            <div key={lecture.lecture_id || `new-lecture-${lectureIndex}`} className='mb-3 pb-3 border-b border-gray-100 last:border-0'>
                                                <div className='flex justify-between items-center'>
                                                    <span className='text-sm'>
                                                        {lectureIndex + 1} {lecture.lectureTitle} ({lecture.lectureDuration} min) {lecture.isPreviewFree ? '- Free' : ''}
                                                    </span>
                                                    <img src={assets.cross_icon} alt=""
                                                        onClick={() => handleLecture('remove', chapter.chapter_id, lectureIndex)}
                                                        className='cursor-pointer w-3' />
                                                </div>

                                                {/* Tutorial PDF: show current state + let educator attach/replace */}
                                                <div className='flex items-center gap-2 mt-1 flex-wrap'>
                                                    {pendingFile ? (
                                                        <span className='text-xs text-green-600'>📄 New PDF selected: {pendingFile.name}</span>
                                                    ) : lecture.tuteUrl ? (
                                                        <a href={`${backendUrl}/uploads/${lecture.tuteUrl}`} target='_blank' rel='noopener noreferrer'
                                                            className='text-xs text-red-600 hover:underline'>
                                                            📄 Current PDF attached (view)
                                                        </a>
                                                    ) : (
                                                        <span className='text-xs text-gray-400'>No tutorial PDF attached</span>
                                                    )}
                                                    <label className='text-xs text-blue-600 hover:underline cursor-pointer'>
                                                        {lecture.tuteUrl || pendingFile ? 'Replace PDF' : 'Attach PDF'}
                                                        <input
                                                            type='file'
                                                            accept='application/pdf'
                                                            hidden
                                                            onChange={(e) => {
                                                                if (e.target.files[0]) {
                                                                    handleTuteFileSelect(chapter.chapter_id, lectureIndex, e.target.files[0])
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    <div className='inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2 text-sm'
                                        onClick={() => handleLecture('add', chapter.chapter_id)}>
                                        + Add Lecture
                                    </div>

                                    {/* Google Meet fields */}
                                    <div className='mt-3 pt-3 border-t border-gray-100'>
                                        <p className='text-xs text-gray-500 mb-1 flex items-center gap-1'>
                                            <span>🎥</span> Virtual Class (Google Meet)
                                        </p>
                                        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
                                            <input
                                                type="text"
                                                placeholder='Meet link: https://meet.google.com/...'
                                                value={chapter.meetLink || ''}
                                                onChange={e => handleMeetLinkChange(chapter.chapter_id, e.target.value)}
                                                className='flex-1 text-sm outline-none py-1.5 px-2 rounded border border-gray-300 focus:border-blue-400'
                                            />
                                            <input
                                                type="datetime-local"
                                                value={chapter.meetDateTime || ''}
                                                onChange={e => handleMeetDateTimeChange(chapter.chapter_id, e.target.value)}
                                                className='text-sm outline-none py-1.5 px-2 rounded border border-gray-300 focus:border-blue-400'
                                            />
                                        </div>
                                        {chapter.meetDateTime && (
                                            <p className='text-xs text-green-600 mt-1'>
                                                Scheduled: {new Date(chapter.meetDateTime).toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <div className='flex justify-center items-center bg-blue-100 p-2 rounded-lg cursor-pointer text-blue-600 font-medium'
                        onClick={() => handleChapter('add')}>
                        + Add Chapter
                    </div>

                    {/* Add Lecture Popup */}
                    {showPopup && (
                        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50'>
                            <div className='bg-white text-gray-700 p-6 rounded-lg relative w-full max-w-80'>
                                <h2 className='text-lg font-semibold mb-4'>Add Lecture</h2>
                                <p className='text-sm mb-1'>Lecture Title</p>
                                <input type="text" className='mb-3 block w-full border p-2'
                                    value={lectureDetails.lectureTitle}
                                    onChange={e => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })} />
                                <p className='text-sm mb-1'>Duration (minutes)</p>
                                <input type="number" min="1" className='mb-3 block w-full border p-2'
                                    value={lectureDetails.lectureDuration}
                                    onChange={e => setLectureDetails({ ...lectureDetails, lectureDuration: e.target.value })} />
                                <p className='text-sm mb-1'>Lecture URL</p>
                                <input type="text" className='mb-3 block w-full border p-2'
                                    value={lectureDetails.lectureUrl}
                                    onChange={e => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })} />

                                <p className='text-sm mb-1'>Tutorial PDF (optional)</p>
                                <input type="file" accept="application/pdf" className='mb-3 block w-full text-sm'
                                    onChange={(e) => setLectureDetails({ ...lectureDetails, tuteFile: e.target.files[0] || null })} />
                                {lectureDetails.tuteFile && (
                                    <p className='text-xs text-green-600 mb-3 -mt-2'>Selected: {lectureDetails.tuteFile.name}</p>
                                )}

                                <div className='flex items-center gap-2 mb-4'>
                                    <input type="checkbox" id="isPreviewEdit"
                                        checked={lectureDetails.isPreviewFree}
                                        onChange={e => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })} />
                                    <label htmlFor="isPreviewEdit">Is Preview Free?</label>
                                </div>
                                <button type='button' className='w-full bg-blue-600 text-white py-2 rounded' onClick={addLecture}>
                                    Add Lecture
                                </button>
                                <img onClick={() => setShowPopup(false)} src={assets.cross_icon}
                                    className='absolute top-4 right-4 w-4 cursor-pointer' />
                            </div>
                        </div>
                    )}
                </div>

                <div className='flex gap-3 my-4'>
                    <button type="button" onClick={() => navigate('/educator/my-courses')}
                        className='border border-gray-400 text-gray-600 py-2.5 px-8 rounded hover:bg-gray-50'>
                        Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting}
                        className={`text-white py-2.5 px-10 rounded ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black cursor-pointer'}`}>
                        {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                    </button>
                </div>
            </form>
        </div>
    )
}

export default EditCourse
