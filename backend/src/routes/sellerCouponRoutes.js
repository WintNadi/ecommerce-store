import express from 'express';
import {
  createProductCoupon,
  getSellerCoupons,
  updateProductCoupon,
  deleteProductCoupon,
  toggleProductCoupon,
  getProductCouponUsage
} from '../controllers/sellerCouponController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// ✅ ALL ROUTES ARE PROTECTED (SELLER ONLY)
// ============================================

// ✅ Get all coupons for seller's products
router.get('/', protect, authorize('seller', 'admin'), getSellerCoupons);

// ✅ Create product coupon
router.post('/product/:productId', protect, authorize('seller', 'admin'), createProductCoupon);

// ✅ Update product coupon
router.put('/product/:productId/:couponCode', protect, authorize('seller', 'admin'), updateProductCoupon);

// ✅ Delete product coupon
router.delete('/product/:productId/:couponCode', protect, authorize('seller', 'admin'), deleteProductCoupon);

// ✅ Toggle product coupon status
router.patch('/product/:productId/:couponCode/toggle', protect, authorize('seller', 'admin'), toggleProductCoupon);

// ✅ Get product coupon usage
router.get('/product/:productId/:couponCode/usage', protect, authorize('seller', 'admin'), getProductCouponUsage);

export default router;