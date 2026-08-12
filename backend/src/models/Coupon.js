import mongoose from 'mongoose';

/**
 * Coupon Schema - Admin created global coupons
 * 
 * This model handles:
 * - Admin-created coupons that can apply to all products, categories, or specific products
 * - Coupon validation rules (minimum order, usage limits, expiry dates)
 * - Tracking coupon usage and applying discounts
 */
const couponSchema = new mongoose.Schema({
  // ============================================
  // BASIC COUPON INFORMATION
  // ============================================
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9\-_]+$/, 'Coupon code can only contain letters, numbers, hyphens and underscores'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },

  // ============================================
  // DISCOUNT CONFIGURATION
  // ============================================
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: [true, 'Discount type is required'],
    default: 'percentage',
  },
  discountValue: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Discount value cannot be negative'],
    validate: {
      validator: function(value) {
        if (this.discountType === 'percentage') {
          return value <= 100;
        }
        return true;
      },
      message: 'Percentage discount cannot exceed 100%',
    },
  },
  maxDiscountAmount: {
    type: Number,
    min: [0, 'Max discount amount cannot be negative'],
    help: 'Maximum discount amount for percentage-based coupons',
  },

  // ============================================
  // COUPON SCOPE - What does this coupon apply to?
  // ============================================
  appliesTo: {
    type: String,
    enum: ['all', 'category', 'product', 'seller', 'user'],
    default: 'all',
    help: 'What the coupon applies to: all, category, product, seller, or user',
  },
  
  // Applicable categories (if appliesTo is 'category')
  categoryIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  
  // Applicable products (if appliesTo is 'product')
  productIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  
  // Applicable sellers (if appliesTo is 'seller')
  sellerIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  // Applicable users (if appliesTo is 'user')
  userIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  // ============================================
  // COUPON RULES & RESTRICTIONS
  // ============================================
  minOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative'],
    help: 'Minimum order total required to use this coupon',
  },
  
  // ✅ Prevent negative totals: Coupon discount cannot exceed order total
  usageLimit: {
    type: Number,
    default: 1,
    min: [1, 'Usage limit must be at least 1'],
    help: 'Maximum number of times this coupon can be used',
  },
  usedCount: {
    type: Number,
    default: 0,
    min: [0, 'Used count cannot be negative'],
  },
  
  // Per-user usage limit
  userUsageLimit: {
    type: Number,
    default: 1,
    min: [1, 'User usage limit must be at least 1'],
    help: 'Maximum times a single user can use this coupon',
  },

  // ============================================
  // DATE RANGE
  // ============================================
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: [true, 'Valid until date is required'],
    validate: {
      validator: function(value) {
        return this.validFrom < value;
      },
      message: 'Valid until date must be after valid from date',
    },
  },

  // ============================================
  // STATUS & TRACKING
  // ============================================
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Admin who created this coupon
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Track which users have used this coupon
  userUsage: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    discountAmount: Number,
  }],

}, {
  timestamps: true,
});

// ============================================
// ✅ VIRTUAL: Check if coupon is currently valid
// ============================================
couponSchema.virtual('isValid').get(function() {
  // Check if active
  if (!this.isActive) return false;
  
  // Check if has reached usage limit
  if (this.usedCount >= this.usageLimit) return false;
  
  // Check date range
  const now = new Date();
  if (this.validFrom && this.validFrom > now) return false;
  if (this.validUntil && this.validUntil < now) return false;
  
  return true;
});

// ============================================
// ✅ VIRTUAL: Remaining uses
// ============================================
couponSchema.virtual('remainingUses').get(function() {
  return Math.max(0, this.usageLimit - this.usedCount);
});

