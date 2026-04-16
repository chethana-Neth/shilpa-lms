import React, { useContext } from 'react'
import { assets } from '../../assets/assets'
import { Link, useLocation } from "react-router-dom";
import { AppContext } from '../../context/AppContext';

const Navbar = () => {
  // 1. Pulling necessary states from AppContext
  const { navigate, isLoggedin, setIsLoggedin, setShowLogin, userData } = useContext(AppContext)

  const location = useLocation();
  const isCourseListPage = location.pathname.includes('/course-list')

  // 2. Role Logic: Match your DB exactly (lowercase 'educator', Capital 'Student')
  const isEducator = userData?.role === 'educator' || userData?.role === 'Admin';
  const isStudent = userData?.role === 'Student';

  // 3. Logout Function
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedin(false);
    navigate('/');
  }

  return (
    <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-36 border-b border-gray-500 py-4 ${isCourseListPage ? 'bg-white text-black' : 'bg-blue-800 text-white'}`}>
      
      {/* Icon/Logo */}
      <img onClick={() => navigate('/')} src={assets.icon} alt="Icon" className='w-28 lg:w-32 cursor-pointer' />

      <div className='hidden md:flex items-center gap-5'>
        <div className='flex items-center gap-5'>
          
          {/* 4. Safety Check: Only render role-based links if logged in AND userData exists */}
         {isLoggedin && userData ? (
  <div className='flex items-center gap-5'>
    
    {/* CASE 1: Educator or Admin - Only show Educator Dashboard */}
    {isEducator && (
      <button onClick={() => navigate('/educator')} className='hover:text-gray-300'>
        Educator Dashboard
      </button>
    )}

    {/* CASE 2: Student - Only show My Enrollments */}
    {isStudent && (
      <Link to='/my-enrollments' className='hover:text-gray-300'>
        My Enrollments
      </Link>
    )}

  </div>
) : null}
        </div>

        {/* Auth Buttons Section */}
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

      {/* Mobile Menu (Phone Screens) */}
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