// server/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = "your_secret_key_123";

const verifyJWT = (req, res, next) => {
    const token = req.headers["x-access-token"];
    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ auth: false, message: "Failed to authenticate token" });
        req.userId = decoded.id;
        req.userRole = decoded.role;
        next();
    });
};

// Middleware to check if user is Admin
const isAdmin = (req, res, next) => {
    if (req.userRole !== 'Admin') {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
};

module.exports = { verifyJWT, isAdmin, JWT_SECRET };