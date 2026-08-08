import React from 'react';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus } from 'lucide-react';
import { updateCartItem, removeFromCart } from '../../store/slices/cartSlice';

const CartItem = ({ item }) => {
  const dispatch = useDispatch();
  const { product, name, price, quantity, image, totalPrice, variation } = item;

  // ✅ productId ကိုသေချာယူပါ
  let productId;
  if (product && typeof product === 'object') {
    // product က Object ဖြစ်နေရင် _id ကိုယူပါ
    productId = product._id || product.id;
  } else if (product) {
    // product က String ဖြစ်နေရင် အဲဒီအတိုင်းသုံးပါ
    productId = product;
  }

  // ✅ productId ကို String အနေနဲ့ သေချာယူပါ
  const productIdStr = productId ? String(productId) : null;

  console.log('CartItem - product:', product);
  console.log('CartItem - productId:', productIdStr);
  console.log('CartItem - name:', name);
  console.log('CartItem - quantity:', quantity);

  const handleQuantityChange = (newQuantity) => {
    if (!productIdStr) {
      console.error('Invalid productId:', productIdStr);
      return;
    }
    
    if (newQuantity < 1) {
      dispatch(removeFromCart({ productId: productIdStr, variation }));
      return;
    }
    dispatch(updateCartItem({ productId: productIdStr, quantity: newQuantity, variation }));
  };

  const handleRemove = () => {
    if (!productIdStr) {
      console.error('Invalid productId:', productIdStr);
      return;
    }
    console.log('Removing item with productId:', productIdStr);
    dispatch(removeFromCart({ productId: productIdStr, variation }));
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
      {/* Product Image */}
      <Link to={`/product/${productIdStr}`} className="flex-shrink-0">
        <img
          src={image || 'https://via.placeholder.com/100x100?text=No+Image'}
          alt={name}
          className="w-24 h-24 object-cover rounded-lg"
        />
      </Link>

      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <Link to={`/product/${productIdStr}`}>
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