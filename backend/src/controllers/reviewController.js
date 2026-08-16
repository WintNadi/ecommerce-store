import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================
// CREATE REVIEW
// ============================================

/**
 * @desc    Create a new review for a product
 * @route   POST /api/reviews
 * @access  Private
 */
export const createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title, comment } = req.body;

  // Validate input
  if (!productId) {
    throw new AppError('Product ID is required', 400);
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new AppError('Please provide a valid rating between 1 and 5', 400);
  }

  if (!comment || comment.length < 10) {
    throw new AppError('Comment must be at least 10 characters', 400);
  }

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if user already reviewed this product
  const existingReview = await Review.findOne({
    user: req.user._id,
    product: productId
  });

  if (existingReview) {
    throw new AppError('You have already reviewed this product', 400);
  }

  // Check if user purchased this product (verified purchase)
  const hasPurchased = await Order.findOne({
    user: req.user._id,
    'orderItems.product': productId,
    status: 'delivered'
  });

  // Create review
  const review = await Review.create({
    user: req.user._id,
    product: productId,
    order: hasPurchased ? hasPurchased._id : undefined,
    rating,
    title: title || '',
    comment,
    isVerifiedPurchase: !!hasPurchased,
    isApproved: req.user.role === 'admin' || !!hasPurchased,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent']
  });

  // Update product rating
  await updateProductRating(productId);

  res.status(201).json({
    success: true,
    message: 'Review created successfully',
    data: review
  });
});

// ============================================
// GET PRODUCT REVIEWS
// ============================================

/**
 * @desc    Get all reviews for a product
 * @route   GET /api/reviews/product/:productId
 * @access  Public
 */
export const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { page = 1, limit = 10, sort = '-createdAt', minRating = 0 } = req.query;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const reviews = await Review.getProductReviews(productId, {
    limit: parseInt(limit),
    page: parseInt(page),
    sort,
    minRating: parseInt(minRating)
  });

  const total = await Review.countDocuments({
    product: productId,
    isApproved: true,
    rating: { $gte: parseInt(minRating) }
  });

  // Get rating statistics
  const ratingStats = await Review.getProductRatingStats(productId);

  res.status(200).json({
    success: true,
    data: {
      reviews,
      stats: ratingStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

// ============================================
// GET USER REVIEWS
// ============================================

/**
 * @desc    Get current user's reviews
 * @route   GET /api/reviews/my-reviews
 * @access  Private
 */
export const getMyReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const reviews = await Review.getUserReviews(req.user._id, {
    limit: parseInt(limit),
    page: parseInt(page)
  });

  const total = await Review.countDocuments({ user: req.user._id });

  res.status(200).json({
    success: true,
    data: reviews,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// GET SINGLE REVIEW
// ============================================

/**
 * @desc    Get single review by ID
 * @route   GET /api/reviews/:id
 * @access  Public
 */
export const getReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id)
    .populate('user', 'name profileImage')
    .populate('product', 'name slug images')
    .populate('adminResponse.respondedBy', 'name');

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Check if review is approved or user is owner/admin
  if (!review.isApproved && 
      req.user?.role !== 'admin' && 
      review.user._id.toString() !== req.user?._id?.toString()) {
    throw new AppError('Review not available', 404);
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// ============================================
// UPDATE REVIEW
// ============================================

/**
 * @desc    Update review
 * @route   PUT /api/reviews/:id
 * @access  Private (Owner only)
 */
export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, title, comment } = req.body;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Check if user is the owner
  if (review.user.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to update this review', 403);
  }

  // Update fields
  if (rating) review.rating = rating;
  if (title !== undefined) review.title = title;
  if (comment) review.comment = comment;

  // If rating changed, reset approval status (need admin approval again)
  if (rating && rating !== review.rating) {
    review.isApproved = false;
    review.status = 'pending';
  }

  await review.save();

  // Update product rating
  await updateProductRating(review.product);

  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    data: review
  });
});

// ============================================
// DELETE REVIEW
// ============================================

/**
 * @desc    Delete review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Owner or Admin)
 */
