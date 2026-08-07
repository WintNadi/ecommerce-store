import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    items: [
      {
        // ✅ product ကို ObjectId အနေနဲ့ သိမ်းပါ
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
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
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

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ isAbandoned: 1, lastActive: -1 });
cartSchema.index({ 'items.product': 1 });

// Pre-save middleware
cartSchema.pre('save', function (next) {
  let subtotal = 0;
  this.items.forEach(item => {
    item.totalPrice = item.price * item.quantity;
    subtotal += item.totalPrice;
  });
  this.subtotal = subtotal;
  this.totalPrice = subtotal + this.taxAmount + this.shippingAmount - this.discountAmount - this.couponDiscount;
  this.lastActive = new Date();
  next();
});

// Instance methods
cartSchema.methods.addItem = async function (product, quantity = 1, variation = null) {
  // ✅ product._id ကို သိမ်းပါ
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

cartSchema.methods.removeItem = async function (productId, variation = null) {
  // ✅ productId ကို String အနေနဲ့ နှိုင်းယှဉ်ပါ
  this.items = this.items.filter(
    item =>
      !(item.product.toString() === productId.toString() &&
        JSON.stringify(item.variation) === JSON.stringify(variation))
  );
  return this.save();
};

cartSchema.methods.updateQuantity = async function (productId, quantity, variation = null) {
  // ✅ productId ကို String အနေနဲ့ နှိုင်းယှဉ်ပါ
  const item = this.items.find(
    item =>
      item.product.toString() === productId.toString() &&
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

cartSchema.methods.clearCart = async function () {
  this.items = [];
  return this.save();
};

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

cartSchema.methods.isEmpty = function () {
  return this.items.length === 0;
};

// Static methods
cartSchema.statics.getOrCreateCart = async function (userId) {
  let cart = await this.findOne({ user: userId });

  if (!cart) {
    cart = new this({ user: userId });
    await cart.save();
  }

  return cart;
};

cartSchema.statics.getAbandonedCarts = async function () {
  const threshold = new Date();
  threshold.setHours(threshold.getHours() - 24);

  return this.find({
    isAbandoned: false,
    lastActive: { $lt: threshold },
    'items.0': { $exists: true }
  }).populate('user', 'name email');
};

// Virtual properties
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

cartSchema.virtual('hasItems').get(function () {
  return this.items.length > 0;
});

// ToJSON transform
cartSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;