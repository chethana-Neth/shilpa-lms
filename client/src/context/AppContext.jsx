import { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const currency = import.meta.env.VITE_CURRENCY;
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
    setallCourses(dummyCourses);
  };

  const fetchUserEnrolledCourses = async () => {
    setEnrolledCourses(dummyCourses);
  };

  const calculateRating = (course) => {
    if (!course.courseRatings || course.courseRatings.length === 0) return 0;
    let total = 0;
    course.courseRatings.forEach((r) => (total += r.rating));
    return total / course.courseRatings.length;
  };

  const calculateChapterTime = (chapter) => {
    let time = 0;
    chapter.chapterContent.forEach(
      (lecture) => (time += lecture.lectureDuration)
    );
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  const calculateCourseDuration = (course) => {
    let time = 0;
    course.courseContent.forEach((chapter) => {
      chapter.chapterContent.forEach(
        (lecture) => (time += lecture.lectureDuration)
      );
    });
    return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
  };

  const calculateNoOfLectures = (course) => {
    let totalLectures = 0;
    course.courseContent.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        totalLectures += chapter.chapterContent.length;
      }
    });
    return totalLectures;
  };

  useEffect(() => {
    fetchAllCourses();
    fetchUserEnrolledCourses();
  }, []);

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

  const value = {
    navigate,
    currency,
    allCourses,
    setallCourses,
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
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};