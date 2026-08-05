import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { searchProducts, clearSearchResults } from '../../store/slices/productSlice';
import { Search, X, Loader2 } from 'lucide-react';
import debounce from 'lodash/debounce';

const SmartSearch = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { searchResults, isLoading } = useSelector((state) => state.products);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Debounced search
  const debouncedSearch = debounce((searchQuery) => {
    if (searchQuery.length >= 2) {
      dispatch(searchProducts({ query: searchQuery, limit: 5 }));
      setIsOpen(true);
    } else {
      dispatch(clearSearchResults());
      setIsOpen(false);
    }
  }, 300);

  useEffect(() => {
    if (query.length >= 2) {
      debouncedSearch(query);
    } else {
      dispatch(clearSearchResults());
      setIsOpen(false);
    }
    setSelectedIndex(-1);
  }, [query, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && searchResults[selectedIndex]) {
            handleSelectProduct(searchResults[selectedIndex]);
          } else if (query.length >= 2) {
            handleViewAll();
          }
          break;
        case 'Escape':
          setIsOpen(false);
          inputRef.current?.blur();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, query]);

  const handleSelectProduct = (product) => {
    setIsOpen(false);
    setQuery('');
    dispatch(clearSearchResults());
    navigate(`/product/${product._id}`);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    setQuery('');
    dispatch(clearSearchResults());
    navigate(`/shop?search=${encodeURIComponent(query)}`);
  };

  const handleClear = () => {
    setQuery('');
    dispatch(clearSearchResults());
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <>
              <div className="max-h-96 overflow-y-auto">
                {searchResults.map((product, index) => (
                  <div
                    key={product._id}
                    onClick={() => handleSelectProduct(product)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-indigo-50 dark:bg-indigo-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <img
                      src={product.images?.[0]?.url || 'https://via.placeholder.com/40x40?text=No+Image'}
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          ${product.price.toFixed(2)}
                        </span>
                        {product.rating > 0 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ★ {product.rating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                    {product.isInStock ? (
                      <span className="text-xs text-green-500">In Stock</span>
                    ) : (
                      <span className="text-xs text-red-500">Out of Stock</span>
                    )}
                  </div>
                ))}
              </div>
              <div
                onClick={handleViewAll}
                className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                View all results for "{query}"
              </div>
            </>
          ) : query.length >= 2 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <p>No products found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;