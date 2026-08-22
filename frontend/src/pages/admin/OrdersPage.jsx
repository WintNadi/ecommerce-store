import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getAllOrders, updateOrderStatus, clearOrderError } from '../../store/slices/orderSlice';
import { Eye, ChevronLeft, ChevronRight, Search, Filter, X, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const OrdersPage = () => {
  const dispatch = useDispatch();
  const { orders, isLoading, error, pagination } = useSelector((state) => state.orders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    dispatch(getAllOrders({ page: currentPage, status: statusFilter, search: searchTerm }));
  }, [dispatch, currentPage, statusFilter, searchTerm]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleStatusUpdate = async () => {
    if (selectedOrder && newStatus) {
      try {
        await dispatch(updateOrderStatus({ id: selectedOrder._id, status: newStatus })).unwrap();
        toast.success(`Order status updated to ${newStatus}`);
        setShowStatusModal(false);
        setSelectedOrder(null);
        setNewStatus('');
        dispatch(getAllOrders({ page: currentPage, status: statusFilter, search: searchTerm }));
      } catch (error) {
        toast.error(error.message || 'Failed to update order status');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'shipped': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading && orders.length === 0) {
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Order Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              View and manage all customer orders
            </p>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-700">
            Total: {pagination?.total || 0} orders
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by order number or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={() => dispatch(clearOrderError())}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 mt-1"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Order</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Payment</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                  <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4">
                        <Link
                          to={`/orders/${order._id}`}
                          className="text-navy-600 hover:text-orange-500 dark:text-navy-400 dark:hover:text-orange-400 font-medium transition-colors"
                        >
                          #{order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-gray-900 dark:text-white">{order.user?.name || 'Guest'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{order.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        ${order.totalPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/orders/${order._id}`}
                            className="p-1.5 text-gray-400 hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
                            title="View Order"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setShowStatusModal(true);
                            }}
                            className="px-3 py-1 text-xs font-medium text-navy-600 border border-navy-200 dark:border-navy-800 rounded hover:bg-navy-50 dark:hover:bg-navy-900/20 transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                        <p>No orders found.</p>
                      </div>
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

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Update Order Status
              </h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Order #{selectedOrder.orderNumber}
            </p>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all mb-4"
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;