import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from "../context/AppContext";
import axios from 'axios';

const Register = () => {
  const { setShowRegister, setShowLogin } = useContext(AppContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ''
  });

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.role) {
      return alert("All fields are required!");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return alert("Please enter a valid email address");
    if (formData.password.length < 6) return alert("Password must be at least 6 characters");
    if (formData.password !== formData.confirmPassword) return alert("Passwords do not match!");

    try {
      const response = await axios.post('http://localhost:8081/api/auth/register', formData);

      if (response.data.Status === "Success") {
        alert("Registration Successful! Please login to continue.");

        // Close register modal
        setShowRegister(false);
        setShowLogin(false); // Ensure login modal is also closed to prevent double render

        // ✅ Navigate to login page and replace history to prevent "back to blank"
        navigate('/login', { replace: true });
      } else {
        alert("Registration failed: " + (response.data.Error || "Error"));
      }
    } catch (err) {
      console.error("Register Error:", err);
      alert("Server error. Is the backend running?");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && setShowRegister(false)}
    >
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[500px] p-8 md:p-12 relative">
        <button
          onClick={() => setShowRegister(false)}
          className="absolute top-6 right-8 text-gray-400 hover:text-gray-900 text-2xl"
        >
          &times;
        </button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 mt-2 text-sm">Join our learning platform today</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username:</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm:</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role:</label>
            <select
              required
              className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="">Select Role</option>
              <option value="Student">Student</option>
              <option value="educator">Educator</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#6366f1] hover:bg-[#5356e3] text-white font-bold rounded-xl shadow-lg active:scale-[0.98] transition-all"
          >
            Register
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-gray-600 font-medium">
          Already have an account?
          <button
            onClick={() => {
              setShowRegister(false);
              navigate('/login', { replace: true });
            }}
            className="text-blue-600 font-bold hover:underline ml-1"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;