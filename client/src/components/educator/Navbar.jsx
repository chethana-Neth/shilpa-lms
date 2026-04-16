import React, { useContext, useState } from 'react'
import { assets ,  dummyEducatorData } from '../../assets/assets'
import { AppContext } from '../../context/AppContext'
import { Link } from 'react-router-dom'

const Navbar = () => {

  const { 
    userData, 
    isLoggedin, 
    
  } = useContext(AppContext)

  const educatorData = dummyEducatorData


  return (
<div className='flex items-center justify-between px-4 md:px-8 border-b border-gray-500 py-3'>
  
<Link to = '/'>
<img src={assets.icon} alt='icon' className='w-28 lg:w-32'/>
</Link>
<div className='flex items-center gap-5 text-gray-500 relative'>
{userData?.name ? (
    <p>{userData.name}</p>
  ) : (
    <p>Not Logged In</p>
  )}
 
    </div>
    </div>
  )
}

export default Navbar