// ============================================
// ✅ VIRTUAL: Is coupon expired
// ============================================
couponSchema.virtual('isExpired').get(function() {
  const now = new Date();
  if (this.validUntil && this.validUntil < now) return true;
  if (this.usedCount >= this.usageLimit) return true;
  return false;
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * ✅ Check if coupon can be used by a specific user
 */
couponSchema.methods.canUserUse = function(userId) {
  // If coupon has user-specific usage limit
  if (this.userUsageLimit) {
    const userUsageCount = this.userUsage.filter(u => u.userId.toString() === userId.toString()).length;
    if (userUsageCount >= this.userUsageLimit) {
      return { 
        valid: false, 
        reason: `You have already used this coupon ${this.userUsageLimit} time(s)` 
      };
    }
  }
  
  return { valid: true };
};

/**
 * ✅ Apply coupon to order total with negative prevention
 */
couponSchema.methods.calculateDiscount = function(orderTotal, applicableItems = null) {
  // Calculate the total that the coupon applies to
  let applicableTotal = orderTotal;
  
  // If coupon only applies to specific items
  if (applicableItems && applicableItems.length > 0) {
    applicableTotal = applicableItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
  
  // Calculate discount
  let discountAmount = 0;
  
  if (this.discountType === 'percentage') {
    discountAmount = (applicableTotal * this.discountValue) / 100;
  } else {
    discountAmount = Math.min(this.discountValue, applicableTotal);
  }
  
  // Apply max discount limit
  if (this.maxDiscountAmount && discountAmount > this.maxDiscountAmount) {
    discountAmount = this.maxDiscountAmount;
  }
  
  // ✅ PREVENT NEGATIVE TOTAL: Discount cannot exceed order total
  discountAmount = Math.min(discountAmount, orderTotal);
  
  return {
    discountAmount,
    applicableTotal,
    newTotal: orderTotal - discountAmount,
  };
};

/**
 * ✅ Record usage of coupon
 */
couponSchema.methods.recordUsage = async function(userId, orderId, discountAmount) {
  this.usedCount += 1;
  
  this.userUsage.push({
    userId,
    usedAt: new Date(),
    orderId,
    discountAmount,
  });
  
  await this.save();
  return this;
};

/**
 * ✅ Check if coupon applies to a product
 */
couponSchema.methods.appliesToProduct = function(productId) {
  if (this.appliesTo === 'all') return true;
  
  if (this.appliesTo === 'product') {
    return this.productIds.some(id => id.toString() === productId.toString());
  }
  
  // For category or seller, we need to check the product's category/seller
  // This is handled in the service layer
  return true;
};

/**
 * ✅ Get coupon summary for frontend
 */
couponSchema.methods.getSummary = function() {
  return {
    code: this.code,
    description: this.description,
    discountType: this.discountType,
    discountValue: this.discountValue,
    maxDiscountAmount: this.maxDiscountAmount,
    minOrderAmount: this.minOrderAmount,
    isValid: this.isValid,
    remainingUses: this.remainingUses,
    isExpired: this.isExpired,
    validUntil: this.validUntil,
  };
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * ✅ Find and validate a coupon by code
 */
couponSchema.statics.findValidCoupon = async function(code, userId = null) {
  const coupon = await this.findOne({ 
    code: code.toUpperCase(),
    isActive: true,
  });
  
  if (!coupon) {
    return { valid: false, reason: 'Invalid coupon code' };
  }
  
  if (!coupon.isValid) {
    return { valid: false, reason: 'Coupon is no longer valid' };
  }
  
  if (userId) {
    const userCheck = coupon.canUserUse(userId);
    if (!userCheck.valid) {
      return userCheck;
    }
  }
  
  return { valid: true, coupon };
};

/**
 * ✅ Get all active coupons (Admin)
 */
couponSchema.statics.getActiveCoupons = async function() {
  const now = new Date();
  return await this.find({
    isActive: true,
    validUntil: { $gt: now },
    $expr: { $lt: ['$usedCount', '$usageLimit'] },
  });
};

/**
 * ✅ Get coupon statistics (Admin)
 */
couponSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        totalCoupons: [{ $count: 'count' }],
        activeCoupons: [
          { $match: { isActive: true } },
          { $count: 'count' },
        ],
        expiredCoupons: [
          { $match: { validUntil: { $lt: new Date() } } },
          { $count: 'count' },
        ],
        totalUses: [
          { $group: { _id: null, total: { $sum: '$usedCount' } } },
        ],
        mostUsed: [
          { $sort: { usedCount: -1 } },
          { $limit: 5 },
          { $project: { code: 1, usedCount: 1, discountValue: 1, discountType: 1 } },
        ],
      },
    },
  ]);

  return {
    totalCoupons: stats[0]?.totalCoupons[0]?.count || 0,
    activeCoupons: stats[0]?.activeCoupons[0]?.count || 0,
    expiredCoupons: stats[0]?.expiredCoupons[0]?.count || 0,
    totalUses: stats[0]?.totalUses[0]?.total || 0,
    mostUsed: stats[0]?.mostUsed || [],
  };
};

// ============================================
// MIDDLEWARE
// ============================================

// ✅ Auto-uppercase code before saving
couponSchema.pre('save', function(next) {
  if (this.code) {
    this.code = this.code.toUpperCase().trim();
  }
  next();
});

// ✅ Validate dates
couponSchema.pre('save', function(next) {
  if (this.validFrom && this.validUntil) {
    if (this.validFrom >= this.validUntil) {
      return next(new Error('Valid from date must be before valid until date'));
    }
  }
  next();
});

// ============================================
// INDEXES
// ============================================

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, validUntil: 1 });
couponSchema.index({ appliesTo: 1 });
couponSchema.index({ categoryIds: 1 });
couponSchema.index({ productIds: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

// ✅ Enable virtuals when converting to JSON
couponSchema.set('toJSON', { virtuals: true });
couponSchema.set('toObject', { virtuals: true });

export default mongoose.model('Coupon', couponSchema);