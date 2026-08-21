import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  RefreshCw,
  Search,
  X,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Package,
  Calendar,
  MessageSquare,
  FileText,
  ExternalLink
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const RefundManagement = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchRefunds();
    fetchStats();
  }, [currentPage, statusFilter, searchTerm]);

  const fetchRefunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/refunds`, {
        params: { page: currentPage, status: statusFilter, search: searchTerm },
        headers: { Authorization: `Bearer ${token}` }
      });
      setRefunds(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch refunds');
      toast.error('Failed to fetch refunds');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/refunds/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleAction = async (refundId, action) => {
    try {
      const token = localStorage.getItem('accessToken');
      const endpoint = `${API_URL}/refunds/${refundId}/${action}`;
      const payload = {};

      if (action === 'reject') {
        payload.rejectionReason = rejectionReason || 'Request rejected';
      }
      if (action === 'approve' || action === 'reject') {
        payload.adminNotes = adminNotes;
      }

      await axios.put(endpoint, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Refund ${action}d successfully`);
      setShowModal(false);
      setSelectedRefund(null);
      setAdminNotes('');
      setRejectionReason('');
      fetchRefunds();
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} refund`);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle }
    };
    const info = statusMap[status] || statusMap.pending;
    const Icon = info.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${info.color}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      defective: 'Defective Product',
      wrong_item: 'Wrong Item Received',
      not_as_described: 'Not as Described',
      shipping_damage: 'Shipping Damage',
      changed_mind: 'Changed Mind',
      other: 'Other'
    };
    return reasons[reason] || reason;
  };

  if (loading && refunds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader size="lg" text="Loading refunds..." />
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
              <DollarSign className="h-6 w-6 text-orange-500" />
              Refund Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage customer refund requests
            </p>
          </div>
          <button
            onClick={fetchRefunds}
            className="flex items-center gap-2 px-4 py-2 bg-navy-500 hover:bg-navy-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Refunds</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRefunds || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.byStatus?.pending?.count || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.byStatus?.approved?.count || 0}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount Refunded</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${stats.totalRefundAmount?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search by order number or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <ErrorMessage
            error={error}
            variant="error"
            title="Failed to load refunds"
            onClear={() => setError(null)}
          />
        )}

        {/* Refunds Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Order</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Reason</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Date</th>
                  <th className="text-right py-3 px-4 text-gray-600 dark:text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.length > 0 ? (
                  refunds.map((refund) => (
                    <tr key={refund._id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-medium text-navy-600 dark:text-navy-400">
                          #{refund.order?.orderNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-gray-900 dark:text-white">{refund.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{refund.user?.email || ''}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        ${refund.totalAmount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {getReasonLabel(refund.reason)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(refund.status)}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRefund(refund);
                              setShowModal(true);
                              setModalAction(null);
                            }}
                            className="p-1.5 text-gray-400 hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {refund.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setModalAction('approve');
                                  setShowModal(true);
                                }}
                                className="p-1.5 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedRefund(refund);
                                  setModalAction('reject');
                                  setShowModal(true);
                                }}
                                className="p-1.5 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {refund.status === 'approved' && (
                            <button
                              onClick={() => {
                                setSelectedRefund(refund);
                                setModalAction('complete');
                                setShowModal(true);
                              }}
                              className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              title="Complete"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-gray-400" />
                        <p>No refund requests found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View/Update Modal */}
      {showModal && selectedRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalAction ? 'Update Refund' : 'Refund Details'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedRefund(null);
                  setModalAction(null);
                  setAdminNotes('');
                  setRejectionReason('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Refund Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    #{selectedRefund.order?.orderNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    ${selectedRefund.totalAmount?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  {getStatusBadge(selectedRefund.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reason</p>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {getReasonLabel(selectedRefund.reason)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {selectedRefund.description}
                </p>
              </div>

              {selectedRefund.rejectionReason && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm font-medium text-red-700 dark:text-red-300">Rejection Reason</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {selectedRefund.rejectionReason}
                  </p>
                </div>
              )}

              {selectedRefund.adminNotes && (
                <div className="p-3 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin Notes</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedRefund.adminNotes}
                  </p>
                </div>
              )}

              {/* Action Forms */}
              {modalAction === 'approve' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about the approval..."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <button
                    onClick={() => handleAction(selectedRefund._id, 'approve')}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    Approve Refund
                  </button>
                </div>
              )}

              {modalAction === 'reject' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why the refund is being rejected..."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about the rejection..."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <button
                    onClick={() => handleAction(selectedRefund._id, 'reject')}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Reject Refund
                  </button>
                </div>
              )}

              {modalAction === 'complete' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Resolution Note (Optional)
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about the completion..."
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:bg-gray-700 dark:text-white transition-all"
                    />
                  </div>
                  <button
                    onClick={() => handleAction(selectedRefund._id, 'complete')}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Complete Refund
                  </button>
                </div>
              )}

              {!modalAction && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedRefund(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RefundManagement;