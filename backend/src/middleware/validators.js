import { body, param, query, validationResult } from 'express-validator';
import { AppError } from './errorHandler.js';

// ============================================
// ✅ VALIDATION RESULT HANDLER
// ============================================

/**
 * Middleware to check validation results
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));

  throw new AppError(extractedErrors, 400);
};

// ============================================
// ✅ PRODUCT VALIDATORS
// ============================================

export const validateProduct = [
  body('name')
    .trim()
    .notEmpty().withMessage('Product name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Name must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Product description is required')
    .isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  
  body('price')
    .isNumeric().withMessage('Price must be a number')
    .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  
  body('comparePrice')
    .optional()
    .isNumeric().withMessage('Compare price must be a number')
    .isFloat({ min: 0 }).withMessage('Compare price cannot be negative'),
  
  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('Stock must be a non-negative integer'),
  
  body('discount')
    .optional()
    .isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0 and 100%'),
  
  body('discountStartDate')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('discountEndDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .custom((value, { req }) => {
      if (req.body.discountStartDate && value) {
        if (new Date(value) <= new Date(req.body.discountStartDate)) {
          throw new Error('Discount end date must be after start date');
        }
      }
      return true;
    }),
  
  body('category')
    .optional()
    .isMongoId().withMessage('Invalid category ID'),
  
  body('subCategory')
    .optional()
    .isMongoId().withMessage('Invalid sub-category ID'),
  
  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
  
  body('images')
    .optional()
    .isArray().withMessage('Images must be an array'),
  
  body('isPublished')
    .optional()
    .isBoolean().withMessage('isPublished must be a boolean'),
  
  body('isFeatured')
    .optional()
    .isBoolean().withMessage('isFeatured must be a boolean'),
  
  validate
];

// ============================================
// ✅ CART VALIDATORS
// ============================================

export const validateAddToCart = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  
  validate
];

export const validateUpdateCart = [
  param('productId')
    .isMongoId().withMessage('Invalid product ID'),
  
  body('quantity')
    .isInt({ min: 0 }).withMessage('Quantity cannot be negative'),
  
  validate
];

export const validateApplyCoupon = [
  body('couponCode')
    .trim()
    .notEmpty().withMessage('Coupon code is required')
    .isLength({ min: 1, max: 50 }).withMessage('Coupon code too long'),
  
  validate
];

export const validateApplyProductCoupon = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isMongoId().withMessage('Invalid product ID'),
  
  body('couponCode')
    .trim()
    .notEmpty().withMessage('Coupon code is required'),
  
  validate
];

export const validateUpdateShipping = [
  body('shippingMethod')
    .optional()
    .isIn(['standard', 'express', 'international']).withMessage('Invalid shipping method'),
  
  body('shippingAddress')
    .optional()
    .isObject().withMessage('Shipping address must be an object'),
  
  validate
];

// ============================================
// ✅ ORDER VALIDATORS
// ============================================

export const validateCreateOrder = [
  body('shippingAddress')
    .isObject().withMessage('Shipping address is required')
    .custom((value) => {
      const required = ['street', 'city', 'state', 'zipCode', 'country'];
      for (const field of required) {
        if (!value[field]) {
          throw new Error(`Shipping address field '${field}' is required`);
        }
      }
      return true;
    }),
  
  body('paymentMethod')
    .isIn(['stripe', 'paypal', 'cod', 'bank_transfer']).withMessage('Invalid payment method'),
  
  body('shippingMethod')
    .optional()
    .isIn(['standard', 'express', 'international']).withMessage('Invalid shipping method'),
  
  body('couponCode')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Coupon code too long'),
  
  validate
];

export const validateUpdateOrderStatus = [
  param('id')
    .isMongoId().withMessage('Invalid order ID'),
  
  body('status')
    .isIn(['confirmed', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status'),
  
  body('note')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Note too long'),
  
  validate
];

export const validateCancelOrder = [
  param('id')
    .isMongoId().withMessage('Invalid order ID'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Reason too long'),
  
  validate
];

// ============================================
// ✅ COUPON VALIDATORS (Admin)
// ============================================

export const validateCoupon = [
  body('code')
    .trim()
    .notEmpty().withMessage('Coupon code is required')
    .isLength({ min: 2, max: 50 }).withMessage('Coupon code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9\-_]+$/i).withMessage('Coupon code can only contain letters, numbers, hyphens and underscores'),
  
  body('discountType')
    .isIn(['percentage', 'fixed']).withMessage('Discount type must be percentage or fixed'),
  
  body('discountValue')
    .isNumeric().withMessage('Discount value must be a number')
    .isFloat({ min: 0.01 }).withMessage('Discount value must be greater than 0')
    .custom((value, { req }) => {
      if (req.body.discountType === 'percentage' && value > 100) {
        throw new Error('Percentage discount cannot exceed 100%');
      }
      return true;
    }),
  
  body('maxDiscountAmount')
    .optional()
    .isNumeric().withMessage('Max discount must be a number')
    .isFloat({ min: 0 }).withMessage('Max discount cannot be negative'),
  
  body('minOrderAmount')
    .optional()
    .isNumeric().withMessage('Min order must be a number')
    .isFloat({ min: 0 }).withMessage('Min order cannot be negative'),
  
  body('appliesTo')
    .optional()
    .isIn(['all', 'category', 'product', 'seller', 'user']).withMessage('Invalid appliesTo value'),
  
  body('usageLimit')
    .optional()
    .isInt({ min: 1 }).withMessage('Usage limit must be at least 1'),
  
  body('userUsageLimit')
    .optional()
    .isInt({ min: 1 }).withMessage('User usage limit must be at least 1'),
  
  body('validFrom')
    .optional()
    .isISO8601().withMessage('Invalid date format'),
  
  body('validUntil')
    .isISO8601().withMessage('Valid until date is required')
    .custom((value, { req }) => {
      if (req.body.validFrom && new Date(value) <= new Date(req.body.validFrom)) {
        throw new Error('Valid until date must be after valid from date');
      }
      return true;
    }),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean'),
  
  validate
];

// ============================================
// ✅ USER VALIDATORS
// ============================================

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('phone')
    .optional()
    .trim()
    .isMobilePhone().withMessage('Please provide a valid phone number'),
  
  validate
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  validate
];

export const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .isMobilePhone().withMessage('Please provide a valid phone number'),
  
  body('address')
    .optional()
    .isObject().withMessage('Address must be an object'),
  
  validate
];

// ============================================
// ✅ REVIEW VALIDATORS
// ============================================

export const validateReview = [
  param('id')
    .isMongoId().withMessage('Invalid product ID'),
  
  body('rating')
    .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ min: 3, max: 500 }).withMessage('Comment must be between 3 and 500 characters'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Title too long'),
  
  validate
];

// ============================================
// ✅ ID VALIDATOR
// ============================================

export const validateId = [
  param('id')
    .isMongoId().withMessage('Invalid ID format'),
  
  validate
];

// ============================================
// ✅ PAGINATION VALIDATORS
// ============================================

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be at least 1'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  query('sort')
    .optional()
    .trim(),
  
  validate
];

// ============================================
// ✅ EXPORT ALL VALIDATORS
// ============================================

export default {
  validate,
  validateProduct,
  validateAddToCart,
  validateUpdateCart,
  validateApplyCoupon,
  validateApplyProductCoupon,
  validateUpdateShipping,
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateCancelOrder,
  validateCoupon,
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateReview,
  validateId,
  validatePagination
};