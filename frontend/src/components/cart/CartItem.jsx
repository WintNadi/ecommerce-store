import React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, X } from 'lucide-react';
import { updateCartItem, removeFromCart } from '../../store/slices/cartSlice';

const CartItem = ({ item }) => {
  const dispatch = useDispatch();
  const { product, name, price, quantity, image, totalPrice, variation } = item;

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) {
      dispatch(removeFromCart({ productId: product, variation }));
      return;
    }
    dispatch(updateCartItem({ productId: product, quantity: newQuantity, variation }));
  };

  const handleRemove = () => {
    dispatch(removeFromCart({ productId: product, variation }));
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
      {/* Product Image */}
      <Link to={`/product/${product}`} className="flex-shrink-0">
        <img
          src={image || 'https://via.placeholder.com/100x100?text=No+Image'}
          alt={name}
          className="w-24 h-24 object-cover rounded-lg"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/product/${product}`}>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400">
            {name}
          </h3>
        </Link>
        {variation && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Variation: {variation.name}: {variation.option}
          </p>
        )}
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          ${price.toFixed(2)}
        </p>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleQuantityChange(quantity - 1)}
          className="p-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-8 text-center font-medium">{quantity}</span>
        <button
          onClick={() => handleQuantityChange(quantity + 1)}
          className="p-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Total Price */}
      <div className="text-right min-w-[80px]">
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          ${totalPrice.toFixed(2)}
        </p>
      </div>

      {/* Remove Button */}
      <button
        onClick={handleRemove}
        className="text-gray-400 hover:text-red-500 transition-colors"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
};

export default CartItem;