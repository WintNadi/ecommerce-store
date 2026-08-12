import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { AppError } from '../middleware/errorHandler.js';

// ============================================
// GET CART
// ============================================

/**
 * @desc    Get current user's cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'name price images stock discount');

  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [],
      subtotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      totalPrice: 0,
    });
  }

  // ✅ Ensure cart totals are calculated correctly
  await cart.calculateTotals();
  await cart.save();

  res.status(200).json({
    success: true,
    data: cart,
  });
});

// ============================================
// ADD ITEM TO CART
// ============================================

/**
 * @desc    Add item to cart
 * @route   POST /api/cart
 * @access  Private
 */
export const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;

  // ✅ Validate product
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // ✅ Check stock
  if (!product.checkStock(quantity)) {
    throw new AppError(`Not enough stock. Available: ${product.stock}`, 400);
  }

  // ✅ Get or create cart
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({
      user: req.user._id,
      items: [],
      subtotal: 0,
      taxAmount: 0,
      shippingAmount: 0,
      discountAmount: 0,
      totalPrice: 0,
    });
  }

  // ✅ Check if item already in cart
  const existingItemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );

  if (existingItemIndex > -1) {
    // Update existing item quantity
    const newQuantity = cart.items[existingItemIndex].quantity + quantity;
    
    // ✅ Check stock for updated quantity
    if (!product.checkStock(newQuantity)) {
      throw new AppError(`Not enough stock. Available: ${product.stock}`, 400);
    }
    
    cart.items[existingItemIndex].quantity = newQuantity;
    cart.items[existingItemIndex].totalPrice = product.price * newQuantity;
  } else {
    // ✅ Add new item
    cart.items.push({
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

  // ✅ Recalculate totals
  await cart.calculateTotals();
  await cart.save();

  // ✅ Populate product details
  await cart.populate('items.product', 'name price images stock');

  res.status(200).json({
    success: true,
    message: 'Item added to cart',
    data: cart,
  });
});

// ============================================
// UPDATE CART ITEM QUANTITY
// ============================================

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/:productId
 * @access  Private
 */
export const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  // ✅ Validate quantity
  if (quantity < 0) {
    throw new AppError('Quantity cannot be negative', 400);
  }

  // ✅ Get cart
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // ✅ Find item
  const itemIndex = cart.items.findIndex(
    item => item.product.toString() === productId
  );

  if (itemIndex === -1) {
    throw new AppError('Item not found in cart', 404);
  }

  // ✅ If quantity is 0, remove item
  if (quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    // ✅ Check stock
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    if (!product.checkStock(quantity)) {
      throw new AppError(`Not enough stock. Available: ${product.stock}`, 400);
    }

    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].totalPrice = cart.items[itemIndex].price * quantity;
  }

  // ✅ Recalculate totals
  await cart.calculateTotals();
  await cart.save();

  // ✅ Populate product details
  await cart.populate('items.product', 'name price images stock');

  res.status(200).json({
    success: true,
    message: 'Cart updated',
    data: cart,
  });
});

// ============================================
// REMOVE ITEM FROM CART
// ============================================

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/:productId
 * @access  Private
 */
export const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // ✅ Remove item
  cart.items = cart.items.filter(
    item => item.product.toString() !== productId
  );

  // ✅ Recalculate totals
  await cart.calculateTotals();
  await cart.save();

  // ✅ Populate product details
  await cart.populate('items.product', 'name price images stock');

  res.status(200).json({
    success: true,
    message: 'Item removed from cart',
    data: cart,
  });
});

// ============================================
// CLEAR CART
// ============================================

/**
 * @desc    Clear all items from cart
 * @route   DELETE /api/cart
 * @access  Private
 */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  await cart.clearCart();

  res.status(200).json({
    success: true,
    message: 'Cart cleared',
    data: cart,
  });
});

// ============================================
// APPLY COUPON TO CART
// ============================================

/**
 * @desc    Apply coupon to cart
 * @route   POST /api/cart/apply-coupon
 * @access  Private
 */
export const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;

  if (!couponCode) {
    throw new AppError('Please provide a coupon code', 400);
  }

  // ✅ Get cart
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    throw new AppError('Your cart is empty', 400);
  }

  // ✅ Calculate current cart total
  const cartTotal = cart.subtotal + cart.taxAmount + cart.shippingAmount;

  // ✅ Find and validate coupon
  const result = await Coupon.findValidCoupon(couponCode, req.user._id);
  if (!result.valid) {
    throw new AppError(result.reason || 'Invalid coupon', 400);
  }

  const coupon = result.coupon;

  // ✅ Check if coupon applies to items in cart
  // For now, check if coupon applies to all items
  // If coupon is product-specific, we need to check each item
  let applicableItems = cart.items;
  
  if (coupon.appliesTo === 'product') {
    applicableItems = cart.items.filter(item => 
      coupon.productIds.some(id => id.toString() === item.product.toString())
    );
    if (applicableItems.length === 0) {
      throw new AppError('Coupon does not apply to any items in your cart', 400);
    }
  }

  if (coupon.appliesTo === 'category') {
    // Get product categories and check
    // This is simplified - you should check product categories
    // For now, we'll check all items
    applicableItems = cart.items;
  }

  // ✅ Check minimum order amount
  if (cartTotal < coupon.minOrderAmount) {
    throw new AppError(`Minimum order amount for this coupon is $${coupon.minOrderAmount.toFixed(2)}`, 400);
  }

  // ✅ Calculate discount
  const discountResult = coupon.calculateDiscount(cartTotal);
  const discountAmount = discountResult.discountAmount;

  // ✅ Apply coupon to cart
  cart.couponCode = coupon.code;
  cart.couponId = coupon._id;
  cart.couponDiscount = discountAmount;
  cart.couponApplied = true;

  // ✅ Recalculate totals
  await cart.calculateTotals();
  await cart.save();

  // ✅ Record coupon usage (will be done when order is placed)
  // For now, we just apply it to the cart

  res.status(200).json({
    success: true,
    message: 'Coupon applied successfully',
    data: {
      coupon: coupon.code,
      discountAmount: discountAmount,
      newTotal: cart.grandTotal,
      cart: cart,
    },
  });
});

