import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Tag, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { applyCoupon, removeCoupon } from '../../store/slices/cartSlice';

const CartCoupon = () => {
  const dispatch = useDispatch();
  const { couponCode, couponDiscount, couponApplied } = useSelector((state) => state.cart);
  const [couponInput, setCouponInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ============================================
  // HANDLE APPLY COUPON
  // ============================================
  const handleApplyCoupon = async () => {
    const trimmedCode = couponInput.trim();
    
    if (!trimmedCode) {
      setError('Please enter a coupon code');
      return;
    }

    setIsApplying(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await dispatch(applyCoupon(trimmedCode)).unwrap();
      setSuccess(true);
      setCouponInput('');
      
      // Reset success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError(err || 'Invalid coupon code. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  // ============================================
  // HANDLE REMOVE COUPON
  // ============================================
  const handleRemoveCoupon = async () => {
    try {
      await dispatch(removeCoupon()).unwrap();
    } catch (err) {
      console.error('Failed to remove coupon:', err);
      setError('Failed to remove coupon. Please try again.');
    }
  };

  // ============================================
  // HANDLE ENTER KEY
  // ============================================
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyCoupon();
    }
  };

  // ============================================
  // CLEAR ERROR
  // ============================================
  const clearError = () => {
    setError(null);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
      <h3 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2 mb-3">
        <Tag className="h-4 w-4 text-indigo-600" />
        Apply Coupon
      </h3>

      {/* ✅ Coupon Applied */}
      {couponApplied && couponCode ? (
        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <div>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Coupon applied: {couponCode}
              </span>
              <span className="text-xs text-green-500 dark:text-green-300 ml-2">
                -${couponDiscount?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Remove
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* ✅ Coupon Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  setError(null);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter coupon code"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                disabled={isApplying}
              />
              {isApplying && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                </div>
              )}
            </div>
            <button
              onClick={handleApplyCoupon}
              disabled={isApplying || !couponInput.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 whitespace-nowrap"
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {/* ✅ Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-600 dark:text-green-400">
                Coupon applied successfully! 🎉
              </p>
            </div>
          )}

          {/* ✅ Error Message */}
          {error && (
            <div className="flex items-center justify-between gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* ✅ Coupon Tips */}
          <div className="mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 Enter a valid coupon code to get discounts on your order.
            </p>
          </div>
        </div>
      )}

      {/* ✅ Coupon Savings Summary (if coupon applied) */}
      {couponApplied && couponDiscount > 0 && (
        <div className="mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <p className="text-xs text-indigo-600 dark:text-indigo-400">
            🎉 You saved <span className="font-bold">${couponDiscount.toFixed(2)}</span> with this coupon!
          </p>
        </div>
      )}
    </div>
  );
};

export default CartCoupon;