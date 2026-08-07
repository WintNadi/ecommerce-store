import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';

// ============================================
// CREATE ORDER
// ============================================

/**
 * @desc    Create a new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = asyncHandler(async (req, res) => {
  const {
    shippingAddress,
    paymentMethod,
    shippingMethod,
    notes,
    couponCode
  } = req.body;

  // Get user's cart
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty. Please add items to your cart.', 400);
  }

  // Check stock availability
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new AppError(`Product "${item.name}" not found`, 404);
    }
    if (product.stock < item.quantity) {
      throw new AppError(`Not enough stock for "${item.name}". Available: ${product.stock}`, 400);
    }
  }

  // Calculate totals
  const subtotal = cart.subtotal;
  const taxPrice = cart.taxAmount || 0;
  const shippingPrice = cart.shippingAmount || 0;
  const discountAmount = cart.discountAmount || 0;
  const couponDiscount = cart.couponDiscount || 0;
  const totalPrice = subtotal + taxPrice + shippingPrice - discountAmount - couponDiscount;

  // Create order items
  const orderItems = cart.items.map(item => ({
    product: item.product,
    name: item.name,
    slug: item.slug,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    variation: item.variation,
    totalPrice: item.price * item.quantity
  }));

  // Create order
  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress: {
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country || 'Myanmar',
      phone: shippingAddress.phone || req.user.phone
    },
    shippingMethod: shippingMethod || 'standard',
    shippingPrice,
    paymentMethod,
    subtotal,
    taxPrice,
    discountAmount,
    couponCode: couponCode || cart.couponCode,
    couponDiscount,
    totalPrice,
    status: 'pending',
    paymentStatus: 'pending',
    timeline: [
      {
        status: 'created',
        note: 'Order created successfully',
        date: new Date()
      }
    ]
  });

  // Reduce product stock
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    await product.reduceStock(item.quantity);
  }

  // Clear cart
  await cart.clearCart();

  // Populate order details
  await order.populate('user', 'name email');

  // Emit socket event for real-time tracking
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${req.user._id}`).emit('order_created', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status
    });
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: order
  });
});

// ============================================
// GET ALL ORDERS (Admin)
// ============================================

/**
 * @desc    Get all orders with filters
 * @route   GET /api/orders
 * @access  Private (Admin only)
 */
export const getOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    status,
    paymentStatus,
    startDate,
    endDate,
    search
  } = req.query;

  // Build filter
  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (paymentStatus) {
    filter.paymentStatus = paymentStatus;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (search) {
    filter.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { 'shippingAddress.phone': { $regex: search, $options: 'i' } }
    ];
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

  const orders = await Order.find(filter)
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('user', 'name email')
    .populate({
      path: 'orderItems.product',
      select: 'name slug price images',
      options: { lean: true }
    })
    .lean();

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
// GET USER ORDERS
// ============================================

/**
 * @desc    Get current user's orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;

  const query = { user: req.user._id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate({
      path: 'orderItems.product',
      select: 'name slug price images',
      options: { lean: true }
    })
    .lean();

  const total = await Order.countDocuments(query);

  // Format orders for frontend
  const formattedOrders = orders.map(order => ({
    ...order,
    orderItems: order.orderItems.map(item => ({
      ...item,
      product: item.product || null
    }))
  }));

  res.status(200).json({
    success: true,
    data: formattedOrders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// GET SINGLE ORDER
// ============================================

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .populate('user', 'name email phone')
    .populate({
      path: 'orderItems.product',
      select: 'name slug price images',
      options: { lean: true }
    })
    .populate('cancelledBy', 'name email')
    .lean();

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user is authorized to view this order
  if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to view this order', 403);
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// ============================================
// UPDATE ORDER STATUS
// ============================================

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private (Admin/Seller)
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Update status
  await order.updateStatus(status, note);

  // Update timeline
  order.timeline.push({
    status,
    note: note || `Order status updated to ${status}`,
    date: new Date()
  });

  // If status is cancelled, restore stock
  if (status === 'cancelled' && order.status !== 'cancelled') {
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        await product.increaseStock(item.quantity);
      }
    }
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;
  }

  // If status is delivered
  if (status === 'delivered') {
    order.isDelivered = true;
    order.deliveredAt = new Date();
  }

  await order.save();

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${order.user}`).emit('order_status_updated', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      status: order.status
    });
    io.to(`order_${order._id}`).emit('order_tracking_update', {
      orderId: order._id,
      status: order.status,
      timestamp: new Date()
    });
  }

  res.status(200).json({
    success: true,
    message: `Order status updated to ${status}`,
    data: order
  });
});

// ============================================
// ADD TRACKING INFORMATION
// ============================================

/**
 * @desc    Add tracking information to order
 * @route   POST /api/orders/:id/tracking
 * @access  Private (Admin/Seller)
 */
export const addTrackingInfo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { trackingNumber, trackingProvider, trackingUrl, status, location, description } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Update tracking info
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (trackingProvider) order.trackingProvider = trackingProvider;
  if (trackingUrl) order.trackingUrl = trackingUrl;

  // Add tracking history
  if (status) {
    await order.addTrackingUpdate(status, location, description);
  }

  await order.save();

  // Emit socket event for real-time tracking
  const io = req.app.get('io');
  if (io) {
    io.to(`order_${order._id}`).emit('tracking_updated', {
      orderId: order._id,
      tracking: order.trackingHistory,
      lastUpdate: order.trackingLastUpdate
    });
  }

  res.status(200).json({
    success: true,
    message: 'Tracking information added successfully',
    data: order
  });
});