// ============================================
// REMOVE COUPON FROM CART
// ============================================

/**
 * @desc    Remove coupon from cart
 * @route   DELETE /api/cart/remove-coupon
 * @access  Private
 */
export const removeCoupon = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  await cart.removeCoupon();

  res.status(200).json({
    success: true,
    message: 'Coupon removed successfully',
    data: cart,
  });
});

// ============================================
// APPLY PRODUCT-SPECIFIC COUPON
// ============================================

/**
 * @desc    Apply product-specific coupon to cart
 * @route   POST /api/cart/apply-product-coupon
 * @access  Private
 */
export const applyProductCoupon = asyncHandler(async (req, res) => {
  const { productId, couponCode } = req.body;

  if (!productId || !couponCode) {
    throw new AppError('Product ID and coupon code are required', 400);
  }

  // ✅ Get product
  const product = await Product.findById(productId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // ✅ Validate product coupon
  const couponValidation = product.isCouponValid(couponCode);
  if (!couponValidation.valid) {
    throw new AppError(couponValidation.reason || 'Invalid coupon', 400);
  }

  const coupon = couponValidation.coupon;

  // ✅ Get cart
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // ✅ Find item in cart
  const item = cart.items.find(
    item => item.product.toString() === productId
  );
  if (!item) {
    throw new AppError('Product not found in cart', 404);
  }

  // ✅ Calculate discount for this product
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (item.price * coupon.discountValue) / 100;
  } else {
    discountAmount = Math.min(coupon.discountValue, item.price);
  }

  // ✅ Apply coupon to item
  item.couponDiscount = discountAmount;
  
  // ✅ Store product coupon in cart
  const existingCouponIndex = cart.productCoupons.findIndex(
    p => p.productId.toString() === productId
  );
  
  if (existingCouponIndex > -1) {
    cart.productCoupons[existingCouponIndex].couponCode = couponCode;
    cart.productCoupons[existingCouponIndex].discountAmount = discountAmount;
  } else {
    cart.productCoupons.push({
      productId,
      couponCode,
      discountAmount,
    });
  }

  // ✅ Recalculate totals
  await cart.calculateTotals();
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Product coupon applied successfully',
    data: {
      coupon: couponCode,
      discountAmount: discountAmount,
      cart: cart,
    },
  });
});

// ============================================
// UPDATE SHIPPING METHOD
// ============================================

/**
 * @desc    Update shipping method
 * @route   PUT /api/cart/shipping
 * @access  Private
 */
export const updateShippingMethod = asyncHandler(async (req, res) => {
  const { shippingMethod, shippingAddress } = req.body;

  const shippingCosts = {
    standard: 5.99,
    express: 12.99,
    international: 25.99,
  };

  // ✅ Validate shipping method
  if (!shippingMethod || !shippingCosts[shippingMethod]) {
    throw new AppError('Invalid shipping method', 400);
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  // ✅ Update shipping
  cart.shippingMethod = shippingMethod;
  cart.shippingAmount = shippingCosts[shippingMethod];

  if (shippingAddress) {
    cart.shippingAddress = shippingAddress;
  }

  // ✅ Recalculate totals
  await cart.calculateTotals();
  await cart.save();

  res.status(200).json({
    success: true,
    message: 'Shipping method updated',
    data: cart,
  });
});

// ============================================
// GET CART SUMMARY
// ============================================

/**
 * @desc    Get cart summary for checkout
 * @route   GET /api/cart/summary
 * @access  Private
 */
export const getCartSummary = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id })
    .populate('items.product', 'name price images stock');

  if (!cart) {
    return res.status(200).json({
      success: true,
      data: {
        items: [],
        subtotal: 0,
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        totalPrice: 0,
        itemCount: 0,
      },
    });
  }

  // ✅ Ensure totals are calculated
  await cart.calculateTotals();

  res.status(200).json({
    success: true,
    data: cart.getSummary(),
  });
});

// ============================================
// GET CART TOTAL
// ============================================

/**
 * @desc    Get cart total (for checkout)
 * @route   GET /api/cart/total
 * @access  Private
 */
export const getCartTotal = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });

  if (!cart || cart.items.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        subtotal: 0,
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        couponDiscount: 0,
        totalPrice: 0,
        itemCount: 0,
      },
    });
  }

  // ✅ Ensure totals are calculated
  await cart.calculateTotals();

  res.status(200).json({
    success: true,
    data: {
      subtotal: cart.subtotal,
      taxAmount: cart.taxAmount,
      shippingAmount: cart.shippingAmount,
      discountAmount: cart.discountAmount,
      couponCode: cart.couponCode,
      couponDiscount: cart.couponDiscount,
      totalPrice: cart.totalPrice,
      itemCount: cart.itemCount,
    },
  });
});