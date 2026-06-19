import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from "../context/AppContext";
import axios from 'axios';

const Login = () => {
  const { setShowLogin, loginUser, setShowRegister } = useContext(AppContext);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      return alert("All fields are required!");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return alert("Please enter a valid email address");
    }

    if (password.length < 6) {
  return alert("Password must be at least 6 characters");
}

const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/;
if (!passwordStrengthRegex.test(password)) {
  return alert("Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&#)");
}

    try {
      const response = await axios.post('http://localhost:8081/api/auth/login', { email, password });

      if (response.data.Login === true) {
        loginUser(response.data.user, response.data.token);
        setShowLogin(false);

        const userRole = response.data.user.role;
        if (userRole === 'Admin') {
          navigate('/admin', { replace: true });        
        } else if (userRole === 'educator') {
          navigate('/educator', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        const msg = response.data.Message || "Invalid Credentials";
        setError(msg);
      }
    } catch (err) {
      console.error("Login Error:", err);
      const backendMsg = err.response?.data?.Message;
      if (backendMsg) {
        setError(backendMsg);
      } else {
        setError("Invalid Email or Password.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[500px] p-8 md:p-12 relative">
        
        <button 
          onClick={() => {
            setShowLogin(false);
            navigate('/');
          }}
          className="absolute top-6 right-8 text-gray-400 hover:text-gray-900 transition-colors text-2xl"
        >
          &times;
        </button>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back!</h1>
          <p className="text-gray-500 mt-2 text-sm">Enter your Credentials to access your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address:</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
              placeholder="hello@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-gray-700">Password:</label>
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')} 
                className="text-xs font-bold text-blue-700 hover:underline"
              >
                forgot password
              </button>
            </div>
            <input 
              type="password" 
              required
              className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 py-2">
            <input 
              type="checkbox" 
              id="remember" 
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
            />
            <label htmlFor="remember" className="text-sm font-semibold text-gray-800 cursor-pointer">
              Remember for 30 days
            </label>
          </div>

          <button 
            type="submit" 
            className="w-full py-3.5 bg-[#6366f1] hover:bg-[#5356e3] text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-100 active:scale-[0.98]"
          >
            Login
          </button>
        </form>

        <div className="mt-8 relative flex items-center justify-center">
          <div className="border-t border-gray-200 w-full"></div>
          <span className="bg-white px-3 text-[10px] uppercase tracking-widest text-gray-400 absolute font-medium">
            Or sign up with
          </span>
        </div>

        <div className="mt-8 space-y-6">
          <button className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
            <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900">Sign in with Google</span>
          </button>

          <p className="text-center text-sm font-medium text-gray-600">
            Don't have an account? 
            <button 
              onClick={() => {
                setShowLogin(false); 
                navigate('/register');
              }} 
              className="text-blue-600 font-bold hover:underline ml-1"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;