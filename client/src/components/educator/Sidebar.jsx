import React, { useContext } from 'react'
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { NavLink } from 'react-router-dom';



const Sidebar = () => {

  const {isEducator} =useContext(AppContext)
  const menuItems = [
    { name: 'Dashboard', path: '/educator', icon: assets.home_icon },
    { name: 'Add Course', path: '/educator/add-course', icon: assets.add_icon },
    { name: 'My Course', path: '/educator/My-courses', icon: assets.my_course_icon },
    { name: 'Student Enrolled', path: '/educator/student-enrolled', icon: assets.person_tick_icon },
  ];
  return isEducator &&(
    <div className='md:w-64 w-16 border-r min-h-screen text-base border-gray-500 py-2 flex flex-col'>
     {menuItems.map((item, index) => (
  <NavLink
    to={item.path}
    key={index}
    className="flex flex-col items-center md:flex-row md:items-center gap-2 p-2 hover:bg-gray-200"
  >
    <img src={item.icon} alt={item.name} className="w-6 h-6" />
    <p className="md:block hidden text-center">{item.name}</p>
  </NavLink>
))}
     </div>
  )
}

export default Sidebar