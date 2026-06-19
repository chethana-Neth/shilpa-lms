import React, { useContext, useState, useEffect } from 'react'
import { AppContext } from '../../context/AppContext'
import { assets } from '../../assets/assets'
import Loading from '../../components/student/Loading'
import axios from 'axios'

const Dashboard = () => {
  const { currency, userData, backendUrl, isLoggedin } = useContext(AppContext)
  const [dashboardData, setDashboardData] = useState(null)

  const fetchDashboardData = async () => {
    try {
      const educatorId = userData?.id;
      if (!educatorId) return;

      // Fetch both Enrollments (for students/revenue) and Courses (for count)
      const [enrollRes, coursesRes] = await Promise.all([
        axios.get(`${backendUrl}/api/enrollments/students/${educatorId}`),
        axios.get(`${backendUrl}/api/courses`)
      ]);

      if (enrollRes.data.success && coursesRes.data.success) {
        const students = enrollRes.data.enrolledStudents;
        
        // Filter courses belonging to this educator
        const educatorCourses = coursesRes.data.courses.filter(
          course => Number(course.educator_id) === Number(educatorId)
        );

        // Calculate Total Revenue
        const totalEarnings = students.reduce((sum, item) => sum + (Number(item.amountPaid) || 0), 0);

        setDashboardData({
          totalCourses: educatorCourses.length,
          totalEnrolments: students.length,
          totalEarnings: totalEarnings,
          enrolledStudentsData: students.slice(0, 5) // Last 5 for the preview table
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  }

  useEffect(() => {
    if (isLoggedin && userData) {
      fetchDashboardData()
    }
  }, [isLoggedin, userData])

  if (!dashboardData || !userData) return <Loading />

  return (
    <div className='min-h-screen flex flex-col items-start justify-between gap-8 md:p-8 md:pb-0 p-4 pt-8 pb-0'>
      <div className='space-y-5 w-full'>
        <div className='flex flex-wrap gap-5 items-center'>
          
          {/* Total Courses Card */}
          <div className='flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md bg-white'>
            <img src={assets.appointments_icon} alt="icon" className='w-10' />
            <div>
              <p className='text-2xl font-medium text-gray-600'>{dashboardData.totalCourses}</p>
              <p className='text-base text-gray-500'>Total Courses</p>
            </div>
          </div>

          {/* Total Enrolments Card */}
          <div className='flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md bg-white'>
            <img src={assets.patients_icon} alt="icon" className='w-10' />
            <div>
              <p className='text-2xl font-medium text-gray-600'>{dashboardData.totalEnrolments}</p>
              <p className='text-base text-gray-500'>Total Enrolments</p>
            </div>
          </div>

          {/* Total Earnings Card */}
          <div className='flex items-center gap-3 shadow-card border border-blue-500 p-4 w-56 rounded-md bg-white'>
            <img src={assets.earning_icon} alt="icon" className='w-10' />
            <div>
              <p className='text-2xl font-medium text-gray-600'>
                {currency}{dashboardData.totalEarnings.toFixed(2)}
              </p>
              <p className='text-base text-gray-500'>Total Earnings</p>
            </div>
          </div>
        </div>

        <div className='pt-8'>
          <h2 className='pb-4 text-lg font-medium'>Latest Enrolments</h2>
          <div className='flex flex-col items-center max-w-4xl w-full overflow-hidden rounded-md bg-white border border-gray-500/20 shadow-sm'>
            <table className='table-fixed md:table-auto w-full overflow-hidden'>
              <thead className='text-gray-900 border-b border-gray-500/20 text-sm text-left bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 font-semibold text-center hidden sm:table-cell'>#</th>
                  <th className='px-4 py-3 font-semibold'>Student Name</th>
                  <th className='px-4 py-3 font-semibold'>Course Title</th>
                </tr>
              </thead>
              <tbody className='text-sm text-gray-500'>
                {dashboardData.enrolledStudentsData.map((item, index) => (
                  <tr key={index} className='border-b border-gray-500/20 hover:bg-gray-50 transition-colors'>
                    <td className='px-4 py-3 text-center hidden sm:table-cell'>{index + 1}</td>
                    <td className='md:px-4 px-2 py-3 flex items-center space-x-3'>
                      {/* Using Initial Avatar since backend doesn't return imageUrl */}
                      <div className='w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs'>
                        {item.studentName?.charAt(0).toUpperCase()}
                      </div>
                      <span className='truncate font-medium text-gray-800'>{item.studentName}</span>
                    </td>
                    <td className='px-4 py-3 truncate'>{item.courseTitle}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dashboardData.enrolledStudentsData.length === 0 && (
                <p className='p-10 text-gray-400'>No recent enrollments found.</p>
            )}
          </div>
        </div> 
      </div>
    </div>
  )
}

export default Dashboard;