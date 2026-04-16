// server/controllers/authController.js
const User = require('../models/userModel'); // Import Model
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const registerUser = async (req, res) => {
  try {
    const { username, email, password, confirmPassword, role } = req.body;

    // ... (Keep your existing validation logic here) ...
    if (password !== confirmPassword) return res.status(400).json({ Error: "Passwords match fail" });

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1️⃣ Use Model to create user
    User.create(username, email, hashedPassword, (err, result) => {
      if (err) return res.status(500).json({ Error: "User creation failed" });

      const userId = result.insertId;

      // 2️⃣ Use Model to assign role
      User.assignRole(userId, role, (err) => {
        if (err) return res.status(500).json({ Error: "Role assignment failed" });
        return res.status(201).json({ Status: "Success" });
      });
    });
  } catch (err) {
    return res.status(500).json({ Error: err.message });
  }
};

const loginUser = (req, res) => {
  const { email, password } = req.body;

  // Use Model to find user
  User.findByEmail(email, async (err, data) => {
    if (err) return res.status(500).json({ Error: "Server error" });
    if (data.length === 0) return res.status(404).json({ Login: false, Message: "User not found" });

    const user = data[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ Login: false, Message: "Wrong password" });

    const token = jwt.sign(
      { id: user.id, role: user.role_name },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.json({
      Login: true,
      token,
      user: { username: user.username, email: user.email, role: user.role_name }
    });
  });
};

module.exports = { registerUser, loginUser };