// ============================================
// CANCEL ORDER
// ============================================

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private (User/Admin)
 */
export const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check if user can cancel
  if (req.user.role === 'user' && order.user.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to cancel this order', 403);
  }

  if (!order.canCancel()) {
    throw new AppError(`Cannot cancel order in "${order.status}" status`, 400);
  }

  // Update status
  order.status = 'cancelled';
  order.cancellationReason = reason || 'Customer requested cancellation';
  order.cancelledAt = new Date();
  order.cancelledBy = req.user._id;

  // Restore stock
  for (const item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      await product.increaseStock(item.quantity);
    }
  }

  // Update timeline
  order.timeline.push({
    status: 'cancelled',
    note: reason || 'Order cancelled by customer',
    date: new Date()
  });

  await order.save();

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.to(`user_${order.user}`).emit('order_cancelled', {
      orderId: order._id,
      orderNumber: order.orderNumber
    });
  }

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: order
  });
});

// ============================================
// GET ORDER TRACKING
// ============================================

/**
 * @desc    Get order tracking information
 * @route   GET /api/orders/:id/tracking
 * @access  Private
 */
export const getOrderTracking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id)
    .select(
      'orderNumber status trackingNumber trackingProvider trackingUrl trackingHistory trackingLastUpdate shippingAddress estimatedDelivery'
    )
    .lean();

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Check authorization
  if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to view this order tracking', 403);
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

// ============================================
// GET ORDER STATISTICS
// ============================================

/**
 * @desc    Get order statistics
 * @route   GET /api/orders/stats
 * @access  Private (Admin)
 */
export const getOrderStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stats = await Order.getStats({
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined
  });

  res.status(200).json({
    success: true,
    data: stats
  });
});

// ============================================
// UPDATE PAYMENT STATUS
// ============================================

/**
 * @desc    Update order payment status
 * @route   PUT /api/orders/:id/payment
 * @access  Private (Admin)
 */
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, paymentResult } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  order.paymentStatus = paymentStatus;

  if (paymentStatus === 'paid') {
    order.paidAt = new Date();
    if (paymentResult) {
      order.paymentResult = paymentResult;
    }
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: `Payment status updated to ${paymentStatus}`,
    data: order
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

  const stats = await Order.getDailyStats(parseInt(days));

  res.status(200).json({
    success: true,
    data: stats
  });
});

// ============================================
// EXPORT ORDERS (CSV)
// ============================================

/**
 * @desc    Export orders to CSV
 * @route   GET /api/orders/export
 * @access  Private (Admin)
 */
export const exportOrders = asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .lean();

  if (orders.length === 0) {
    throw new AppError('No orders found to export', 404);
  }

  // Format data for CSV
  const csvData = orders.map(order => ({
    'Order Number': order.orderNumber,
    'Customer Name': order.user?.name || 'Guest',
    'Customer Email': order.user?.email || '',
    'Total Items': order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    'Subtotal': order.subtotal,
    'Shipping': order.shippingPrice,
    'Tax': order.taxPrice,
    'Discount': order.discountAmount + order.couponDiscount,
    'Total': order.totalPrice,
    'Status': order.status,
    'Payment Status': order.paymentStatus,
    'Payment Method': order.paymentMethod,
    'Shipping Address': `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state}, ${order.shippingAddress.zipCode}`,
    'Created At': order.createdAt.toISOString().split('T')[0],
    'Order Date': order.createdAt.toLocaleDateString()
  }));

  // Set response headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=orders_${new Date().toISOString().split('T')[0]}.csv`);

  // Write CSV
  const headers = Object.keys(csvData[0]);
  const csv = [
    headers.join(','),
    ...csvData.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n');

  res.status(200).send(csv);
});