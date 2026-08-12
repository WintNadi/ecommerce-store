import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  Tag,
  DollarSign,
  Percent,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Package
} from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SellerCouponManagement = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');

  // ============================================
  // COUPON FORM STATE
  // ============================================
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    maxUses: '1',
    validUntil: '',
    isActive: true,
  });

  // ============================================
  // FETCH DATA
  // ============================================
  useEffect(() => {
    fetchCoupons();
    fetchProducts();
  }, []);

  const fetchCoupons = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/seller/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch coupons');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/products?seller=${user?._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  // ============================================
  // CREATE/UPDATE COUPON
  // ============================================
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedProduct && !editingCoupon) {
      setError('Please select a product');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const payload = {
        ...couponForm,
        discountValue: parseFloat(couponForm.discountValue),
        maxUses: parseInt(couponForm.maxUses),
        validUntil: couponForm.validUntil || undefined,
      };

      let response;
      const productId = editingCoupon?.productId || selectedProduct;

      if (editingCoupon) {
        response = await axios.put(
          `${API_URL}/seller/coupons/product/${productId}/${editingCoupon.code}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        response = await axios.post(
          `${API_URL}/seller/coupons/product/${productId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await fetchCoupons();
      resetForm();
      setShowCreateModal(false);
      setEditingCoupon(null);
      setSelectedProduct('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save coupon');
    }
  };

  // ============================================
  // DELETE COUPON
  // ============================================
  const handleDeleteCoupon = async (productId, couponCode) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(
        `${API_URL}/seller/coupons/product/${productId}/${couponCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCoupons();
      setShowDeleteModal(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete coupon');
    }
  };

  // ============================================
  // TOGGLE COUPON STATUS
  // ============================================
  const handleToggleStatus = async (productId, couponCode) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.patch(
        `${API_URL}/seller/coupons/product/${productId}/${couponCode}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle coupon status');
    }
  };

  // ============================================
  // RESET FORM
  // ============================================
  const resetForm = () => {
    setCouponForm({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      maxUses: '1',
      validUntil: '',
      isActive: true,
    });
    setEditingCoupon(null);
    setSelectedProduct('');
  };

  // ============================================
  // EDIT COUPON
  // ============================================
  const handleEditCoupon = (coupon) => {
    setEditingCoupon(coupon);
    setSelectedProduct(coupon.productId);
    setCouponForm({
      code: coupon.code || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: coupon.discountValue || '',
      maxUses: coupon.maxUses || '1',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
      isActive: coupon.isActive !== undefined ? coupon.isActive : true,
    });
    setShowCreateModal(true);
  };

  // ============================================
  // FILTER COUPONS
  // ============================================
  const filteredCoupons = coupons.filter(coupon =>
    coupon.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coupon.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ============================================
  // GET STATUS BADGE
  // ============================================
  const getStatusBadge = (coupon) => {
    const now = new Date();
    if (!coupon.isActive) {
      return { label: 'Inactive', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
    if (coupon.validUntil && new Date(coupon.validUntil) < now) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' };
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return { label: 'Used Up', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' };
    }
    return { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' };
  };

  // ============================================
  // GET DISCOUNT TEXT
  // ============================================
  const getDiscountText = (coupon) => {
    if (coupon.discountType === 'percentage') {
      return `${coupon.discountValue}%`;
    }
    return `$${coupon.discountValue.toFixed(2)}`;
  };

  // ============================================
  // RENDER
  // ============================================
  if (isLoading) {
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
              <Tag className="h-6 w-6 text-indigo-600" />
              My Product Coupons
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create coupons for your products to boost sales
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchCoupons}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Coupon
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search coupons by code or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Coupons Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Product</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Code</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Discount</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Usage</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.length > 0 ? (
                  filteredCoupons.map((coupon) => {
                    const status = getStatusBadge(coupon);
                    return (
                      <tr key={`${coupon.productId}-${coupon.code}`} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={coupon.productImage || '/images/placeholder.svg'}
                              alt={coupon.productName}
                              className="w-10 h-10 object-cover rounded-lg bg-gray-100 dark:bg-gray-700"
                              onError={(e) => e.target.src = '/images/placeholder.svg'}
                            />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{coupon.productName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                ${coupon.productPrice?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900 dark:text-white">{coupon.code}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-900 dark:text-white">{getDiscountText(coupon)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {coupon.usedCount || 0} / {coupon.maxUses || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(coupon.productId, coupon.code)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                              title={coupon.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {coupon.isActive ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleEditCoupon(coupon)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setShowDeleteModal(coupon)}
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
                        <div>
                          <p className="text-lg font-medium">No coupons found</p>
                          <p className="text-sm mt-1">Try adjusting your search terms</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-lg font-medium">No coupons yet</p>
                          <p className="text-sm mt-1">Create coupons for your products to boost sales</p>
                          <button
                            onClick={() => {
                              resetForm();
                              setShowCreateModal(true);
                            }}
                            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Create First Coupon
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ============================================
          CREATE/EDIT COUPON MODAL
          ============================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCoupon ? 'Edit Coupon' : 'Create Product Coupon'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="space-y-4">
              {/* Product Selection */}
              {!editingCoupon && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Product *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      required
                    >
                      <option value="">Choose a product...</option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} - ${product.price?.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Coupon Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={couponForm.code}
                  onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SUMMER2024"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                    placeholder={couponForm.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 10.00'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Max Uses & Valid Until */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Uses *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.maxUses}
                    onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={couponForm.validUntil}
                    onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={couponForm.isActive}
                  onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================
          DELETE CONFIRMATION MODAL
          ============================================ */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Coupon
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete coupon <span className="font-medium text-gray-900 dark:text-white">"{showDeleteModal.code}"</span> for product <span className="font-medium text-gray-900 dark:text-white">"{showDeleteModal.productName}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCoupon(showDeleteModal.productId, showDeleteModal.code)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerCouponManagement;