import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  getCartSummary,
  getAbandonedCarts,
  getCartStats,
  mergeGuestCart,
  bulkAddToCart
} from '../controllers/cartController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// USER ROUTES (Protected)
// ============================================

router.get('/', protect, getCart);
router.get('/summary', protect, getCartSummary);
router.post('/', protect, addToCart);
router.post('/bulk', protect, bulkAddToCart);
router.post('/merge', protect, mergeGuestCart);
router.put('/:productId', protect, updateCartItem);
router.delete('/:productId', protect, removeFromCart);
router.delete('/', protect, clearCart);
router.post('/coupon', protect, applyCoupon);
router.delete('/coupon', protect, removeCoupon);

// ============================================
// ADMIN ROUTES
// ============================================

router.get('/abandoned', protect, authorize('admin'), getAbandonedCarts);
router.get('/stats', protect, authorize('admin'), getCartStats);

export default router;