const express = require('express');
const router = express.Router();
const passwordController = require('../controllers/passwordController');

// The server checks if that email exists
router.post('/forgot-password', passwordController.forgotPassword);

// If token is valid,  proceed to the reset password page.
router.get('/verify-token/:token', passwordController.verifyResetToken);


router.post('/reset-password', passwordController.resetPassword);

// Called when the user submits their new password.
module.exports = router;