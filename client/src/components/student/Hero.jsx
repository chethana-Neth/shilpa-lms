import React from 'react'
import { assets } from '../../assets/assets'
import SearchBar from './SearchBar'


const Hero = () => {
  return (
    <div className='relative flex flex-col items-center justify-center w-full md:pt-15 pt-20 px-7 md:px-35 space-y-5 text-center bg-gradient-to-b from-blue-800 to-white/0'>

      {/*Background Image Container*/}
      <div>
          <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-20"></div>
          <img src={assets.icon} alt="Icon" 
          
          className="  w-500 h-120 object-cover  rounded-3xl"
        />

      </div>
 {/* Updated Heading in Hero.jsx */}
<h1 className="text-home-small md:text-home-large relative font-bold text-gray-800 max-w-3xl mx-auto">
  Empower your potential with interactive education at your{" "}
  <span className="text-blue-600">fingertips</span>
</h1>
      {/* Description */}
      <p className="text-1xl mt-4 text-gray-600 max-w-2xl mx-auto">
        Bridging the gap to excellence with secure, smart, and student-centered learning at
        <span className="text-1xl font-bold block text-gray-800">
          SHILPA Higher Educational Centre.
        </span>
      </p>
      <div className='w-full flex justify-start md:pl-32 px-4'>
    <SearchBar/>
     </div>
      </div>


  )
}

export default Hero