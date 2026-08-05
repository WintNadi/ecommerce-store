import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { getAllOrders, updateOrderStatus } from '../../store/slices/orderSlice';
import { ShoppingBag, Eye, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';

const SellerOrdersPage = () => {
  const dispatch = useDispatch();
  const { orders, isLoading, pagination } = useSelector((state) => state.orders);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);

  useEffect(() => {
    dispatch(getAllOrders({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  const handleStatusUpdate = async () => {
    if (selectedOrder && newStatus) {
      await dispatch(updateOrderStatus({ id: selectedOrder._id, status: newStatus })).unwrap();
      setShowStatusModal(false);
      setSelectedOrder(null);
      setNewStatus('');
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

  if (isLoading && orders.length === 0) {
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Orders
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total: {pagination?.total || 0} orders
          </span>
        </div>

        {/* Orders Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Order</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Total</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                  <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders && orders.length > 0 ? (
                  orders.map((order) => (
                    <tr key={order._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        #{order.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                        {order.user?.name || 'Guest'}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        ${order.totalPrice.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/orders/${order._id}`}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setNewStatus(order.status);
                              setShowStatusModal(true);
                            }}
                            className="px-3 py-1 text-xs font-medium text-indigo-600 border border-indigo-200 dark:border-indigo-800 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      No orders found.
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
                onClick={() => setCurrentPage(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => setCurrentPage(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white mb-4"
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
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusUpdate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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

export default SellerOrdersPage;