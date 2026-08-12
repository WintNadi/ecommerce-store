import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon,
  applyProductCoupon,
  updateShippingMethod,
  getCartSummary,
  getCartTotal
} from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ============================================
// ✅ ALL CART ROUTES ARE PROTECTED
// ============================================

// ============================================
// GET /api/cart
// ============================================
/**
 * @route   GET /api/cart
 * @desc    Get current user's cart
 * @access  Private
 */
router.get('/', protect, getCart);

// ============================================
// GET /api/cart/summary
// ============================================
/**
 * @route   GET /api/cart/summary
 * @desc    Get cart summary for checkout
 * @access  Private
 */
router.get('/summary', protect, getCartSummary);

// ============================================
// GET /api/cart/total
// ============================================
/**
 * @route   GET /api/cart/total
 * @desc    Get cart total for checkout
 * @access  Private
 */
router.get('/total', protect, getCartTotal);

// ============================================
// POST /api/cart
// ============================================
/**
 * @route   POST /api/cart
 * @desc    Add item to cart
 * @access  Private
 */
router.post('/', protect, addToCart);

// ============================================
// PUT /api/cart/:productId
// ============================================
/**
 * @route   PUT /api/cart/:productId
 * @desc    Update cart item quantity
 * @access  Private
 */
router.put('/:productId', protect, updateCartItem);

// ============================================
// DELETE /api/cart/:productId
// ============================================
/**
 * @route   DELETE /api/cart/:productId
 * @desc    Remove item from cart
 * @access  Private
 */
router.delete('/:productId', protect, removeFromCart);

// ============================================
// DELETE /api/cart
// ============================================
/**
 * @route   DELETE /api/cart
 * @desc    Clear all items from cart
 * @access  Private
 */
router.delete('/', protect, clearCart);

// ============================================
// COUPON ROUTES
// ============================================

// ============================================
// POST /api/cart/apply-coupon
// ============================================
/**
 * @route   POST /api/cart/apply-coupon
 * @desc    Apply coupon to cart
 * @access  Private
 */
router.post('/apply-coupon', protect, applyCoupon);

// ============================================
// DELETE /api/cart/remove-coupon
// ============================================
/**
 * @route   DELETE /api/cart/remove-coupon
 * @desc    Remove coupon from cart
 * @access  Private
 */
router.delete('/remove-coupon', protect, removeCoupon);

// ============================================
// POST /api/cart/apply-product-coupon
// ============================================
/**
 * @route   POST /api/cart/apply-product-coupon
 * @desc    Apply product-specific coupon to cart
 * @access  Private
 */
router.post('/apply-product-coupon', protect, applyProductCoupon);

// ============================================
// SHIPPING ROUTES
// ============================================

// ============================================
// PUT /api/cart/shipping
// ============================================
/**
 * @route   PUT /api/cart/shipping
 * @desc    Update shipping method
 * @access  Private
 */
router.put('/shipping', protect, updateShippingMethod);

// ============================================
// ✅ TEST ROUTE (Optional - for debugging)
// ============================================
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Cart routes are working!',
    endpoints: [
      'GET /api/cart',
      'GET /api/cart/summary',
      'GET /api/cart/total',
      'POST /api/cart',
      'PUT /api/cart/:productId',
      'DELETE /api/cart/:productId',
      'DELETE /api/cart',
      'POST /api/cart/apply-coupon',
      'DELETE /api/cart/remove-coupon',
      'POST /api/cart/apply-product-coupon',
      'PUT /api/cart/shipping'
    ]
  });
});

export default router;