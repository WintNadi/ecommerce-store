import express from 'express';
import {
  createOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
  getOrderTracking,
  getOrders,
  updateOrderStatus,
  addTrackingInfo,
  getOrderStats,
  getDailyOrderStats,
  exportOrders
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// USER ROUTES (Protected)
// ============================================

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);  // ← ဒါပါရမယ်
router.get('/:id/tracking', protect, getOrderTracking);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

// ============================================
// ADMIN ROUTES
// ============================================

router.get('/', protect, authorize('admin'), getOrders);
router.get('/stats', protect, authorize('admin'), getOrderStats);
router.get('/daily-stats', protect, authorize('admin'), getDailyOrderStats);
router.get('/export', protect, authorize('admin'), exportOrders);
router.put('/:id/status', protect, authorize('admin', 'seller'), updateOrderStatus);
router.post('/:id/tracking', protect, authorize('admin', 'seller'), addTrackingInfo);

export default router;