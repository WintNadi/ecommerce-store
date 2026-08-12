import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getProducts, deleteProduct, clearProductError } from '../../store/slices/productSlice';
import { Plus, Search, Edit, Trash2, Eye, Loader2, Package, CheckCircle, XCircle } from 'lucide-react';
import ErrorMessage from '../../components/common/ErrorMessage';

const SellerProductsPage = () => {
  const dispatch = useDispatch();
  const { products, isLoading, error, pagination } = useSelector((state) => state.products);
  const { user } = useSelector((state) => state.auth);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ✅ Fetch products with seller filter
  useEffect(() => {
    if (user) {
      dispatch(getProducts({
        page: currentPage,
        search: searchTerm,
        limit: 10,
        seller: user._id  // ✅ Only get seller's products
      }));
    }
  }, [dispatch, currentPage, searchTerm, user]);

  const handleDelete = async () => {
    if (selectedProduct) {
      const productId = selectedProduct._id || selectedProduct.id;
      if (!productId) {
        console.error('Product ID is undefined');
        return;
      }

      try {
        await dispatch(deleteProduct(productId)).unwrap();
        setShowDeleteModal(false);
        setSelectedProduct(null);
        // ✅ Refresh product list after deletion
        if (user) {
          dispatch(getProducts({
            page: currentPage,
            search: searchTerm,
            limit: 10,
            seller: user._id
          }));
        }
      } catch (error) {
        console.error('Failed to delete product:', error);
      }
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) {
      return { label: 'Out of Stock', color: 'text-red-500 bg-red-100 dark:bg-red-900/30' };
    } else if (stock <= 5) {
      return { label: 'Low Stock', color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' };
    } else {
      return { label: 'In Stock', color: 'text-green-500 bg-green-100 dark:bg-green-900/30' };
    }
  };

  // ✅ Universal image URL handler with local fallback
  const getImageUrl = (product) => {
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

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-6 w-6" />
              My Products
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your product inventory
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {pagination?.total || 0} products
            </span>
            <Link
              to="/seller/products/create"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search your products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Error Message */}
        <ErrorMessage
          error={error}
          onClear={() => dispatch(clearProductError())}
        />

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Price</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products && products.length > 0 ? (
                  products.map((product) => {
                    const productId = product._id || product.id;
                    const stockStatus = getStockStatus(product.stock || 0);
                    const imageUrl = getImageUrl(product);

                    return (
                      <tr key={productId} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={imageUrl}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg bg-gray-100 dark:bg-gray-700"
                              onError={(e) => {
                                console.error('Image failed to load:', imageUrl);
                                e.target.src = '/images/placeholder.svg';
                              }}
                            />
                            <div>
                              <Link
                                to={`/product/${productId}`}
                                className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                              >
                                {product.name}
                              </Link>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                SKU: {product.sku || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              ${product.price?.toFixed(2) || '0.00'}
                            </p>
                            {product.comparePrice && product.comparePrice > product.price && (
                              <p className="text-xs text-gray-400 line-through">
                                ${product.comparePrice?.toFixed(2) || '0.00'}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                            {stockStatus.label} ({product.stock || 0})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            {product.isPublished ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                <CheckCircle className="h-3 w-3" />
                                Published
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <XCircle className="h-3 w-3" />
                                Draft
                              </span>
                            )}
                            {product.isFeatured && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 rounded">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/product/${productId}`}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/seller/products/edit/${productId}`}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm ? (
                        <div>
                          <p className="text-lg font-medium">No products found</p>
                          <p className="text-sm mt-1">Try adjusting your search terms</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-medium">No products yet</p>
                          <p className="text-sm mt-1">Start adding your products to sell</p>
                          <Link
                            to="/seller/products/create"
                            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Add Your First Product
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Product
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProduct(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Are you sure you want to delete{' '}
                <span className="font-medium text-gray-900 dark:text-white">
                  "{selectedProduct.name}"
                </span>
                ? This action cannot be undone.
              </p>
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  ⚠️ Deleting this product will remove it from your store permanently.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProductsPage;