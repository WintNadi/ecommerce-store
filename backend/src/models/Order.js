import mongoose from 'mongoose';

/**
 * Order Schema - Customer orders
 * 
 * This model handles:
 * - Order creation and tracking
 * - Payment status and history
 * - Coupon and discount tracking
 * - Status transitions
 * - Negative total prevention
 */
const orderSchema = new mongoose.Schema({
  // ============================================
  // BASIC ORDER INFORMATION
  // ============================================
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },

  // ============================================
  // ORDER ITEMS
  // ============================================
  orderItems: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: String,
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    image: String,
    // Product discount applied
    productDiscount: {
      type: Number,
      default: 0,
    },
    // Coupon discount applied to this item
    couponDiscount: {
      type: Number,
      default: 0,
    },
    // Total for this item (price * quantity - discounts)
    totalPrice: {
      type: Number,
      required: true,
      min: [0, 'Item total cannot be negative'],
    },
    // Variation if any
    variation: {
      type: mongoose.Schema.Types.Mixed,
    },
  }],

  // ============================================
  // SHIPPING INFORMATION
  // ============================================
  shippingAddress: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: 'Myanmar',
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
  },
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'international'],
    default: 'standard',
  },
  shippingPrice: {
    type: Number,
    default: 0,
    min: [0, 'Shipping price cannot be negative'],
  },
  shippingTracking: {
    number: String,
    provider: String,
    url: String,
  },

  // ============================================
  // PAYMENT INFORMATION
  // ============================================
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'cod', 'bank_transfer'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
  },
  paymentResult: {
    id: String,
    status: String,
    updateTime: Date,
    emailAddress: String,
    paymentIntent: String,
  },
  paidAt: {
    type: Date,
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: [0, 'Refund amount cannot be negative'],
  },
  refundReason: String,
  refundedAt: Date,

  // ============================================
  // ORDER TOTALS (ALL PRICES SHOULD BE >= 0)
  // ============================================
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative'],
    default: 0,
  },
  taxPrice: {
    type: Number,
    required: true,
    min: [0, 'Tax cannot be negative'],
    default: 0,
  },
  shippingPrice: {
    type: Number,
    required: true,
    min: [0, 'Shipping cannot be negative'],
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  couponCode: {
    type: String,
    uppercase: true,
    trim: true,
  },
  couponDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Coupon discount cannot be negative'],
  },
  // ✅ Total price - GUARANTEED to be >= 0
  totalPrice: {
    type: Number,
    required: true,
    min: [0, 'Total cannot be negative'],
    default: 0,
  },

  // ============================================
  // ORDER STATUS
  // ============================================
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  timeline: [{
    status: String,
    note: String,
    date: {
      type: Date,
      default: Date.now,
    },
  }],

  // ============================================
  // DELIVERY INFORMATION
  // ============================================
  estimatedDelivery: {
    type: Date,
  },
  deliveredAt: {
    type: Date,
  },
  isDelivered: {
    type: Boolean,
    default: false,
  },

  // ============================================
  // CANCELLATION
  // ============================================
  cancellationReason: {
    type: String,
  },
  cancelledAt: {
    type: Date,
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  // ============================================
  // NOTES
  // ============================================
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  internalNotes: {
    type: String,
    maxlength: [1000, 'Internal notes cannot exceed 1000 characters'],
  },

}, {
  timestamps: true,
});

// ============================================
// ✅ VIRTUAL: Check if order is paid
// ============================================
orderSchema.virtual('isPaid').get(function() {
  return this.paymentStatus === 'paid';
});

// ============================================
// ✅ VIRTUAL: Check if order can be cancelled
// ============================================
orderSchema.virtual('canCancel').get(function() {
  return ['pending', 'confirmed', 'processing'].includes(this.status);
});

