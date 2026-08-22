import express from 'express';
import {
  createRefund,
  getMyRefunds,
  getRefund,
  getAllRefunds,
  approveRefund,
  rejectRefund,
  completeRefund,
  getRefundStats
} from '../controllers/refundController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// USER ROUTES (Protected)
// ============================================

/**
 * @route   POST /api/refunds
 * @desc    Create a refund request
 * @access  Private
 */
router.post('/', protect, createRefund);

/**
 * @route   GET /api/refunds/my-refunds
 * @desc    Get current user's refunds
 * @access  Private
 */
router.get('/my-refunds', protect, getMyRefunds);

/**
 * @route   GET /api/refunds/:id
 * @desc    Get a single refund by ID
 * @access  Private
 */
router.get('/:id', protect, getRefund);

// ============================================
// ADMIN ROUTES (Protected + Admin only)
// ============================================

/**
 * @route   GET /api/refunds
 * @desc    Get all refunds with filters
 * @access  Private (Admin)
 */
router.get('/', protect, authorize('admin'), getAllRefunds);

/**
 * @route   GET /api/refunds/stats
 * @desc    Get refund statistics
 * @access  Private (Admin)
 */
router.get('/stats', protect, authorize('admin'), getRefundStats);

/**
 * @route   PUT /api/refunds/:id/approve
 * @desc    Approve a refund request
 * @access  Private (Admin)
 */
router.put('/:id/approve', protect, authorize('admin'), approveRefund);

/**
 * @route   PUT /api/refunds/:id/reject
 * @desc    Reject a refund request
 * @access  Private (Admin)
 */
router.put('/:id/reject', protect, authorize('admin'), rejectRefund);

/**
 * @route   PUT /api/refunds/:id/complete
 * @desc    Mark a refund as completed
 * @access  Private (Admin)
 */
router.put('/:id/complete', protect, authorize('admin'), completeRefund);

export default router;