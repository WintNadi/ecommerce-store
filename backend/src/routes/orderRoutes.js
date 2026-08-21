import express from 'express';
import {
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
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// USER ROUTES (Protected)
// ============================================

/**
 * @route   POST /api/orders
 * @desc    Create a new order
 * @access  Private
 */
router.post('/', protect, createOrder);

/**
 * @route   GET /api/orders/my-orders
 * @desc    Get current user's orders
 * @access  Private
 */
router.get('/my-orders', protect, getMyOrders);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order by ID
 * @access  Private
 */
router.get('/:id', protect, getOrder);

/**
 * @route   PUT /api/orders/:id/cancel
 * @desc    Cancel an order (User)
 * @access  Private
 */
router.put('/:id/cancel', protect, cancelOrder);

// ============================================
// ADMIN/SELLER ROUTES (Protected)
// ============================================

/**
 * @route   GET /api/orders
 * @desc    Get all orders with filters (Admin/Seller)
 * @access  Private (Admin/Seller)
 */
router.get('/', protect, getAllOrders);

/**
 * @route   GET /api/orders/seller/:sellerId
 * @desc    Get orders for a specific seller
 * @access  Private (Admin/Seller)
 */
router.get('/seller/:sellerId', protect, getSellerOrders);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics
 * @access  Private (Admin/Seller)
 */
router.get('/stats', protect, getOrderStats);

/**
 * @route   GET /api/orders/daily-stats
 * @desc    Get daily order statistics
 * @access  Private (Admin)
 */
router.get('/daily-stats', protect, authorize('admin'), getDailyOrderStats);

/**
 * @route   PUT /api/orders/:id/status
 * @desc    Update order status
 * @access  Private (Admin/Seller)
 */
router.put('/:id/status', protect, updateOrderStatus);

/**
 * @route   PUT /api/orders/:id/payment
 * @desc    Update payment status
 * @access  Private (Admin)
 */
router.put('/:id/payment', protect, authorize('admin'), updatePaymentStatus);

/**
 * @route   DELETE /api/orders/:id
 * @desc    Delete an order (Admin only)
 * @access  Private (Admin)
 */
router.delete('/:id', protect, authorize('admin'), deleteOrder);

export default router;