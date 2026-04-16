// server/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');
const { verifyJWT } = require('../middleware/authMiddleware');

// Protected route
router.get('/', verifyJWT, getAllUsers);

module.exports = router;