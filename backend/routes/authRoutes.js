const express = require('express');
const { register, login, getProfile, verifyEmail, resendVerification } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Register with photo uploads
router.post('/register', upload.fields([
    { name: 'nationalIdPhoto', maxCount: 1 },
    { name: 'selfiePhoto', maxCount: 1 }
]), register);

router.post('/login', login);
router.get('/profile', protect, getProfile);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

module.exports = router;
