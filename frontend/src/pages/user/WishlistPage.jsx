import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import { getWishlist, removeFromWishlist, addToCart } from '../../store/slices/wishlistSlice';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { items, isLoading, error } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getWishlist());
    }
  }, [dispatch, isAuthenticated]);

  const handleRemoveFromWishlist = (productId) => {
    dispatch(removeFromWishlist(productId));
  };

  const handleAddToCart = async (productId) => {
    await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Wishlist</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Please login to view your wishlist.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500 fill-red-500" />
            My Wishlist
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {items?.length || 0} items
          </span>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {items && items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((product) => (
              <div
                key={product._id || product.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
              >
                <Link to={`/product/${product._id || product.id}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={product.images?.[0]?.url || 'https://via.placeholder.com/300x300?text=No+Image'}
                      alt={product.name || 'Product'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFromWishlist(product._id || product.id);
                      }}
                      className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/product/${product._id || product.id}`}>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate">
                      {product.name || 'Product'}
                    </h3>
                  </Link>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {/* ✅ price ရှိမှပြပါ */}
                      ${product.price?.toFixed(2) || '0.00'}
                    </span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        ${product.comparePrice?.toFixed(2) || '0.00'}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAddToCart(product._id || product.id)}
                    className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <Heart className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your wishlist is empty</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Start adding your favorite products to your wishlist!
            </p>
            <Link
              to="/shop"
              className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;