import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================
// GET CART
// ============================================

export const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'name slug price images stock');

  if (!cart) {
    return res.status(200).json({
      success: true,
      data: {
        items: [],
        subtotal: 0,
        totalPrice: 0,
        itemCount: 0
      }
    });
  }

  res.status(200).json({
    success: true,
    data: cart
  });
});

// ============================================
// ADD TO CART
// ============================================

export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variation } = req.body;

  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (!product.isActive || !product.isPublished) {
    throw new AppError('This product is not available', 400);
  }

  if (product.stock < quantity) {
    throw new AppError(
      `Not enough stock. Available: ${product.stock}, Requested: ${quantity}`,
      400
    );
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // ✅ productId ကို String အနေနဲ့ နှိုင်းယှဉ်ပါ
  const productIdStr = String(productId);
  
  const existingItem = cart.items.find(item => {
    const itemProductId = item.product ? String(item.product) : '';
    return itemProductId === productIdStr;
  });

  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.totalPrice = existingItem.price * existingItem.quantity;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      quantity,
      image: product.images?.[0]?.url || '',
      variation,
      totalPrice: product.price * quantity
    });
  }

  // Calculate totals
  let subtotal = 0;
  cart.items.forEach(item => {
    subtotal += item.totalPrice;
  });
  cart.subtotal = subtotal;
  cart.totalPrice = subtotal;

  await cart.save();
  await cart.populate('items.product', 'name slug price images stock');

  res.status(200).json({
    success: true,
    message: 'Item added to cart successfully',
    data: cart
  });
});

// ============================================
// UPDATE CART ITEM
// ============================================

export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity, variation } = req.body;

  if (quantity === undefined || quantity < 0) {
    throw new AppError('Invalid quantity', 400);
  }

  // Product ကို ID နဲ့ရှာပါ
  const product = await Product.findById(productId);

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // ✅ productId ကို String အနေနဲ့ နှိုင်းယှဉ်ပါ
  const productIdStr = String(productId);
  
  console.log('updateCartItem - productId:', productIdStr);
  console.log('updateCartItem - cart items:', cart.items.map(item => ({
    product: item.product ? String(item.product) : '',
    quantity: item.quantity
  })));

  const itemIndex = cart.items.findIndex(item => {
    const itemProductId = item.product ? String(item.product) : '';
    return itemProductId === productIdStr;
  });

  console.log('updateCartItem - itemIndex:', itemIndex);

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  if (quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalPrice = cart.items[itemIndex].price * quantity;
  }

  // Recalculate totals
  let subtotal = 0;
  cart.items.forEach(item => {
    subtotal += item.totalPrice;
  });
  cart.subtotal = subtotal;
  cart.totalPrice = subtotal;

  await cart.save();
  await cart.populate('items.product', 'name slug price images stock');

  res.status(200).json({
    success: true,
    message: 'Cart updated successfully',
    data: cart
  });
});

// ============================================
// REMOVE FROM CART
// ============================================

export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { variation } = req.query;

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // ✅ productId ကို String အနေနဲ့ နှိုင်းယှဉ်ပါ
  const productIdStr = String(productId);
  
  console.log('removeFromCart - productId:', productIdStr);
  console.log('removeFromCart - cart items:', cart.items.map(item => ({
    product: item.product ? String(item.product) : '',
    quantity: item.quantity
  })));

  const itemIndex = cart.items.findIndex(item => {
    const itemProductId = item.product ? String(item.product) : '';
    return itemProductId === productIdStr;
  });

  console.log('removeFromCart - itemIndex:', itemIndex);

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  cart.items.splice(itemIndex, 1);

  // Recalculate totals
  let subtotal = 0;
  cart.items.forEach(item => {
    subtotal += item.totalPrice;
  });
  cart.subtotal = subtotal;
  cart.totalPrice = subtotal;

  await cart.save();
  await cart.populate('items.product', 'name slug price images stock');

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: cart
  });
});

// ============================================
// CLEAR CART
// ============================================

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  cart.items = [];
  cart.subtotal = 0;
  cart.totalPrice = 0;

  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Cart cleared successfully',
    data: {
      items: [],
      subtotal: 0,
      totalPrice: 0,
      itemCount: 0
    }
  });
});

// ============================================
// APPLY COUPON
// ============================================

export const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    throw new AppError('Please provide a coupon code', 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  if (cart.items.length === 0) {
    throw new AppError('Your cart is empty. Please add items first.', 400);
  }

  // TODO: Implement coupon validation with Coupon model
  const coupon = {
    code: couponCode,
    discountAmount: 10,
    discountType: 'fixed'
  };

  cart.couponCode = coupon.code;
  cart.couponDiscount = coupon.discountAmount;
  cart.discountAmount = coupon.discountAmount;
  cart.totalPrice = cart.subtotal - cart.discountAmount - cart.couponDiscount;

  await cart.save();
  await cart.populate('items.product', 'name slug price images stock');

  res.status(200).json({
    success: true,
    message: 'Coupon applied successfully',
    data: cart
  });
});

