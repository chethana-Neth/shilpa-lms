import React, { useContext } from 'react'
import { AppContext } from '../../context/AppContext'
import Login from '../login'
import Hero from '../../components/student/Hero'
import CoursesSection from '../../components/student/CoursesSection'
import TestimonialsSection from '../../components/student/TestimonialsSection'
import CallToAction from '../../components/student/CallToAction'
import Footer from '../../components/student/Footer'

const Home = () => {

const { showLogin } = useContext(AppContext);

  return (
    <div className='flex flex-col items-center space-y-7'>
      {showLogin && <Login />}
      <Hero/>
      <CoursesSection/>
      <TestimonialsSection/>
      <CallToAction/>
      <Footer/>
    </div>
  )
}

export default Home