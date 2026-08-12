import Product from '../models/Product.js';
import { uploadToSupabase, deleteFromSupabase } from '../middleware/upload.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================
// UPLOAD SINGLE PRODUCT IMAGE
// ============================================

/**
 * @desc    Upload a single product image
 * @route   POST /api/products/:id/upload-image
 * @access  Private (Admin/Seller)
 */
export const uploadProductImage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ✅ Validate product ID
  if (!id || id === 'temp' || id === 'undefined') {
    throw new AppError('Invalid product ID. Please save the product first.', 400);
  }

  // Find product
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check authorization
  if (req.user.role !== 'admin' && product.seller?.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to upload images for this product', 403);
  }

  // Check if file exists
  if (!req.file) {
    throw new AppError('No image file uploaded', 400);
  }

  // Upload to Supabase
  const result = await uploadToSupabase(req.file, 'products/');
  const imageUrl = result.url;

  // Update product
  if (!product.images) {
    product.images = [];
  }
  product.images.push(imageUrl);
  
  // If no primary image set, set this as primary
  if (!product.image) {
    product.image = imageUrl;
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Image uploaded successfully',
    data: {
      imageUrl,
      product,
    },
  });
});

// ============================================
// UPLOAD MULTIPLE PRODUCT IMAGES
// ============================================

/**
 * @desc    Upload multiple product images
 * @route   POST /api/products/:id/upload-images
 * @access  Private (Admin/Seller)
 */
export const uploadMultipleProductImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ✅ Validate product ID
  if (!id || id === 'temp' || id === 'undefined') {
    throw new AppError('Invalid product ID. Please save the product first.', 400);
  }

  // Find product
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check authorization
  if (req.user.role !== 'admin' && product.seller?.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to upload images for this product', 403);
  }

  // Check if files exist
  if (!req.files || req.files.length === 0) {
    throw new AppError('No image files uploaded', 400);
  }

  const imageUrls = [];

  // Upload each file to Supabase
  for (const file of req.files) {
    const result = await uploadToSupabase(file, 'products/');
    imageUrls.push(result.url);
  }

  // Initialize images array if needed
  if (!product.images) {
    product.images = [];
  }

  product.images.push(...imageUrls);
  
  // If no primary image set, set first as primary
  if (!product.image && imageUrls.length > 0) {
    product.image = imageUrls[0];
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: `${imageUrls.length} images uploaded successfully`,
    data: {
      imageUrls,
      product,
    },
  });
});

// ============================================
// DELETE PRODUCT IMAGE
// ============================================

/**
 * @desc    Delete a product image
 * @route   DELETE /api/products/:id/images/:imageIndex
 * @access  Private (Admin/Seller)
 */
export const deleteProductImage = asyncHandler(async (req, res) => {
  const { id, imageIndex } = req.params;

  // ✅ Validate product ID
  if (!id || id === 'temp' || id === 'undefined') {
    throw new AppError('Invalid product ID', 400);
  }

  // Find product
  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check authorization
  if (req.user.role !== 'admin' && product.seller?.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to delete images for this product', 403);
  }

  // Check if images exist
  if (!product.images || product.images.length === 0) {
    throw new AppError('No images to delete', 404);
  }

  // Validate index
  const index = parseInt(imageIndex);
  if (isNaN(index) || index < 0 || index >= product.images.length) {
    throw new AppError('Invalid image index', 400);
  }

  const imageUrl = product.images[index];
  
  // Extract file path from URL
  const filePath = imageUrl.split('/public/').pop();
  
  if (filePath) {
    await deleteFromSupabase(filePath);
  }

  // Remove from product
  product.images.splice(index, 1);
  
  // If deleted image was primary, set new primary
  if (product.image === imageUrl && product.images.length > 0) {
    product.image = product.images[0];
  } else if (product.image === imageUrl && product.images.length === 0) {
    product.image = '';
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Image deleted successfully',
    data: product,
  });
});

