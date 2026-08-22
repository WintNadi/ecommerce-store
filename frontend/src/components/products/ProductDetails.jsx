import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Share2, 
  ChevronLeft,
  Minus,
  Plus,
  Truck,
  ShieldCheck,
  RotateCcw,
  Clock
} from 'lucide-react';
import { getProductDetails } from '../../store/slices/productSlice';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import ProductReviews from './ProductReviews';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { product, loading, error } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const [quantity, setQuantity] = useState(1);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('description');

  useEffect(() => {
    if (id) {
      dispatch(getProductDetails(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (wishlistItems && product) {
      const found = wishlistItems.some(item => item.id === product._id || item._id === product._id);
      setIsInWishlist(found);
    }
  }, [wishlistItems, product]);

  if (loading) return <Loader />;
  if (error) return <ErrorMessage error={error} variant="error" />;
  if (!product) return <ErrorMessage error="Product not found" variant="error" />;

  const {
    name,
    price,
    comparePrice,
    description,
    images = [],
    rating = 0,
    numReviews = 0,
    stock = 0,
    category,
    brand,
    discount = 0,
    specifications = {},
    isPublished,
    isActive,
    reviews = []
  } = product;

  const isOnSale = discount > 0;
  const discountedPrice = discount > 0 ? price * (1 - discount / 100) : price;
  const isOutOfStock = stock === 0;
  const isNotAvailable = !isPublished || !isActive;

  const handleQuantityChange = (value) => {
    if (value < 1) return;
    if (value > stock) {
      toast.error(`Only ${stock} items available`);
      return;
    }
    setQuantity(value);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }
    if (isOutOfStock || isNotAvailable) {
      toast.error('Product not available');
      return;
    }
    try {
      await dispatch(addToCart({ productId: product._id, quantity })).unwrap();
      toast.success(`Added ${quantity} item(s) to cart! 🛒`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(product._id)).unwrap();
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(product._id)).unwrap();
        setIsInWishlist(true);
        toast.success('Added to wishlist ❤️');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link to="/" className="hover:text-navy-600 dark:hover:text-navy-400">Home</Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <Link to="/shop" className="hover:text-navy-600 dark:hover:text-navy-400">Shop</Link>
          <ChevronLeft className="h-3 w-3 rotate-180" />
          <span className="text-navy-600 dark:text-navy-400 font-medium">{name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Images */}
          <div>
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
              <img
                src={images[selectedImage] || '/images/placeholder.svg'}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-orange-500'
                        : 'border-gray-200 dark:border-gray-700 hover:border-navy-400'
                    }`}
                  >
                    <img src={img} alt={`${name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info */}
          <div>
            {/* Brand & Category */}
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
              {brand && <span className="font-medium text-navy-600 dark:text-navy-400">{brand}</span>}
              {brand && category && <span>•</span>}
              {category && <span>{category}</span>}
            </div>

            {/* Name */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({numReviews || 0} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="mb-4">
              {isOnSale ? (
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-orange-500 dark:text-orange-400">
                    ${discountedPrice.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-400 line-through">
                    ${price.toFixed(2)}
                  </span>
                  <span className="px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                    {Math.round(discount)}% OFF
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-navy-600 dark:text-navy-400">
                  ${price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-4">
              {isOutOfStock ? (
                <span className="text-red-600 dark:text-red-400 font-medium">Out of Stock</span>
              ) : stock <= 5 ? (
                <span className="text-orange-500 dark:text-orange-400 font-medium">
                  Only {stock} left in stock - Order soon!
                </span>
              ) : (
                <span className="text-green-600 dark:text-green-400 font-medium">In Stock</span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              {description}
            </p>

            {/* Quantity & Add to Cart */}
            {!isOutOfStock && !isNotAvailable && (
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => handleQuantityChange(quantity - 1)}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    disabled={quantity >= stock}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Add to Cart
                </button>

                <button
                  onClick={handleWishlist}
                  className={`p-3 rounded-lg border transition-colors ${
                    isInWishlist
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-500'
                      : 'border-gray-300 dark:border-gray-600 hover:border-navy-500 dark:hover:border-navy-400'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${isInWishlist ? 'fill-red-500' : ''}`} />
                </button>
              </div>
            )}

            {/* Not Available */}
            {isNotAvailable && !isOutOfStock && (
              <div className="mb-6 p-4 bg-navy-50 dark:bg-navy-900/20 border border-navy-200 dark:border-navy-800 rounded-lg">
                <p className="text-navy-600 dark:text-navy-400 font-medium flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Coming Soon
                </p>
                <p className="text-sm text-navy-500 dark:text-navy-400 mt-1">
                  This product will be available soon. Check back later!
                </p>
              </div>
            )}

            {/* Features */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Truck className="h-5 w-5 text-navy-600 dark:text-navy-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">Free Shipping</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-navy-600 dark:text-navy-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">Secure Payment</span>
              </div>
              <div className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <RotateCcw className="h-5 w-5 text-navy-600 dark:text-navy-400" />
                <span className="text-xs text-gray-600 dark:text-gray-300 mt-1">30-Day Returns</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-6">
                {['description', 'specifications', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                      activeTab === tab
                        ? 'border-orange-500 text-orange-500'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-navy-600 dark:hover:text-navy-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="py-4">
              {activeTab === 'description' && (
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {description}
                </p>
              )}
              {activeTab === 'specifications' && (
                <div className="space-y-2">
                  {Object.entries(specifications).map(([key, value]) => (
                    <div key={key} className="flex py-2 border-b border-gray-100 dark:border-gray-800">
                      <span className="w-1/3 text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className="w-2/3 text-sm text-gray-600 dark:text-gray-400">{value}</span>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'reviews' && (
                <ProductReviews productId={product._id} reviews={reviews} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;