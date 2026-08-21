import Refund from '../models/Refund.js';
import Order from '../models/Order.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================
// USER: CREATE REFUND REQUEST
// ============================================

/**
 * @desc    Create a refund request
 * @route   POST /api/refunds
 * @access  Private
 */
export const createRefund = asyncHandler(async (req, res) => {
  const { orderId, reason, description, items, totalAmount } = req.body;

  // Validate order
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to request refund for this order', 403);
  }

  // Check if refund already exists
  const existingRefund = await Refund.findOne({ order: orderId });
  if (existingRefund) {
    throw new AppError('A refund request already exists for this order', 400);
  }

  // Check if order is delivered (only delivered orders can be refunded)
  if (order.status !== 'delivered') {
    throw new AppError('Only delivered orders can be refunded', 400);
  }

  // Create refund
  const refund = await Refund.create({
    order: orderId,
    user: req.user._id,
    items: items || order.orderItems.map(item => ({
      product: item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      reason: reason
    })),
    totalAmount: totalAmount || order.totalPrice,
    reason,
    description,
    paymentMethod: order.paymentMethod,
    statusHistory: [{
      status: 'pending',
      updatedBy: req.user._id,
      note: 'Refund request submitted'
    }]
  });

  res.status(201).json({
    success: true,
    message: 'Refund request submitted successfully',
    data: refund
  });
});

// ============================================
// USER: GET MY REFUNDS
// ============================================

/**
 * @desc    Get current user's refunds
 * @route   GET /api/refunds/my-refunds
 * @access  Private
 */
export const getMyRefunds = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = 'all' } = req.query;

  const filter = { user: req.user._id };
  if (status !== 'all') {
    filter.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const refunds = await Refund.find(filter)
    .populate('order', 'orderNumber createdAt totalPrice')
    .populate('items.product', 'name images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Refund.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: refunds,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// USER: GET SINGLE REFUND
// ============================================

/**
 * @desc    Get a single refund by ID
 * @route   GET /api/refunds/:id
 * @access  Private
 */
export const getRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const refund = await Refund.findById(id)
    .populate('order', 'orderNumber createdAt totalPrice shippingAddress')
    .populate('user', 'name email')
    .populate('items.product', 'name images')
    .populate('approvedBy', 'name email');

  if (!refund) {
    throw new AppError('Refund not found', 404);
  }

  // Check if user is owner or admin
  if (refund.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('You are not authorized to view this refund', 403);
  }

  res.status(200).json({
    success: true,
    data: refund
  });
});

// ============================================
// ADMIN: GET ALL REFUNDS
// ============================================

/**
 * @desc    Get all refunds with filters (Admin only)
 * @route   GET /api/refunds
 * @access  Private (Admin)
 */
export const getAllRefunds = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status = 'all',
    search = '',
    sort = '-createdAt',
    fromDate,
    toDate
  } = req.query;

  // Build filter
  const filter = {};
  if (status !== 'all') filter.status = status;
  if (search) {
    filter.$or = [
      { 'order.orderNumber': { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }
  if (fromDate || toDate) {
    filter.createdAt = {};
    if (fromDate) filter.createdAt.$gte = new Date(fromDate);
    if (toDate) filter.createdAt.$lte = new Date(toDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build sort
  const sortQuery = {};
  if (sort.startsWith('-')) {
    sortQuery[sort.substring(1)] = -1;
  } else {
    sortQuery[sort] = 1;
  }

  const refunds = await Refund.find(filter)
    .populate('order', 'orderNumber createdAt totalPrice')
    .populate('user', 'name email')
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Refund.countDocuments(filter);

  // Get stats
  const stats = await Refund.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const statusStats = { pending: 0, approved: 0, rejected: 0, completed: 0 };
  stats.forEach(stat => {
    if (statusStats[stat._id] !== undefined) {
      statusStats[stat._id] = stat.count;
    }
  });

  const totalAmount = await Refund.aggregate([
    { $match: { status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  res.status(200).json({
    success: true,
    data: refunds,
    stats: {
      ...statusStats,
      totalRefunds: await Refund.countDocuments(),
      totalRefundAmount: totalAmount[0]?.total || 0
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// ADMIN: APPROVE REFUND
// ============================================

/**
 * @desc    Approve a refund request (Admin only)
 * @route   PUT /api/refunds/:id/approve
 * @access  Private (Admin)
 */
export const approveRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { adminNotes, paymentRefundId } = req.body;

  const refund = await Refund.findById(id);
  if (!refund) {
    throw new AppError('Refund not found', 404);
  }

  if (refund.status !== 'pending') {
    throw new AppError('Refund request is not pending', 400);
  }

  refund.status = 'approved';
  refund.approvedBy = req.user._id;
  refund.approvedAt = new Date();
  refund.adminNotes = adminNotes || refund.adminNotes;
  refund.paymentRefundId = paymentRefundId;

  // Update order status
  await Order.findByIdAndUpdate(refund.order, {
    status: 'refunded',
    refundedAt: new Date()
  });

  await refund.save();

  res.status(200).json({
    success: true,
    message: 'Refund approved successfully',
    data: refund
  });
});

// ============================================
// ADMIN: REJECT REFUND
// ============================================

/**
 * @desc    Reject a refund request (Admin only)
 * @route   PUT /api/refunds/:id/reject
 * @access  Private (Admin)
 */
export const rejectRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason, adminNotes } = req.body;

  const refund = await Refund.findById(id);
  if (!refund) {
    throw new AppError('Refund not found', 404);
  }

  if (refund.status !== 'pending') {
    throw new AppError('Refund request is not pending', 400);
  }

  refund.status = 'rejected';
  refund.rejectionReason = rejectionReason || 'Request rejected';
  refund.adminNotes = adminNotes || refund.adminNotes;
  refund.resolvedAt = new Date();

  await refund.save();

  res.status(200).json({
    success: true,
    message: 'Refund rejected',
    data: refund
  });
});

// ============================================
// ADMIN: COMPLETE REFUND
// ============================================

/**
 * @desc    Mark a refund as completed (Admin only)
 * @route   PUT /api/refunds/:id/complete
 * @access  Private (Admin)
 */
export const completeRefund = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolutionNote } = req.body;

  const refund = await Refund.findById(id);
  if (!refund) {
    throw new AppError('Refund not found', 404);
  }

  if (refund.status !== 'approved') {
    throw new AppError('Only approved refunds can be marked as completed', 400);
  }

  refund.status = 'completed';
  refund.completedAt = new Date();
  refund.resolutionNote = resolutionNote || 'Refund completed';
  refund.isResolved = true;

  await refund.save();

  res.status(200).json({
    success: true,
    message: 'Refund completed successfully',
    data: refund
  });
});

// ============================================
// GET REFUND STATS
// ============================================

/**
 * @desc    Get refund statistics (Admin only)
 * @route   GET /api/refunds/stats
 * @access  Private (Admin)
 */
export const getRefundStats = asyncHandler(async (req, res) => {
  const stats = await Refund.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$totalAmount' } } }
  ]);

  const result = { pending: 0, approved: 0, rejected: 0, completed: 0 };
  stats.forEach(stat => {
    result[stat._id] = {
      count: stat.count,
      amount: stat.total
    };
  });

  const totalRefunds = await Refund.countDocuments();
  const totalAmount = await Refund.aggregate([
    { $match: { status: { $in: ['approved', 'completed'] } } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalRefunds,
      totalRefundAmount: totalAmount[0]?.total || 0,
      byStatus: result
    }
  });
});