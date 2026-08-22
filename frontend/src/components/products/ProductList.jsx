import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Eye,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  LayoutList,
  Filter
} from 'lucide-react';
import { addToCart } from '../../store/slices/cartSlice';
import { addToWishlist, removeFromWishlist } from '../../store/slices/wishlistSlice';
import { getProducts } from '../../store/slices/productSlice';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import ProductSkeleton from './ProductSkeleton';
import toast from 'react-hot-toast';

const ProductList = ({
  products: externalProducts,
  loading: externalLoading,
  error: externalError,
  title,
  showPagination = true,
  showViewToggle = true,
  showSort = true,
  showFilters = true,
  className = '',
  onProductClick,
}) => {
  const dispatch = useDispatch();
  const { 
    products: storeProducts, 
    loading: storeLoading, 
    error: storeError,
    pagination 
  } = useSelector((state) => state.products);
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const [viewMode, setViewMode] = useState('list'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Use external props if provided, otherwise use Redux state
  const products = externalProducts || storeProducts;
  const loading = externalLoading !== undefined ? externalLoading : storeLoading;
  const error = externalError || storeError;

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  useEffect(() => {
    if (!externalProducts) {
      dispatch(getProducts({ page: currentPage, sort: sortBy }));
    }
  }, [dispatch, currentPage, sortBy, externalProducts]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    if (!externalProducts) {
      dispatch(getProducts({ page, sort: sortBy }));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (e) => {
    const value = e.target.value;
    setSortBy(value);
    setCurrentPage(1);
    if (!externalProducts) {
      dispatch(getProducts({ page: 1, sort: value }));
    }
  };

  const handleAddToCart = async (productId, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      await dispatch(addToCart({ productId, quantity: 1 })).unwrap();
      toast.success('Added to cart! 🛒');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleWishlist = async (productId, isInWishlist, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlist(productId)).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await dispatch(addToWishlist(productId)).unwrap();
        toast.success('Added to wishlist ❤️');
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const isInWishlist = (productId) => {
    if (!wishlistItems) return false;
    return wishlistItems.some(item => item.id === productId || item._id === productId);
  };

  const renderPagination = () => {
    if (!showPagination) return null;
    
    const totalPages = pagination?.pages || 1;
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-1 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePageChange(1)}
              className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-500 dark:text-gray-400">…</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`px-3 py-1 rounded-lg transition-colors ${
              currentPage === page
                ? 'bg-orange-500 text-white font-medium'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500 dark:text-gray-400">…</span>}
            <button
              onClick={() => handlePageChange(totalPages)}
              className="px-3 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Loading state
  if (loading && !products.length) {
    return (
      <div className={className}>
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h2>
        )}
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <ProductSkeleton key={i} variant="list" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <ErrorMessage 
          error={error} 
          variant="error"
          title="Failed to load products"
          onClear={() => {}} 
        />
      </div>
    );
  }

  // No products
  if (!products || products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 dark:text-gray-500">
          <span className="text-6xl block mb-4">🛒</span>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
            No products found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Try adjusting your filters or check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {title}
            {pagination?.total > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                ({pagination.total} products)
              </span>
            )}
          </h2>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {/* Mobile Filter Button */}
          {showFilters && (
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          )}

          {/* Sort */}
          {showSort && (
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* View Toggle */}
          {showViewToggle && (
            <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                aria-label="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Products List */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {products.map((product) => {
            const productId = product._id || product.id;
            const inWishlist = isInWishlist(productId);
            const isOnSale = product.discount > 0;
            const discountedPrice = isOnSale 
              ? product.price * (1 - product.discount / 100) 
              : product.price;
            const isOutOfStock = product.stock === 0;

            return (
              <div
                key={productId}
                className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100 dark:border-gray-700"
              >
                {/* Image */}
                <Link
                  to={`/product/${productId}`}
                  className="sm:w-48 lg:w-56 flex-shrink-0"
                  onClick={() => onProductClick?.(product)}
                >
                  <div className="aspect-square sm:aspect-auto sm:h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <img
                      src={product.images?.[0] || '/images/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/images/placeholder.svg';
                      }}
                    />
                  </div>
                </Link>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col">
                  <Link
                    to={`/product/${productId}`}
                    className="hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
                    onClick={() => onProductClick?.(product)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < Math.floor(product.rating || 0)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      ({product.numReviews || 0} reviews)
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2 flex-1">
                    {product.description || 'No description available'}
                  </p>

                  {/* Price */}
                  <div className="flex items-center gap-3 mt-3">
                    {isOnSale ? (
                      <>
                        <span className="text-xl font-bold text-orange-500 dark:text-orange-400">
                          ${discountedPrice.toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          ${product.price.toFixed(2)}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded">
                          {Math.round(product.discount)}% OFF
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-bold text-navy-600 dark:text-navy-400">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {isOutOfStock ? (
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium mt-1">
                      Out of Stock
                    </span>
                  ) : product.stock <= 5 ? (
                    <span className="text-sm text-orange-500 dark:text-orange-400 font-medium mt-1">
                      Only {product.stock} left in stock
                    </span>
                  ) : (
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium mt-1">
                      In Stock
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      to={`/product/${productId}`}
                      className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
                      aria-label="View product"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={(e) => handleWishlist(productId, inWishlist, e)}
                      className={`p-2 rounded-lg border transition-colors ${
                        inWishlist
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-500'
                          : 'border-gray-300 dark:border-gray-600 hover:border-navy-500 dark:hover:border-navy-400 text-gray-600 dark:text-gray-400'
                      }`}
                      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart className={`h-4 w-4 ${inWishlist ? 'fill-red-500' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handleAddToCart(productId, e)}
                      disabled={isOutOfStock}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                        isOutOfStock
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-orange-500 hover:bg-orange-600'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4" />
                      {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product._id || product.id}
              product={product}
              onClick={onProductClick}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default ProductList;