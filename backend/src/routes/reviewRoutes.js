import express from 'express';
import {
  createReview,
  getProductReviews,
  getMyReviews,
  getReview,
  updateReview,
  deleteReview,
  markHelpful,
  markUnhelpful,
  getAllReviews,
  approveReview,
  rejectReview,
  addAdminResponse,
  getReviewStats
} from '../controllers/reviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

router.get('/product/:productId', getProductReviews);
router.get('/:id', getReview);

// ============================================
// USER ROUTES (Protected)
// ============================================

router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);
router.post('/:id/helpful', protect, markHelpful);
router.post('/:id/unhelpful', protect, markUnhelpful);

// ============================================
// ADMIN ROUTES (Protected + Admin only)
// ============================================

router.get('/', protect, authorize('admin'), getAllReviews);
router.get('/stats', protect, authorize('admin'), getReviewStats);
router.put('/:id/approve', protect, authorize('admin'), approveReview);
router.put('/:id/reject', protect, authorize('admin'), rejectReview);
router.post('/:id/response', protect, authorize('admin'), addAdminResponse);

export default router;