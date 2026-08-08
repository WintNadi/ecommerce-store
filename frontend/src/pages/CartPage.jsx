import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { getCart, clearCart, applyCoupon, removeCoupon, updateCartItem, removeFromCart } from '../store/slices/cartSlice';
import CartItem from '../components/cart/CartItem';
import { ShoppingCart, ArrowLeft, Tag, X, Loader2, Trash2, AlertCircle } from 'lucide-react';

const CartPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { 
    items, 
    subtotal, 
    taxAmount, 
    shippingAmount, 
    discountAmount, 
    couponCode, 
    couponDiscount, 
    totalPrice, 
    itemCount,
    isLoading,
    error,
    success
  } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [couponInput, setCouponInput] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getCart());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (success) {
      // Refresh cart after any update
      dispatch(getCart());
    }
  }, [success, dispatch]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    setCouponError('');
    try {
      await dispatch(applyCoupon(couponInput.trim())).unwrap();
      setCouponInput('');
      setCouponError('Coupon applied successfully!');
      setTimeout(() => setCouponError(''), 3000);
    } catch (error) {
      setCouponError(error.message || 'Invalid coupon code');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  const handleUpdateQuantity = (productId, quantity, variation) => {
    if (!productId) {
      console.error('Invalid productId:', productId);
      return;
    }
    
    if (quantity < 1) {
      dispatch(removeFromCart({ productId, variation }));
      return;
    }
    dispatch(updateCartItem({ productId, quantity, variation }));
  };

  // Calculate shipping
  const shippingCost = subtotal > 50 ? 0 : 5.99;
  const tax = subtotal * 0.05;
  const finalTotal = subtotal + shippingCost + tax - discountAmount - couponDiscount;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your cart is empty</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please login to view your cart and start shopping.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/shop"
              className="px-6 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your cart is empty</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Looks like you haven't added any items to your cart yet.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Shopping Cart ({itemCount} items)
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleClearCart}
              className="text-sm text-red-500 hover:text-red-600 transition-colors flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cart
            </button>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              {items.map((item, index) => (
                <CartItem key={index} item={item} />
              ))}
            </div>

            {/* Coupon Section */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Apply Coupon
              </h3>
              {couponCode ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Coupon applied: {couponCode}
                    </span>
                    <span className="ml-2 text-sm text-green-600 dark:text-green-300">
                      -${couponDiscount.toFixed(2)}
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Enter coupon code"
                      value={couponInput}
                      onChange={(e) => {
                        setCouponInput(e.target.value);
                        setCouponError('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                    {couponError && (
                      <p className={`mt-1 text-sm ${couponError.includes('success') ? 'text-green-500' : 'text-red-500'}`}>
                        {couponError}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1 whitespace-nowrap"
                  >
                    {applyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${tax.toFixed(2)}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Coupon: {couponCode}</span>
                    <span>-${couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-indigo-600 dark:text-indigo-400">
                      ${finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={items.length === 0}
                className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>

              <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
                Shipping and taxes calculated at checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;