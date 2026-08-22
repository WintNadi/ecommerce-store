import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter,
  Star,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MessageSquare,
  User,
  Package
} from 'lucide-react';
import { 
  getAllReviews,
  approveReview,
  rejectReview,
  deleteReview,
  addAdminResponse,
  getReviewStats
} from '../../store/slices/reviewSlice';
import Loader from '../../components/common/Loader';
import ErrorMessage from '../../components/common/ErrorMessage';
import toast from 'react-hot-toast';

const ReviewModeration = () => {
  const dispatch = useDispatch();
  const { reviews, loading, error, stats } = useSelector((state) => state.reviews);
  const { user } = useSelector((state) => state.auth);

  const [filters, setFilters] = useState({
    status: 'pending',
    rating: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [expandedReview, setExpandedReview] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(null);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected', 'all'

  useEffect(() => {
    fetchReviews();
    dispatch(getReviewStats());
  }, [dispatch, currentPage, pageSize, filters]);

  const fetchReviews = () => {
    const params = {
      page: currentPage,
      limit: pageSize,
      ...filters,
    };
    dispatch(getAllReviews(params));
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const statusMap = {
      pending: 'pending',
      approved: 'approved',
      rejected: 'rejected',
      all: 'all',
    };
    handleFilterChange('status', statusMap[tab]);
  };

  const handleApprove = async (reviewId) => {
    try {
      await dispatch(approveReview(reviewId)).unwrap();
      toast.success('Review approved successfully');
      fetchReviews();
      dispatch(getReviewStats());
    } catch (error) {
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (reviewId) => {
    const reason = prompt('Enter reason for rejection (optional):');
    try {
      await dispatch(rejectReview({ id: reviewId, reason })).unwrap();
      toast.success('Review rejected');
      fetchReviews();
      dispatch(getReviewStats());
    } catch (error) {
      toast.error('Failed to reject review');
    }
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      await dispatch(deleteReview(reviewId)).unwrap();
      toast.success('Review deleted successfully');
      fetchReviews();
      dispatch(getReviewStats());
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const handleAddResponse = async (reviewId) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }
    try {
      await dispatch(addAdminResponse({ reviewId, comment: responseText })).unwrap();
      toast.success('Response added successfully');
      setResponseText('');
      setShowResponseForm(null);
      fetchReviews();
    } catch (error) {
      toast.error('Failed to add response');
    }
  };

  const toggleExpand = (reviewId) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  const toggleResponseForm = (reviewId) => {
    setShowResponseForm(showResponseForm === reviewId ? null : reviewId);
    setResponseText('');
  };

  // Render stars
  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i < rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
    );
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: 'bg-yellow-500', icon: Clock, text: 'Pending' },
      approved: { color: 'bg-green-500', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-500', icon: XCircle, text: 'Rejected' },
    };
    const statusInfo = statusMap[status] || statusMap.pending;
    const Icon = statusInfo.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-white ${statusInfo.color} rounded-full`}>
        <Icon className="h-3 w-3" />
        {statusInfo.text}
      </span>
    );
  };

  // Loading state
  if (loading && !reviews.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader size="lg" text="Loading reviews..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorMessage
        error={error}
        variant="error"
        title="Failed to load reviews"
        onClear={() => {}}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Review Moderation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage and moderate product reviews
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="flex items-center gap-2 px-4 py-2 bg-navy-500 hover:bg-navy-600 text-white font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalReviews || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.totalPending || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalApproved || 0}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
            <p className="text-2xl font-bold text-orange-500">{stats.averageRating?.toFixed(1) || 0}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 overflow-x-auto">
          {['pending', 'approved', 'rejected', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-2 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'pending' && stats?.totalPending > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500 text-white rounded-full">
                  {stats.totalPending}
                </span>
              )}
              {tab === 'approved' && stats?.totalApproved > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-full">
                  {stats.totalApproved}
                </span>
              )}
              {tab === 'rejected' && stats?.totalRejected > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
                  {stats.totalRejected}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            placeholder="Search by user or product..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
          />
        </div>
        <select
          value={filters.rating}
          onChange={(e) => handleFilterChange('rating', e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all"
        >
          <option value="">All Ratings</option>
          <option value="5">5★</option>
          <option value="4">4★ & Up</option>
          <option value="3">3★ & Up</option>
          <option value="2">2★ & Up</option>
          <option value="1">1★ & Up</option>
        </select>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-500">
            <span className="text-4xl block mb-3">📝</span>
            <p className="text-gray-600 dark:text-gray-300">No reviews found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeTab === 'pending' 
                ? 'No pending reviews to moderate.' 
                : 'No reviews match your filters.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Review Header */}
              <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderStars(review.rating)}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {review.rating} / 5
                      </span>
                      {getStatusBadge(review.status)}
                    </div>

                    {review.title && (
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                        {review.title}
                      </h4>
                    )}

                    <p className="text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                      {review.comment}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {review.user?.name || 'Anonymous'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        {review.product?.name || 'Unknown Product'}
                      </span>
                      <span>
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {review.isVerifiedPurchase && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          ✅ Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1 flex-shrink-0">
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(review._id)}
                          className="p-1.5 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                          title="Approve"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleReject(review._id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Reject"
                        >
                          <XCircle className="h-5 w-5" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => toggleResponseForm(review._id)}
                      className="p-1.5 text-navy-600 dark:text-navy-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Add Response"
                    >
                      <MessageSquare className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(review._id)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => toggleExpand(review._id)}
                      className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {expandedReview === review._id ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedReview === review._id && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                    {/* Full Comment */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Comment</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{review.comment}</p>
                    </div>

                    {/* User Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">User</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {review.user?.name || 'Anonymous'}
                          {review.user?.email && (
                            <span className="text-xs text-gray-500 dark:text-gray-500 block">
                              {review.user.email}
                            </span>
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Product</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {review.product?.name || 'Unknown Product'}
                          {review.product?._id && (
                            <span className="text-xs text-gray-500 dark:text-gray-500 block">
                              ID: {review.product._id}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Admin Response */}
                    {review.adminResponse && (
                      <div className="p-3 bg-navy-50 dark:bg-navy-900/20 rounded-lg border border-navy-200 dark:border-navy-800">
                        <p className="text-sm font-medium text-navy-600 dark:text-navy-400">
                          Admin Response
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                          {review.adminResponse.comment}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(review.adminResponse.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Response Form */}
              {showResponseForm === review._id && (
                <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="mt-3 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Admin Response
                    </label>
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write your response to this review..."
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddResponse(review._id)}
                        className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors text-sm"
                      >
                        Submit Response
                      </button>
                      <button
                        onClick={() => toggleResponseForm(review._id)}
                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {reviews.length} reviews
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300 px-2">
              Page {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={reviews.length < pageSize}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-700 dark:text-gray-300"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewModeration;