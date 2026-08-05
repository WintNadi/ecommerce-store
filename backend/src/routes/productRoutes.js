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
// PUBLIC ROUTES
// ============================================

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/top-selling', getTopSellingProducts);
router.get('/:id', getProduct);
router.get('/:id/reviews', getProductReviews);

// ============================================
// PROTECTED ROUTES
// ============================================

// Product Reviews (User)
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
router.get('/stats', protect, authorize('admin', 'seller'), getProductStats);

export default router;