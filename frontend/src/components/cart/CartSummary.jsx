import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ShoppingCart, Truck, Shield, CheckCircle, Tag, Loader2 } from 'lucide-react';
import CartCoupon from './CartCoupon';

const CartSummary = ({ isLoading = false, onCheckout }) => {
  const navigate = useNavigate();
  const {
    items,
    subtotal,
    shippingAmount,
    taxAmount,
    discountAmount,
    couponDiscount,
    couponApplied,
    couponCode,
    totalPrice,
    itemCount
  } = useSelector((state) => state.cart);

  // ✅ Calculate totals with negative prevention
  const subtotalAmount = subtotal || 0;
  const shippingCost = shippingAmount || 0;
  const taxAmountValue = taxAmount || 0;
  const couponDiscountValue = couponDiscount || 0;
  const discountAmountValue = discountAmount || 0;
  
  // ✅ PREVENT NEGATIVE TOTAL
  const totalAmount = Math.max(0, subtotalAmount + shippingCost + taxAmountValue - discountAmountValue - couponDiscountValue);
  const totalSavings = discountAmountValue + couponDiscountValue;

  // ✅ Handle checkout
  const handleCheckout = () => {
    if (items.length === 0) return;
    if (onCheckout) {
      onCheckout();
    } else {
      navigate('/checkout');
    }
  };

  // ✅ Handle continue shopping
  const handleContinueShopping = () => {
    navigate('/shop');
  };

  // ✅ Get free shipping threshold
  const freeShippingThreshold = 50;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotalAmount);
  const isFreeShippingEligible = subtotalAmount >= freeShippingThreshold;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sticky top-4">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-indigo-600" />
        Order Summary
      </h2>

      {/* ✅ Free shipping progress */}
      {!isFreeShippingEligible && subtotalAmount > 0 && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Free shipping on orders over ${freeShippingThreshold}</span>
            <span>${remainingForFreeShipping.toFixed(2)} away</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (subtotalAmount / freeShippingThreshold) * 100)}%`
              }}
            />
          </div>
        </div>
      )}

      {/* ✅ Cart items count */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
        <span>Items ({itemCount || 0})</span>
        <span className="font-medium text-gray-900 dark:text-white">
          {itemCount || 0}
        </span>
      </div>

      {/* ✅ Totals */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
          <span className="text-gray-900 dark:text-white font-medium">
            ${subtotalAmount.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Shipping</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {isFreeShippingEligible ? (
              <span className="text-green-600 dark:text-green-400">Free</span>
            ) : (
              `$${shippingCost.toFixed(2)}`
            )}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Tax</span>
          <span className="text-gray-900 dark:text-white font-medium">
            ${taxAmountValue.toFixed(2)}
          </span>
        </div>

        {discountAmountValue > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
            <span>Product Discount</span>
            <span>-${discountAmountValue.toFixed(2)}</span>
          </div>
        )}

        {couponApplied && couponDiscountValue > 0 && (
          <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              <span>Coupon ({couponCode})</span>
            </div>
            <span>-${couponDiscountValue.toFixed(2)}</span>
          </div>
        )}

        {/* ✅ Total savings */}
        {totalSavings > 0 && (
          <div className="flex justify-between text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
            <span>Total Savings</span>
            <span className="font-bold">${totalSavings.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-2">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              ${totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Coupon Section */}
      <div className="mt-4">
        <CartCoupon />
      </div>

      {/* ✅ Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={items.length === 0 || isLoading}
        className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Updating...
          </>
        ) : (
          'Proceed to Checkout'
        )}
      </button>

      {/* ✅ Continue Shopping */}
      <button
        onClick={handleContinueShopping}
        className="w-full mt-2 px-6 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
      >
        Continue Shopping
      </button>

      {/* ✅ Trust badges */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-1">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Truck className="h-4 w-4 text-indigo-500" />
          <span>Free shipping on orders over ${freeShippingThreshold}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Shield className="h-4 w-4 text-indigo-500" />
          <span>Secure checkout with SSL encryption</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <CheckCircle className="h-4 w-4 text-indigo-500" />
          <span>30-day money-back guarantee</span>
        </div>
      </div>

      {/* ✅ Coupon savings summary */}
      {couponApplied && couponDiscountValue > 0 && (
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-xs text-green-600 dark:text-green-400 text-center flex items-center justify-center gap-1">
            <CheckCircle className="h-3 w-3" />
            🎉 You saved <span className="font-bold">${couponDiscountValue.toFixed(2)}</span> with coupon!
          </p>
        </div>
      )}

      {/* ✅ Out of stock warning (if any) */}
      {items.some(item => item.stock === 0) && (
        <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
            ⚠️ Some items in your cart are out of stock. Please remove them before checkout.
          </p>
        </div>
      )}
    </div>
  );
};

export default CartSummary;