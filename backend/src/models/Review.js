import mongoose from 'mongoose';

/**
 * Review Schema - E-Commerce Review Model
 * ထုတ်ကုန်သုံးသပ်ချက်များကို စီမံခန့်ခွဲမယ်
 */
const reviewSchema = new mongoose.Schema(
  {
    // ============================================
    // REVIEW RELATIONSHIPS
    // ============================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },

    // ============================================
    // REVIEW CONTENT
    // ============================================
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating must be at most 5']
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot be more than 1000 characters']
    },

    // ============================================
    // MEDIA
    // ============================================
    images: [
      {
        url: String,
        publicId: String
      }
    ],

    // ============================================
    // VERIFICATION
    // ============================================
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    isFeatured: {
      type: Boolean,
      default: false
    },

    // ============================================
    // HELPFULNESS
    // ============================================
    helpfulCount: {
      type: Number,
      default: 0
    },
    helpfulUsers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        type: {
          type: String,
          enum: ['helpful', 'unhelpful'],
          default: 'helpful'
        }
      }
    ],

    // ============================================
    // ADMIN RESPONSE
    // ============================================
    adminResponse: {
      comment: String,
      respondedAt: Date,
      respondedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },

    // ============================================
    // META DATA
    // ============================================
    ipAddress: String,
    userAgent: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'spam'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ isApproved: 1, product: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ helpfulCount: -1 });
reviewSchema.index({ isFeatured: 1, isApproved: 1 });

// Compound indexes
reviewSchema.index({ product: 1, isApproved: 1, rating: -1 });
reviewSchema.index({ user: 1, createdAt: -1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

reviewSchema.pre('save', function (next) {
  // Auto-approve if user is admin or verified purchase
  if (this.isVerifiedPurchase) {
    this.isApproved = true;
  }

  // Auto-featured for high ratings
  if (this.rating >= 4.5 && this.isApproved) {
    this.isFeatured = true;
  }

  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Mark as helpful
 */
reviewSchema.methods.markAsHelpful = async function (userId) {
  // Check if user already voted
  const existingVote = this.helpfulUsers.find(
    vote => vote.user.toString() === userId.toString()
  );

  if (existingVote) {
    if (existingVote.type === 'helpful') {
      throw new Error('You already marked this review as helpful');
    }
    // Change from unhelpful to helpful
    existingVote.type = 'helpful';
    this.helpfulCount += 1;
  } else {
    this.helpfulUsers.push({ user: userId, type: 'helpful' });
    this.helpfulCount += 1;
  }

  return this.save();
};

/**
 * Mark as unhelpful
 */
reviewSchema.methods.markAsUnhelpful = async function (userId) {
  const existingVote = this.helpfulUsers.find(
    vote => vote.user.toString() === userId.toString()
  );

  if (existingVote) {
    if (existingVote.type === 'unhelpful') {
      throw new Error('You already marked this review as unhelpful');
    }
    // Change from helpful to unhelpful
    existingVote.type = 'unhelpful';
    this.helpfulCount -= 1;
  } else {
    this.helpfulUsers.push({ user: userId, type: 'unhelpful' });
  }

  return this.save();
};

/**
 * Admin approve review
 */
reviewSchema.methods.approve = async function () {
  this.isApproved = true;
  this.status = 'approved';
  this.isFeatured = this.rating >= 4.5;
  return this.save();
};

/**
 * Admin reject review
 */
reviewSchema.methods.reject = async function (reason = '') {
  this.isApproved = false;
  this.status = 'rejected';
  return this.save();
};

/**
 * Add admin response
 */
reviewSchema.methods.addAdminResponse = async function (comment, adminId) {
  this.adminResponse = {
    comment,
    respondedAt: new Date(),
    respondedBy: adminId
  };
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get product reviews
 */
reviewSchema.statics.getProductReviews = function (productId, options = {}) {
  const { limit = 20, page = 1, sort = '-createdAt', minRating = 0 } = options;

  const query = {
    product: productId,
    isApproved: true,
    rating: { $gte: minRating }
  };

  return this.find(query)
    .sort(sort)
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('user', 'name email profileImage')
    .populate('adminResponse.respondedBy', 'name');
};

/**
 * Get user reviews
 */
reviewSchema.statics.getUserReviews = function (userId, options = {}) {
  const { limit = 20, page = 1 } = options;

  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('product', 'name slug images price');
};

/**
 * Get product rating statistics
 */
reviewSchema.statics.getProductRatingStats = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: {
        product: productId,
        isApproved: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        ratingCounts: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (!stats.length) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      }
    };
  }

  const result = stats[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // Count ratings by star
  const ratingCounts = await this.aggregate([
    {
      $match: {
        product: productId,
        isApproved: true
      }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    }
  ]);

  ratingCounts.forEach(item => {
    distribution[item._id] = item.count;
  });

  return {
    averageRating: Math.round(result.averageRating * 10) / 10,
    totalReviews: result.totalReviews,
    ratingDistribution: distribution
  };
};

/**
 * Get review statistics
 */
reviewSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        pendingReviews: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        approvedReviews: {
          $sum: { $cond: [{ $eq: ['$isApproved', true] }, 1, 0] }
        },
        featuredReviews: {
          $sum: { $cond: [{ $eq: ['$isFeatured', true] }, 1, 0] }
        },
        averageRating: { $avg: '$rating' },
        totalHelpful: { $sum: '$helpfulCount' }
      }
    }
  ]);

  return stats[0] || {
    totalReviews: 0,
    pendingReviews: 0,
    approvedReviews: 0,
    featuredReviews: 0,
    averageRating: 0,
    totalHelpful: 0
  };
};

// ============================================
// VIRTUAL PROPERTIES
// ============================================

reviewSchema.virtual('isPending').get(function () {
  return this.status === 'pending';
});

reviewSchema.virtual('isApprovedReview').get(function () {
  return this.isApproved;
});

reviewSchema.virtual('hasAdminResponse').get(function () {
  return !!this.adminResponse?.comment;
});

// ============================================
// TOJSON TRANSFORM
// ============================================

reviewSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.helpfulUsers;
    return ret;
  }
});

// ============================================
// EXPORT MODEL
// ============================================

const Review = mongoose.model('Review', reviewSchema);
export default Review;