// ============================================
// ✅ VIRTUAL: Check if order is complete
// ============================================
orderSchema.virtual('isComplete').get(function() {
  return this.status === 'delivered' || this.status === 'cancelled' || this.status === 'refunded';
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * ✅ Generate order number
 */
orderSchema.methods.generateOrderNumber = function() {
  const date = new Date();
  const dateStr = date.getFullYear() +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  this.orderNumber = `ORD-${dateStr}-${random}`;
  return this.orderNumber;
};

/**
 * ✅ Calculate order totals with negative prevention
 */
orderSchema.methods.calculateTotals = function() {
  // Calculate subtotal from items
  this.subtotal = this.orderItems.reduce((sum, item) => {
    return sum + Math.max(0, item.totalPrice);
  }, 0);

  // ✅ Ensure subtotal is not negative
  this.subtotal = Math.max(0, this.subtotal);

  // ✅ Calculate total with negative prevention
  this.totalPrice = Math.max(0,
    this.subtotal +
    Math.max(0, this.taxPrice) +
    Math.max(0, this.shippingPrice) -
    Math.max(0, this.discountAmount) -
    Math.max(0, this.couponDiscount)
  );

  return this;
};

/**
 * ✅ Update order status with history
 */
orderSchema.methods.updateStatus = async function(newStatus, note = '', userId = null) {
  // Define valid status transitions
  const validTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': [],
    'cancelled': [],
    'refunded': [],
  };

  // Check if transition is valid
  if (!validTransitions[this.status]?.includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  // Update status
  this.status = newStatus;

  // Add to history
  this.statusHistory.push({
    status: newStatus,
    note: note || `Status changed to ${newStatus}`,
    updatedBy: userId,
    timestamp: new Date(),
  });

  // Add to timeline
  this.timeline.push({
    status: newStatus,
    note: note || `Status changed to ${newStatus}`,
    date: new Date(),
  });

  // Handle specific statuses
  if (newStatus === 'delivered') {
    this.isDelivered = true;
    this.deliveredAt = new Date();
  }

  if (newStatus === 'cancelled') {
    this.cancelledAt = new Date();
    if (userId) this.cancelledBy = userId;
  }

  return this;
};

/**
 * ✅ Mark order as paid
 */
orderSchema.methods.markAsPaid = async function(paymentResult) {
  this.paymentStatus = 'paid';
  this.paidAt = new Date();
  this.paymentResult = {
    id: paymentResult.id,
    status: paymentResult.status,
    updateTime: paymentResult.updateTime || new Date(),
    emailAddress: paymentResult.emailAddress,
    paymentIntent: paymentResult.paymentIntent,
  };
  await this.save();
  return this;
};

/**
 * ✅ Process refund
 */
orderSchema.methods.processRefund = async function(amount, reason) {
  if (this.paymentStatus !== 'paid') {
    throw new Error('Only paid orders can be refunded');
  }

  this.refundAmount = Math.min(amount, this.totalPrice);
  this.refundReason = reason || 'Customer requested refund';
  this.refundedAt = new Date();
  this.paymentStatus = 'refunded';
  this.status = 'refunded';

  await this.save();
  return this;
};

/**
 * ✅ Add tracking information
 */
orderSchema.methods.addTracking = async function(trackingNumber, provider, url) {
  this.shippingTracking = {
    number: trackingNumber,
    provider: provider,
    url: url,
  };
  await this.save();
  return this;
};

/**
 * ✅ Get order summary
 */
orderSchema.methods.getSummary = function() {
  return {
    id: this._id,
    orderNumber: this.orderNumber,
    status: this.status,
    paymentStatus: this.paymentStatus,
    subtotal: this.subtotal,
    taxPrice: this.taxPrice,
    shippingPrice: this.shippingPrice,
    discountAmount: this.discountAmount,
    couponCode: this.couponCode,
    couponDiscount: this.couponDiscount,
    totalPrice: this.totalPrice,
    createdAt: this.createdAt,
    items: this.orderItems.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
    })),
  };
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * ✅ Get order statistics
 */
orderSchema.statics.getStats = async function(options = {}) {
  const { startDate, endDate } = options;
  const match = {};
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $facet: {
        totalOrders: [{ $count: 'count' }],
        totalRevenue: [
          { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ],
        byPaymentStatus: [
          { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
        ],
        averageOrderValue: [
          { $group: { _id: null, avg: { $avg: '$totalPrice' } } },
        ],
        dailyStats: [
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              total: { $sum: '$totalPrice' },
            },
          },
          { $sort: { _id: 1 } },
        ],
      },
    },
  ]);

  return {
    totalOrders: stats[0]?.totalOrders[0]?.count || 0,
    totalRevenue: stats[0]?.totalRevenue[0]?.total || 0,
    averageOrderValue: stats[0]?.averageOrderValue[0]?.avg || 0,
    byStatus: stats[0]?.byStatus || [],
    byPaymentStatus: stats[0]?.byPaymentStatus || [],
    dailyStats: stats[0]?.dailyStats || [],
  };
};

/**
 * ✅ Get user order history
 */
orderSchema.statics.getUserOrders = async function(userId, options = {}) {
  const { page = 1, limit = 10, status } = options;
  const query = { user: userId };
  if (status) query.status = status;

  const skip = (page - 1) * limit;

  const orders = await this.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('orderItems.product', 'name slug images');

  const total = await this.countDocuments(query);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// ============================================
// MIDDLEWARE
// ============================================

// ✅ Auto-generate order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.generateOrderNumber();
  }
  // ✅ Ensure total is never negative
  this.calculateTotals();
  next();
});

// ============================================
// INDEXES
// ============================================

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ shippingMethod: 1 });

// ✅ Enable virtuals when converting to JSON
orderSchema.set('toJSON', { virtuals: true });
orderSchema.set('toObject', { virtuals: true });

export default mongoose.model('Order', orderSchema);