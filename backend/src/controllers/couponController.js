import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================
// CREATE COUPON
// ============================================

/**
 * @desc    Create a new coupon (Admin only)
 * @route   POST /api/coupons
 * @access  Private (Admin)
 */
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    appliesTo,
    categoryIds,
    productIds,
    sellerIds,
    userIds,
    minOrderAmount,
    usageLimit,
    userUsageLimit,
    validFrom,
    validUntil,
    isActive
  } = req.body;

  // ✅ Check if coupon code already exists
  const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
  if (existingCoupon) {
    throw new AppError('Coupon code already exists', 400);
  }

  // ✅ Validate discount
  if (discountType === 'percentage' && discountValue > 100) {
    throw new AppError('Percentage discount cannot exceed 100%', 400);
  }

  // ✅ Validate dates
  if (validFrom && validUntil) {
    if (new Date(validFrom) >= new Date(validUntil)) {
      throw new AppError('Valid from date must be before valid until date', 400);
    }
  }

  // ✅ Validate appliesTo
  if (appliesTo === 'category' && (!categoryIds || categoryIds.length === 0)) {
    throw new AppError('Category IDs are required when appliesTo is category', 400);
  }

  if (appliesTo === 'product' && (!productIds || productIds.length === 0)) {
    throw new AppError('Product IDs are required when appliesTo is product', 400);
  }

  if (appliesTo === 'seller' && (!sellerIds || sellerIds.length === 0)) {
    throw new AppError('Seller IDs are required when appliesTo is seller', 400);
  }

  if (appliesTo === 'user' && (!userIds || userIds.length === 0)) {
    throw new AppError('User IDs are required when appliesTo is user', 400);
  }

  // ✅ Create coupon
  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    appliesTo: appliesTo || 'all',
    categoryIds: categoryIds || [],
    productIds: productIds || [],
    sellerIds: sellerIds || [],
    userIds: userIds || [],
    minOrderAmount: minOrderAmount || 0,
    usageLimit: usageLimit || 1,
    userUsageLimit: userUsageLimit || 1,
    validFrom: validFrom || new Date(),
    validUntil,
    isActive: isActive !== undefined ? isActive : true,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully',
    data: coupon
  });
});

// ============================================
// GET ALL COUPONS
// ============================================

/**
 * @desc    Get all coupons with filters (Admin only)
 * @route   GET /api/coupons
 * @access  Private (Admin)
 */
export const getCoupons = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    sort = '-createdAt',
    search,
    isActive,
    discountType,
    appliesTo
  } = req.query;

  // Build filter
  const filter = {};

  if (search) {
    filter.$or = [
      { code: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  if (discountType) {
    filter.discountType = discountType;
  }

  if (appliesTo) {
    filter.appliesTo = appliesTo;
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build sort
  let sortQuery = {};
  if (sort.startsWith('-')) {
    sortQuery[sort.substring(1)] = -1;
  } else {
    sortQuery[sort] = 1;
  }

  const coupons = await Coupon.find(filter)
    .sort(sortQuery)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('createdBy', 'name email');

  const total = await Coupon.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: coupons,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

// ============================================
// GET SINGLE COUPON
// ============================================

/**
 * @desc    Get single coupon by ID (Admin only)
 * @route   GET /api/coupons/:id
 * @access  Private (Admin)
 */
export const getCouponById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id)
    .populate('createdBy', 'name email')
    .populate('categoryIds', 'name slug')
    .populate('productIds', 'name price images')
    .populate('sellerIds', 'name email')
    .populate('userIds', 'name email');

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  res.status(200).json({
    success: true,
    data: coupon
  });
});

// ============================================
// UPDATE COUPON
// ============================================

/**
 * @desc    Update coupon (Admin only)
 * @route   PUT /api/coupons/:id
 * @access  Private (Admin)
 */
export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    code,
    description,
    discountType,
    discountValue,
    maxDiscountAmount,
    appliesTo,
    categoryIds,
    productIds,
    sellerIds,
    userIds,
    minOrderAmount,
    usageLimit,
    userUsageLimit,
    validFrom,
    validUntil,
    isActive
  } = req.body;

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  // ✅ Check if coupon code already exists (if changing code)
  if (code && code.toUpperCase() !== coupon.code) {
    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      throw new AppError('Coupon code already exists', 400);
    }
  }

  // ✅ Validate discount
  if (discountType === 'percentage' && discountValue > 100) {
    throw new AppError('Percentage discount cannot exceed 100%', 400);
  }

  // ✅ Validate dates
  if (validFrom && validUntil) {
    if (new Date(validFrom) >= new Date(validUntil)) {
      throw new AppError('Valid from date must be before valid until date', 400);
    }
  }

  // ✅ Update fields
  if (code) coupon.code = code.toUpperCase();
  if (description !== undefined) coupon.description = description;
  if (discountType) coupon.discountType = discountType;
  if (discountValue !== undefined) coupon.discountValue = discountValue;
  if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
  if (appliesTo) coupon.appliesTo = appliesTo;
  if (categoryIds) coupon.categoryIds = categoryIds;
  if (productIds) coupon.productIds = productIds;
  if (sellerIds) coupon.sellerIds = sellerIds;
  if (userIds) coupon.userIds = userIds;
  if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
  if (usageLimit) coupon.usageLimit = usageLimit;
  if (userUsageLimit) coupon.userUsageLimit = userUsageLimit;
  if (validFrom) coupon.validFrom = validFrom;
  if (validUntil) coupon.validUntil = validUntil;
  if (isActive !== undefined) coupon.isActive = isActive;

  await coupon.save();

  res.status(200).json({
    success: true,
    message: 'Coupon updated successfully',
    data: coupon
  });
});

// ============================================
// DELETE COUPON
// ============================================

/**
 * @desc    Delete coupon (Admin only)
 * @route   DELETE /api/coupons/:id
 * @access  Private (Admin)
 */
export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  await coupon.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully'
  });
});

// ============================================
// VALIDATE COUPON
// ============================================

/**
 * @desc    Validate a coupon code (Public)
 * @route   GET /api/coupons/validate/:code
 * @access  Public
 */
export const validateCoupon = asyncHandler(async (req, res) => {
  const { code } = req.params;
  const { userId, cartTotal } = req.query;

  const result = await Coupon.findValidCoupon(code, userId);

  if (!result.valid) {
    return res.status(400).json({
      success: false,
      message: result.reason || 'Invalid coupon'
    });
  }

  const coupon = result.coupon;

  // ✅ Calculate discount for the cart total
  const discountResult = coupon.calculateDiscount(parseFloat(cartTotal) || 0);

  res.status(200).json({
    success: true,
    data: {
      coupon: coupon.getSummary(),
      discountAmount: discountResult.discountAmount,
      newTotal: discountResult.newTotal,
      appliesTo: coupon.appliesTo
    }
  });
});

// ============================================
// TOGGLE COUPON STATUS
// ============================================

/**
 * @desc    Toggle coupon active status (Admin only)
 * @route   PATCH /api/coupons/:id/toggle
 * @access  Private (Admin)
 */
export const toggleCouponStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await Coupon.findById(id);

  if (!coupon) {
    throw new AppError('Coupon not found', 404);
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.status(200).json({
    success: true,
    message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'} successfully`,
    data: coupon
  });
});

// ============================================
// GET COUPON STATISTICS
// ============================================

/**
 * @desc    Get coupon statistics (Admin only)
 * @route   GET /api/coupons/stats
 * @access  Private (Admin)
 */
export const getCouponStats = asyncHandler(async (req, res) => {
  const stats = await Coupon.getStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});