import mongoose from 'mongoose';

/**
 * Cart Schema - Shopping cart for users
 * 
 * This model handles:
 * - Storing user cart items
 * - Calculating cart totals
 * - Applying/removing coupons
 * - Preventing negative totals
 */
const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  
  // ============================================
  // CART ITEMS
  // ============================================
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    comparePrice: {
      type: Number,
      min: [0, 'Compare price cannot be negative'],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    image: {
      type: String,
    },
    // Product discount (set by seller)
    productDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // ✅ Product-specific coupon discount
    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Variation selection (if product has variations)
    variation: {
      type: mongoose.Schema.Types.Mixed,
    },
    // Total price for this item (price * quantity)
    totalPrice: {
      type: Number,
      default: 0,
    },
  }],

  // ============================================
  // CART TOTALS
  // ============================================
  subtotal: {
    type: Number,
    default: 0,
    min: [0, 'Subtotal cannot be negative'],
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative'],
  },
  shippingAmount: {
    type: Number,
    default: 0,
    min: [0, 'Shipping cannot be negative'],
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative'],
  },
  totalPrice: {
    type: Number,
    default: 0,
    min: [0, 'Total cannot be negative'],
  },

  // ============================================
  // COUPON FIELDS
  // ============================================
  couponCode: {
    type: String,
    uppercase: true,
    trim: true,
    default: null,
  },
  couponId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon',
    default: null,
  },
  couponDiscount: {
    type: Number,
    default: 0,
    min: [0, 'Coupon discount cannot be negative'],
  },
  couponApplied: {
    type: Boolean,
    default: false,
  },
  
  // ✅ Product-specific coupons applied
  productCoupons: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    couponCode: {
      type: String,
      uppercase: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
  }],

  // ============================================
  // SHIPPING & TAX
  // ============================================
  shippingMethod: {
    type: String,
    enum: ['standard', 'express', 'international'],
    default: 'standard',
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: {
      type: String,
      default: 'Myanmar',
    },
    phone: String,
  },

  // ============================================
  // CART STATUS
  // ============================================
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(+new Date() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },

}, {
  timestamps: true,
});

// ============================================
// ✅ VIRTUAL: Item count
// ============================================
cartSchema.virtual('itemCount').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// ============================================
// ✅ VIRTUAL: Total discount (product + coupon)
// ============================================
cartSchema.virtual('totalDiscount').get(function() {
  return this.discountAmount + this.couponDiscount;
});

// ============================================
// ✅ VIRTUAL: Grand total with negative prevention
// ============================================
cartSchema.virtual('grandTotal').get(function() {
  // ✅ PREVENT NEGATIVE TOTAL
  return Math.max(0, this.subtotal + this.taxAmount + this.shippingAmount - this.totalDiscount);
});

// ============================================
// INSTANCE METHODS
// ============================================

/**
 * ✅ Calculate cart totals with negative prevention
 */
cartSchema.methods.calculateTotals = function() {
  let subtotal = 0;
  let discountAmount = 0;
  let productCouponDiscount = 0;
  
  // Calculate item totals and discounts
  for (const item of this.items) {
    // Calculate item price with product discount
    let itemPrice = item.price;
    let itemDiscount = 0;
    
    // Apply product discount (seller set)
    if (item.productDiscount && item.productDiscount > 0) {
      itemDiscount = (item.price * item.productDiscount) / 100;
      itemPrice = item.price - itemDiscount;
    }
    
    // Apply product-specific coupon discount
    if (item.couponDiscount && item.couponDiscount > 0) {
      // ✅ Ensure coupon discount doesn't exceed item price
      const maxCouponDiscount = itemPrice;
      const actualCouponDiscount = Math.min(item.couponDiscount, maxCouponDiscount);
      itemPrice = itemPrice - actualCouponDiscount;
      productCouponDiscount += actualCouponDiscount;
    }
    
    // ✅ Ensure item total is not negative
    const itemTotal = Math.max(0, itemPrice * item.quantity);
    subtotal += item.totalPrice || itemTotal;
    
    // Store calculated total
    item.totalPrice = itemTotal;
  }
  
  // ✅ Update subtotal
  this.subtotal = Math.max(0, subtotal);
  
  // ✅ Update discount amounts
  this.discountAmount = discountAmount;
  
  // ✅ Ensure subtotal is not negative
  this.subtotal = Math.max(0, this.subtotal);
  
  // ✅ Calculate grand total with negative prevention
  this.totalPrice = Math.max(0, 
    this.subtotal + this.taxAmount + this.shippingAmount - this.discountAmount - this.couponDiscount
  );
  
  return this;
};

/**
 * ✅ Add item to cart
 */
