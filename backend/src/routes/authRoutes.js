import express from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification
} from '../controllers/auth/authController.js';
import { protect } from '../middleware/auth.js';
import { loginLimiter, authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes
router.post('/register', authLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh-token', refreshToken);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', authLimiter, resetPassword);
router.post('/resend-verification', authLimiter, resendVerification);

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
