const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin } = require('../controllers/authController');

//  Pass actual functions to router
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);

module.exports = router;