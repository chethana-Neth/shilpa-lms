import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'

const MyCourses = () => {
  const { currency, allCourses, userData, fetchAllCourses, backendUrl } = useContext(AppContext)
  const [courses, setCourses] = useState(null)
  const [deletingId, setDeletingId] = useState(null)   // tracks which course is being deleted
  const navigate = useNavigate()

  useEffect(() => {
    if (allCourses && userData) {
      const currentUserId = userData.id || userData._id
      const myCreatedCourses = allCourses.filter(
        course => course.educator_id == currentUserId
      )
      setCourses(myCreatedCourses)
    }
  }, [allCourses, userData])

  const handleDelete = async (courseId, courseTitle) => {
    // Confirm before deleting — this also prevents accidental taps on mobile
    const confirmed = window.confirm(
      `Are you sure you want to delete "${courseTitle}"?\n\nThis will also delete all chapters and lectures inside it.`
    )
    if (!confirmed) return

    try {
      setDeletingId(courseId)

      const { data } = await axios.delete(`${backendUrl}/api/courses/${courseId}`)

      if (data.success) {
        toast.success("Course deleted successfully.")
        await fetchAllCourses()   // refresh list in context so table updates
      } else {
        toast.error(data.message || "Failed to delete course.")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error(error.response?.data?.message || "Failed to delete course.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (courseId) => {
    navigate(`/educator/edit-course/${courseId}`)
  }

  if (!courses) return <Loading />

  return (
    <div className='min-h-screen flex flex-col items-start gap-8 md:p-8 p-4 pt-8'>
      <h2 className='pb-4 text-lg font-medium'>My Courses</h2>
      <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20'>
        {courses.length > 0 ? (
          <table className='md:table-auto table-fixed w-full overflow-hidden'>
            <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left'>
              <tr>
                <th className='px-4 py-3 font-semibold'>All Courses</th>
                <th className='px-4 py-3 font-semibold'>Earnings</th>
                <th className='px-4 py-3 font-semibold'>Students</th>
                <th className='px-4 py-3 font-semibold'>Published On</th>
                <th className='px-4 py-3 font-semibold'>Actions</th>
              </tr>
            </thead>
            <tbody className='text-sm text-gray-500'>
              {courses.map((course) => (
                <tr key={course._id} className='border-b border-gray-500/20'>

                  {/* Course thumbnail + title */}
                  <td className='md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3'>
                    <img
                      src={`${backendUrl}/uploads/${course.courseThumbnail}`}
                      alt=""
                      className='w-16 h-12 object-cover rounded'
                    />
                    <span className='truncate hidden md:block'>{course.courseTitle}</span>
                  </td>

                  {/* Earnings */}
                  <td className='px-4 py-3'>
                    {currency}{Math.floor(
                      course.enrolledStudentsCount *
                      (course.coursePrice - (course.discount * course.coursePrice / 100))
                    )}
                  </td>

                  {/* Students */}
                  <td className='px-4 py-3'>{course.enrolledStudentsCount}</td>

                  {/* Published date */}
                  <td className='px-4 py-3'>
                    {new Date(course.createdAt).toLocaleDateString()}
                  </td>

                  {/* Edit + Delete buttons */}
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-2'>
                      <button
                        onClick={() => handleEdit(course._id)}
                        className='px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors'
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(course._id, course.courseTitle)}
                        disabled={deletingId === course._id}
                        className={`px-3 py-1.5 text-xs text-white rounded transition-colors ${
                          deletingId === course._id
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600'
                        }`}
                      >
                        {deletingId === course._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-gray-500">You haven't added any courses yet.</div>
        )}
      </div>
    </div>
  )
}

export default MyCourses