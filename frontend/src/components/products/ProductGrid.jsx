import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Grid3x3, LayoutList, ChevronLeft, ChevronRight } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductSkeleton from './ProductSkeleton';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import { getProducts } from '../../store/slices/productSlice';

const ProductGrid = ({
  products: externalProducts,
  loading: externalLoading,
  error: externalError,
  title,
  columns = 4,
  showPagination = true,
  showViewToggle = true,
  showSort = true,
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

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');

  // Use external props if provided, otherwise use Redux state
  const products = externalProducts || storeProducts;
  const loading = externalLoading !== undefined ? externalLoading : storeLoading;
  const error = externalError || storeError;

  // Column classes based on view mode and columns
  const getGridColumns = () => {
    if (viewMode === 'list') return 'grid-cols-1';
    
    const colMap = {
      1: 'grid-cols-1',
      2: 'grid-cols-1 sm:grid-cols-2',
      3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    };
    return colMap[columns] || colMap[4];
  };

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
        <div className={getGridColumns()}>
          {[...Array(8)].map((_, i) => (
            <ProductSkeleton key={i} variant={viewMode === 'list' ? 'list' : 'grid'} />
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

        <div className="flex items-center gap-3">
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

      {/* Products Grid */}
      <div className={getGridColumns()}>
        {products.map((product) => (
          <ProductCard
            key={product._id || product.id}
            product={product}
            onClick={onProductClick}
          />
        ))}
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default ProductGrid;