import React, { useState, useEffect, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import axios from 'axios'

const StudentsEnrolled = () => {
  const { backendUrl, userData, currency } = useContext(AppContext)
  const [enrolledStudents, setEnrolledStudents] = useState(null)

  const fetchEnrolledStudents = async () => {
    const educatorId = userData?.id;
    if (!educatorId) return;

    try {
      const { data } = await axios.get(
        `${backendUrl}/api/enrollments/students/${educatorId}`
      );
      if (data.success) {
        setEnrolledStudents(data.enrolledStudents);
      } else {
        setEnrolledStudents([]);
      }
    } catch (error) {
      console.error("Fetch students error:", error);
      setEnrolledStudents([]);
    }
  };

  useEffect(() => {
    fetchEnrolledStudents();
  }, [userData]);

  // Calculate total revenue across all enrollments
  const totalRevenue = enrolledStudents
    ? enrolledStudents.reduce((sum, item) => sum + (Number(item.amountPaid) || 0), 0)
    : 0;

  return enrolledStudents ? (
    <div className='min-h-screen flex flex-col items-start justify-start md:p-8 p-4 pt-8'>
      <h2 className='pb-6 text-xl font-semibold text-gray-800'>Students Enrolled</h2>

      {/* Revenue summary cards - now positioned at the top */}
      <div className='mb-8 flex gap-4'>
        <div className='bg-white border border-gray-200 rounded-lg px-6 py-4 shadow-sm'>
          <p className='text-xs text-gray-500 mb-1 uppercase font-medium tracking-wider'>Total Students</p>
          <p className='text-2xl font-bold text-gray-800'>{enrolledStudents.length}</p>
        </div>
        <div className='bg-white border border-gray-200 rounded-lg px-6 py-4 shadow-sm'>
          <p className='text-xs text-gray-500 mb-1 uppercase font-medium tracking-wider'>Total Revenue</p>
          <p className='text-2xl font-bold text-green-700'>
            {currency}{totalRevenue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className='flex flex-col items-center max-w-5xl w-full overflow-hidden rounded-lg bg-white border border-gray-200 shadow-sm'>
        {enrolledStudents.length === 0 ? (
          <div className='p-10 text-gray-500'>No students have enrolled in your courses yet.</div>
        ) : (
          <table className='table-fixed md:table-auto w-full overflow-hidden'>
            <thead className='text-gray-900 bg-gray-50 border-b border-gray-200 text-sm text-left'>
              <tr>
                <th className='px-4 py-4 font-semibold text-center hidden sm:table-cell w-16'>#</th>
                <th className='px-4 py-4 font-semibold'>Student Name</th>
                <th className='px-4 py-4 font-semibold hidden md:table-cell'>Email</th>
                <th className='px-4 py-4 font-semibold'>Course Title</th>
                <th className='px-4 py-4 font-semibold hidden sm:table-cell'>Amount Paid</th>
                <th className='px-4 py-4 font-semibold hidden sm:table-cell'>Enrolled On</th>
              </tr>
            </thead>
            <tbody className='text-sm text-gray-600'>
              {enrolledStudents.map((item, index) => (
                <tr key={index} className='border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors'>

                  {/* Row number */}
                  <td className='px-4 py-4 text-center hidden sm:table-cell text-gray-400'>
                    {index + 1}
                  </td>

                  {/* Student avatar + name */}
                  <td className='md:px-4 px-2 py-4 flex items-center space-x-3'>
                    <div className='w-9 h-9 rounded-full bg-red-800 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0'>
                      {item.studentName?.charAt(0).toUpperCase() || 'S'}
                    </div>
                    <span className='truncate font-medium text-gray-800'>{item.studentName}</span>
                  </td>

                  {/* Email */}
                  <td className='px-4 py-4 truncate text-gray-500 hidden md:table-cell'>
                    {item.studentEmail}
                  </td>

                  {/* Course title */}
                  <td className='px-4 py-4 truncate'>{item.courseTitle}</td>

                  {/* Amount paid */}
                  <td className='px-4 py-4 hidden sm:table-cell'>
                    {item.amountPaid
                      ? <span className='text-green-700 font-semibold'>
                          {currency}{Number(item.amountPaid).toFixed(2)}
                        </span>
                      : <span className='text-gray-400 text-xs'>—</span>
                    }
                  </td>

                  {/* Enrolled date */}
                  <td className='px-4 py-4 hidden sm:table-cell text-gray-500'>
                    {new Date(item.purchaseDate).toLocaleDateString()}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  ) : <Loading />
}

export default StudentsEnrolled