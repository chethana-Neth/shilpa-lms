// server/controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const GOOGLE_CLIENT_ID = "664650359556-2vkr9sbcnpt7943faqagh2fbldvk7gov.apps.googleusercontent.com";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const registerUser = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role } = req.body;

    if (password !== confirmPassword)
      return res.status(400).json({ Error: "Passwords do not match" });

    // Validate role
    if (!['Student', 'educator'].includes(role)) {
      return res.status(400).json({ Error: "Invalid role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Set status: 'pending' for educators, 'approved' for students
    const status = role === 'educator' ? 'pending' : 'approved';

    // Create user with status
    User.create(username, email, hashedPassword, status, (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ Error: "User creation failed" });
      }

      const userId = result.insertId;

      User.assignRole(userId, role, (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ Error: "Role assignment failed" });
        }
        // Return status so frontend knows to show pending message
        return res.status(201).json({ Status: "Success", status });
      });
    });
  } catch (err) {
    return res.status(500).json({ Error: err.message });
  }
};

//Login User 
const loginUser = (req, res) => {
  const { email, password } = req.body;

  User.findByEmail(email, async (err, data) => {
    if (err) return res.status(500).json({ Error: "Server error" });
    if (data.length === 0)
      return res.status(404).json({ Login: false, Message: "User not found" });

    const user = data[0];

    // Check account status
    if (user.status === 'pending') {
      return res.status(403).json({ Login: false, Message: "Your account is pending admin approval. Please wait." });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ Login: false, Message: "Your registration was rejected. Contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ Login: false, Message: "Wrong password" });

    const token = jwt.sign(
      { id: user.id, role: user.role_name },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      Login: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role_name,
        status: user.status
      }
    });
  });
};

// Google Sign-In / Sign-Up
const googleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ Login: false, Message: "No Google token provided" });
  }

  try {
    // Verify the token actually came from Google and matches our app
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const username = payload.name || email.split('@')[0];

    User.findByEmail(email, async (err, data) => {
      if (err) return res.status(500).json({ Login: false, Message: "Server error" });

      // EXISTING USER — log them in
      if (data.length > 0) {
        const user = data[0];

        if (user.status === 'pending') {
          return res.status(403).json({ Login: false, Message: "Your account is pending admin approval. Please wait." });
        }
        if (user.status === 'rejected') {
          return res.status(403).json({ Login: false, Message: "Your registration was rejected. Contact support." });
        }

        const jwtToken = jwt.sign(
          { id: user.id, role: user.role_name },
          JWT_SECRET,
          { expiresIn: '2h' }
        );

        return res.json({
          Login: true,
          token: jwtToken,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role_name,
            status: user.status
          }
        });
      }

      // NEW USER — create account with default role 'Student'
      const randomPassword = crypto.randomBytes(20).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      User.createGoogleUser(username, email, hashedPassword, (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ Login: false, Message: "Account creation failed" });
        }

        const userId = result.insertId;

        User.assignRole(userId, 'Student', (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ Login: false, Message: "Role assignment failed" });
          }

          const jwtToken = jwt.sign(
            { id: userId, role: 'Student' },
            JWT_SECRET,
            { expiresIn: '2h' }
          );

          return res.json({
            Login: true,
            token: jwtToken,
            user: {
              id: userId,
              username,
              email,
              role: 'Student',
              status: 'approved'
            }
          });
        });
      });
    });
  } catch (err) {
    console.error("Google Login Error:", err);
    return res.status(401).json({ Login: false, Message: "Invalid Google token" });
  }
};

module.exports = { registerUser, loginUser, googleLogin };