import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('') // Previous error clear
        if (!email.trim()) return setError('Please enter your email address.')
        try {
            setSubmitting(true)
            const { data } = await axios.post(`${backendUrl}/api/password/forgot-password`, { email })
            if (data.success) setSent(true)
            else setError(data.message || 'Something went wrong.')
        } catch {
            setError('Server error. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[500px] p-8 md:p-12 relative">
                <button onClick={() => navigate('/login')} className="absolute top-6 right-8 text-gray-400 hover:text-gray-900 text-2xl">&times;</button>
                {!sent ? (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Forgot Password?</h1>
                            <p className="text-gray-500 mt-2 text-sm">Enter your email and we'll send you a reset link</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email address:</label>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="hello@example.com"
                                    className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none transition-all" />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <button type="submit" disabled={submitting}
                                className={`w-full py-3.5 text-white font-bold rounded-xl transition-all ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#6366f1] hover:bg-[#5356e3]'}`}>
                                {submitting ? 'Sending...' : 'Send Reset Link'}
                            </button>
                        </form>
                        <p className="text-center text-sm mt-6 text-gray-600">
                            Remember your password?{' '}
                            <button onClick={() => navigate('/login')} className="text-blue-600 font-bold hover:underline">Login</button>
                        </p>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="text-6xl mb-4">📧</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
                        <p className="text-gray-500 text-sm mb-6">We sent a reset link to <strong>{email}</strong>. Expires in 1 hour.</p>
                        <button onClick={() => navigate('/login')} className="w-full py-3.5 bg-[#6366f1] hover:bg-[#5356e3] text-white font-bold rounded-xl transition-all">Back to Login</button>
                    </div>
                )}
            </div>
        </div>
    )
}
export default ForgotPassword