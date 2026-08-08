import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
      sparse: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    orderItems: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        name: {
          type: String,
          required: true
        },
        slug: String,
        price: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: [1, 'Quantity cannot be less than 1']
        },
        image: String,
        variation: {
          name: String,
          option: String
        },
        totalPrice: {
          type: Number,
          required: true
        }
      }
    ],
    shippingAddress: {
      street: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      zipCode: {
        type: String,
        required: true
      },
      country: {
        type: String,
        required: true,
        default: 'Myanmar'
      },
      phone: {
        type: String,
        required: true
      }
    },
    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'international'],
      default: 'standard'
    },
    shippingPrice: {
      type: Number,
      default: 0
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'cod', 'bank_transfer'],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      emailAddress: String,
      paymentIntent: String
    },
    paidAt: Date,
    subtotal: {
      type: Number,
      required: true
    },
    taxPrice: {
      type: Number,
      default: 0
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    couponCode: String,
    couponDiscount: {
      type: Number,
      default: 0
    },
    totalPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'confirmed',
        'shipped',
        'delivered',
        'cancelled',
        'refunded'
      ],
      default: 'pending',
      index: true
    },
    trackingNumber: String,
    trackingProvider: String,
    trackingUrl: String,
    trackingHistory: [
      {
        status: {
          type: String,
          enum: [
            'order_placed',
            'processing',
            'shipped',
            'in_transit',
            'out_for_delivery',
            'delivered'
          ]
        },
        location: String,
        description: String,
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],
    trackingLastUpdate: Date,

    // ✅ Fixed timeline enum
    timeline: [
      {
        status: {
          type: String,
          enum: [

            'pending',     // ✅ Added
            'created',     // ✅ Added
            'confirmed',
            'processing',
            'shipped',
            'delivered',
            'cancelled',
            'refunded'
          ]
        },
        note: String,
        date: {
          type: Date,
          default: Date.now
        }
      }
    ],
    deliveredAt: Date,
    isDelivered: {
      type: Boolean,
      default: false
    },
    cancellationReason: String,
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    notes: String,
    ipAddress: String,
    userAgent: String,
    isGuestOrder: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// INDEXES
// ============================================

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 }, { unique: true, sparse: true });
orderSchema.index({ trackingNumber: 1 }, { sparse: true });
orderSchema.index({ createdAt: -1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

orderSchema.pre('save', function (next) {
  // Generate order number if not exists
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }

  // Calculate total price
  let subtotal = 0;
  this.orderItems.forEach(item => {
    item.totalPrice = item.price * item.quantity;
    subtotal += item.totalPrice;
  });
  this.subtotal = subtotal;

  // Calculate total
  const total = subtotal + this.taxPrice + this.shippingPrice - this.discountAmount - this.couponDiscount;
  this.totalPrice = Math.round(total * 100) / 100;

  // Add to timeline if status changed
  if (this.isModified('status')) {
    this.timeline.push({

      status: this.status || 'pending',
      date: new Date()
    });
  }

  // Update delivered status
  if (this.status === 'delivered') {
    this.isDelivered = true;
    this.deliveredAt = new Date();
  }

  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

orderSchema.methods.addTrackingUpdate = function (status, location, description) {
  this.trackingHistory.push({
    status,
    location,
    description,
    timestamp: new Date()
  });
  this.trackingLastUpdate = new Date();
  return this.save();
};

orderSchema.methods.updateStatus = async function (newStatus, note = '') {
  const validTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered', 'cancelled'],
    delivered: ['refunded'],
    cancelled: [],
    refunded: []
  };

  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  if (note) {
    this.notes = note;
  }

  return this.save();
};

orderSchema.methods.canCancel = function () {
  return ['pending', 'processing'].includes(this.status);
};

orderSchema.methods.canRefund = function () {
  return ['delivered', 'shipped'].includes(this.status);
};

orderSchema.methods.getTotalItems = function () {
  return this.orderItems.reduce((total, item) => total + item.quantity, 0);
};

orderSchema.methods.getSummary = function () {
  return {
    orderNumber: this.orderNumber,
    totalItems: this.getTotalItems(),
    subtotal: this.subtotal,
    tax: this.taxPrice,
    shipping: this.shippingPrice,
    discount: this.discountAmount + this.couponDiscount,
    total: this.totalPrice,
    status: this.status,
    paymentStatus: this.paymentStatus,
    createdAt: this.createdAt
  };
};

// ============================================
// STATIC METHODS
// ============================================

orderSchema.statics.getUserOrders = function (userId, options = {}) {
  const { limit = 20, page = 1, status } = options;

  const query = { user: userId };
  if (status) query.status = status;

  return this.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('orderItems.product', 'name slug images');
};

orderSchema.statics.getStats = async function (options = {}) {
  const match = {};
  if (options.startDate) match.createdAt = { $gte: options.startDate };
  if (options.endDate) match.createdAt = { ...match.createdAt, $lte: options.endDate };

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        averageOrderValue: { $avg: '$totalPrice' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        processingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
        },
        shippedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
        },
        deliveredOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0
  };
};

orderSchema.statics.getDailyStats = async function (days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        orders: { $sum: 1 },
        revenue: { $sum: '$totalPrice' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
  ]);
};

// ============================================
// VIRTUAL PROPERTIES
// ============================================

orderSchema.virtual('isPaid').get(function () {
  return this.paymentStatus === 'paid';
});

orderSchema.virtual('isProcessing').get(function () {
  return this.status === 'processing';
});

orderSchema.virtual('isShipping').get(function () {
  return this.status === 'shipped';
});

orderSchema.virtual('canBeCancelled').get(function () {
  return this.canCancel();
});

// ============================================
// TOJSON TRANSFORM
// ============================================

orderSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// ============================================
// EXPORT MODEL
// ============================================

const Order = mongoose.model('Order', orderSchema);
export default Order;
