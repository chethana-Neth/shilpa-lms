import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import axios from 'axios';

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const currency = import.meta.env.VITE_CURRENCY;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8081";
  const navigate = useNavigate();

  const [allCourses, setallCourses] = useState([]);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [enrolledCourses, setEnrolledCourses] = useState([]);

  const [isLoggedin, setIsLoggedin] = useState(
    !!localStorage.getItem("token")
  );

  const [userData, setUserData] = useState(() => {
    const savedUser = localStorage.getItem("user");
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.error("Error parsing user data", error);
      return null;
    }
  });

  const isEducator = userData?.role === "educator" || userData?.role === "Admin";

  const fetchAllCourses = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/courses`);
      if (data.success) {
        setallCourses(data.courses);
      }
    } catch (error) {
      console.error("Error fetching courses", error);
    }
  };

  // Fetches real enrolled courses from backend for the logged-in student
  const fetchUserEnrolledCourses = async () => {
    const userId = userData?.id;
    if (!userId) {
      setEnrolledCourses([]);
      return;
    }
    try {
      const { data } = await axios.get(
        `${backendUrl}/api/enrollments/my-enrollments/${userId}`
      );
      if (data.success) {
        setEnrolledCourses(data.courses);
      } else {
        setEnrolledCourses([]);
      }
    } catch (error) {
      console.error("Error fetching enrolled courses", error);
      setEnrolledCourses([]);
    }
  };

  const calculateRating = (course) => {
    if (!course.courseRatings || course.courseRatings.length === 0) return 0;
    let total = 0;
    course.courseRatings.forEach((r) => (total += r.rating));
    return (total / course.courseRatings.length).toFixed(1);
  };

  const calculateChapterTime = (chapter) => {
    let time = 0;
    if (chapter.chapterContent) {
      chapter.chapterContent.forEach(
        (lecture) => (time += lecture.lectureDuration)
      );
    }
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  const calculateCourseDuration = (course) => {
    let time = 0;
    if (course.courseContent) {
      course.courseContent.forEach((chapter) => {
        chapter.chapterContent.forEach(
          (lecture) => (time += lecture.lectureDuration)
        );
      });
    }
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  const calculateNoOfLectures = (course) => {
    let totalLectures = 0;
    if (course.courseContent) {
      course.courseContent.forEach((chapter) => {
        if (Array.isArray(chapter.chapterContent)) {
          totalLectures += chapter.chapterContent.length;
        }
      });
    }
    return totalLectures;
  };

  useEffect(() => {
    fetchAllCourses();
  }, []);

  // Re-fetch enrolled courses when user logs in or out
  useEffect(() => {
    if (userData?.id) {
      fetchUserEnrolledCourses();
    } else {
      setEnrolledCourses([]);
    }
  }, [userData]);

  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");
      if (token && savedUser) {
        setIsLoggedin(true);
        setUserData(JSON.parse(savedUser));
      } else {
        setIsLoggedin(false);
        setUserData(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const loginUser = (user, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUserData(user);
    setIsLoggedin(true);
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserData(null);
    setIsLoggedin(false);
    setEnrolledCourses([]);
    navigate('/');
};

  const value = {
    navigate,
    currency,
    backendUrl,
    allCourses,
    setallCourses,
    fetchAllCourses,
    isLoggedin,
    setIsLoggedin,
    showLogin,
    setShowLogin,
    showRegister,
    setShowRegister,
    userData,
    setUserData,
    enrolledCourses,
    fetchUserEnrolledCourses,
    calculateRating,
    calculateNoOfLectures,
    calculateCourseDuration,
    calculateChapterTime,
    isEducator,
    loginUser,
    logoutUser,
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};
