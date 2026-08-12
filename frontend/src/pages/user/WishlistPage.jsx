import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Trash2 } from 'lucide-react';
import { getWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { addToCart } from '../../store/slices/cartSlice';

const WishlistPage = () => {
  const dispatch = useDispatch();
  const { items: wishlistItems, isLoading } = useSelector((state) => state.wishlist);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [addingToCart, setAddingToCart] = useState({});

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getWishlist());
    }
  }, [dispatch, isAuthenticated]);

  // ✅ Universal image URL handler
  const getImageUrl = (product) => {
    if (!product) return '/images/placeholder.svg';
    
    // Check images array
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === 'string' && firstImage.startsWith('http')) {
        return firstImage;
      }
      if (firstImage?.url && firstImage.url.startsWith('http')) {
        return firstImage.url;
      }
    }
    
    // Fallback to single image
    if (product.image && typeof product.image === 'string' && product.image.startsWith('http')) {
      return product.image;
    }
    
    // ✅ Use local placeholder
    return '/images/placeholder.svg';
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await dispatch(removeFromWishlist(productId)).unwrap();
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const handleAddToCart = async (productId, product) => {
    setAddingToCart(prev => ({ ...prev, [productId]: true }));
    try {
      await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
      // Optionally remove from wishlist after adding to cart
      // await dispatch(removeFromWishlist(productId)).unwrap();
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setAddingToCart(prev => ({ ...prev, [productId]: false }));
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Wishlist is Private</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Please login to view your wishlist.</p>
          <Link to="/login" className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!wishlistItems || wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Wishlist is Empty</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Save your favorite items here.</p>
            <Link to="/shop" className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Heart className="h-6 w-6 text-red-500" />
              My Wishlist
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {wishlistItems.length} items in your wishlist
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => {
            const product = item.product || item;
            const productId = product._id || product.id;
            
            return (
              <div key={productId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <Link to={`/product/${productId}`}>
                  <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={getImageUrl(product)}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = '/images/placeholder.svg';
                      }}
                    />
                  </div>
                </Link>
                
                <div className="p-4">
                  <Link to={`/product/${productId}`}>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ${product.price?.toFixed(2)}
                    </span>
                    {product.comparePrice && product.comparePrice > product.price && (
                      <span className="text-sm text-gray-400 line-through">
                        ${product.comparePrice?.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {product.rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < Math.floor(product.rating || 0)
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({product.numReviews || 0})
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleAddToCart(productId, product)}
                      disabled={addingToCart[productId]}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {addingToCart[productId] ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => handleRemoveFromWishlist(productId)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WishlistPage;