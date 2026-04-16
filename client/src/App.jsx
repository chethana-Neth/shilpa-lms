import React, { useContext } from 'react'
import { Route, Routes, useMatch, Navigate } from 'react-router-dom'
import { AppContext } from './context/AppContext'

// Page imports
import Home from './pages/student/Home'
import CoursesList from './pages/student/CoursesList'
import CourseDetails from './pages/student/CourseDetails'
import MyEnrollments from './pages/student/MyEnrollments'
import Player from './pages/student/Player'
import Loading from './components/student/Loading'
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourse from './pages/educator/AddCourse'
import MyCourses from './pages/educator/MyCourses'
import StudentsEnrolled from './pages/educator/StudentsEnrolled'
import Navbar from './components/student/Navbar'
import Login from './pages/login'
import Register from './pages/Register';

const App = () => {
  const { userData, isLoggedin, showLogin, showRegister } = useContext(AppContext);

  const isEducatorRoute = useMatch('/educator/*')
  const isAuthPageRoute = useMatch('/login') || useMatch('/register');

  // FIX: Removed the global "return <Loading />" that was causing the blank screen.
  // We only show loading inside the protected routes now.

  return (
    <div className='text-default min-h-screen bg-white'>
      {/* Show Navbar only if not on Educator or direct Auth pages */}
      {!isEducatorRoute && !isAuthPageRoute && <Navbar/>}

      {/* Render modals only if NOT on the explicit /login or /register page */}
      {!isAuthPageRoute && showLogin && <Login />}
      {!isAuthPageRoute && showRegister && <Register />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/course-list" element={<CoursesList />} />
        <Route path="/course-list/:input" element={<CoursesList />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/my-enrollments" element={<MyEnrollments />} />
        <Route path="/player/:courseId" element={<Player />} />
        <Route path="/loading/:path" element={<Loading />} />

        <Route 
          path="/educator" 
          element={
            localStorage.getItem('token') && !userData ? (
              <Loading /> // Only block the Educator page while loading user data
            ) : isLoggedin && userData ? (
              userData.role === 'educator' || userData.role === 'Admin' ? (
                <Educator />
              ) : (
                <Navigate to="/" /> 
              )
            ) : (
              <Navigate to="/login" /> 
            )
          } 
        >
          <Route path="" element={<Dashboard />} />
          <Route path="add-course" element={<AddCourse />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="student-enrolled" element={<StudentsEnrolled />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App;