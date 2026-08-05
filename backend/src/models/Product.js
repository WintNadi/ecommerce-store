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
      sparse: true // ✅ Allows null/undefined
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
      // ✅ required ကိုဖယ်ပါ
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
    thumbnail: String,
    attributes: {
      brand: String,
      weight: Number,
      dimensions: {
        length: Number,
        width: Number,
        height: Number
      },
      color: String,
      material: String,
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
    timestamps: true
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
  
  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

productSchema.methods.isOnSale = function () {
  if (!this.discount || this.discount <= 0) return false;
  if (this.discountStartDate && this.discountStartDate > new Date()) return false;
  if (this.discountEndDate && this.discountEndDate < new Date()) return false;
  return true;
};

productSchema.methods.getDiscountedPrice = function () {
  if (!this.isOnSale()) return this.price;
  return this.price * (1 - this.discount / 100);
};

productSchema.methods.calculateRating = function () {
  if (this.reviews.length === 0) {
    this.rating = 0;
    this.numReviews = 0;
    return;
  }
  const total = this.reviews.reduce((sum, review) => sum + review.rating, 0);
  this.rating = total / this.reviews.length;
  this.numReviews = this.reviews.length;
};

productSchema.methods.reduceStock = async function (quantity) {
  if (this.stock < quantity) {
    throw new Error(`Not enough stock. Available: ${this.stock}`);
  }
  this.stock -= quantity;
  await this.save();
};

productSchema.methods.increaseStock = async function (quantity) {
  this.stock += quantity;
  await this.save();
};

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

productSchema.statics.searchProducts = function (query, options = {}) {
  const { limit = 20, page = 1, sort = '-createdAt' } = options;
  return this.find(
    { $text: { $search: query }, isPublished: true, isActive: true },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' }, [sort]: 1 })
    .skip((page - 1) * limit)
    .limit(limit);
};

productSchema.statics.getFeatured = function (limit = 10) {
  return this.find({
    isFeatured: true,
    isPublished: true,
    isActive: true,
    stock: { $gt: 0 }
  })
    .sort({ rating: -1, sales: -1 })
    .limit(limit);
};

productSchema.statics.getTopSelling = function (limit = 10) {
  return this.find({
    isPublished: true,
    isActive: true,
    stock: { $gt: 0 }
  })
    .sort({ sales: -1, rating: -1 })
    .limit(limit);
};

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
        totalStock: { $sum: '$stock' }
      }
    }
  ]);
  return stats[0] || {
    totalProducts: 0,
    totalRevenue: 0,
    averagePrice: 0,
    averageRating: 0,
    totalStock: 0
  };
};

// ============================================
// TOJSON TRANSFORM
// ============================================

productSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Product = mongoose.model('Product', productSchema);
export default Product;