// ============================================
// DELETE ALL PRODUCT IMAGES
// ============================================

/**
 * @desc    Delete all product images
 * @route   DELETE /api/products/:id/images
 * @access  Private (Admin/Seller)
 */
export const deleteAllProductImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ✅ Validate product ID
  if (!id || id === 'temp' || id === 'undefined') {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (req.user.role !== 'admin' && product.seller?.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to delete images for this product', 403);
  }

  if (!product.images || product.images.length === 0) {
    throw new AppError('No images to delete', 404);
  }

  // Delete all images from Supabase
  for (const imageUrl of product.images) {
    try {
      const filePath = imageUrl.split('/public/').pop();
      if (filePath) {
        await deleteFromSupabase(filePath);
      }
    } catch (error) {
      console.error('Delete error:', error);
      // Continue with next image
    }
  }

  product.images = [];
  product.image = '';
  await product.save();

  res.status(200).json({
    success: true,
    message: 'All images deleted successfully',
    data: product,
  });
});

// ============================================
// ✅ NEW: GET PRODUCT IMAGES
// ============================================

/**
 * @desc    Get all images for a product
 * @route   GET /api/products/:id/images
 * @access  Private (Admin/Seller)
 */
export const getProductImages = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // ✅ Validate product ID
  if (!id || id === 'temp' || id === 'undefined') {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check authorization (allow product owner or admin)
  if (req.user.role !== 'admin' && product.seller?.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to view images for this product', 403);
  }

  res.status(200).json({
    success: true,
    data: {
      images: product.images || [],
      primaryImage: product.image || null,
      count: product.images?.length || 0,
    },
  });
});

// ============================================
// ✅ NEW: SET PRIMARY IMAGE
// ============================================

/**
 * @desc    Set a specific image as the primary image
 * @route   PUT /api/products/:id/images/:imageIndex/primary
 * @access  Private (Admin/Seller)
 */
export const setPrimaryImage = asyncHandler(async (req, res) => {
  const { id, imageIndex } = req.params;

  // ✅ Validate product ID
  if (!id || id === 'temp' || id === 'undefined') {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (req.user.role !== 'admin' && product.seller?.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to set primary image for this product', 403);
  }

  if (!product.images || product.images.length === 0) {
    throw new AppError('No images to set as primary', 404);
  }

  const index = parseInt(imageIndex);
  if (isNaN(index) || index < 0 || index >= product.images.length) {
    throw new AppError('Invalid image index', 400);
  }

  product.image = product.images[index];
  await product.save();

  res.status(200).json({
    success: true,
    message: 'Primary image set successfully',
    data: {
      primaryImage: product.image,
      product,
    },
  });
});

// ============================================
// ✅ NEW: REORDER IMAGES
// ============================================

/**
 * @desc    Reorder product images
 * @route   PUT /api/products/:id/images/reorder
 * @access  Private (Admin/Seller)
 */
export const reorderImages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { imageOrder } = req.body;

  // ✅ Validate product ID
  if (!id || id === 'temp' || id === 'undefined') {
    throw new AppError('Invalid product ID', 400);
  }

  if (!imageOrder || !Array.isArray(imageOrder) || imageOrder.length === 0) {
    throw new AppError('Invalid image order', 400);
  }

  const product = await Product.findById(id);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (req.user.role !== 'admin' && product.seller?.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to reorder images for this product', 403);
  }

  // Validate all image IDs exist
  const allImages = product.images || [];
  const validOrder = imageOrder.every((url) => allImages.includes(url));
  
  if (!validOrder || imageOrder.length !== allImages.length) {
    throw new AppError('Invalid image order - some images are missing or extra', 400);
  }

  product.images = imageOrder;
  
  // Update primary image if needed
  if (product.image && !imageOrder.includes(product.image)) {
    product.image = imageOrder[0] || '';
  }

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Images reordered successfully',
    data: {
      images: product.images,
      primaryImage: product.image,
    },
  });
});