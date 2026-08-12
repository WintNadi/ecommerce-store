import express from 'express';
import {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  getCouponStats,
  toggleCouponStatus
} from '../controllers/couponController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ✅ ALL COUPON ROUTES ARE ADMIN ONLY
// ============================================

// ============================================
// POST /api/coupons
// ============================================
/**
 * @route   POST /api/coupons
 * @desc    Create a new coupon (Admin only)
 * @access  Private (Admin)
 */
router.post('/', protect, authorize('admin'), createCoupon);

// ============================================
// GET /api/coupons
// ============================================
/**
 * @route   GET /api/coupons
 * @desc    Get all coupons with filters (Admin only)
 * @access  Private (Admin)
 */
router.get('/', protect, authorize('admin'), getCoupons);

// ============================================
// GET /api/coupons/stats
// ============================================
/**
 * @route   GET /api/coupons/stats
 * @desc    Get coupon statistics (Admin only)
 * @access  Private (Admin)
 */
router.get('/stats', protect, authorize('admin'), getCouponStats);

// ============================================
// GET /api/coupons/validate/:code
// ============================================
/**
 * @route   GET /api/coupons/validate/:code
 * @desc    Validate a coupon code (Public)
 * @access  Public
 */
router.get('/validate/:code', validateCoupon);

// ============================================
// GET /api/coupons/:id
// ============================================
/**
 * @route   GET /api/coupons/:id
 * @desc    Get single coupon by ID (Admin only)
 * @access  Private (Admin)
 */
router.get('/:id', protect, authorize('admin'), getCouponById);

// ============================================
// PUT /api/coupons/:id
// ============================================
/**
 * @route   PUT /api/coupons/:id
 * @desc    Update coupon (Admin only)
 * @access  Private (Admin)
 */
router.put('/:id', protect, authorize('admin'), updateCoupon);

// ============================================
// DELETE /api/coupons/:id
// ============================================
/**
 * @route   DELETE /api/coupons/:id
 * @desc    Delete coupon (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', protect, authorize('admin'), deleteCoupon);

// ============================================
// PATCH /api/coupons/:id/toggle
// ============================================
/**
 * @route   PATCH /api/coupons/:id/toggle
 * @desc    Toggle coupon active status (Admin only)
 * @access  Private (Admin)
 */
router.patch('/:id/toggle', protect, authorize('admin'), toggleCouponStatus);

export default router;