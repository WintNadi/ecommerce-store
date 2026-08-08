import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

const CartSummary = () => {
  const { items, subtotal, totalPrice, itemCount } = useSelector((state) => state.cart);

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
        <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Your cart is empty</p>
        <Link
          to="/shop"
          className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
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
            ${subtotal > 50 ? '0.00' : '5.99'}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Tax</span>
          <span className="text-gray-900 dark:text-white font-medium">
            ${(subtotal * 0.05).toFixed(2)}
          </span>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-indigo-600 dark:text-indigo-400">
              ${(subtotal + (subtotal > 50 ? 0 : 5.99) + subtotal * 0.05).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <Link
        to="/checkout"
        className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Proceed to Checkout
      </Link>

      <p className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
        {itemCount} items in cart
      </p>
    </div>
  );
};

export default CartSummary;