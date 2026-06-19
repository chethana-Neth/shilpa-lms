import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import Footer from '../../components/student/Footer'

const MyEnrollments = () => {
  const {
    backendUrl,
    userData,
    calculateCourseDuration,
    calculateNoOfLectures,
    currency
  } = useContext(AppContext)

  const [enrolledCourses, setEnrolledCourses] = useState(null)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const fetchEnrolledCourses = async () => {
    if (!userData?.id) return;
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/enrollments/my-enrollments/${userData.id}`
      );
      if (data.success) {
        setEnrolledCourses(data.courses);
      } else {
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error("Fetch enrolled courses error:", error);
      setEnrolledCourses([]);
    }
  };

  useEffect(() => {
    fetchEnrolledCourses();
  }, [userData]);

  // Handle payment return 
  useEffect(() => {
    const success = searchParams.get('success');
    const courseId = searchParams.get('courseId');
    const userId = searchParams.get('userId');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    if (success === 'true' && courseId && userId) {
      axios.post(`${backendUrl}/api/enrollments/confirm`, {
        courseId,
        userId,
        orderId,
        amount: Number(amount)
      })
        .then(() => {
          toast.success("Payment successful! You are now enrolled.");
          window.history.replaceState({}, '', '/my-enrollments');
          setTimeout(() => fetchEnrolledCourses(), 1000);
        })
        .catch(() => {
          toast.success("Payment successful!");
          setTimeout(() => fetchEnrolledCourses(), 1000);
        });
    }
  }, []);

  // get badge based on status and days remaining
  const getStatusBadge = (status, daysRemaining) => {
    if (status === 'expired') {
      return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">Expired</span>;
    }
    if (status === 'grace') {
      return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">Grace period</span>;
    }
    if (daysRemaining <= 3) {
      return <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded">Expires soon ({daysRemaining}d)</span>;
    }
    return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">Active ({daysRemaining}d left)</span>;
  };

  if (!enrolledCourses) return <Loading />;

  return (
    <>
      <div className='md:px-36 px-8 pt-20 min-h-screen'>
        <h1 className='text-2xl font-semibold text-gray-800 mb-2'>My Enrollments</h1>
        <p className='text-gray-500 mb-8'>Courses you have enrolled in</p>

        {enrolledCourses.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-gray-400'>
            <p className='text-lg mb-4'>You haven't enrolled in any courses yet.</p>
            <button
              onClick={() => navigate('/course-list')}
              className='px-6 py-2.5 bg-red-800 text-white rounded hover:bg-red-700 transition-colors'
            >
              Browse Courses
            </button>
          </div>
        ) : (
          <table className='md:table-auto table-fixed w-full overflow-hidden border mb-16'>
            <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left max-sm:hidden'>
              <tr>
                <th className='px-4 py-3 font-semibold truncate'>Course</th>
                <th className='px-4 py-3 font-semibold truncate'>Duration</th>
                <th className='px-4 py-3 font-semibold truncate'>Lessons</th>
                <th className='px-4 py-3 font-semibold truncate'>Enrolled / Expires</th>
                <th className='px-4 py-3 font-semibold truncate'>Status</th>
                <th className='px-4 py-3 font-semibold truncate'>Action</th>
              </tr>
            </thead>
            <tbody className='text-gray-700'>
              {enrolledCourses.map((course, index) => (
                <tr key={index} className='border-b border-gray-500/20'>
                  <td className='md:px-4 pl-2 md:pl-4 py-3 flex items-center space-x-3'>
                    <img
                      src={`${backendUrl}/uploads/${course.courseThumbnail}`}
                      alt=''
                      className='w-14 sm:w-24 md:w-28 rounded'
                    />
                    <div className='flex-1'>
                      <p className='mb-1 max-sm:text-sm font-medium'>{course.courseTitle}</p>
                      <p className='text-xs text-green-600 font-medium'>✓ Enrolled</p>
                    </div>
                  </td>
                  <td className='px-4 py-3 max-sm:hidden text-sm'>
                    {calculateCourseDuration(course)}
                  </td>
                  <td className='px-4 py-3 max-sm:hidden text-sm'>
                    {calculateNoOfLectures(course)} lectures
                  </td>
                  <td className='px-4 py-3 max-sm:hidden text-sm'>
                    {new Date(course.enrolled_at).toLocaleDateString()} <br />
                    <span className="text-xs text-gray-500">Expires: {new Date(course.expires_at).toLocaleDateString()}</span>
                  </td>
                  <td className='px-4 py-3 max-sm:hidden'>
                    {getStatusBadge(course.status, course.days_remaining)}
                  </td>
                  <td className='px-4 py-3 max-sm:text-right'>
                    {course.status === 'expired' ? (
                      <button
                        onClick={() => navigate(`/course/${course._id}`)}
                        className='px-3 sm:px-5 py-1.5 sm:py-2 bg-yellow-600 hover:bg-yellow-500 max-sm:text-xs text-white rounded transition-colors'
                      >
                        Re-enroll
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/course/${course._id}`)}
                        className='px-3 sm:px-5 py-1.5 sm:py-2 bg-red-800 hover:bg-red-700 max-sm:text-xs text-white rounded transition-colors'
                      >
                        Watch Now
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyEnrollments;