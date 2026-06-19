import React, { useContext, useEffect, useState } from 'react'
import { AppContext } from '../../context/AppContext'
import { useParams } from 'react-router-dom'
import { assets } from '../../assets/assets'
import humanizeDuration from 'humanize-duration'
import YouTube from 'react-youtube'
import axios from 'axios'
import Footer from '../../components/student/Footer'
import Rating from '../../components/student/Rating'

const Player = () => {

  const { calculateChapterTime, userData, backendUrl } = useContext(AppContext)
  const { courseId } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [openSections, setOpenSections] = useState({})
  const [playerData, setPlayerData] = useState(null)
  const [completedLectureIds, setCompletedLectureIds] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch full course details directly from API (includes chapters + lectures)
  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/courses/${courseId}`)
      if (data.success) {
        setCourseData(data.courseData)
      }
    } catch (error) {
      console.error('Error fetching course data', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompletedLectures = async () => {
    if (!userData?.id || !courseId) return
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/progress/completed/${userData.id}/${courseId}`
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
      }
    } catch (error) {
      console.error('Error marking lecture complete', error)
    }
  }

  const toggleSection = (index) => {
    setOpenSections((prev) => ({
      ...prev,
      [index]: !prev[index],
    }))
  }

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  useEffect(() => {
    fetchCompletedLectures()
  }, [userData, courseId])

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-gray-500'>Loading course...</p>
      </div>
    )
  }

  if (!courseData) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <p className='text-gray-500'>Course not found.</p>
      </div>
    )
  }

  return (
    <>
      <div className='p-4 sm:p-10 flex flex-col-reverse md:grid md:grid-cols-2 gap-10 md:px-36'>
        {/* Left column – course structure */}
        <div className='text-gray-800'>
          <h2 className='text-xl font-semibold'>Course Structure</h2>
          <div className='pt-5'>
            {courseData.courseContent.map((chapter, index) => (
              <div key={index} className='border border-gray-300 bg-white mb-2 rounded'>
                <div
                  className='flex items-center justify-between px-4 py-3 cursor-pointer select-none'
                  onClick={() => toggleSection(index)}
                >
                  <div className='flex items-center gap-2'>
                    <img
                      className={`transform transition-transform ${openSections[index] ? 'rotate-180' : ''}`}
                      src={assets.down_arrow_icon}
                      alt='arrow icon'
                    />
                    <p className='font-medium md:text-base text-sm'>{chapter.chapterTitle}</p>
                  </div>
                  <p className='text-sm md:text-default'>
                    {chapter.chapterContent.length} lectures · {calculateChapterTime(chapter)}
                  </p>
                </div>

                {/* Lecture list */}
                <div className={`overflow-hidden transition-all duration-300 ${openSections[index] ? 'max-h-96' : 'max-h-0'}`}>
                  <ul className='list-disc md:pl-10 pl-4 pr-4 py-2 text-gray-600 border-t border-gray-300'>
                    {chapter.chapterContent.map((lecture, i) => (
                      <li key={i} className='flex items-start gap-2 py-1'>
                        <img
                          src={completedLectureIds.includes(lecture.lecture_id) ? assets.blue_tick_icon : assets.play_icon}
                          alt='status icon'
                          className='w-4 h-4 mt-1'
                        />
                        <div className='flex items-center justify-between w-full text-gray-800 text-xs md:text-default'>
                          <p className={completedLectureIds.includes(lecture.lecture_id) ? 'line-through text-gray-400' : ''}>
                            {lecture.lectureTitle}
                          </p>
                          <div className='flex gap-2 items-center'>
                            {lecture.lectureUrl && (
                              <p
                                onClick={() => setPlayerData({
                                  ...lecture,
                                  chapter: index + 1,
                                  lecture: i + 1
                                })}
                                className='text-blue-500 cursor-pointer hover:underline'
                              >
                                Watch
                              </p>
                            )}
                            <p>
                              {humanizeDuration(
                                lecture.lectureDuration * 60 * 1000,
                                { units: ['h', 'm'] }
                              )}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <div className='flex items-center gap-2 py-3 mt-10'>
            <h1 className='text-xl font-bold'>Rate this Course</h1>
            <Rating initialRating={0} />
          </div>
        </div>

        {/* Right column – video player */}
        <div className='md:mt-10'>
          {playerData ? (
            <div>
              <YouTube
                videoId={playerData.lectureUrl.split('/').pop()}
                iframeClassName='w-full aspect-video'
                onEnd={() => markLectureComplete(playerData.lecture_id)}
              />
              <div className='flex justify-between items-center mt-2 px-1'>
                <p className='text-sm text-gray-700 font-medium'>
                  {playerData.chapter}.{playerData.lecture} {playerData.lectureTitle}
                </p>
                <button
                  onClick={() => markLectureComplete(playerData.lecture_id)}
                  disabled={completedLectureIds.includes(playerData.lecture_id)}
                  className={`text-sm px-3 py-1 rounded-full font-medium transition ${
                    completedLectureIds.includes(playerData.lecture_id)
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                  }`}
                >
                  {completedLectureIds.includes(playerData.lecture_id) ? '✓ Completed' : 'Mark Complete'}
                </button>
              </div>
            </div>
          ) : (
            <div className='text-center'>
              <img
                src={courseData.courseThumbnail
                  ? `${backendUrl}/uploads/${courseData.courseThumbnail}`
                  : ''}
                alt='Course thumbnail'
                className='w-full rounded'
              />
              <p className='text-gray-400 text-sm mt-3'>Click "Watch" on any lecture to start</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default Player