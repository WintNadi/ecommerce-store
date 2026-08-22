import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  ChevronUp,
  Star,
  Filter,
  RotateCcw
} from 'lucide-react';
import { getCategories } from '../../store/slices/categorySlice';
import { getProducts } from '../../store/slices/productSlice';

const ProductFilter = ({ 
  onFilterChange, 
  initialFilters = {},
  className = '',
  showMobile = false,
  onClose
}) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.categories);
  const [isOpen, setIsOpen] = useState(showMobile);
  const [expandedSections, setExpandedSections] = useState({
    categories: true,
    price: true,
    rating: true,
    availability: true
  });
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    rating: initialFilters.rating || 0,
    inStock: initialFilters.inStock || false,
    onSale: initialFilters.onSale || false,
    sortBy: initialFilters.sortBy || 'newest'
  });

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const ratingOptions = [
    { value: 0, label: 'All Ratings' },
    { value: 4, label: '4★ & Up' },
    { value: 3, label: '3★ & Up' },
    { value: 2, label: '2★ & Up' },
    { value: 1, label: '1★ & Up' },
  ];

  useEffect(() => {
    dispatch(getCategories());
  }, [dispatch]);

  useEffect(() => {
    setIsOpen(showMobile);
  }, [showMobile]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleClearFilters = () => {
    const resetFilters = {
      category: '',
      minPrice: '',
      maxPrice: '',
      rating: 0,
      inStock: false,
      onSale: false,
      sortBy: 'newest'
    };
    setFilters(resetFilters);
    if (onFilterChange) {
      onFilterChange(resetFilters);
    }
  };

  const handleApplyFilters = () => {
    if (onFilterChange) {
      onFilterChange(filters);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleReset = () => {
    handleClearFilters();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.category) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.rating > 0) count++;
    if (filters.inStock) count++;
    if (filters.onSale) count++;
    if (filters.sortBy !== 'newest') count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const FilterSection = ({ title, section, children }) => (
    <div className="border-b border-gray-200 dark:border-gray-700 py-3">
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full text-left font-medium text-gray-700 dark:text-gray-300 hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
      >
        <span>{title}</span>
        {expandedSections[section] ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {expandedSections[section] && (
        <div className="mt-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );

  const FilterContent = () => (
    <div className="space-y-2">
      {/* Sort By */}
      <FilterSection title="Sort By" section="sort">
        <div className="space-y-2">
          {sortOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="sortBy"
                value={option.value}
                checked={filters.sortBy === option.value}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Categories */}
      <FilterSection title="Categories" section="categories">
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="category"
              value=""
              checked={filters.category === ''}
              onChange={() => handleFilterChange('category', '')}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-gray-600"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">All Categories</span>
          </label>
          {categories?.map((category) => (
            <label key={category._id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="category"
                value={category._id}
                checked={filters.category === category._id}
                onChange={() => handleFilterChange('category', category._id)}
                className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300">{category.name}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range" section="price">
        <div className="flex gap-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Min</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400">Max</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="1000"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
              />
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection title="Rating" section="rating">
        <div className="space-y-2">
          {ratingOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rating"
                value={option.value}
                checked={filters.rating === option.value}
                onChange={() => handleFilterChange('rating', option.value)}
                className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-gray-600"
              />
              <div className="flex items-center gap-1">
                {option.value > 0 ? (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < option.value
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">& Up</span>
                  </>
                ) : (
                  <span className="text-sm text-gray-600 dark:text-gray-300">{option.label}</span>
                )}
              </div>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability" section="availability">
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.inStock}
              onChange={(e) => handleFilterChange('inStock', e.target.checked)}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">In Stock Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.onSale}
              onChange={(e) => handleFilterChange('onSale', e.target.checked)}
              className="w-4 h-4 text-orange-500 focus:ring-orange-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">On Sale</span>
          </label>
        </div>
      </FilterSection>

      {/* Action Buttons */}
      <div className="pt-4 space-y-2">
        <button
          onClick={handleApplyFilters}
          className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
        >
          Apply Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
        <button
          onClick={handleReset}
          className="w-full py-2.5 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          Reset Filters
        </button>
      </div>
    </div>
  );

  // Mobile Filter Drawer
  if (showMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300 ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-navy-600 dark:text-navy-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto h-[calc(100%-140px)]">
            <FilterContent />
          </div>
        </div>
      </>
    );
  }

  // Desktop Sidebar
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-navy-600 dark:text-navy-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs bg-orange-500 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          onClick={handleReset}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
        >
          Reset All
        </button>
      </div>

      <FilterContent />
    </div>
  );
};

export default ProductFilter;