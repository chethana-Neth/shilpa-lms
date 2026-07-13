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

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword || !formData.role) {
      return alert("All fields are required!");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return alert("Please enter a valid email address");
    if (formData.password.length < 6) return alert("Password must be at least 6 characters");

    const passwordStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/;
    if (!passwordStrengthRegex.test(formData.password)) {
      return alert("Password must contain at least one uppercase letter, one lowercase letter, one number, and one symbol (@$!%*?&#)");
    }

    if (formData.password !== formData.confirmPassword) return alert("Passwords do not match!");

    try {
      const response = await axios.post('http://localhost:8081/api/auth/register', formData);

      if (response.data.Status === "Success") {
        if (response.data.status === 'pending') {
          alert("Registration submitted! Your account is pending admin approval. You'll be notified once approved.");
        } else {
          alert("Registration Successful! Please login to continue.");
        }

        setShowRegister(false);
        navigate('/login', { replace: true });
      } else {
        alert("Registration failed: " + (response.data.Error || "Error"));
      }
    } catch (err) {
      console.error("Register Error:", err);
      alert("Server error. Is the backend running?");
    }
  };

  // Reusable eye icon toggle button
  const EyeToggle = ({ show, onToggle }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? (
        // Eye-off — password is visible
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        // Eye — password is hidden
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

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
          {/* USERNAME */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username:</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          {/* EMAIL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* PASSWORD + CONFIRM PASSWORD */}
          <div className="grid grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-2.5 pr-10 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm:</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-2.5 pr-10 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none"
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <EyeToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
              </div>
            </div>
          </div>

          {/* ROLE DROPDOWN */}
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