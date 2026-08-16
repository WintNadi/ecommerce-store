// backend/src/routes/reviewRoutes.js

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
// PUBLIC ROUTES (No authentication required)
// ============================================

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get all approved reviews for a specific product with pagination and stats
 * @access  Public
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10)
 * @query   {string} sort - Sort field (default: -createdAt)
 * @query   {number} minRating - Filter by minimum rating (default: 0)
 */
router.get('/product/:productId', getProductReviews);

/**
 * @route   GET /api/reviews/:id
 * @desc    Get a single review by its ID
 * @access  Public (only approved reviews or owner/admin)
 */
router.get('/:id', getReview);

// ============================================
// USER ROUTES (Requires authentication)
// ============================================

/**
 * @route   POST /api/reviews/
 * @desc    Create a new review for a product
 * @access  Private (User)
 * @body    {string} productId - Product ID to review
 * @body    {number} rating - Rating from 1-5
 * @body    {string} title - Review title (optional)
 * @body    {string} comment - Review comment (min 10 characters)
 * @logic   - Checks if user already reviewed product
 *           - Checks if user purchased product (verified purchase)
 *           - Auto-approves if admin or verified purchase
 */
router.post('/', protect, createReview);

/**
 * @route   GET /api/reviews/my-reviews
 * @desc    Get all reviews written by the authenticated user
 * @access  Private (User)
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 10)
 */
router.get('/my-reviews', protect, getMyReviews);

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a review you wrote
 * @access  Private (Owner only)
 * @body    {number} rating - New rating (optional)
 * @body    {string} title - New title (optional)
 * @body    {string} comment - New comment (optional)
 * @logic   - Resets approval status if rating changes
 */
router.put('/:id', protect, updateReview);

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a review (owner or admin)
 * @access  Private (Owner or Admin)
 */
router.delete('/:id', protect, deleteReview);

/**
 * @route   POST /api/reviews/:id/helpful
 * @desc    Mark a review as helpful
 * @access  Private (User)
 * @logic   - Prevents duplicate votes from same user
 */
router.post('/:id/helpful', protect, markHelpful);

/**
 * @route   POST /api/reviews/:id/unhelpful
 * @desc    Mark a review as unhelpful (remove helpful vote)
 * @access  Private (User)
 * @logic   - Removes user's helpful vote if exists
 */
router.post('/:id/unhelpful', protect, markUnhelpful);

// ============================================
// ADMIN ROUTES (Requires authentication + Admin role)
// ============================================

/**
 * @route   GET /api/reviews/
 * @desc    Get all reviews with advanced filtering (Admin only)
 * @access  Private (Admin only)
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 * @query   {string} sort - Sort field (default: -createdAt)
 * @query   {string} status - Filter by status (pending, approved, rejected)
 * @query   {number} rating - Filter by exact rating
 * @query   {string} productId - Filter by product
 * @query   {string} userId - Filter by user
 * @query   {boolean} isVerified - Filter verified purchases only
 */
router.get('/', protect, authorize('admin'), getAllReviews);

/**
 * @route   GET /api/reviews/stats
 * @desc    Get overall review statistics (Admin only)
 * @access  Private (Admin only)
 * @returns {object} - Total reviews, average rating, status breakdown, etc.
 */
router.get('/stats', protect, authorize('admin'), getReviewStats);

/**
 * @route   PUT /api/reviews/:id/approve
 * @desc    Approve a pending review (makes it visible)
 * @access  Private (Admin only)
 * @logic   - Updates review status to 'approved'
 *           - Recalculates product rating
 */
router.put('/:id/approve', protect, authorize('admin'), approveReview);

/**
 * @route   PUT /api/reviews/:id/reject
 * @desc    Reject a pending review (keeps it hidden)
 * @access  Private (Admin only)
 * @body    {string} reason - Reason for rejection (optional)
 * @logic   - Updates review status to 'rejected'
 *           - Recalculates product rating
 */
router.put('/:id/reject', protect, authorize('admin'), rejectReview);

/**
 * @route   POST /api/reviews/:id/response
 * @desc    Add an admin response to a review
 * @access  Private (Admin only)
 * @body    {string} comment - Response text (min 5 characters)
 * @logic   - Creates admin response with timestamp
 *           - Updates review with response data
 */
router.post('/:id/response', protect, authorize('admin'), addAdminResponse);

export default router;