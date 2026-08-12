import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getProduct } from '../store/slices/productSlice';
import { addToCart } from '../store/slices/cartSlice';
import { Star, ShoppingCart, Heart, Share2, Minus, Plus, Check, Clock, Truck, Shield, ArrowLeft } from 'lucide-react';

const ProductPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { product, isLoading, error } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    dispatch(getProduct(id));
    window.scrollTo(0, 0);
  }, [dispatch, id]);

  // ✅ Universal image URL handler
  const getImageUrl = (image) => {
    if (!image) return 'https://via.placeholder.com/600x600?text=No+Image';
    if (typeof image === 'string') return image;
    if (image?.url) return image.url;
    return 'https://via.placeholder.com/600x600?text=No+Image';
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      // Show login modal or redirect
      return;
    }

    try {
      await dispatch(addToCart({ productId: product._id || product.id, quantity })).unwrap();
      setIsAdded(true);
      setTimeout(() => setIsAdded(false), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity < 1) return;
    if (product.stock && newQuantity > product.stock) return;
    setQuantity(newQuantity);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product Not Found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">The product you're looking for doesn't exist.</p>
          <Link to="/shop" className="mt-4 inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const {
    name,
    description,
    price,
    comparePrice,
    images,
    rating,
    numReviews,
    stock,
    discount,
    category,
    attributes,
    reviews = [],
    isPublished,
    isActive
  } = product;

  const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price;
  const isOnSale = discount > 0;
  const isOutOfStock = stock === 0;
  const isNotAvailable = !isPublished || !isActive;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Shop
        </Link>

        {/* Breadcrumb */}
        <nav className="flex mb-8 text-sm">
          <Link to="/" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            Home
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <Link to="/shop" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            Shop
          </Link>
          <span className="mx-2 text-gray-400">/</span>
          <span className="text-gray-900 dark:text-white font-medium truncate">{name}</span>
        </nav>

        {/* Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
              {/* ✅ FIXED: Use getImageUrl function */}
              <img
                src={getImageUrl(images?.[selectedImage])}
                alt={name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/600x600?text=No+Image';
                }}
              />
              {isOnSale && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded">
                  {Math.round(discount)}% OFF
                </div>
              )}
              {isNotAvailable && !isOutOfStock && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-indigo-500 text-white text-sm font-semibold rounded flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Coming Soon
                </div>
              )}
              {isOutOfStock && (
                <div className="absolute top-4 left-4 px-3 py-1 bg-gray-700 text-white text-sm font-semibold rounded">
                  Out of Stock
                </div>
              )}
            </div>
            {images && images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-indigo-600'
                        : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {/* ✅ FIXED: Use getImageUrl for thumbnails */}
                    <img
                      src={getImageUrl(image)}
                      alt={`${name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{name}</h1>
              {category && (
                <Link
                  to={`/shop?category=${category._id}`}
                  className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  {category.name}
                </Link>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(rating || 0)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ({numReviews || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              {isOnSale ? (
                <>
                  <span className="text-3xl font-bold text-red-600 dark:text-red-400">
                    ${discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-xl text-gray-400 line-through">
                    ${price.toFixed(2)}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                    Save ${(price - discountedPrice).toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div>
              {isNotAvailable ? (
                <p className="text-indigo-500 font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Coming Soon - Not yet available
                </p>
              ) : isOutOfStock ? (
                <p className="text-red-500 font-semibold">Out of Stock</p>
              ) : stock <= 5 ? (
                <p className="text-orange-500 font-semibold">
                  Only {stock} left in stock - order soon!
                </p>
              ) : (
                <p className="text-green-500 font-semibold">In Stock</p>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300">{description}</p>
            </div>

            {/* Attributes */}
            {attributes && Object.keys(attributes).length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-gray-900 dark:text-white">Specifications</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(attributes).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-gray-500 dark:text-gray-400 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className="text-gray-900 dark:text-white">{value}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {!isNotAvailable && !isOutOfStock && (
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={stock <= quantity}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <div className="flex gap-4">
              {isNotAvailable ? (
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg cursor-not-allowed"
                >
                  <Clock className="h-5 w-5" />
                  Coming Soon
                </button>
              ) : isOutOfStock ? (
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                >
                  Out of Stock
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white font-medium rounded-lg transition-colors ${
                    isAdded
                      ? 'bg-green-500'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="h-5 w-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      Add to Cart
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <Heart className="h-5 w-5" />
                Wishlist
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                <Share2 className="h-5 w-5" />
                Share
              </button>
            </div>

            {/* Delivery Info */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Truck className="h-5 w-5 text-indigo-500" />
                <span>Free delivery on orders over $50</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                <Shield className="h-5 w-5 text-indigo-500" />
                <span>Secure payment &amp; 30-day return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        {reviews && reviews.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Customer Reviews ({reviews.length})
            </h2>
            <div className="space-y-6">
              {reviews.slice(0, 5).map((review, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {review.user?.name || 'Anonymous'}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.verifiedPurchase && (
                      <span className="text-xs text-green-500">Verified Purchase</span>
                    )}
                  </div>
                  {review.title && (
                    <h4 className="mt-2 font-medium text-gray-900 dark:text-white">{review.title}</h4>
                  )}
                  <p className="mt-1 text-gray-600 dark:text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;