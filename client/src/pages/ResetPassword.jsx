import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const ResetPassword = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')
    const [tokenValid, setTokenValid] = useState(null)
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081'

    useEffect(() => {
        const verifyToken = async () => {
            try {
                const { data } = await axios.get(`${backendUrl}/api/password/verify-token/${token}`)
                setTokenValid(data.success)
            } catch { setTokenValid(false) }
        }
        verifyToken()
    }, [token])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        if (newPassword.length < 6) return setError('Password must be at least 6 characters.')
        if (newPassword !== confirmPassword) return setError('Passwords do not match.')
        try {
            setSubmitting(true)
            const { data } = await axios.post(`${backendUrl}/api/password/reset-password`, { token, newPassword })
            if (data.success) setSuccess(true)
            else setError(data.message || 'Failed to reset password.')
        } catch { setError('Server error. Please try again.') }
        finally { setSubmitting(false) }
    }

    if (tokenValid === null) return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-12 text-center"><p className="text-gray-500">Verifying reset link...</p></div>
        </div>
    )

    if (tokenValid === false) return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[500px] p-8 text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
                <p className="text-gray-500 text-sm mb-6">This reset link is invalid or has expired.</p>
                <button onClick={() => navigate('/forgot-password')} className="w-full py-3.5 bg-[#6366f1] text-white font-bold rounded-xl">Request New Link</button>
            </div>
        </div>
    )

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[500px] p-8 md:p-12">
                {!success ? (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Reset Password</h1>
                            <p className="text-gray-500 mt-2 text-sm">Enter your new password below</p>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password:</label>
                                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="At least 6 characters"
                                    className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password:</label>
                                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Repeat your new password"
                                    className="w-full px-4 py-2.5 border border-[#ced4da] rounded-xl focus:ring-2 focus:ring-indigo-400 outline-none" />
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            <button type="submit" disabled={submitting}
                                className={`w-full py-3.5 text-white font-bold rounded-xl ${submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#6366f1] hover:bg-[#5356e3]'}`}>
                                {submitting ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <div className="text-6xl mb-4">✅</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                        <p className="text-gray-500 text-sm mb-6">Your password has been reset. You can now log in.</p>
                        <button onClick={() => navigate('/login')} className="w-full py-3.5 bg-[#6366f1] hover:bg-[#5356e3] text-white font-bold rounded-xl">Go to Login</button>
                    </div>
                )}
            </div>
        </div>
    )
}
export default ResetPassword