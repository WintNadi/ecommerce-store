import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import { 
  sendOrderConfirmation, 
  sendOrderStatusUpdate, 
  sendOrderShipped, 
  sendOrderDelivered,
  sendNewOrderToSeller
} from '../utils/email.js';

// ============================================
// USER: CREATE ORDER
// ============================================

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    taxPrice = 0,
    shippingPrice = 0,
    totalPrice
  } = req.body;

  // Validate order items
  if (!orderItems || orderItems.length === 0) {
    throw new AppError('No order items', 400);
  }

  // Validate shipping address
  if (!shippingAddress || !shippingAddress.city) {
    throw new AppError('Please provide a shipping address', 400);
  }

  // Process order items and check stock
  const processedItems = [];
  let totalAmount = 0;

  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new AppError(`Product ${item.product} not found`, 404);
    }

    // Check stock
    if (product.stock < item.quantity) {
      throw new AppError(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400);
    }

    // Update stock
    product.stock -= item.quantity;
    await product.save({ validateBeforeSave: false });

    processedItems.push({
      product: product._id,
      name: product.name,
      price: item.price || product.price,
      quantity: item.quantity,
      image: product.images?.[0]?.url || ''
    });

    totalAmount += (item.price || product.price) * item.quantity;
  }

  // Get seller ID from first product
  const firstProduct = await Product.findById(orderItems[0].product).populate('seller');
  const sellerId = firstProduct?.seller?._id;

  // Create order
  const order = await Order.create({
    user: req.user._id,
    orderItems: processedItems,
    shippingAddress,
    paymentMethod,
    taxPrice,
    shippingPrice,
    totalPrice: totalPrice || totalAmount + taxPrice + shippingPrice,
    sellerId,
    status: 'pending',
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending'
  });

  // Populate order for response
  const populatedOrder = await Order.findById(order._id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'name price images');

  // ✅ Send email notifications (fire and forget - don't block)
  try {
    // Send confirmation to customer
    await sendOrderConfirmation(populatedOrder);
    
    // Send notification to seller (if applicable)
    if (sellerId) {
      const seller = await User.findById(sellerId);
      if (seller && seller.email) {
        await sendNewOrderToSeller(populatedOrder, seller);
      }
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    // Don't block the order creation
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: populatedOrder
  });
});

// ============================================
// USER: GET MY ORDERS
// ============================================

/**
 * @desc    Get current user's orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status = 'all' } = req.query;

  const filter = { user: req.user._id };
  if (status !== 'all') {
    filter.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(filter)
    .populate('orderItems.product', 'name price images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// USER: GET SINGLE ORDER
// ============================================

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name price images')
    .populate('sellerId', 'name email sellerProfile');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user is authorized (owner, seller, or admin)
  const isOwner = order.user._id.toString() === req.user._id.toString();
  const isSeller = order.sellerId && order.sellerId._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isSeller && !isAdmin) {
    throw new AppError('Not authorized to view this order', 403);
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// ============================================
// ADMIN/SELLER: GET ALL ORDERS
// ============================================

/**
 * @desc    Get all orders (Admin/Seller)
 * @route   GET /api/orders
 * @access  Private (Admin/Seller)
 */
export const getAllOrders = asyncHandler(async (req, res) => {
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

  // Sellers can only see their own orders
  if (req.user.role === 'seller') {
    filter.sellerId = req.user._id;
  }

  if (status !== 'all') {
    filter.status = status;
  }

  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'user.name': { $regex: search, $options: 'i' } },
      { 'user.email': { $regex: search, $options: 'i' } }
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

  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name price images')
    .populate('sellerId', 'name email sellerProfile')
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(filter);

  // Get order status stats
  const statusStats = await Order.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const stats = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
  statusStats.forEach(stat => {
    if (stats[stat._id] !== undefined) {
      stats[stat._id] = stat.count;
    }
  });

  // Get total revenue
  const revenue = await Order.aggregate([
    { $match: { ...filter, status: { $in: ['delivered', 'shipped'] } } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);

  res.status(200).json({
    success: true,
    data: orders,
    stats: {
      ...stats,
      totalOrders: await Order.countDocuments(filter),
      totalRevenue: revenue[0]?.total || 0
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
// ADMIN: UPDATE ORDER STATUS
// ============================================

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin/Seller)
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber, notes } = req.body;

  const order = await Order.findById(id)
    .populate('user', 'name email');

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if seller owns this order
  if (req.user.role === 'seller') {
    const isSeller = order.sellerId && order.sellerId.toString() === req.user._id.toString();
    if (!isSeller) {
      throw new AppError('You are not authorized to update this order', 403);
    }
  }

  // Store old status for email
  const oldStatus = order.status;

  // Validate status transition
  const validTransitions = {
    'pending': ['processing', 'cancelled'],
    'processing': ['confirmed', 'cancelled'],
    'confirmed': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': [],  // Terminal state - no further transitions
    'cancelled': []   // Terminal state - no further transitions
  };

  if (!validTransitions[oldStatus].includes(status)) {
    throw new AppError(
      `Cannot transition from ${oldStatus} to ${status}. ` +
      `Valid transitions: ${validTransitions[oldStatus].join(', ')}`,
      400
    );
  }

  // Update status
  order.status = status;
  order.updatedAt = new Date();

  // Add tracking number if provided
  if (trackingNumber) {
    order.trackingNumber = trackingNumber;
  }

  // Add to status history
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: status,
    updatedBy: req.user._id,
    note: notes || `Status changed to ${status}`,
    updatedAt: new Date()
  });

  // Set special timestamps
  if (status === 'shipped') {
    order.shippedAt = new Date();
  }
  if (status === 'delivered') {
    order.deliveredAt = new Date();
  }
  if (status === 'cancelled') {
    order.cancelledAt = new Date();
    // Restore stock if order is cancelled
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save({ validateBeforeSave: false });
      }
    }
  }

  await order.save();

  // ✅ Send email notifications (fire and forget)
  try {
    await sendOrderStatusUpdate(order, oldStatus, status);
    
    if (status === 'shipped') {
      await sendOrderShipped(order);
    }
    if (status === 'delivered') {
      await sendOrderDelivered(order);
    }
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    data: order
  });
});