export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  // Check if user is owner or admin
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You are not authorized to delete this review', 403);
  }

  await review.deleteOne();

  // Update product rating
  await updateProductRating(review.product);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// ============================================
// MARK REVIEW AS HELPFUL
// ============================================

/**
 * @desc    Mark review as helpful
 * @route   POST /api/reviews/:id/helpful
 * @access  Private
 */
export const markHelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  await review.markAsHelpful(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Review marked as helpful',
    data: {
      helpfulCount: review.helpfulCount
    }
  });
});

// ============================================
// UNMARK REVIEW AS HELPFUL
// ============================================

/**
 * @desc    Unmark review as helpful
 * @route   POST /api/reviews/:id/unhelpful
 * @access  Private
 */
export const markUnhelpful = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  await review.markAsUnhelpful(req.user._id);

  res.status(200).json({
    success: true,
    message: 'Review marked as unhelpful',
    data: {
      helpfulCount: review.helpfulCount
    }
  });
});

// ============================================
// ADMIN: GET ALL REVIEWS
// ============================================

/**
 * @desc    Get all reviews with filters (Admin only)
 * @route   GET /api/reviews
 * @access  Private (Admin)
 */
export const getAllReviews = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    status,
    rating,
    productId,
    userId,
    isVerified
  } = req.query;

  // Build filter
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (rating) {
    filter.rating = parseInt(rating);
  }

  if (productId) {
    filter.product = productId;
  }

  if (userId) {
    filter.user = userId;
  }

  if (isVerified === 'true') {
    filter.isVerifiedPurchase = true;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build sort
  let sortQuery = {};
  if (sort.startsWith('-')) {
    sortQuery[sort.substring(1)] = -1;
  } else {
    sortQuery[sort] = 1;
  }

  const reviews = await Review.find(filter)
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name email profileImage')
    .populate('product', 'name slug images')
    .populate('adminResponse.respondedBy', 'name email');

  const total = await Review.countDocuments(filter);

  // Get statistics
  const stats = await Review.getStats();

  res.status(200).json({
    success: true,
    data: reviews,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// ADMIN: APPROVE REVIEW
// ============================================

/**
 * @desc    Approve review (Admin only)
 * @route   PUT /api/reviews/:id/approve
 * @access  Private (Admin)
 */
export const approveReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  await review.approve();

  // Update product rating
  await updateProductRating(review.product);

  res.status(200).json({
    success: true,
    message: 'Review approved successfully',
    data: review
  });
});

// ============================================
// ADMIN: REJECT REVIEW
// ============================================

/**
 * @desc    Reject review (Admin only)
 * @route   PUT /api/reviews/:id/reject
 * @access  Private (Admin)
 */
export const rejectReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  await review.reject(reason);

  // Update product rating
  await updateProductRating(review.product);

  res.status(200).json({
    success: true,
    message: 'Review rejected successfully',
    data: review
  });
});

// ============================================
// ADMIN: ADD ADMIN RESPONSE
// ============================================

/**
 * @desc    Add admin response to review (Admin only)
 * @route   POST /api/reviews/:id/response
 * @access  Private (Admin)
 */
export const addAdminResponse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  if (!comment || comment.length < 5) {
    throw new AppError('Response must be at least 5 characters', 400);
  }

  const review = await Review.findById(id);

  if (!review) {
    throw new AppError('Review not found', 404);
  }

  await review.addAdminResponse(comment, req.user._id);

  res.status(200).json({
    success: true,
    message: 'Admin response added successfully',
    data: review
  });
});

// ============================================
// GET REVIEW STATISTICS
// ============================================

/**
 * @desc    Get review statistics
 * @route   GET /api/reviews/stats
 * @access  Private (Admin)
 */
export const getReviewStats = asyncHandler(async (req, res) => {
  const stats = await Review.getStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

// ============================================
// HELPER FUNCTION
// ============================================

/**
 * Update product rating after review changes
 */
const updateProductRating = async (productId) => {
  const stats = await Review.getProductRatingStats(productId);

  const product = await Product.findById(productId);
  if (product) {
    product.rating = stats.averageRating;
    product.numReviews = stats.totalReviews;
    await product.save({ validateBeforeSave: false });
  }
};