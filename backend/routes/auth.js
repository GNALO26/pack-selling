// routes/auth.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Rate limit strict sur auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
});

router.post('/register',             authLimiter, ctrl.register);
router.get( '/verify-email',                      ctrl.verifyEmail);
router.post('/login',                authLimiter, ctrl.login);
router.get( '/me',                   protect,     ctrl.getMe);
router.post('/forgot-password',      authLimiter, ctrl.forgotPassword);
router.post('/reset-password',       authLimiter, ctrl.resetPassword);
router.post('/resend-verification',  authLimiter, ctrl.resendVerification);

module.exports = router;
