import React, { useContext } from 'react'
import { assets } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const { userData, isLoggedin, logoutUser } = useContext(AppContext)

  return (
    <div className='flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3 bg-white'>
      <Link to='/'>
        <img src={assets.icon} alt='icon' className='w-28 lg:w-32'/>
      </Link>
      
      <div className='flex items-center gap-5 text-gray-500'>
        {/* If context has user data, show the name; otherwise show login status */}
        {isLoggedin && userData ? (
          <div className='flex items-center gap-4'>
            <p className='text-gray-800 font-medium hidden sm:block'>
              Hi, {userData.name || userData.username}
            </p>
            <button 
              onClick={logoutUser}
              className='bg-red-500 text-white px-4 py-1.5 rounded-full text-sm'
            >
              Logout
            </button>
          </div>
        ) : (
          <p className='text-red-500 font-medium'>Not Logged In</p>
        )}
      </div>
    </div>
  )
}

export default Navbar;