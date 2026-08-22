import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Star, Clock } from 'lucide-react';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist, getWishlist } from '../../store/slices/wishlistSlice';
import toast from 'react-hot-toast';

const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const [isAdded, setIsAdded] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // ✅ product ကို စစ်ပါ
  if (!product) {
    console.warn('ProductCard: product is null or undefined');
    return null;
  }

  // ✅ productId ကိုယူပါ
  const productId = product.id || product._id;

  if (!productId) {
    console.warn('ProductCard: No product ID found. Product:', product);
    return null;
  }

  // ✅ Extract product data with fallbacks
  const {
    name = 'Product',
    price = 0,
    comparePrice,
    images = [],
    rating = 0,
    numReviews = 0,
    stock = 0,
    discount = 0,
    isPublished = false,
    isActive = false
  } = product;

  // ✅ Universal image URL handler with local fallback
  const getImageUrl = () => {
    if (!product) return '/images/placeholder.svg';
    
    // Check images array first
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      // If it's a string URL
      if (typeof firstImage === 'string' && firstImage.startsWith('http')) {
        return firstImage;
      }
      // If it's an object with a url property
      if (firstImage?.url && firstImage.url.startsWith('http')) {
        return firstImage.url;
      }
    }
    
    // Fallback to single image field
    if (product.image && typeof product.image === 'string' && product.image.startsWith('http')) {
      return product.image;
    }
    
    // ✅ Use local placeholder instead of external
    return '/images/placeholder.svg';
  };

  const imageUrl = getImageUrl();

  const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price;
  const isOnSale = discount > 0;
  const isOutOfStock = stock === 0;
  const isNotAvailable = !isPublished || !isActive;

  // Check if product is in wishlist
  useEffect(() => {
    if (wishlistItems && wishlistItems.length > 0) {
      const found = wishlistItems.some(item => item.id === productId || item._id === productId);
      setIsInWishlist(found);
    } else {
      setIsInWishlist(false);
    }
  }, [wishlistItems, productId]);

  // Load wishlist on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(getWishlist());
    }
  }, [dispatch, isAuthenticated]);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (isNotAvailable || isOutOfStock) {
      toast.error('This product is not available');
      return;
    }

    try {
      await dispatch(addToCart({ productId: productId, quantity: 1 })).unwrap();
      setIsAdded(true);
      toast.success('Added to cart! 🛒');
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(productId)).unwrap();
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(productId)).unwrap();
        setIsInWishlist(true);
        toast.success('Added to wishlist ❤️');
      }
      await dispatch(getWishlist());
    } catch (error) {
      console.error('Wishlist error:', error);
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 dark:border-gray-700">
      <Link to={`/product/${productId}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              console.error('❌ Image failed to load:', imageUrl);
              e.target.src = '/images/placeholder.svg';
            }}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isOnSale && (
              <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                {Math.round(discount)}% OFF
              </span>
            )}
            {isOutOfStock && (
              <span className="px-2 py-1 text-xs font-semibold text-white bg-gray-700 rounded">
                Out of Stock
              </span>
            )}
            {isNotAvailable && !isOutOfStock && (
              <span className="px-2 py-1 text-xs font-semibold text-white bg-navy-500 dark:bg-navy-600 rounded flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Coming Soon
              </span>
            )}
          </div>

          {/* Wishlist Button - Navy + Orange theme */}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-gray-800/80 rounded-full hover:bg-white dark:hover:bg-gray-700 transition-colors z-10 shadow-sm"
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart 
              className={`h-4 w-4 transition-colors ${
                isInWishlist 
                  ? 'text-red-500 fill-red-500' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-orange-500'
              }`} 
            />
          </button>
        </div>

        <div className="p-4">
          {/* Product Name - Navy hover */}
          <h3 className="text-sm font-medium text-gray-900 dark:text-white hover:text-navy-600 dark:hover:text-navy-400 truncate transition-colors">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center mt-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-3 w-3 ${
                    i < Math.floor(rating || 0)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              ))}
            </div>
            <span className="ml-1 text-xs text-gray-500 dark:text-gray-400">
              ({numReviews || 0})
            </span>
          </div>

          {/* Price - Navy + Orange theme */}
          <div className="flex items-center mt-2">
            {isOnSale ? (
              <>
                <span className="text-lg font-bold text-orange-500 dark:text-orange-400">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="ml-2 text-sm text-gray-400 line-through">
                  ${price.toFixed(2)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-navy-600 dark:text-navy-400">
                ${price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Low Stock Warning - Orange */}
          {!isOutOfStock && stock <= 5 && (
            <p className="mt-1 text-xs text-orange-500 dark:text-orange-400 font-medium">
              Only {stock} left in stock
            </p>
          )}
        </div>
      </Link>

      {/* Add to Cart Button - Orange theme */}
      <div className="px-4 pb-4">
        {isNotAvailable ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-500 bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-md cursor-not-allowed"
          >
            <Clock className="h-4 w-4" />
            Coming Soon
          </button>
        ) : isOutOfStock ? (
          <button
            disabled
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-400 dark:bg-gray-600 rounded-md cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={isAdded}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
              isAdded
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {isAdded ? 'Added!' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;