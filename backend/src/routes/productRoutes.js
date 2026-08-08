import express from 'express';
import {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
  getProductReviews,
  updateStock,
  bulkCreateProducts,
  getProductStats,
  getFeaturedProducts,
  getTopSellingProducts,
  searchProducts
} from '../controllers/productController.js';
import { protect, authorize } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ============================================
// ✅ PUBLIC ROUTES (ပထမဆုံးထားပါ)
// ============================================

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/top-selling', getTopSellingProducts);
router.get('/stats', protect, authorize('admin', 'seller'), getProductStats); // ✅ /stats ကို /:id ရှေ့မှာထားပါ
router.get('/:id', getProduct); // ✅ /:id ကို နောက်ဆုံးထားပါ
router.get('/:id/reviews', getProductReviews);

// ============================================
// PROTECTED ROUTES
// ============================================

router.post('/:id/reviews', protect, addProductReview);

// ============================================
// ADMIN/SELLER ROUTES
// ============================================

router.post('/', protect, authorize('admin', 'seller'), createProduct);
router.put('/:id', protect, authorize('admin', 'seller'), updateProduct);
router.delete('/:id', protect, authorize('admin', 'seller'), deleteProduct);
router.patch('/:id/stock', protect, authorize('admin', 'seller'), updateStock);

// Admin only
router.post('/bulk', protect, authorize('admin'), bulkCreateProducts);

export default router;