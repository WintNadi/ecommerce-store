import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a product name'],
      trim: true,
      maxlength: [200, 'Name cannot be more than 200 characters'],
      index: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      sparse: true
    },
    description: {
      type: String,
      required: [true, 'Please provide a product description'],
      maxlength: [5000, 'Description cannot be more than 5000 characters']
    },
    shortDescription: {
      type: String,
      maxlength: [500, 'Short description cannot be more than 500 characters']
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price'],
      min: [0, 'Price cannot be negative'],
      index: true
    },
    comparePrice: {
      type: Number,
      min: [0, 'Compare price cannot be negative']
    },
    costPrice: {
      type: Number,
      min: [0, 'Cost price cannot be negative']
    },
    stock: {
      type: Number,
      required: [true, 'Please provide stock quantity'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      index: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      index: true
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    images: [{
      url: {
        type: String,
        required: true
      },
      publicId: String,
      alt: String,
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],
    thumbnail: {
      type: String,
      default: ''
    },
    attributes: {
      brand: {
        type: String,
        default: ''
      },
      color: {
        type: String,
        default: ''
      },
      material: {
        type: String,
        default: ''
      },
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      },
      warranty: String
    },
    variations: [{
      name: String,
      options: [{
        value: String,
        price: Number,
        stock: Number,
        sku: String,
        image: String
      }]
    }],
    hasVariations: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    numReviews: {
      type: Number,
      default: 0
    },
    reviews: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      title: String,
      comment: String,
      images: [String],
      verifiedPurchase: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      helpful: {
        type: Number,
        default: 0
      }
    }],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true
    },
    publishedAt: Date,
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    discountStartDate: Date,
    discountEndDate: Date,
    shipping: {
      weight: Number,
      length: Number,
      width: Number,
      height: Number,
      isFreeShipping: {
        type: Boolean,
        default: false
      },
      shippingFee: {
        type: Number,
        default: 0
      }
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    views: {
      type: Number,
      default: 0
    },
    sales: {
      type: Number,
      default: 0
    },
    seo: {
      title: String,
      description: String,
      keywords: [String],
      ogImage: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ============================================
// INDEXES
// ============================================

productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ price: 1, createdAt: -1 });
productSchema.index({ category: 1, isPublished: 1 });
productSchema.index({ isFeatured: 1, isPublished: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ sales: -1 });
productSchema.index({ seller: 1, createdAt: -1 });

// Compound indexes
productSchema.index({ category: 1, isPublished: 1, price: 1 });
productSchema.index({ seller: 1, isPublished: 1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

productSchema.pre('save', function (next) {
  // Generate slug from name if slug is empty
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Set isInStock based on stock
  this.isInStock = this.stock > 0;

  // Set default thumbnail if not provided
  if (!this.thumbnail && this.images && this.images.length > 0) {
    const primaryImage = this.images.find(img => img.isPrimary) || this.images[0];
    if (primaryImage) {
      this.thumbnail = primaryImage.url;
    }
  }

  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Check if product is on sale
 */
productSchema.methods.isOnSale = function () {
  if (!this.discount || this.discount <= 0) return false;
  if (this.discountStartDate && this.discountStartDate > new Date()) return false;
  if (this.discountEndDate && this.discountEndDate < new Date()) return false;
  return true;
};

/**
 * Get discounted price
 */
productSchema.methods.getDiscountedPrice = function () {
  if (!this.isOnSale()) return this.price;
  return this.price * (1 - this.discount / 100);
};

/**
 * Calculate average rating
 */
productSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
    return;
  }
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating = Number((total / this.reviews.length).toFixed(1));
  this.numReviews = this.reviews.length;
};

/**
 * Check if product is out of stock
 */
productSchema.methods.isOutOfStock = function () {
  return this.stock <= 0;
};

/**
 * Check if product is low on stock
 */
productSchema.methods.isLowStock = function () {
  return this.stock > 0 && this.stock <= 5;
};

/**
 * Reduce stock
 */
productSchema.methods.reduceStock = async function (quantity) {
  if (this.stock < quantity) {
    throw new Error(`Not enough stock. Available: ${this.stock}`);
  }
  this.stock -= quantity;
  await this.save();
};

/**
 * Increase stock
 */
productSchema.methods.increaseStock = async function (quantity) {
  this.stock += quantity;
  await this.save();
};

/**
 * Get related products
 */
productSchema.methods.getRelatedProducts = async function (limit = 5) {
  return await this.constructor.find({
    _id: { $ne: this._id },
    category: this.category,
    isPublished: true,
    isActive: true
  })
    .limit(limit)
    .select('name slug price images thumbnail rating numReviews');
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Search products
 */
productSchema.statics.searchProducts = function (query, options = {}) {
  const { limit = 20, page = 1, sort = '-createdAt' } = options;
  return this.find(
    { $text: { $search: query }, isPublished: true, isActive: true },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' }, [sort]: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('category', 'name slug');
};

/**
 * Get featured products
 */
productSchema.statics.getFeatured = function (limit = 10) {
  return this.find({
    isFeatured: true,
    isPublished: true,
    isActive: true,
    stock: { $gt: 0 }
  })
    .sort({ rating: -1, sales: -1 })
    .limit(limit)
    .populate('category', 'name slug');
};

/**
 * Get top selling products
 */
productSchema.statics.getTopSelling = function (limit = 10) {
  return this.find({
    isPublished: true,
    isActive: true,
    stock: { $gt: 0 }
  })
    .sort({ sales: -1, rating: -1 })
    .limit(limit)
    .populate('category', 'name slug');
};

/**
 * Get product statistics
 */
productSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $match: { isPublished: true }
    },
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalRevenue: { $sum: '$sales' },
        averagePrice: { $avg: '$price' },
        averageRating: { $avg: '$rating' },
        totalStock: { $sum: '$stock' },
        lowStockItems: {
          $sum: {
            $cond: [
              { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', 5] }] },
              1,
              0
            ]
          }
        },
        outOfStockItems: {
          $sum: {
            $cond: [{ $eq: ['$stock', 0] }, 1, 0]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    totalProducts: 0,
    totalRevenue: 0,
    averagePrice: 0,
    averageRating: 0,
    totalStock: 0,
    lowStockItems: 0,
    outOfStockItems: 0
  };
};

// ============================================
// VIRTUAL PROPERTIES
// ============================================

/**
 * Sale badge
 */
productSchema.virtual('saleBadge').get(function () {
  if (!this.isOnSale()) return null;
  return {
    text: `${Math.round(this.discount)}% OFF`,
    discountAmount: this.price ? this.price - this.getDiscountedPrice() : 0
  };
});

/**
 * Formatted price
 */
productSchema.virtual('formattedPrice').get(function () {
  return this.price ? `$${this.price.toFixed(2)}` : '$0.00';
});

/**
 * Formatted discounted price
 */
productSchema.virtual('formattedDiscountedPrice').get(function () {
  if (!this.isOnSale()) return null;
  const discounted = this.getDiscountedPrice();
  return discounted ? `$${discounted.toFixed(2)}` : null;
});

/**
 * In stock status
 */
productSchema.virtual('inStock').get(function () {
  return this.stock > 0;
});

/**
 * Stock status text
 */
productSchema.virtual('stockStatus').get(function () {
  if (this.stock === 0) return 'Out of Stock';
  if (this.stock <= 5) return 'Low Stock';
  return 'In Stock';
});

// ============================================
// TOJSON TRANSFORM
// ============================================

productSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret._id = ret._id;
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  }
});

// ============================================
// EXPORT MODEL
// ============================================

const Product = mongoose.model('Product', productSchema);
export default Product;