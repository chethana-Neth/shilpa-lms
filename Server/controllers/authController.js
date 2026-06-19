// server/controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET } = require('../middleware/authMiddleware');

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

module.exports = { registerUser, loginUser };