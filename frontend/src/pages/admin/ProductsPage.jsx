import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  getProducts,
  deleteProduct,
  clearProductError,
  clearProductSuccess
} from '../../store/slices/productSlice';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  X,
  CheckCircle,
  XCircle,
  User,
  AlertCircle
} from 'lucide-react';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast';

const ProductsPage = () => {
  const dispatch = useDispatch();
  const { products, isLoading, error, success, pagination } = useSelector((state) => state.products);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ✅ Admin အတွက် အကုန်လုံးပြမယ် (admin=true ပို့ပါ)
  useEffect(() => {
    dispatch(getProducts({ 
      page: currentPage, 
      search: searchTerm, 
      limit: 10,
      admin: true  // ✅ Admin view
    }));
  }, [dispatch, currentPage, searchTerm]);

  useEffect(() => {
    if (success) {
      dispatch(clearProductSuccess());
    }
  }, [success, dispatch]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (selectedProduct) {
      const productId = selectedProduct._id || selectedProduct.id;
      if (!productId) {
        console.error('Product ID is undefined');
        return;
      }
      
      try {
        await dispatch(deleteProduct(productId)).unwrap();
        toast.success('Product deleted successfully');
        setShowDeleteModal(false);
        setSelectedProduct(null);
        // Refresh product list after deletion
        dispatch(getProducts({ 
          page: currentPage, 
          search: searchTerm, 
          limit: 10,
          admin: true
        }));
      } catch (error) {
        toast.error(error.message || 'Failed to delete product');
        console.error('Failed to delete product:', error);
      }
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (isLoading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="h-6 w-6 text-orange-500" />
              Product Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage all products in the store
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
              Total: {pagination?.total || 0} products
            </span>
            <Link
              to="/admin/products/create"
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search products by name, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </form>
        </div>

        {/* Error Message */}
        <ErrorMessage 
          error={error} 
          onClear={() => dispatch(clearProductError())} 
        />

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Price</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Stock</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Seller</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products && products.length > 0 ? (
                  products.map((product) => {
                    const productId = product._id || product.id;
                    const stockStatus = getStockStatus(product.stock);
                    
                    return (
                      <tr key={productId} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.images?.[0]?.url || '/images/placeholder.svg'}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                              onError={(e) => {
                                e.target.src = '/images/placeholder.svg';
                              }}
                            />
                            <div>
                              <Link
                                to={`/product/${productId}`}
                                className="font-medium text-gray-900 dark:text-white hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
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
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">
                              {product.seller?.name || 'Unknown'}
                            </span>
                          </div>
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
                              <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded">
                                Featured
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/product/${productId}`}
                              className="p-1.5 text-gray-400 hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <Link
                              to={`/admin/products/edit/${productId}`}
                              className="p-1.5 text-gray-400 hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
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
                    <td colSpan="6" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchTerm ? (
                        <div className="flex flex-col items-center gap-2">
                          <AlertCircle className="h-8 w-8 text-gray-400" />
                          <p className="text-lg font-medium">No products found</p>
                          <p className="text-sm mt-1">Try adjusting your search terms</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-medium">No products in the store</p>
                          <p className="text-sm mt-1">Start adding products to sell</p>
                          <Link
                            to="/admin/products/create"
                            className="mt-4 inline-block px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
                          >
                            Add First Product
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-700">
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
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete{' '}
              <span className="font-medium text-gray-900 dark:text-white">
                "{selectedProduct.name}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
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

export default ProductsPage;