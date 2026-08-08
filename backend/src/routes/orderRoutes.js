import express from 'express';
import {
  createOrder,
  getOrders,
  getMyOrders,
  getOrder,
  updateOrderStatus,
  addTrackingInfo,
  cancelOrder,
  getOrderTracking,
  getOrderStats,
  updatePaymentStatus,
  getDailyOrderStats,
  exportOrders
} from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ✅ USER ROUTES (ပထမဆုံးထားပါ)
// ============================================

router.post('/', protect, createOrder);
router.get('/my-orders', protect, getMyOrders);

// ============================================
// ✅ STATS ROUTES (/:id ရှေ့မှာထားပါ)
// ============================================

router.get('/stats', protect, authorize('admin'), getOrderStats);
router.get('/daily-stats', protect, authorize('admin'), getDailyOrderStats);
router.get('/export', protect, authorize('admin'), exportOrders);

// ============================================
// ✅ SINGLE ORDER ROUTES (နောက်ဆုံးထားပါ)
// ============================================

router.get('/:id/tracking', protect, getOrderTracking);
router.get('/:id', protect, getOrder);
router.put('/:id/cancel', protect, cancelOrder);

// ============================================
// ✅ ADMIN ROUTES
// ============================================

router.get('/', protect, authorize('admin'), getOrders);
router.put('/:id/status', protect, authorize('admin', 'seller'), updateOrderStatus);
router.post('/:id/tracking', protect, authorize('admin', 'seller'), addTrackingInfo);
router.put('/:id/payment', protect, authorize('admin'), updatePaymentStatus);

export default router;