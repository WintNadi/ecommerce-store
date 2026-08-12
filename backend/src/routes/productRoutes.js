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
import {
  uploadProductImage,
  uploadMultipleProductImages,
  deleteProductImage,
  deleteAllProductImages,
  getProductImages,
  setPrimaryImage,
  reorderImages
} from '../controllers/productImageController.js';
import { protect, authorize } from '../middleware/auth.js';
import { generalLimiter } from '../middleware/rateLimiter.js';
import { uploadSingle, uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

// ============================================
// ✅ PUBLIC ROUTES
// ============================================

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/featured', getFeaturedProducts);
router.get('/top-selling', getTopSellingProducts);
router.get('/stats', protect, authorize('admin', 'seller'), getProductStats);
router.get('/:id', getProduct);
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

// ============================================
// 📸 IMAGE UPLOAD ROUTES (Admin/Seller only)
// ============================================

// ✅ Get all images for a product
router.get(
  '/:id/images',
  protect,
  authorize('admin', 'seller'),
  getProductImages
);

// ✅ Upload single image
router.post(
  '/:id/upload-image',
  protect,
  authorize('admin', 'seller'),
  uploadSingle,
  uploadProductImage
);

// ✅ Upload multiple images
router.post(
  '/:id/upload-images',
  protect,
  authorize('admin', 'seller'),
  uploadMultiple,
  uploadMultipleProductImages
);

// ✅ Delete single image by index
router.delete(
  '/:id/images/:imageIndex',
  protect,
  authorize('admin', 'seller'),
  deleteProductImage
);

// ✅ Delete all images
router.delete(
  '/:id/images',
  protect,
  authorize('admin', 'seller'),
  deleteAllProductImages
);

// ✅ Set primary image
router.put(
  '/:id/images/:imageIndex/primary',
  protect,
  authorize('admin', 'seller'),
  setPrimaryImage
);

// ✅ Reorder images
router.put(
  '/:id/images/reorder',
  protect,
  authorize('admin', 'seller'),
  reorderImages
);

export default router;