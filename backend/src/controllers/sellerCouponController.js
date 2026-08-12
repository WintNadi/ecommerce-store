import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================
// SELLER: CREATE PRODUCT COUPON
// ============================================

/**
 * @desc    Create a product-specific coupon (Seller only)
 * @route   POST /api/seller/coupons/product/:productId
 * @access  Private (Seller)
 */
export const createProductCoupon = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const {
    code,
    discountType,
    discountValue,
    maxUses,
    validUntil
  } = req.body;

  // ✅ Validate product ownership
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to create coupons for this product', 403);
  }

  // ✅ Check if coupon code already exists on this product
  const existingCoupon = product.productCoupons.find(
    c => c.code === code.toUpperCase()
  );
  if (existingCoupon) {
    throw new AppError('Coupon code already exists for this product', 400);
  }

  // ✅ Validate discount
  if (discountType === 'percentage' && discountValue > 100) {
    throw new AppError('Percentage discount cannot exceed 100%', 400);
  }

  // ✅ Add product coupon
  product.productCoupons.push({
    code: code.toUpperCase(),
    discountType,
    discountValue,
    maxUses: maxUses || 1,
    usedCount: 0,
    validUntil: validUntil || null,
    isActive: true
  });

  await product.save();

  res.status(201).json({
    success: true,
    message: 'Product coupon created successfully',
    data: product
  });
});

// ============================================
// SELLER: GET PRODUCT COUPONS
// ============================================

/**
 * @desc    Get all coupons for a seller's products
 * @route   GET /api/seller/coupons
 * @access  Private (Seller)
 */
export const getSellerCoupons = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  // ✅ Find all products for this seller
  const filter = { seller: req.user._id };
  
  const products = await Product.find(filter)
    .select('name price images productCoupons');

  // ✅ Extract all coupons with product info
  let coupons = [];
  for (const product of products) {
    if (product.productCoupons && product.productCoupons.length > 0) {
      for (const coupon of product.productCoupons) {
        coupons.push({
          productId: product._id,
          productName: product.name,
          productImage: product.images?.[0] || '',
          productPrice: product.price,
          ...coupon.toObject()
        });
      }
    }
  }

  // ✅ Filter by search
  if (search) {
    coupons = coupons.filter(c => 
      c.code.includes(search.toUpperCase()) ||
      c.productName.toLowerCase().includes(search.toLowerCase())
    );
  }

  // ✅ Pagination
  const total = coupons.length;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedCoupons = coupons.slice(skip, skip + parseInt(limit));

  res.status(200).json({
    success: true,
    data: paginatedCoupons,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// SELLER: UPDATE PRODUCT COUPON
// ============================================

/**
 * @desc    Update a product-specific coupon
 * @route   PUT /api/seller/coupons/product/:productId/:couponCode
 * @access  Private (Seller)
 */
export const updateProductCoupon = asyncHandler(async (req, res) => {
  const { productId, couponCode } = req.params;
  const {
    discountType,
    discountValue,
    maxUses,
    validUntil,
    isActive
  } = req.body;

  // ✅ Validate product ownership
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to update coupons for this product', 403);
  }

  // ✅ Find coupon
  const couponIndex = product.productCoupons.findIndex(
    c => c.code === couponCode.toUpperCase()
  );
  if (couponIndex === -1) {
    throw new AppError('Coupon not found', 404);
  }

  // ✅ Update coupon
  const coupon = product.productCoupons[couponIndex];
  
  if (discountType) coupon.discountType = discountType;
  if (discountValue !== undefined) coupon.discountValue = discountValue;
  if (maxUses) coupon.maxUses = maxUses;
  if (validUntil !== undefined) coupon.validUntil = validUntil;
  if (isActive !== undefined) coupon.isActive = isActive;

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product coupon updated successfully',
    data: product
  });
});

// ============================================
// SELLER: DELETE PRODUCT COUPON
// ============================================

/**
 * @desc    Delete a product-specific coupon
 * @route   DELETE /api/seller/coupons/product/:productId/:couponCode
 * @access  Private (Seller)
 */
export const deleteProductCoupon = asyncHandler(async (req, res) => {
  const { productId, couponCode } = req.params;

  // ✅ Validate product ownership
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to delete coupons for this product', 403);
  }

  // ✅ Remove coupon
  product.productCoupons = product.productCoupons.filter(
    c => c.code !== couponCode.toUpperCase()
  );

  await product.save();

  res.status(200).json({
    success: true,
    message: 'Product coupon deleted successfully',
    data: product
  });
});

// ============================================
// SELLER: TOGGLE PRODUCT COUPON
// ============================================

/**
 * @desc    Toggle product coupon active status
 * @route   PATCH /api/seller/coupons/product/:productId/:couponCode/toggle
 * @access  Private (Seller)
 */
export const toggleProductCoupon = asyncHandler(async (req, res) => {
  const { productId, couponCode } = req.params;

  // ✅ Validate product ownership
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to update coupons for this product', 403);
  }

  // ✅ Find coupon
  const coupon = product.productCoupons.find(
    c => c.code === couponCode.toUpperCase()
  );
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  coupon.isActive = !coupon.isActive;
  await product.save();

  res.status(200).json({
    success: true,
    message: `Product coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
    data: product
  });
});

// ============================================
// SELLER: GET PRODUCT COUPON USAGE
// ============================================

/**
 * @desc    Get usage statistics for a product coupon
 * @route   GET /api/seller/coupons/product/:productId/:couponCode/usage
 * @access  Private (Seller)
 */
export const getProductCouponUsage = asyncHandler(async (req, res) => {
  const { productId, couponCode } = req.params;

  // ✅ Validate product ownership
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (product.seller.toString() !== req.user._id.toString()) {
    throw new AppError('You are not authorized to view coupons for this product', 403);
  }

  // ✅ Find coupon
  const coupon = product.productCoupons.find(
    c => c.code === couponCode.toUpperCase()
  );
  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      code: coupon.code,
      productId: product._id,
      productName: product.name,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses,
      usedCount: coupon.usedCount,
      remainingUses: Math.max(0, coupon.maxUses - coupon.usedCount),
      validUntil: coupon.validUntil,
      isActive: coupon.isActive,
      isExpired: coupon.validUntil && new Date(coupon.validUntil) < new Date()
    }
  });
});