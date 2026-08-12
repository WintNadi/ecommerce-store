import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Please provide a product description'],
    maxlength: [2000, 'Description cannot be more than 2000 characters'],
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot be more than 500 characters'],
  },
  price: {
    type: Number,
    required: [true, 'Please provide a product price'],
    min: [0, 'Price cannot be negative'],
  },
  comparePrice: {
    type: Number,
    min: [0, 'Compare price cannot be negative'],
  },
  costPrice: {
    type: Number,
    min: [0, 'Cost price cannot be negative'],
  },
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  brand: {
    type: String,
    trim: true,
  },
  color: {
    type: String,
    trim: true,
  },
  material: {
    type: String,
    trim: true,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  
  // Simple string array for images
  images: [{
    type: String,
    default: [],
  }],
  
  // Primary image (single string)
  image: {
    type: String,
    default: '',
  },
  
  thumbnail: {
    type: String,
    default: '',
  },
  
  attributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  variations: [{
    name: String,
    options: [String],
    price: Number,
    stock: Number,
    sku: String,
  }],
  
  hasVariations: {
    type: Boolean,
    default: false,
  },
  
  seo: {
    title: String,
    description: String,
    keywords: [String],
  },
  
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    requiresExtraShipping: {
      type: Boolean,
      default: false,
    },
  },
  
  // ============================================
  // ✅ DISCOUNT FIELDS (Seller controlled)
  // ============================================
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  discountStartDate: {
    type: Date,
  },
  discountEndDate: {
    type: Date,
  },
  
  // ============================================
  // ✅ PRODUCT-SPECIFIC COUPONS (Seller controlled)
  // ============================================
  productCoupons: [{
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      default: 'percentage',
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    maxUses: {
      type: Number,
      default: 1,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    validUntil: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  numReviews: {
    type: Number,
    default: 0,
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      maxlength: 100,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  isPublished: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  hasStock: {
    type: Boolean,
    default: true,
  },
  
  views: {
    type: Number,
    default: 0,
  },
  
  slug: {
    type: String,
    unique: true,
    sparse: true,
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// ============================================
// MIDDLEWARE
// ============================================

productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Generate slug from name if not provided
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  
  // Update hasStock based on stock
  this.hasStock = this.stock > 0;
  
  // ✅ Validate discount dates
  if (this.discountStartDate && this.discountEndDate) {
    if (this.discountStartDate > this.discountEndDate) {
      return next(new Error('Discount start date must be before end date'));
    }
  }
  
  next();
});

// ============================================
// ✅ VIRTUAL: Check if discount is currently active
// ============================================
productSchema.virtual('isDiscountActive').get(function() {
  if (!this.discount || this.discount <= 0) return false;
  
  const now = new Date();
  
  // Check if within date range
  if (this.discountStartDate && this.discountStartDate > now) return false;
  if (this.discountEndDate && this.discountEndDate < now) return false;
  
  return true;
});

// ============================================
// ✅ VIRTUAL: Get discounted price
// ============================================
productSchema.virtual('discountedPrice').get(function() {
  if (!this.isDiscountActive) return this.price;
  return this.price * (1 - this.discount / 100);
});

// ============================================
// ✅ INSTANCE METHOD: Check if coupon is valid
// ============================================
productSchema.methods.isCouponValid = function(couponCode) {
  const coupon = this.productCoupons.find(c => c.code === couponCode.toUpperCase());
  if (!coupon) return { valid: false, reason: 'Coupon not found' };
  
  if (!coupon.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (coupon.usedCount >= coupon.maxUses) return { valid: false, reason: 'Coupon has reached maximum uses' };
  if (coupon.validUntil && coupon.validUntil < new Date()) return { valid: false, reason: 'Coupon has expired' };
  
  return { valid: true, coupon };
};

// ============================================
// ✅ INSTANCE METHOD: Use product coupon
// ============================================
productSchema.methods.useProductCoupon = async function(couponCode) {
  const coupon = this.productCoupons.find(c => c.code === couponCode.toUpperCase());
  if (!coupon) throw new Error('Coupon not found');
  
  const validation = this.isCouponValid(couponCode);
  if (!validation.valid) throw new Error(validation.reason);
  
  coupon.usedCount += 1;
  await this.save();
  
  // Calculate discount for this product
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = this.price * (coupon.discountValue / 100);
  } else {
    discountAmount = Math.min(coupon.discountValue, this.price);
  }
  
  return {
    coupon: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount: discountAmount,
  };
};

// ============================================
// INDEXES
// ============================================

productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ isPublished: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });

// ✅ Index for discount queries
productSchema.index({ discount: 1, discountStartDate: 1, discountEndDate: 1 });

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if product is in stock for given quantity
 */
productSchema.methods.checkStock = function(quantity = 1) {
  return this.stock >= quantity;
};

/**
 * Reduce stock by given quantity
 */
productSchema.methods.reduceStock = async function(quantity = 1) {
  if (!this.checkStock(quantity)) {
    throw new Error(`Not enough stock available. Available: ${this.stock}`);
  }
  this.stock -= quantity;
  this.hasStock = this.stock > 0;
  await this.save();
  return this;
};

/**
 * Increase stock by given quantity
 */
productSchema.methods.increaseStock = async function(quantity = 1) {
  this.stock += quantity;
  this.hasStock = this.stock > 0;
  await this.save();
  return this;
};

/**
 * Calculate average rating
 */
productSchema.methods.calculateRating = function() {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
    return;
  }
  
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  this.rating = Number((sum / this.reviews.length).toFixed(1));
  this.numReviews = this.reviews.length;
};

