const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { db } = require('../config/db');

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const queryPromise = (sql, params) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    });
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required." });
    try {
        const users = await queryPromise("SELECT id, username FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
        const user = users[0];
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        await queryPromise("DELETE FROM password_resets WHERE email = ?", [email]);
        await queryPromise("INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)", [email, token, expiresAt]);
        const resetUrl = `${process.env.FRONTEND_URL}/#/reset-password/${token}`;
        await transporter.sendMail({
            from: '"Shilpa LMS" <no-reply@shilpalms.com>',
            to: email,
            subject: 'Password Reset Request',
            html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><h2>Password Reset Request</h2><p>Hi <strong>${user.username}</strong>,</p><p>Click below to reset your password. Expires in <strong>1 hour</strong>.</p><div style="text-align:center;margin:30px 0;"><a href="${resetUrl}" style="background:#7c3aed;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;">Reset Password</a></div><p style="color:#666;font-size:12px;">Or copy: <a href="${resetUrl}">${resetUrl}</a></p></div>`
        });
        res.json({ success: true, message: "If this email exists, a reset link has been sent." });
    } catch (error) {
        console.error("Forgot password error:", error);
        res.status(500).json({ success: false, message: "Failed to send reset email." });
    }
};

exports.verifyResetToken = async (req, res) => {
    const { token } = req.params;
    try {
        const resets = await queryPromise("SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()", [token]);
        if (resets.length === 0) return res.json({ success: false, message: "Reset link is invalid or has expired." });
        res.json({ success: true, email: resets[0].email });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: "Token and password are required." });
    if (newPassword.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });
    try {
        const resets = await queryPromise("SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > NOW()", [token]);
        if (resets.length === 0) return res.json({ success: false, message: "Reset link is invalid or has expired." });
        const { email } = resets[0];
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await queryPromise("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);
        await queryPromise("UPDATE password_resets SET used = 1 WHERE token = ?", [token]);
        res.json({ success: true, message: "Password reset successfully! You can now log in." });
    } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};