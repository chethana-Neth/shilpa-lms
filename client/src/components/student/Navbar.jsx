import React, { useContext } from 'react'
import { assets } from '../../assets/assets'
import { Link, useLocation } from "react-router-dom";
import { AppContext } from '../../context/AppContext';

const Navbar = () => {
  const { navigate, isLoggedin, setIsLoggedin, setShowLogin, userData } = useContext(AppContext)

  const location = useLocation();
  const isCourseListPage = location.pathname.includes('/course-list')

  // Role checks
  const isEducator = userData?.role === 'educator';
  const isStudent = userData?.role === 'Student';
  const isAdmin = userData?.role === 'Admin';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedin(false);
    navigate('/');
  }

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${isCourseListPage ? 'bg-white text-black' : 'bg-blue-800 text-white'}`}>
      
      <img onClick={() => navigate('/')} src={assets.icon} alt="Icon" className='w-28 lg:w-32 cursor-pointer' />

      <div className='hidden md:flex items-center gap-5'>
        <div className='flex items-center gap-5'>
          {isLoggedin && userData ? (
            <div className='flex items-center gap-5'>
              {/* Educator Dashboard (educators only) */}
              {isEducator && (
                <button onClick={() => navigate('/educator')} className='hover:text-gray-300'>
                  Educator Dashboard
                </button>
              )}
              {/* Student My Enrollments (students only) */}
              {isStudent && (
                <Link to='/my-enrollments' className='hover:text-gray-300'>
                  My Enrollments
                </Link>
              )}
              {/* Admin Panel (admins only) */}
              {isAdmin && (
                <Link to='/admin' className='hover:text-gray-300'>
                  Admin Panel
                </Link>
              )}
            </div>
          ) : null}
        </div>

        {isLoggedin ? (
          <div className='flex items-center gap-3'>
            <span className='font-medium text-xs'>
              Hi, {userData?.username} ({userData?.role})
            </span>
            <button 
              onClick={handleLogout} 
              className='bg-red-500 px-5 py-2 rounded-full text-sm text-white hover:bg-red-600 transition-all'
            >
              Logout
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setShowLogin(true)} 
            className='bg-blue-600 px-5 py-2 rounded-full text-white hover:bg-blue-700 transition-all'
          >
            Create Account
          </button>
        )}
      </div>

      <div className='md:hidden flex items-center gap-2 sm:gap-5'>
        {isLoggedin ? (
          <button onClick={handleLogout} className='text-sm underline'>Logout</button>
        ) : (
          <button onClick={() => setShowLogin(true)} className='text-sm'>Login</button>
        )}
      </div>
    </div>
  )
}

export default Navbar;