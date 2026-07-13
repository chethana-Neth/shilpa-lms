import React, { useContext, useEffect } from 'react';
import { Route, Routes, useMatch, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppContext } from './context/AppContext';

// Student pages
import Home from './pages/student/Home';
import CoursesList from './pages/student/CoursesList';
import CourseDetails from './pages/student/CourseDetails';
import MyEnrollments from './pages/student/MyEnrollments';
import Player from './pages/student/Player';
import TakeQuiz from './pages/student/TakeQuiz';
import SubmitAssignment from './pages/student/SubmitAssignment';

// Educator pages
import Educator from './pages/educator/Educator';
import Dashboard from './pages/educator/Dashboard';
import AddCourse from './pages/educator/AddCourse';
import EditCourse from './pages/educator/EditCourse';
import MyCourses from './pages/educator/MyCourses';
import StudentsEnrolled from './pages/educator/StudentsEnrolled';
import AddQuiz from './pages/educator/AddQuiz';
import AddAssignment from './pages/educator/AddAssignment';
import EditQuiz from './pages/educator/EditQuiz';                 // NEW
import EditAssignment from './pages/educator/EditAssignment';     // NEW

// Admin pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import PendingEducators from './pages/admin/PendingEducators';
import AdminAnalytics from './pages/admin/AdminAnalytics';    
import RevenueDashboard from './pages/admin/RevenueDashboard';    // NEW
import AdminUsers from './pages/admin/AdminUsers';

// Auth pages
import Login from './pages/login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Shared
import Loading from './components/student/Loading';
import Navbar from './components/student/Navbar';
import "quill/dist/quill.snow.css";

const App = () => {
  const { userData, isLoggedin } = useContext(AppContext);
  const location = useLocation();

  const isEducatorRoute = useMatch('/educator/*');
  const isLoginRoute = useMatch('/login');
  const isRegisterRoute = useMatch('/register');
  const isForgotPasswordRoute = useMatch('/forgot-password');
  const isResetPasswordRoute = useMatch('/reset-password/*');

  const isAuthPageRoute = isLoginRoute || isRegisterRoute ||
                         isForgotPasswordRoute || isResetPasswordRoute;

  useEffect(() => {
    console.log('App rendered:', {
      pathname: location.pathname,
      isAuthPageRoute,
      isLoggedin,
      userData: userData?.role
    });
  }, [location.pathname, isAuthPageRoute, isLoggedin, userData]);

  const showNavbar = !isEducatorRoute && !isAuthPageRoute;

  return (
    <div className='text-default min-h-screen bg-white'>
      <ToastContainer position="top-right" autoClose={3000} />

      {showNavbar && <Navbar />}

      <Routes>
        {/* Student routes */}
        <Route path="/" element={<Home />} />
        <Route path="/course-list" element={<CoursesList />} />
        <Route path="/course-list/:input" element={<CoursesList />} />
        <Route path="/course/:id" element={<CourseDetails />} />
        <Route path="/my-enrollments" element={<MyEnrollments />} />
        <Route path="/player/:courseId" element={<Player />} />
        <Route path="/loading/:path" element={<Loading />} />
        <Route path="/quiz/:quizId" element={<TakeQuiz />} />
        <Route path="/assignment/:assignmentId" element={<SubmitAssignment />} />

        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Admin routes (with layout) */}
        <Route
          path="/admin"
          element={
            isLoggedin && userData?.role === 'Admin' ? (
              <AdminLayout />
            ) : (
              <Navigate to="/" replace />
            )
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="pending-educators" element={<PendingEducators />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="revenue" element={<RevenueDashboard />} />
          <Route path="users" element={<AdminUsers />} />
        </Route>

        {/* Educator routes – only for role 'educator' */}
        <Route
          path="/educator"
          element={
            !userData ? (
              <Loading />
            ) : isLoggedin && userData ? (
              userData.role === 'educator' ? (
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
          <Route path="edit-course/:id" element={<EditCourse />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="student-enrolled" element={<StudentsEnrolled />} />
          <Route path="add-quiz/:lectureId" element={<AddQuiz />} />
          <Route path="add-assignment/:lectureId" element={<AddAssignment />} />
          {/* NEW: Edit routes */}
          <Route path="edit-quiz/:quizId" element={<EditQuiz />} />
          <Route path="edit-assignment/:assignmentId" element={<EditAssignment />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;