// ============================================
// REMOVE COUPON
// ============================================

export const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  cart.couponCode = null;
  cart.couponDiscount = 0;
  cart.discountAmount = 0;
  cart.totalPrice = cart.subtotal;

  await cart.save();
  await cart.populate('items.product', 'name slug price images stock');

  res.status(200).json({
    success: true,
    message: 'Coupon removed successfully',
    data: cart
  });
});

// ============================================
// MERGE GUEST CART
// ============================================

export const mergeGuestCart = asyncHandler(async (req, res) => {
  const { guestCartItems } = req.body;

  if (!guestCartItems || !Array.isArray(guestCartItems) || guestCartItems.length === 0) {
    throw new AppError('Please provide guest cart items', 400);
  }

  let userCart = await Cart.findOne({ user: req.user._id });

  if (!userCart) {
    userCart = new Cart({ user: req.user._id, items: [] });
  }

  for (const guestItem of guestCartItems) {
    const { productId, quantity, variation } = guestItem;

    const product = await Product.findById(productId);

    if (!product || !product.isActive || !product.isPublished) {
      continue;
    }

    const productIdStr = String(productId);
    
    const existingItem = userCart.items.find(item => {
      const itemProductId = item.product ? String(item.product) : '';
      return itemProductId === productIdStr;
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity <= product.stock && newQuantity <= 99) {
        existingItem.quantity = newQuantity;
        existingItem.totalPrice = existingItem.price * existingItem.quantity;
      }
    } else {
      if (quantity <= product.stock && quantity <= 99) {
        userCart.items.push({
          product: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          quantity: Math.min(quantity, product.stock),
          image: product.images?.[0]?.url || '',
          variation,
          totalPrice: product.price * quantity
        });
      }
    }
  }

  let subtotal = 0;
  userCart.items.forEach(item => {
    subtotal += item.totalPrice;
  });
  userCart.subtotal = subtotal;
  userCart.totalPrice = subtotal;

  await userCart.save();
  await userCart.populate('items.product', 'name slug price images stock');

  res.status(200).json({
    success: true,
    message: 'Guest cart merged successfully',
    data: userCart
  });
});

// ============================================
// BULK ADD TO CART
// ============================================

export const bulkAddToCart = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Please provide items to add', 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  let addedCount = 0;
  const errors = [];

  for (const item of items) {
    try {
      const { productId, quantity = 1, variation } = item;

      const product = await Product.findById(productId);

      if (!product || !product.isActive || !product.isPublished) {
        errors.push(`Product ${productId} not available`);
        continue;
      }

      if (product.stock < quantity) {
        errors.push(`Not enough stock for ${product.name}`);
        continue;
      }

      const productIdStr = String(productId);
      
      const existingItem = cart.items.find(cartItem => {
        const itemProductId = cartItem.product ? String(cartItem.product) : '';
        return itemProductId === productIdStr;
      });

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.totalPrice = existingItem.price * existingItem.quantity;
      } else {
        cart.items.push({
          product: product._id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          quantity,
          image: product.images?.[0]?.url || '',
          variation,
          totalPrice: product.price * quantity
        });
      }

      addedCount++;
    } catch (error) {
      errors.push(error.message);
    }
  }

  let subtotal = 0;
  cart.items.forEach(item => {
    subtotal += item.totalPrice;
  });
  cart.subtotal = subtotal;
  cart.totalPrice = subtotal;

  await cart.save();
  await cart.populate('items.product', 'name slug price images stock');

  res.status(200).json({
    success: true,
    message: `${addedCount} items added to cart${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
    data: {
      ...cart.toJSON(),
      errors: errors.length > 0 ? errors : undefined
    }
  });
});

// ============================================
// GET CART SUMMARY
// ============================================

export const getCartSummary = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    return res.status(200).json({
      success: true,
      data: {
        totalItems: 0,
        itemCount: 0,
        subtotal: 0,
        total: 0
      }
    });
  }

  res.status(200).json({
    success: true,
    data: {
      totalItems: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      itemCount: cart.items.length,
      subtotal: cart.subtotal,
      total: cart.totalPrice
    }
  });
});

// ============================================
// GET ABANDONED CARTS (Admin)
// ============================================

export const getAbandonedCarts = asyncHandler(async (req, res) => {
  const threshold = new Date();
  threshold.setHours(threshold.getHours() - 24);

  const carts = await Cart.find({
    isAbandoned: false,
    lastActive: { $lt: threshold },
    'items.0': { $exists: true }
  }).populate('user', 'name email');

  res.status(200).json({
    success: true,
    data: carts
  });
});

// ============================================
// GET CART STATISTICS (Admin)
// ============================================

export const getCartStats = asyncHandler(async (req, res) => {
  const stats = await Cart.aggregate([
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

  res.status(200).json({
    success: true,
    data: stats[0] || {
      totalCarts: 0,
      totalItems: 0,
      averageItems: 0,
      abandonedCarts: 0,
      totalValue: 0
    }
  });
});