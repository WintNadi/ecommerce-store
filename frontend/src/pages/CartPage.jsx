import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  Tag,
  X
} from 'lucide-react';
import { getCart, updateCartItem, removeFromCart, clearCart } from '../store/slices/cartSlice';
import CartCoupon from '../components/cart/CartCoupon';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, subtotal, totalPrice, itemCount, isLoading, error, shippingAmount, couponDiscount, couponApplied, couponCode } = useSelector(
    (state) => state.cart
  );
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ✅ Fetch cart on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getCart());
    } else {
      navigate('/login', { state: { from: '/cart' } });
    }
  }, [dispatch, isAuthenticated, navigate]);

  // ✅ Calculate cart totals
  const subtotalAmount = subtotal || 0;
  const shippingCost = shippingAmount || 5.99;
  const couponDiscountValue = couponDiscount || 0;
  const taxAmount = 0; // Tax calculation can be added here
  const totalAmount = Math.max(0, subtotalAmount + shippingCost + taxAmount - couponDiscountValue);

  // ✅ Handle quantity change
  const handleQuantityChange = async (productId, newQuantity) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    setUpdatingItem(productId);

    try {
      await dispatch(updateCartItem({ productId, quantity: newQuantity })).unwrap();
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setIsUpdating(false);
      setUpdatingItem(null);
    }
  };

  // ✅ Handle remove item
  const handleRemoveItem = async (productId) => {
    if (!window.confirm('Remove this item from your cart?')) return;

    setIsUpdating(true);
    setUpdatingItem(productId);

    try {
      await dispatch(removeFromCart(productId)).unwrap();
    } catch (error) {
      console.error('Failed to remove item:', error);
    } finally {
      setIsUpdating(false);
      setUpdatingItem(null);
    }
  };

  // ✅ Handle clear cart
  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your cart?')) return;

    try {
      await dispatch(clearCart()).unwrap();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  // ✅ Handle checkout
  const handleCheckout = () => {
    if (items.length === 0) return;
    navigate('/checkout');
  };

  // ✅ Handle continue shopping
  const handleContinueShopping = () => {
    navigate('/shop');
  };

  // ✅ Loading state
  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // ✅ Empty cart state
  if (!isLoading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-12">
            <ShoppingCart className="h-20 w-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Looks like you haven't added any items to your cart yet.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
              <AlertCircle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">Error loading cart</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <button
              onClick={() => dispatch(getCart())}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-indigo-600" />
              Shopping Cart
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {itemCount} item{itemCount !== 1 ? 's' : ''} in your cart
            </p>
          </div>
          <button
            onClick={handleContinueShopping}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Cart Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              {/* Cart Items List */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item) => {
                  const productId = item.product?._id || item.productId;
                  const isUpdatingThisItem = updatingItem === productId && isUpdating;

                  return (
                    <div key={productId} className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Product Image */}
                        <Link
                          to={`/product/${productId}`}
                          className="flex-shrink-0 w-full sm:w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                        >
                          <img
                            src={item.image || item.product?.images?.[0] || '/images/placeholder.svg'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/images/placeholder.svg';
                            }}
                          />
                        </Link>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product/${productId}`}
                            className="text-base font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {item.name}
                          </Link>
                          {item.variation && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Variation: {item.variation}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Price: ${item.price?.toFixed(2) || '0.00'}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(productId, (item.quantity || 1) - 1)}
                                disabled={isUpdatingThisItem || (item.quantity || 1) <= 1}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-10 text-center text-sm font-medium">
                                {isUpdatingThisItem ? (
                                  <Loader2 className="h-4 w-4 animate-spin mx-auto text-indigo-600" />
                                ) : (
                                  item.quantity || 1
                                )}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(productId, (item.quantity || 1) + 1)}
                                disabled={isUpdatingThisItem}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>

                            <button
                              onClick={() => handleRemoveItem(productId)}
                              disabled={isUpdatingThisItem}
                              className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Item Total */}
                        <div className="sm:text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            ${(item.price * (item.quantity || 1)).toFixed(2)}
                          </p>
                          {item.comparePrice && item.comparePrice > item.price && (
                            <p className="text-sm text-gray-400 line-through">
                              ${(item.comparePrice * (item.quantity || 1)).toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Cart Actions */}
              {items.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Clear Cart
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${subtotalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${shippingCost.toFixed(2)}
                  </span>
                </div>

                {couponApplied && couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span>Coupon Discount</span>
                    <span>-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* ✅ Coupon Section */}
                <CartCoupon />
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={items.length === 0 || isUpdating}
                className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Updating...
                  </span>
                ) : (
                  'Proceed to Checkout'
                )}
              </button>

              {couponApplied && couponDiscount > 0 && (
                <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400 text-center">
                    🎉 You saved ${couponDiscount.toFixed(2)} with coupon!
                  </p>
                </div>
              )}

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>✅ Free shipping on orders over $50</p>
                <p>🛡️ Secure checkout with SSL encryption</p>
                <p>🔄 30-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </div>

        {/* Clear Cart Confirmation Modal */}
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Clear Cart
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to remove all items from your cart? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearCart}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;