// ============================================
// ADMIN: UPDATE PAYMENT STATUS
// ============================================

/**
 * @desc    Update payment status
 * @route   PUT /api/orders/:id/payment
 * @access  Private (Admin)
 */
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, paymentId } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  order.paymentStatus = paymentStatus;
  if (paymentId) {
    order.paymentId = paymentId;
  }
  if (paymentStatus === 'paid') {
    order.paidAt = new Date();
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: `Payment status updated to ${paymentStatus}`,
    data: order
  });
});

// ============================================
// ADMIN: DELETE ORDER
// ============================================

/**
 * @desc    Delete an order (Admin only)
 * @route   DELETE /api/orders/:id
 * @access  Private (Admin)
 */
export const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Restore stock if order is not delivered
  if (order.status !== 'delivered' && order.status !== 'cancelled') {
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.stock += item.quantity;
        await product.save({ validateBeforeSave: false });
      }
    }
  }

  await order.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Order deleted successfully'
  });
});

// ============================================
// GET ORDER STATS
// ============================================

/**
 * @desc    Get order statistics
 * @route   GET /api/orders/stats
 * @access  Private (Admin/Seller)
 */
export const getOrderStats = asyncHandler(async (req, res) => {
  const filter = {};

  // Sellers can only see their own orders
  if (req.user.role === 'seller') {
    filter.sellerId = req.user._id;
  }

  const stats = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalPrice' }
      }
    }
  ]);

  const result = {
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    totalRevenue: 0,
    totalOrders: 0
  };

  stats.forEach(stat => {
    const statusKey = `${stat._id}Orders`;
    if (statusKey in result) {
      result[statusKey] = stat.count;
    }
    if (stat._id === 'delivered' || stat._id === 'shipped') {
      result.totalRevenue += stat.totalAmount;
    }
    result.totalOrders += stat.count;
  });

  res.status(200).json({
    success: true,
    data: result
  });
});

// ============================================
// GET DAILY ORDER STATS
// ============================================

/**
 * @desc    Get daily order statistics
 * @route   GET /api/orders/daily-stats
 * @access  Private (Admin)
 */
export const getDailyOrderStats = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const stats = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $in: ['delivered', 'shipped'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);

  res.status(200).json({
    success: true,
    data: stats
  });
});

// ============================================
// CANCEL ORDER (USER)
// ============================================

/**
 * @desc    Cancel an order (User)
 * @route   PUT /api/orders/:id/cancel
 * @access  Private
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to cancel this order', 403);
  }

  // Only pending or processing orders can be cancelled by user
  if (order.status !== 'pending' && order.status !== 'processing') {
    throw new AppError('This order cannot be cancelled at this stage', 400);
  }

  // Store old status for email
  const oldStatus = order.status;

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: 'cancelled',
    updatedBy: req.user._id,
    note: reason || 'Cancelled by customer',
    updatedAt: new Date()
  });

  // Restore stock
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      await product.save({ validateBeforeSave: false });
    }
  }

  await order.save();

  // ✅ Send email notification
  try {
    await sendOrderStatusUpdate(order, oldStatus, 'cancelled');
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// ============================================
// GET SELLER ORDERS
// ============================================

/**
 * @desc    Get orders for a specific seller
 * @route   GET /api/orders/seller/:sellerId
 * @access  Private (Admin/Seller)
 */
export const getSellerOrders = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const { page = 1, limit = 20, status = 'all' } = req.query;

  // Check authorization
  if (req.user.role !== 'admin' && req.user._id.toString() !== sellerId) {
    throw new AppError('Not authorized to view these orders', 403);
  }

  const filter = { sellerId };
  if (status !== 'all') {
    filter.status = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(filter)
    .populate('user', 'name email phone')
    .populate('orderItems.product', 'name price images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// EXPORT
// ============================================

export default {
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats,
  getDailyOrderStats,
  cancelOrder,
  getSellerOrders
};