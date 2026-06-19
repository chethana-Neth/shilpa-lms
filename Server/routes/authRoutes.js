const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

//  Pass actual functions to router
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;