/**
 * Get related products
 */
productSchema.methods.getRelatedProducts = async function(limit = 5) {
  return await this.constructor.find({
    _id: { $ne: this._id },
    category: this.category,
    isPublished: true,
    isActive: true,
  })
  .limit(limit)
  .select('name price images slug rating');
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get product statistics
 */
productSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $facet: {
        totalProducts: [{ $count: 'count' }],
        publishedProducts: [
          { $match: { isPublished: true } },
          { $count: 'count' },
        ],
        outOfStock: [
          { $match: { stock: 0 } },
          { $count: 'count' },
        ],
        averagePrice: [
          { $group: { _id: null, avg: { $avg: '$price' } } },
        ],
        totalValue: [
          { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$stock'] } } } },
        ],
        byCategory: [
          { $group: { _id: '$category', count: { $sum: 1 } } },
        ],
      },
    },
  ]);

  return {
    totalProducts: stats[0]?.totalProducts[0]?.count || 0,
    publishedProducts: stats[0]?.publishedProducts[0]?.count || 0,
    outOfStock: stats[0]?.outOfStock[0]?.count || 0,
    averagePrice: stats[0]?.averagePrice[0]?.avg || 0,
    totalValue: stats[0]?.totalValue[0]?.total || 0,
    byCategory: stats[0]?.byCategory || [],
  };
};

/**
 * Get featured products
 */
productSchema.statics.getFeatured = async function(limit = 10) {
  return await this.find({
    isFeatured: true,
    isPublished: true,
    isActive: true,
  })
  .limit(limit)
  .sort({ createdAt: -1 })
  .select('name price images slug rating');
};

/**
 * Get top selling products
 */
productSchema.statics.getTopSelling = async function(limit = 10) {
  return await this.find({
    isPublished: true,
    isActive: true,
  })
  .sort({ rating: -1, numReviews: -1 })
  .limit(limit)
  .select('name price images slug rating numReviews');
};

/**
 * Search products
 */
productSchema.statics.searchProducts = async function(query, options = {}) {
  const { limit = 20, page = 1, sort = '-createdAt' } = options;
  const skip = (page - 1) * limit;

  let sortQuery = {};
  if (sort.startsWith('-')) {
    sortQuery[sort.substring(1)] = -1;
  } else {
    sortQuery[sort] = 1;
  }

  const products = await this.find(
    {
      $text: { $search: query },
      isPublished: true,
      isActive: true,
    },
    {
      score: { $meta: 'textScore' },
    }
  )
  .sort({ score: { $meta: 'textScore' }, ...sortQuery })
  .skip(skip)
  .limit(limit)
  .select('name price images slug rating description');

  return products;
};

// ✅ Enable virtuals when converting to JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

export default mongoose.model('Product', productSchema);