cartSchema.methods.addItem = async function(product, quantity = 1) {
  // Check if item already exists in cart
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === product._id.toString()
  );
  
  if (existingItemIndex > -1) {
    // Update existing item
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].totalPrice = 
      this.items[existingItemIndex].price * this.items[existingItemIndex].quantity;
  } else {
    // Add new item
    this.items.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      comparePrice: product.comparePrice,
      quantity: quantity,
      image: product.image || product.images?.[0] || '',
      productDiscount: product.discount || 0,
      totalPrice: product.price * quantity,
    });
  }
  
  await this.calculateTotals();
  await this.save();
  return this;
};

/**
 * ✅ Update item quantity
 */
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const item = this.items.find(
    item => item.product.toString() === productId
  );
  
  if (!item) {
    throw new Error('Item not found in cart');
  }
  
  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    return this.removeItem(productId);
  }
  
  item.quantity = quantity;
  item.totalPrice = item.price * quantity;
  
  await this.calculateTotals();
  await this.save();
  return this;
};

/**
 * ✅ Remove item from cart
 */
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(
    item => item.product.toString() !== productId
  );
  
  await this.calculateTotals();
  await this.save();
  return this;
};

/**
 * ✅ Clear cart
 */
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.subtotal = 0;
  this.taxAmount = 0;
  this.shippingAmount = 0;
  this.discountAmount = 0;
  this.totalPrice = 0;
  this.couponCode = null;
  this.couponId = null;
  this.couponDiscount = 0;
  this.couponApplied = false;
  this.productCoupons = [];
  
  await this.save();
  return this;
};

/**
 * ✅ Apply global coupon to cart
 */
cartSchema.methods.applyCoupon = async function(coupon, orderTotal) {
  // Calculate discount
  const discountResult = coupon.calculateDiscount(orderTotal);
  
  this.couponCode = coupon.code;
  this.couponId = coupon._id;
  this.couponDiscount = discountResult.discountAmount;
  this.couponApplied = true;
  
  await this.calculateTotals();
  await this.save();
  
  return {
    discountAmount: discountResult.discountAmount,
    newTotal: discountResult.newTotal,
  };
};

/**
 * ✅ Apply product-specific coupon to cart
 */
cartSchema.methods.applyProductCoupon = async function(productId, couponCode, discountAmount) {
  // Check if product coupon already exists
  const existing = this.productCoupons.find(
    p => p.productId.toString() === productId.toString()
  );
  
  if (existing) {
    existing.couponCode = couponCode;
    existing.discountAmount = discountAmount;
  } else {
    this.productCoupons.push({
      productId,
      couponCode,
      discountAmount,
    });
  }
  
  // Update item's coupon discount
  const item = this.items.find(
    item => item.product.toString() === productId
  );
  
  if (item) {
    // ✅ Ensure coupon discount doesn't exceed item price
    const maxDiscount = item.price * item.quantity;
    item.couponDiscount = Math.min(discountAmount, maxDiscount);
  }
  
  await this.calculateTotals();
  await this.save();
  return this;
};

/**
 * ✅ Remove coupon from cart
 */
cartSchema.methods.removeCoupon = async function() {
  this.couponCode = null;
  this.couponId = null;
  this.couponDiscount = 0;
  this.couponApplied = false;
  this.productCoupons = [];
  
  // Reset item coupon discounts
  for (const item of this.items) {
    item.couponDiscount = 0;
  }
  
  await this.calculateTotals();
  await this.save();
  return this;
};

/**
 * ✅ Check if cart has items
 */
cartSchema.methods.isEmpty = function() {
  return this.items.length === 0;
};

/**
 * ✅ Get cart summary for checkout
 */
cartSchema.methods.getSummary = function() {
  return {
    items: this.items.map(item => ({
      productId: item.product,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
    })),
    subtotal: this.subtotal,
    taxAmount: this.taxAmount,
    shippingAmount: this.shippingAmount,
    discountAmount: this.discountAmount,
    couponCode: this.couponCode,
    couponDiscount: this.couponDiscount,
    totalPrice: this.totalPrice,
    itemCount: this.itemCount,
  };
};

// ============================================
// STATIC METHODS
// ============================================

/**
 * ✅ Get or create cart for user
 */
cartSchema.statics.getOrCreateCart = async function(userId) {
  let cart = await this.findOne({ user: userId });
  
  if (!cart) {
    cart = await this.create({
      user: userId,
      items: [],
      subtotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      totalPrice: 0,
    });
  }
  
  return cart;
};

// ============================================
// MIDDLEWARE
// ============================================

// ✅ Calculate totals before saving
cartSchema.pre('save', function(next) {
  this.calculateTotals();
  next();
});

// ============================================
// INDEXES
// ============================================

cartSchema.index({ user: 1 }, { unique: true });
cartSchema.index({ expiresAt: 1 });
cartSchema.index({ 'items.product': 1 });
cartSchema.index({ couponCode: 1 });

// ✅ Enable virtuals when converting to JSON
cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

export default mongoose.model('Cart', cartSchema);