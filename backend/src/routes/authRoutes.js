import express from 'express';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  addAddress,
  updateAddress,
  deleteAddress,
  addToWishlist,
  removeFromWishlist,
  getWishlist
} from '../controllers/auth/authController.js';
import { protect } from '../middleware/auth.js';
import { loginLimiter, authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// Register & Login
router.post('/register', authLimiter, register);
router.post('/login', loginLimiter, login);

// Email Verification
router.get('/verify-email/:token', verifyEmail);

// Password Reset
router.post('/forgot-password', authLimiter, forgotPassword);
router.put('/reset-password/:token', authLimiter, resetPassword);

// ============================================
// PROTECTED ROUTES (Requires Authentication)
// ============================================

// Profile
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// Password
router.put('/change-password', protect, changePassword);

// Logout
router.post('/logout', protect, logout);

// Address Management
router.post('/address', protect, addAddress);
router.put('/address/:addressId', protect, updateAddress);
router.delete('/address/:addressId', protect, deleteAddress);

// Wishlist
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:productId', protect, addToWishlist);
router.delete('/wishlist/:productId', protect, removeFromWishlist);

export default router;