import React, { useEffect, useRef, useState, useContext } from 'react'
import uniqid from 'uniqid';
import Quill from 'quill';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';

const AddCourse = () => {
    const { backendUrl, userData, fetchAllCourses, navigate } = useContext(AppContext);

    const quillRef = useRef(null);
    const editorRef = useRef(null);

    const [courseTitle, setCourseTitle] = useState('');
    const [coursePrice, setCoursePrice] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [image, setImage] = useState(null);
    const [chapters, setChapters] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [currentChapterId, setCurrentChapterId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Maps lectureId (client-side uniqid) -> the actual PDF File object.
    // Kept separate from `chapters` state because File objects can't survive JSON.stringify.
    const [tuteFiles, setTuteFiles] = useState({});

    const [lectureDetails, setLectureDetails] = useState({
        lectureTitle: '',
        lectureDurationHours: '',
        lectureUrl: '',
        isPreviewFree: false,
        tuteFile: null,
    });

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins}m`;
        if (mins === 0) return `${hours}h`;
        return `${hours}h ${mins}m`;
    };

    const handleChapter = (action, chapterId) => {
        if (action === 'add') {
            const title = prompt('Enter Chapter Name:');
            if (title && title.trim()) {
                const newChapter = {
                    chapterId: uniqid(),
                    chapterTitle: title.trim(),
                    chapterContent: [],
                    collapsed: false,
                    meetLink: '',
                    meetDateTime: '',        
                    chapterOrder: chapters.length > 0
                        ? chapters[chapters.length - 1].chapterOrder + 1
                        : 1,
                };
                setChapters([...chapters, newChapter]);
            }
        } else if (action === 'remove') {
            setChapters(chapters.filter((chapter) => chapter.chapterId !== chapterId));
        } else if (action === 'toggle') {
            setChapters(
                chapters.map((chapter) =>
                    chapter.chapterId === chapterId
                        ? { ...chapter, collapsed: !chapter.collapsed }
                        : chapter
                )
            );
        }
    };

    const handleMeetLinkChange = (chapterId, value) => {
        setChapters(chapters.map(ch =>
            ch.chapterId === chapterId ? { ...ch, meetLink: value } : ch
        ));
    };

    const handleMeetDateTimeChange = (chapterId, value) => {
        setChapters(chapters.map(ch =>
            ch.chapterId === chapterId ? { ...ch, meetDateTime: value } : ch
        ));
    };

    const handleLecture = (action, chapterId, lectureIndex) => {
        if (action === 'add') {
            setCurrentChapterId(chapterId);
            setShowPopup(true);
        } else if (action === 'remove') {
            setChapters(
                chapters.map((chapter) => {
                    if (chapter.chapterId === chapterId) {
                        const updatedContent = [...chapter.chapterContent];
                        const [removed] = updatedContent.splice(lectureIndex, 1);
                        // Clean up any attached PDF for the removed lecture
                        if (removed?.lectureId) {
                            setTuteFiles(prev => {
                                const next = { ...prev };
                                delete next[removed.lectureId];
                                return next;
                            });
                        }
                        return { ...chapter, chapterContent: updatedContent };
                    }
                    return chapter;
                })
            );
        }
    };

    const addLecture = () => {
        if (!lectureDetails.lectureTitle.trim()) return toast.error("Lecture title is required.");
        const hours = parseFloat(lectureDetails.lectureDurationHours);
        if (isNaN(hours) || hours <= 0) return toast.error("Please enter a valid duration in hours (e.g., 1.5).");
        if (!lectureDetails.lectureUrl.trim()) return toast.error("Lecture URL is required.");

        const durationMinutes = Math.round(hours * 60);
        const newLectureId = uniqid();

        setChapters(
            chapters.map((chapter) => {
                if (chapter.chapterId === currentChapterId) {
                    const newLecture = {
                        lectureTitle: lectureDetails.lectureTitle,
                        lectureDuration: durationMinutes,
                        lectureUrl: lectureDetails.lectureUrl,
                        isPreviewFree: lectureDetails.isPreviewFree,
                        lectureOrder: chapter.chapterContent.length > 0
                            ? chapter.chapterContent[chapter.chapterContent.length - 1].lectureOrder + 1
                            : 1,
                        lectureId: newLectureId,
                        hasTutePdf: !!lectureDetails.tuteFile, // just for showing a badge in the list below
                    };
                    return { ...chapter, chapterContent: [...chapter.chapterContent, newLecture] };
                }
                return chapter;
            })
        );

        // Store the actual PDF File separately, keyed by the lecture's client-side id
        if (lectureDetails.tuteFile) {
            setTuteFiles(prev => ({ ...prev, [newLectureId]: lectureDetails.tuteFile }));
        }

        setShowPopup(false);
        setLectureDetails({ lectureTitle: '', lectureDurationHours: '', lectureUrl: '', isPreviewFree: false, tuteFile: null });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const activeId = userData?.id;
        if (!activeId) return toast.error("User session expired. Please log in again.");
        if (!courseTitle.trim()) return toast.error("Course title is required.");
        if (!image) return toast.error("Course thumbnail is required.");
        if (chapters.length === 0) return toast.error("Please add at least one chapter.");

        try {
            setIsSubmitting(true);

            const descriptionHtml = quillRef.current.root.innerHTML;
            const formData = new FormData();
            formData.append('educator_id', activeId);
            formData.append('courseTitle', courseTitle.trim());
            formData.append('courseDescription', descriptionHtml);
            formData.append('coursePrice', Number(coursePrice));
            formData.append('discount', Number(discount));
            formData.append('courseThumbnail', image);
            formData.append('chapters', JSON.stringify(chapters));

            // Attach each lecture's tutorial PDF, field-named so the backend
            // can match it back to the right lecture via its client-side id.
            Object.entries(tuteFiles).forEach(([lectureId, file]) => {
                formData.append(`tute_${lectureId}`, file, file.name);
            });

            const { data } = await axios.post(
                `${backendUrl}/api/courses/add-course`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            if (data.success) {
                toast.success(data.message || "Course added successfully!");
                await fetchAllCourses();
                navigate('/educator/my-courses');
            } else {
                toast.error(data.message || "Failed to add course. Please try again.");
            }
        } catch (error) {
            console.error("AddCourse submit error:", error);
            toast.error(error.response?.data?.message || "Failed to add course.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        if (!quillRef.current && editorRef.current) {
            quillRef.current = new Quill(editorRef.current, { theme: 'snow' });
        }
    }, []);

    return (
        <div className='h-screen overflow-scroll flex flex-col items-start justify-between md:p-8 md:pb-0 p-4 pt-8 pb-0'>
            <form onSubmit={handleSubmit} className='flex flex-col gap-4 max-w-md w-full text-gray-500'>
                <div className='flex flex-col gap-1'>
                    <p>Course Title</p>
                    <input onChange={e => setCourseTitle(e.target.value)} value={courseTitle}
                        type="text" placeholder='Type here'
                        className='outline-none md:py-2.5 py-2 px-3 rounded border border-gray-500' required />
                </div>

                <div className='flex flex-col gap-1'>
                    <p>Course Description</p>
                    <div ref={editorRef} className='bg-white'></div>
                </div>

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
                            {image && <img className='max-h-10' src={URL.createObjectURL(image)} alt="" />}
                        </label>
                    </div>
                </div>

                <div className='flex flex-col gap-1'>
                    <p>Discount %</p>
                    <input onChange={e => setDiscount(e.target.value)} value={discount}
                        type="number" min="0" max="100"
                        className='outline-none md:py-2.5 py-2 w-28 px-3 rounded border border-gray-500' required />
                </div>

                <div>
                    {chapters.map((chapter, chapterIndex) => (
                        <div key={chapter.chapterId} className='bg-white border rounded-lg mb-4'>
                            <div className='flex justify-between items-center p-4 border-b'>
                                <div className='flex items-center'>
                                    <img onClick={() => handleChapter('toggle', chapter.chapterId)}
                                        src={assets.down_arrow_icon} width={14}
                                        className={`mr-2 cursor-pointer transition-all ${chapter.collapsed ? "-rotate-90" : ""}`} />
                                    <span className='font-semibold'>{chapterIndex + 1} {chapter.chapterTitle}</span>
                                </div>
                                <img onClick={() => handleChapter('remove', chapter.chapterId)} src={assets.cross_icon} className='cursor-pointer' />
                            </div>

                            {!chapter.collapsed && (
                                <div className='p-4'>
                                    {/* Lectures list */}
                                    {chapter.chapterContent.map((lecture, lectureIndex) => (
                                        <div key={lecture.lectureId} className='flex justify-between items-center mb-2'>
                                            <span className='text-sm'>
                                                {lectureIndex + 1} {lecture.lectureTitle} ({formatDuration(lecture.lectureDuration)}) {lecture.isPreviewFree ? '- Free' : ''}
                                                {lecture.hasTutePdf && <span className='ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full'>📄 PDF attached</span>}
                                            </span>
                                            <img src={assets.cross_icon} alt=""
                                                onClick={() => handleLecture('remove', chapter.chapterId, lectureIndex)}
                                                className='cursor-pointer w-3' />
                                        </div>
                                    ))}

                                    <div className='inline-flex bg-gray-100 p-2 rounded cursor-pointer mt-2 text-sm'
                                        onClick={() => handleLecture('add', chapter.chapterId)}>
                                        + Add Lecture
                                    </div>

                                    {/* Google Meet Link + Date/Time per chapter */}
                                    <div className='mt-3 pt-3 border-t border-gray-100'>
                                        <p className='text-xs text-gray-500 mb-1 flex items-center gap-1'>
                                            <span>🎥</span> Virtual Class (Google Meet)
                                        </p>
                                        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
                                            <input
                                                type="text"
                                                placeholder='Meet link: https://meet.google.com/...'
                                                value={chapter.meetLink || ''}
                                                onChange={e => handleMeetLinkChange(chapter.chapterId, e.target.value)}
                                                className='flex-1 text-sm outline-none py-1.5 px-2 rounded border border-gray-300 focus:border-blue-400'
                                            />
                                            <input
                                                type="datetime-local"
                                                value={chapter.meetDateTime || ''}
                                                onChange={e => handleMeetDateTimeChange(chapter.chapterId, e.target.value)}
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

                    {showPopup && (
                        <div className='fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50'>
                            <div className='bg-white text-gray-700 p-6 rounded-lg relative w-full max-w-80'>
                                <h2 className='text-lg font-semibold mb-4'>Add Lecture</h2>

                                <p className='text-sm mb-1'>Lecture Title</p>
                                <input type="text" className='mb-3 block w-full border p-2'
                                    value={lectureDetails.lectureTitle}
                                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureTitle: e.target.value })} />

                                <p className='text-sm mb-1'>Duration (hours)</p>
                                <input type="number" step="any" min="0.1" className='mb-3 block w-full border p-2'
                                    value={lectureDetails.lectureDurationHours}
                                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureDurationHours: e.target.value })} />

                                <p className='text-sm mb-1'>Lecture URL</p>
                                <input type="text" className='mb-3 block w-full border p-2'
                                    value={lectureDetails.lectureUrl}
                                    onChange={(e) => setLectureDetails({ ...lectureDetails, lectureUrl: e.target.value })} />

                                <p className='text-sm mb-1'>Tutorial PDF (optional)</p>
                                <input type="file" accept="application/pdf" className='mb-3 block w-full text-sm'
                                    onChange={(e) => setLectureDetails({ ...lectureDetails, tuteFile: e.target.files[0] || null })} />
                                {lectureDetails.tuteFile && (
                                    <p className='text-xs text-green-600 mb-3 -mt-2'>Selected: {lectureDetails.tuteFile.name}</p>
                                )}

                                <div className='flex items-center gap-2 mb-4'>
                                    <input type="checkbox" id="isPreview"
                                        checked={lectureDetails.isPreviewFree}
                                        onChange={(e) => setLectureDetails({ ...lectureDetails, isPreviewFree: e.target.checked })} />
                                    <label htmlFor="isPreview">Is Preview Free?</label>
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

                <button type="submit" disabled={isSubmitting}
                    className={`text-white py-2.5 px-10 rounded my-4 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black cursor-pointer'}`}>
                    {isSubmitting ? 'ADDING...' : 'ADD COURSE'}
                </button>
            </form>
        </div>
    );
};

export default AddCourse;
