import React, { useContext, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import Footer from '../../components/student/Footer'
import YouTube from 'react-youtube'
import axios from 'axios'
import { toast } from 'react-toastify'
import Rating from '../../components/student/Rating'

const CourseDetails = () => {
  const { id } = useParams()

  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [enrollmentInfo, setEnrollmentInfo] = useState(null)
  const [playerData, setPlayerData] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [lectureExtras, setLectureExtras] = useState({})
  const [payhereReady, setPayhereReady] = useState(false)
  const [deleting, setDeleting] = useState({ quiz: null, assignment: null })
  const [completedLectureIds, setCompletedLectureIds] = useState([])
  const [userRating, setUserRating] = useState(0)
  const [ratingStats, setRatingStats] = useState({ average: 0, count: 0 })
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [notices, setNotices] = useState([])

  const {
    backendUrl,
    calculateRating,
    calculateNoOfLectures,
    calculateCourseDuration,
    calculateChapterTime,
    currency,
    userData,
    isLoggedin,
    isEducator,
    navigate
  } = useContext(AppContext)

  const getYouTubeID = (url) => {
    if (!url) return null
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[7].length === 11) ? match[7] : url.split('/').pop()
  }

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/courses/${id}`)
      if (data.success) setCourseData(data.courseData)
    } catch (error) {
      console.error('Error fetching course details', error)
    }
  }

  const checkEnrollment = async () => {
    if (!userData?.id || !id) return
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/enrollments/check/${userData.id}/${id}`
      )
      if (data.success) {
        setEnrollmentInfo({
          enrolled: data.enrolled,
          inGrace: data.inGrace || false,
          expiresAt: data.expiresAt,
          daysRemaining: data.daysRemaining,
          canRenew: data.canRenew || false
        })
      } else {
        setEnrollmentInfo({ enrolled: false })
      }
    } catch (error) {
      console.error('Enrollment check error:', error)
      setEnrollmentInfo({ enrolled: false })
    }
  }

  const fetchCompletedLectures = async () => {
    if (!userData?.id || !id) return
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/progress/completed/${userData.id}/${id}`
      )
      if (data.success) {
        setCompletedLectureIds(data.completedLectureIds)
      }
    } catch (error) {
      console.error('Error fetching completed lectures', error)
    }
  }

  const markLectureComplete = async (lectureId) => {
    if (!userData?.id || !lectureId) return
    if (completedLectureIds.includes(lectureId)) return

    try {
      const { data } = await axios.post(`${backendUrl}/api/progress/complete`, {
        student_id: userData.id,
        lecture_id: lectureId
      })
      if (data.success) {
        setCompletedLectureIds((prev) => [...prev, lectureId])
        toast.success('Lecture marked as complete!')
      }
    } catch (error) {
      console.error('Error marking lecture complete:', error)
      toast.error('Failed to mark lecture as complete.')
    }
  }

  const fetchRatingData = async () => {
    try {
      const statsRes = await axios.get(`${backendUrl}/api/ratings/course/${id}`)
      if (statsRes.data.success) {
        setRatingStats({
          average: parseFloat(statsRes.data.average),
          count: statsRes.data.count
        })
      }
      if (userData?.id) {
        const myRes = await axios.get(`${backendUrl}/api/ratings/my-rating/${id}/${userData.id}`)
        if (myRes.data.success) setUserRating(myRes.data.rating)
      }
    } catch (error) {
      console.error('Error fetching ratings', error)
    }
  }

  const handleRating = async (value) => {
    if (!userData?.id) return toast.error('Please log in to rate this course.')
    if (!hasFullAccess) return toast.error('You must be enrolled to rate this course.')
    setRatingSubmitting(true)
    try {
      const { data } = await axios.post(`${backendUrl}/api/ratings/submit`, {
        course_id: id,
        student_id: userData.id,
        rating: value
      })
      if (data.success) {
        setUserRating(value)
        setRatingStats({ average: parseFloat(data.average), count: data.count })
        toast.success('Rating submitted!')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit rating.')
    } finally {
      setRatingSubmitting(false)
    }
  }

  const fetchNotices = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/notices/${id}`)
      if (data.success) setNotices(data.notices)
    } catch (error) {
      console.error('Error fetching notices', error)
    }
  }

  const fetchLectureExtras = async (courseContent) => {
    const extras = {}
    for (const chapter of courseContent) {
      for (const lecture of chapter.chapterContent) {
        try {
          const [quizRes, assignRes] = await Promise.all([
            axios.get(`${backendUrl}/api/quizzes/lecture/${lecture.lecture_id}`),
            axios.get(`${backendUrl}/api/assignments/lecture/${lecture.lecture_id}`)
          ])
          extras[lecture.lecture_id] = {
            quiz: quizRes.data.quiz || null,
            assignment: assignRes.data.assignment || null
          }
        } catch (e) {
          extras[lecture.lecture_id] = { quiz: null, assignment: null }
        }
      }
    }
    setLectureExtras(extras)
  }

  const handleDeleteQuiz = async (quizId, lectureId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return
    setDeleting(prev => ({ ...prev, quiz: quizId }))
    try {
      await axios.delete(`${backendUrl}/api/quizzes/${quizId}`)
      toast.success('Quiz deleted successfully')
      const updatedExtras = { ...lectureExtras }
      if (updatedExtras[lectureId]) updatedExtras[lectureId].quiz = null
      setLectureExtras(updatedExtras)
    } catch (error) {
      toast.error('Failed to delete quiz')
    } finally {
      setDeleting(prev => ({ ...prev, quiz: null }))
    }
  }

  const handleDeleteAssignment = async (assignmentId, lectureId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return
    setDeleting(prev => ({ ...prev, assignment: assignmentId }))
    try {
      await axios.delete(`${backendUrl}/api/assignments/${assignmentId}`)
      toast.success('Assignment deleted successfully')
      const updatedExtras = { ...lectureExtras }
      if (updatedExtras[lectureId]) updatedExtras[lectureId].assignment = null
      setLectureExtras(updatedExtras)
    } catch (error) {
      toast.error('Failed to delete assignment')
    } finally {
      setDeleting(prev => ({ ...prev, assignment: null }))
    }
  }

  useEffect(() => { fetchCourseData() }, [id])
  useEffect(() => { if (userData?.id) checkEnrollment() }, [id, userData])
  useEffect(() => {
    if (userData?.id && id) fetchCompletedLectures()
  }, [userData, id])
  useEffect(() => {
    if (courseData && (isEducator || enrollmentInfo?.enrolled)) {
      fetchLectureExtras(courseData.courseContent || [])
    }
  }, [courseData, isEducator, enrollmentInfo])
  useEffect(() => { fetchRatingData() }, [id, userData])
  useEffect(() => { fetchNotices() }, [id])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://www.payhere.lk/lib/payhere.js'
    script.async = true
    script.onload = () => setPayhereReady(true)
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  const toggleSection = (index) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handlePlayLecture = (lecture) => {
    const videoId = getYouTubeID(lecture.lectureUrl)
    if (videoId) setPlayerData({ videoId, lecture_id: lecture.lecture_id, lectureTitle: lecture.lectureTitle })
    else toast.error('Invalid video URL.')
  }

  const handleEnroll = async () => {
    if (!isLoggedin || !userData) {
      return toast.error('Please log in to enroll in this course.')
    }
    if (!payhereReady) {
      return toast.error('Payment system is loading. Please wait and try again.')
    }
    if (enrollmentInfo?.enrolled && !enrollmentInfo?.canRenew) {
      return toast.info('You already have active access.')
    }

    try {
      setEnrolling(true)

      const finalPrice = courseData.coursePrice - (courseData.discount * courseData.coursePrice / 100)
      const amount = finalPrice.toFixed(2)
      const curr = 'LKR'
      const orderId = `COURSE_${courseData._id}_${userData.id}_${Date.now()}`

      const { data: hashData } = await axios.post(
        `${backendUrl}/api/enrollments/get-hash`,
        { orderId, amount, currency: curr }
      )

      if (!hashData.success) return toast.error('Failed to initiate payment.')

      const payment = {
        sandbox: true,
        merchant_id: hashData.merchantId,
        return_url: `${window.location.origin}/my-enrollments?success=true&courseId=${courseData._id}&userId=${userData.id}&orderId=${orderId}&amount=${amount}`,
        cancel_url: `${window.location.origin}/course/${courseData._id}`,
        notify_url: `${backendUrl}/api/enrollments/notify`,
        order_id: orderId,
        items: courseData.courseTitle,
        amount: amount,
        currency: curr,
        hash: hashData.hash,
        first_name: userData.username || 'Student',
        last_name: '',
        email: userData.email || '',
        phone: '0771234567',
        address: 'Sri Lanka',
        city: 'Colombo',
        country: 'Sri Lanka',
      }

      window.payhere.onCompleted = async (completedOrderId) => {
        const parts = completedOrderId.split('_')
        const cId = parts[1]
        const uId = parts[2]
        try {
          await axios.post(`${backendUrl}/api/enrollments/confirm`, {
            courseId: cId, userId: uId,
            orderId: completedOrderId, amount: Number(payment.amount)
          })
          await checkEnrollment()
          toast.success('Payment successful! Your access has been renewed for 30 days.')
          navigate('/my-enrollments')
        } catch (err) {
          toast.error('Confirmation failed, but payment may have succeeded.')
        }
      }

      window.payhere.onDismissed = () => setEnrolling(false)
      window.payhere.onError = (error) => {
        toast.error('Payment error: ' + error)
        setEnrolling(false)
      }

      window.payhere.startPayment(payment)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start payment.')
      setEnrolling(false)
    }
  }

  const formatDuration = (minutes) => {
    return humanizeDuration((minutes || 0) * 60 * 1000, { units: ['h', 'm'] })
  }

  const hasFullAccess = enrollmentInfo?.enrolled && !enrollmentInfo?.canRenew

  if (!courseData) return <Loading />

  return (
    <>
      <div className='flex md:flex-row flex-col-reverse gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left'>
        <div className='absolute top-0 left-0 w-full h-section-height -z-1 bg-gradient-to-b from-cyan-100/70'></div>

        {/* Left Column */}
        <div className='max-w-2xl z-10 text-gray-500'>
          <h1 className='md:text-course-details-large text-course-details-small font-semibold text-gray-800'>
            {courseData.courseTitle}
          </h1>
          <p className='pt-4 md:text-base text-sm'
            dangerouslySetInnerHTML={{ __html: courseData.courseDescription?.slice(0, 200) || '' }}>
          </p>

          {/* Rating display */}
          <div className='flex items-center space-x-2 pt-3 pb-1 text-sm'>
            <p>{ratingStats.average || 0}</p>
            <div className='flex'>
              {[...Array(5)].map((_, i) => (
                <img key={i}
                  src={i < Math.floor(ratingStats.average) ? assets.star : assets.star_blank}
                  alt='' className='w-3.5 h-3.5' />
              ))}
            </div>
            <p className='text-blue-600'>
              ({ratingStats.count} {ratingStats.count === 1 ? 'rating' : 'ratings'})
            </p>
            <p>{courseData.enrolledStudentsCount || 0}{' '}
              {(courseData.enrolledStudentsCount || 0) > 1 ? 'Students' : 'Student'}
            </p>
          </div>

          <p className='text-sm'>Course by <span className='text-blue-600 underline'>{courseData.educatorName}</span></p>

                   {/* ── NOTICES SECTION ── visible to enrolled students and educators */}
          {(hasFullAccess || isEducator) && notices.length > 0 && (
            <div className='pb-10 border-t border-gray-200 pt-6'>
              <h3 className='text-xl font-semibold text-gray-800 mb-4'>
                📢 Notices
                <span className='text-sm font-normal text-gray-400 ml-2'>({notices.length})</span>
              </h3>
              <div className='flex flex-col gap-4'>
                {notices.map((notice) => (
                  <div key={notice.notice_id} className='bg-blue-50 border border-blue-100 rounded-xl p-4'>
                    <h4 className='font-semibold text-gray-800 mb-1'>{notice.title}</h4>
                    <p className='text-sm text-gray-600 leading-relaxed whitespace-pre-wrap'>
                      {notice.message}
                    </p>
                    <p className='text-xs text-gray-400 mt-2'>
                      {new Date(notice.created_at).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Course Structure */}
          <div className='pt-8 text-gray-800'>
            <h2 className='text-xl font-semibold'>Course Structure</h2>

            {/* Progress bar for enrolled students */}
            {hasFullAccess && courseData.courseContent && (() => {
              const totalLectures = courseData.courseContent.reduce(
                (sum, ch) => sum + (ch.chapterContent?.length || 0), 0
              )
              const completedCount = completedLectureIds.length
              const pct = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0
              return (
                <div className='mt-3 mb-4'>
                  <div className='flex justify-between text-sm text-gray-500 mb-1'>
                    <span>{completedCount} / {totalLectures} lectures completed</span>
                    <span className='font-medium text-indigo-600'>{pct}%</span>
                  </div>
                  <div className='w-full bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-indigo-500 h-2 rounded-full transition-all duration-500'
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })()}

            <div className='pt-5'>
              {courseData.courseContent?.map((chapter, index) => (
                <div key={index} className='border border-gray-300 bg-white mb-2 rounded'>
                  <div className='flex items-center justify-between px-4 py-3 cursor-pointer select-none'
                    onClick={() => toggleSection(index)}>
                    <div className='flex items-center gap-2'>
                      <img className={`transform transition-transform ${openSections[index] ? 'rotate-180' : ''}`}
                        src={assets.down_arrow_icon} alt='arrow icon' />
                      <p className='font-medium md:text-base text-sm'>{chapter.chapterTitle}</p>
                    </div>
                    <p className='text-sm md:text-default'>
                      {chapter.chapterContent?.length || 0} lectures · {calculateChapterTime(chapter)}
                    </p>
                  </div>

                  <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? 'max-h-screen' : 'max-h-0'}`}>
                    <ul className='list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300'>
                      {chapter.chapterContent?.map((lecture, i) => {
                        const extras = lectureExtras[lecture.lecture_id] || {}
                        const isPreview = !!lecture.isPreviewFree
                        const isCompleted = completedLectureIds.includes(lecture.lecture_id)
                        return (
                          <li key={i} className='py-3 border-b border-gray-100 last:border-0'>
                            <div className='flex flex-col gap-2'>

                              {/* Lecture title and controls row */}
                              <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                                <div className='flex items-center gap-2 min-w-0'>
                                  <img
                                    src={isCompleted ? assets.blue_tick_icon : assets.play_icon}
                                    alt='status icon'
                                    className='w-4 h-4 flex-shrink-0'
                                  />
                                  <p className={`font-medium text-gray-800 break-words ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                                    {lecture.lectureTitle}
                                  </p>
                                </div>
                                <div className='flex gap-3 items-center text-sm flex-shrink-0 whitespace-nowrap'>

                                  {/* Preview button */}
                                  {isPreview && !hasFullAccess && !isEducator && (
                                    <button onClick={() => handlePlayLecture(lecture)}
                                      className='text-blue-500 hover:underline'>Preview</button>
                                  )}

                                  {/* Tutorial PDF */}
                                  {lecture.tuteUrl && (isEducator || hasFullAccess || (isPreview && !hasFullAccess)) && (
                                    <a
                                      href={`${backendUrl}/uploads/${lecture.tuteUrl}`}
                                      target='_blank'
                                      rel='noopener noreferrer'
                                      className='text-red-600 font-medium hover:underline flex items-center gap-1'
                                    >
                                      📄 Tutorial PDF
                                    </a>
                                  )}

                                  {/* Watch + Mark Complete for enrolled students */}
                                  {hasFullAccess && !isEducator && (
                                    <>
                                      <button
                                        onClick={() => handlePlayLecture(lecture)}
                                        className='text-green-600 font-medium hover:underline'
                                      >
                                        Watch
                                      </button>
                                      <button
                                        onClick={() => markLectureComplete(lecture.lecture_id)}
                                        disabled={isCompleted}
                                        className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                                          isCompleted
                                            ? 'bg-green-100 text-green-700 cursor-default'
                                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                                        }`}
                                      >
                                        {isCompleted ? '✓ Completed' : 'Mark Complete'}
                                      </button>
                                    </>
                                  )}

                                  <span className='text-gray-500'>{formatDuration(lecture.lectureDuration)}</span>
                                </div>
                              </div>

                              {/* EDUCATOR SECTION */}
                              {isEducator && (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 bg-gray-50 p-3 rounded-lg'>
                                  <div className='border border-gray-200 rounded-md p-2 bg-white shadow-sm'>
                                    <div className='flex items-center gap-1 mb-2'>
                                      <span className='text-sm font-medium text-gray-700'>📝 Quiz</span>
                                    </div>
                                    {extras.quiz ? (
                                      <div className='flex flex-wrap gap-2'>
                                        <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>✓ Added</span>
                                        <button
                                          onClick={() => navigate(`/educator/edit-quiz/${extras.quiz.quiz_id}`)}
                                          className='text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200 transition'>
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteQuiz(extras.quiz.quiz_id, lecture.lecture_id)}
                                          disabled={deleting.quiz === extras.quiz.quiz_id}
                                          className='text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 disabled:opacity-50 transition'>
                                          {deleting.quiz === extras.quiz.quiz_id ? '...' : 'Remove'}
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => navigate(`/educator/add-quiz/${lecture.lecture_id}`)}
                                        className='text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition w-full'>
                                        + Add Quiz
                                      </button>
                                    )}
                                  </div>

                                  <div className='border border-gray-200 rounded-md p-2 bg-white shadow-sm'>
                                    <div className='flex items-center gap-1 mb-2'>
                                      <span className='text-sm font-medium text-gray-700'>📋 Assignment</span>
                                    </div>
                                    {extras.assignment ? (
                                      <div className='flex flex-wrap gap-2'>
                                        <span className='text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full'>✓ Added</span>
                                        <button
                                          onClick={() => navigate(`/educator/edit-assignment/${extras.assignment.assignment_id}`)}
                                          className='text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded hover:bg-yellow-200 transition'>
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteAssignment(extras.assignment.assignment_id, lecture.lecture_id)}
                                          disabled={deleting.assignment === extras.assignment.assignment_id}
                                          className='text-xs bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 disabled:opacity-50 transition'>
                                          {deleting.assignment === extras.assignment.assignment_id ? '...' : 'Remove'}
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => navigate(`/educator/add-assignment/${lecture.lecture_id}`)}
                                        className='text-xs bg-purple-600 text-white px-3 py-1.5 rounded hover:bg-purple-700 transition w-full'>
                                        + Add Assignment
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* STUDENT SECTION: Take Quiz / Submit Assignment */}
                              {hasFullAccess && !isEducator && (extras.quiz || extras.assignment) && (
                                <div className='mt-2 flex flex-wrap gap-3'>
                                  {extras.quiz && (
                                    <button
                                      onClick={() => navigate(`/quiz/${extras.quiz.quiz_id}`)}
                                      className='text-xs bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full hover:bg-blue-200 transition'>
                                      📝 Take Quiz
                                    </button>
                                  )}
                                  {extras.assignment && (
                                    <button
                                      onClick={() => navigate(`/assignment/${extras.assignment.assignment_id}`)}
                                      className='text-xs bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full hover:bg-purple-200 transition'>
                                      📋 Submit Assignment
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>

                    {/* GOOGLE MEET SECTION */}
                    {hasFullAccess && chapter.meetLink && (
                      <div className='mx-4 mb-4 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                        <div className='flex items-start gap-3'>
                          <span className='text-xl'>🎥</span>
                          <div className='flex-1'>
                            <p className='text-xs text-blue-600 font-medium mb-0.5'>
                              Virtual Class — {chapter.chapterTitle}
                            </p>
                            <a href={chapter.meetLink} target='_blank' rel='noopener noreferrer'
                              className='text-sm text-blue-700 underline hover:text-blue-900 break-all'>
                              Join Google Meet
                            </a>
                            {chapter.meetDateTime && (
                              <p className='text-xs text-gray-500 mt-1'>
                                📅 Scheduled: {new Date(chapter.meetDateTime).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {!hasFullAccess && !isEducator && chapter.meetLink && (
                      <div className='mx-4 mb-4 mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg'>
                        <div className='flex items-start gap-3'>
                          <span className='text-xl'>🔒</span>
                          <div className='flex-1'>
                            <p className='text-xs text-gray-500'>Virtual class link available after enrollment</p>
                            {chapter.meetDateTime && (
                              <p className='text-xs text-gray-400 mt-1'>
                                Scheduled: {new Date(chapter.meetDateTime).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className='py-20 text-sm md:text-default'>
            <h3 className='text-xl font-semibold text-gray-800'>Course Description</h3>
            <p className='pt-3 rich-text' dangerouslySetInnerHTML={{ __html: courseData.courseDescription || '' }}></p>
          </div>

 

          {/* Rate this Course — only visible to enrolled students */}
          {hasFullAccess && !isEducator && (
            <div className='pb-10 border-t border-gray-200 pt-6'>
              <h3 className='text-xl font-semibold text-gray-800 mb-2'>Rate this Course</h3>
              <p className='text-sm text-gray-500 mb-3'>
                {userRating > 0
                  ? `Your current rating: ${userRating} star${userRating > 1 ? 's' : ''} — click to change`
                  : 'Share your experience with other students'}
              </p>
              <div className='flex items-center gap-4'>
                <Rating
                  initialRating={userRating}
                  onRate={handleRating}
                />
                {ratingSubmitting && <span className='text-sm text-gray-400'>Saving...</span>}
                {userRating > 0 && !ratingSubmitting && (
                  <span className='text-sm text-green-600 font-medium'>✓ Rated {userRating}/5</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className='max-w-course-card z-10 shadow-custom-card rounded-t md:rounded-none overflow-hidden bg-white min-w-[300px] sm:min-w-[420px]'>
          {playerData
            ? (
              <div>
                <YouTube
                  videoId={playerData.videoId}
                  opts={{ playerVars: { autoplay: 1 } }}
                  iframeClassName='w-full aspect-video'
                  onEnd={() => markLectureComplete(playerData.lecture_id)}
                />
                {/* Mark Complete bar under the video */}
                {hasFullAccess && playerData.lecture_id && (
                  <div className='flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200'>
                    <p className='text-sm text-gray-600 truncate'>{playerData.lectureTitle}</p>
                    <button
                      onClick={() => markLectureComplete(playerData.lecture_id)}
                      disabled={completedLectureIds.includes(playerData.lecture_id)}
                      className={`ml-3 text-xs px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
                        completedLectureIds.includes(playerData.lecture_id)
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      }`}
                    >
                      {completedLectureIds.includes(playerData.lecture_id) ? '✓ Completed' : 'Mark Complete'}
                    </button>
                  </div>
                )}
              </div>
            )
            : <img src={`${backendUrl}/uploads/${courseData.courseThumbnail}`} alt='' className='w-full aspect-video object-cover' />
          }

          <div className='p-5'>
            <div className='flex gap-3 items-center pt-2'>
              <p className='text-gray-800 md:text-4xl text-2xl font-semibold'>
                {currency}{(courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2)}
              </p>
              <p className='md:text-lg text-gray-500 line-through'>{currency}{courseData.coursePrice}</p>
              <p className='md:text-lg text-gray-500'>{courseData.discount}% off</p>
            </div>

            <div className='flex items-center text-sm md:text-default gap-4 pt-2 md:pt-4 text-gray-500'>
              <div className='flex items-center gap-1'>
                <img src={assets.star} alt='' />
                <p>{ratingStats.average || 0}</p>
              </div>
              <div className='h-4 w-px bg-gray-500/40'></div>
              <div className='flex items-center gap-1'>
                <img src={assets.time_clock_icon} alt='' />
                <p>{calculateCourseDuration(courseData)}</p>
              </div>
              <div className='h-4 w-px bg-gray-500/40'></div>
              <div className='flex items-center gap-1'>
                <img src={assets.lesson_icon} alt='' />
                <p>{calculateNoOfLectures(courseData)} lessons</p>
              </div>
            </div>

            {enrollmentInfo?.inGrace && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                ⚠️ Your access expires in {enrollmentInfo.daysRemaining} days. Please re-enroll to continue.
              </div>
            )}

            {!isEducator && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className={`md:mt-6 mt-4 w-full py-3 rounded text-white font-medium transition-colors ${
                  hasFullAccess
                    ? 'bg-green-600 cursor-default'
                    : enrolling
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-800 hover:bg-red-700 cursor-pointer'
                }`}
              >
                {hasFullAccess
                  ? 'Access Active ✓'
                  : enrollmentInfo?.canRenew
                    ? 'Re-enroll (Monthly)'
                    : enrolling
                      ? 'Opening Payment...'
                      : 'Enroll Now (Monthly)'}
              </button>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}

export default CourseDetails
