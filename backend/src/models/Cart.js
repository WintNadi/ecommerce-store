import mongoose from 'mongoose';

/**
 * Cart Schema - E-Commerce Cart Model
 * ဈေးဝယ်တောင်းကို စီမံခန့်ခွဲမယ်
 */
const cartSchema = new mongoose.Schema(
  {
    // ============================================
    // USER
    // ============================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },

    // ============================================
    // CART ITEMS
    // ============================================
    items: [
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
          min: [1, 'Quantity cannot be less than 1'],
          max: [99, 'Quantity cannot be more than 99']
        },
        image: String,
        variation: {
          name: String,
          option: String
        },
        totalPrice: {
          type: Number,
          required: true
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // ============================================
    // PRICING
    // ============================================
    subtotal: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    shippingAmount: {
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
      default: 0
    },

    // ============================================
    // COUPON
    // ============================================
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },

    // ============================================
    // META DATA
    // ============================================
    lastActive: {
      type: Date,
      default: Date.now
    },
    isAbandoned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// ============================================
// INDEXES FOR PERFORMANCE
// ============================================

cartSchema.index({ user: 1 });
cartSchema.index({ isAbandoned: 1, lastActive: -1 });
cartSchema.index({ 'items.product': 1 });

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

cartSchema.pre('save', function (next) {
  // Calculate subtotal
  let subtotal = 0;
  this.items.forEach(item => {
    item.totalPrice = item.price * item.quantity;
    subtotal += item.totalPrice;
  });
  this.subtotal = subtotal;

  // Calculate total
  const total = subtotal + this.taxAmount + this.shippingAmount - this.discountAmount - this.couponDiscount;
  this.totalPrice = Math.round(total * 100) / 100;

  // Update last active
  this.lastActive = new Date();

  next();
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * Add item to cart
 */
cartSchema.methods.addItem = async function (product, quantity = 1, variation = null) {
  const existingItem = this.items.find(
    item =>
      item.product.toString() === product._id.toString() &&
      JSON.stringify(item.variation) === JSON.stringify(variation)
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.totalPrice = existingItem.price * existingItem.quantity;
  } else {
    this.items.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      quantity,
      image: product.thumbnail || product.images?.[0]?.url,
      variation,
      totalPrice: product.price * quantity
    });
  }

  this.isAbandoned = false;
  return this.save();
};

/**
 * Remove item from cart
 */
cartSchema.methods.removeItem = async function (productId, variation = null) {
  this.items = this.items.filter(
    item =>
      !(
        item.product.toString() === productId &&
        JSON.stringify(item.variation) === JSON.stringify(variation)
      )
  );
  return this.save();
};

/**
 * Update item quantity
 */
cartSchema.methods.updateQuantity = async function (productId, quantity, variation = null) {
  const item = this.items.find(
    item =>
      item.product.toString() === productId &&
      JSON.stringify(item.variation) === JSON.stringify(variation)
  );

  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    return this.removeItem(productId, variation);
  }

  item.quantity = Math.min(quantity, 99);
  item.totalPrice = item.price * item.quantity;

  return this.save();
};

/**
 * Clear cart
 */
cartSchema.methods.clearCart = async function () {
  this.items = [];
  return this.save();
};

/**
 * Get cart summary
 */
cartSchema.methods.getSummary = function () {
  return {
    totalItems: this.items.reduce((total, item) => total + item.quantity, 0),
    subtotal: this.subtotal,
    tax: this.taxAmount,
    shipping: this.shippingAmount,
    discount: this.discountAmount + this.couponDiscount,
    total: this.totalPrice
  };
};

/**
 * Check if cart is empty
 */
cartSchema.methods.isEmpty = function () {
  return this.items.length === 0;
};

/**
 * Apply coupon
 */
cartSchema.methods.applyCoupon = async function (coupon) {
  // Validate coupon logic here
  this.couponCode = coupon.code;
  this.couponDiscount = coupon.discountAmount || 0;
  this.couponId = coupon._id;
  return this.save();
};

/**
 * Remove coupon
 */
cartSchema.methods.removeCoupon = async function () {
  this.couponCode = undefined;
  this.couponDiscount = 0;
  this.couponId = undefined;
  return this.save();
};

/**
 * Mark cart as abandoned
 */
cartSchema.methods.markAsAbandoned = async function () {
  this.isAbandoned = true;
  return this.save();
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * Get or create cart for user
 */
cartSchema.statics.getOrCreateCart = async function (userId) {
  let cart = await this.findOne({ user: userId });

  if (!cart) {
    cart = new this({ user: userId });
    await cart.save();
  }

  return cart;
};

/**
 * Get abandoned carts (older than 24 hours)
 */
cartSchema.statics.getAbandonedCarts = async function () {
  const threshold = new Date();
  threshold.setHours(threshold.getHours() - 24);

  return this.find({
    isAbandoned: false,
    lastActive: { $lt: threshold },
    'items.0': { $exists: true }
  }).populate('user', 'name email');
};

/**
 * Get cart statistics
 */
cartSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalCarts: { $sum: 1 },
        totalItems: { $sum: { $size: '$items' } },
        averageItems: { $avg: { $size: '$items' } },
        abandonedCarts: {
          $sum: { $cond: ['$isAbandoned', 1, 0] }
        },
        totalValue: { $sum: '$totalPrice' }
      }
    }
  ]);

  return stats[0] || {
    totalCarts: 0,
    totalItems: 0,
    averageItems: 0,
    abandonedCarts: 0,
    totalValue: 0
  };
};

// ============================================
// VIRTUAL PROPERTIES
// ============================================

cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

cartSchema.virtual('hasItems').get(function () {
  return this.items.length > 0;
});

// ============================================
// TOJSON TRANSFORM
// ============================================

cartSchema.set('toJSON', {
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

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;