import React, { useState, useEffect, useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import Loading from '../../components/student/Loading'
import axios from 'axios'

const StudentsEnrolled = () => {
  const { backendUrl, userData, currency } = useContext(AppContext)
  const [enrolledStudents, setEnrolledStudents] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

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

  // Filter students locally based on the search term (name, email, or course title)
  const filteredStudents = enrolledStudents
    ? enrolledStudents.filter((item) => {
        const term = searchTerm.toLowerCase();
        return (
          item.studentName?.toLowerCase().includes(term) ||
          item.studentEmail?.toLowerCase().includes(term) ||
          item.courseTitle?.toLowerCase().includes(term)
        );
      })
    : [];

  return enrolledStudents ? (
    <div className='min-h-screen flex flex-col items-start justify-start md:p-8 p-4 pt-8'>
      <h2 className='pb-6 text-xl font-semibold text-gray-800'>Students Enrolled</h2>

      {/* Search bar - filters the table below live as you type */}
      <div className='mb-6 max-w-xl w-full md:h-14 h-12 flex items-center bg-white border border-gray-300 rounded-lg shadow-sm'>
        <svg className='w-5 h-5 text-gray-400 ml-4 flex-shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z' />
        </svg>
        <input
          type='text'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder='Search by student name, email, or course'
          className='w-full px-3 py-3 outline-none text-gray-700 bg-transparent'
        />
        {searchTerm && (
          <button
            type='button'
            onClick={() => setSearchTerm('')}
            className='text-gray-400 hover:text-gray-600 px-4'
            aria-label='Clear search'
          >
            ✕
          </button>
        )}
      </div>

      {/* Revenue summary cards */}
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

      {/* Table Container - widened and made horizontally scrollable so nothing gets clipped */}
      <div className='flex flex-col items-center w-full max-w-7xl overflow-x-auto rounded-lg bg-white border border-gray-200 shadow-sm'>
        {enrolledStudents.length === 0 ? (
          <div className='p-10 text-gray-500'>No students have enrolled in your courses yet.</div>
        ) : filteredStudents.length === 0 ? (
          <div className='p-10 text-gray-500'>No students match "{searchTerm}".</div>
        ) : (
          <table className='w-full min-w-[900px] table-auto'>
            <thead className='text-gray-900 bg-gray-50 border-b border-gray-200 text-sm text-left'>
              <tr>
                <th className='px-4 py-4 font-semibold text-center hidden sm:table-cell w-12'>#</th>
                <th className='px-4 py-4 font-semibold w-1/5'>Student Name</th>
                <th className='px-4 py-4 font-semibold hidden md:table-cell w-1/5'>Email</th>
                <th className='px-4 py-4 font-semibold w-1/4'>Course Title</th>
                <th className='px-4 py-4 font-semibold hidden sm:table-cell w-32'>Amount Paid</th>
                <th className='px-4 py-4 font-semibold hidden sm:table-cell w-32'>Enrolled On</th>
              </tr>
            </thead>
            <tbody className='text-sm text-gray-600'>
              {filteredStudents.map((item, index) => (
                <tr key={index} className='border-b border-gray-100 last:border-0 hover:bg-blue-50/30 transition-colors'>

                  {/* Row number */}
                  <td className='px-4 py-4 text-center hidden sm:table-cell text-gray-400'>
                    {index + 1}
                  </td>

                  {/* Student avatar + name */}
                  <td className='md:px-4 px-2 py-4'>
                    <div className='flex items-center space-x-3'>
                      <div className='w-9 h-9 rounded-full bg-red-800 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0'>
                        {item.studentName?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <span className='truncate font-medium text-gray-800'>{item.studentName}</span>
                    </div>
                  </td>

                  {/* Email */}
                  <td className='px-4 py-4 truncate text-gray-500 hidden md:table-cell'>
                    {item.studentEmail}
                  </td>

                  {/* Course title */}
                  <td className='px-4 py-4'>{item.courseTitle}</td>

                  {/* Amount paid */}
                  <td className='px-4 py-4 hidden sm:table-cell whitespace-nowrap'>
                    {item.amountPaid
                      ? <span className='text-green-700 font-semibold'>
                          {currency}{Number(item.amountPaid).toFixed(2)}
                        </span>
                      : <span className='text-gray-400 text-xs'>—</span>
                    }
                  </td>

                  {/* Enrolled date */}
                  <td className='px-4 py-4 hidden sm:table-cell text-gray-500 whitespace-nowrap'>
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
