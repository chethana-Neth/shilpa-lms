// server/controllers/userController.js
const User = require('../models/userModel');

const getAllUsers = (req, res) => {
    User.getAll((err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ Error: "Failed to fetch users" });
        }
        return res.json(data);
    });
};

module.exports = { getAllUsers };