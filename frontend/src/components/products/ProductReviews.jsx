import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Star, StarHalf, ThumbsUp, ThumbsDown, Flag, X } from 'lucide-react';
import { 
  getProductReviews, 
  createReview, 
  updateReview, 
  deleteReview,
  markHelpful,
  markUnhelpful
} from '../../store/slices/reviewSlice';
import { getProductDetails } from '../../store/slices/productSlice';
import Loader from '../common/Loader';
import ErrorMessage from '../common/ErrorMessage';
import toast from 'react-hot-toast';

const ProductReviews = ({ 
  productId, 
  reviews: externalReviews,
  onReviewAdded,
  className = '' 
}) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { 
    reviews: storeReviews, 
    loading, 
    error,
    stats 
  } = useSelector((state) => state.reviews);

  const [showForm, setShowForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Use external reviews if provided, otherwise use Redux state
  const reviews = externalReviews || storeReviews || [];
  const reviewStats = stats || calculateStats(reviews);

  useEffect(() => {
    if (productId && !externalReviews) {
      dispatch(getProductReviews(productId));
    }
  }, [dispatch, productId, externalReviews]);

  // Reset form when editing is cancelled
  const resetForm = () => {
    setRating(0);
    setTitle('');
    setComment('');
    setEditingReview(null);
    setShowForm(false);
    setSubmitting(false);
  };

  const handleEdit = (review) => {
    setEditingReview(review);
    setRating(review.rating);
    setTitle(review.title || '');
    setComment(review.comment || '');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await dispatch(deleteReview(reviewId)).unwrap();
      toast.success('Review deleted successfully');
      if (productId && !externalReviews) {
        dispatch(getProductReviews(productId));
        dispatch(getProductDetails(productId));
      }
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      return;
    }

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (comment.length < 10) {
      toast.error('Comment must be at least 10 characters');
      return;
    }

    setSubmitting(true);

    try {
      if (editingReview) {
        await dispatch(updateReview({
          id: editingReview._id,
          rating,
          title,
          comment
        })).unwrap();
        toast.success('Review updated successfully');
      } else {
        await dispatch(createReview({
          productId,
          rating,
          title,
          comment
        })).unwrap();
        toast.success('Review submitted successfully! 🎉');
        if (onReviewAdded) onReviewAdded();
      }
      
      resetForm();
      if (productId && !externalReviews) {
        dispatch(getProductReviews(productId));
        dispatch(getProductDetails(productId));
      }
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!isAuthenticated) {
      toast.error('Please login to mark reviews as helpful');
      return;
    }
    try {
      await dispatch(markHelpful(reviewId)).unwrap();
      if (productId && !externalReviews) {
        dispatch(getProductReviews(productId));
      }
    } catch (error) {
      toast.error('Failed to mark as helpful');
    }
  };

  const handleUnhelpful = async (reviewId) => {
    if (!isAuthenticated) {
      toast.error('Please login to mark reviews as unhelpful');
      return;
    }
    try {
      await dispatch(markUnhelpful(reviewId)).unwrap();
      if (productId && !externalReviews) {
        dispatch(getProductReviews(productId));
      }
    } catch (error) {
      toast.error('Failed to mark as unhelpful');
    }
  };

  const calculateStats = (reviewList) => {
    if (!reviewList || reviewList.length === 0) {
      return {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const total = reviewList.length;
    const sum = reviewList.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / total;

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviewList.forEach(r => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating]++;
      }
    });

    return {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: total,
      ratingDistribution: distribution
    };
  };

  const getSortedReviews = () => {
    const sorted = [...reviews];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'highest':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'lowest':
        return sorted.sort((a, b) => a.rating - b.rating);
      case 'helpful':
        return sorted.sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
      default:
        return sorted;
    }
  };

  const sortedReviews = getSortedReviews();

  // Render stars for rating display
  const renderStars = (ratingValue, size = 'h-4 w-4') => {
    const fullStars = Math.floor(ratingValue);
    const halfStar = ratingValue % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} className={`${size} text-yellow-400 fill-yellow-400`} />
        ))}
        {halfStar && (
          <StarHalf className={`${size} text-yellow-400 fill-yellow-400`} />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} className={`${size} text-gray-300 dark:text-gray-600`} />
        ))}
      </div>
    );
  };

  // Render rating input stars
  const renderRatingInput = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => setRating(star)}
            className="p-0.5 focus:outline-none"
          >
            <Star
              className={`h-8 w-8 transition-colors ${
                star <= (hoverRating || rating)
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
          {rating > 0 ? `${rating} / 5` : 'Select rating'}
        </span>
      </div>
    );
  };

  // Loading state
  if (loading && !reviews.length) {
    return (
      <div className={`${className} py-8`}>
        <div className="flex items-center justify-center">
          <Loader size="md" text="Loading reviews..." />
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
          title="Failed to load reviews"
          onClear={() => {}} 
        />
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Stats Summary */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="text-center sm:text-left">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {reviewStats.averageRating || 0}
            </div>
            <div className="flex justify-center sm:justify-start mt-1">
              {renderStars(reviewStats.averageRating, 'h-5 w-5')}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {reviewStats.totalReviews} {reviewStats.totalReviews === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = reviewStats.ratingDistribution?.[star] || 0;
              const percentage = reviewStats.totalReviews > 0 
                ? (count / reviewStats.totalReviews) * 100 
                : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300 w-8">
                    {star}★
                  </span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Write Review Button */}
      {isAuthenticated && (
        <div className="mb-6">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
            >
              Write a Review
            </button>
          ) : (
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingReview ? 'Edit Your Review' : 'Write a Review'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Rating Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating *
                </label>
                {renderRatingInput()}
              </div>

              {/* Title Input */}
              <div>
                <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  id="review-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
                />
              </div>

              {/* Comment Input */}
              <div>
                <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment *
                </label>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-y"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {comment.length}/500 characters
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 dark:disabled:bg-orange-700 text-white font-medium rounded-lg transition-colors"
              >
                {submitting ? 'Submitting...' : editingReview ? 'Update Review' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sort Controls */}
      {reviews.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      )}

      {/* Reviews List */}
      {sortedReviews.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500">
            <span className="text-4xl block mb-3">📝</span>
            <p className="text-gray-600 dark:text-gray-300">No reviews yet</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Be the first to review this product!
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReviews.map((review) => {
            const isOwner = user && (review.user?._id === user._id || review.user === user._id);
            const isAdmin = user?.role === 'admin';
            const canModerate = isOwner || isAdmin;

            return (
              <div
                key={review._id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {renderStars(review.rating, 'h-4 w-4')}
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {review.rating} / 5
                      </span>
                    </div>
                    {review.title && (
                      <h4 className="text-base font-semibold text-gray-900 dark:text-white mt-1">
                        {review.title}
                      </h4>
                    )}
                    <p className="text-gray-600 dark:text-gray-300 mt-2">
                      {review.comment}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>
                        By {review.user?.name || 'Anonymous User'}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      {review.isVerifiedPurchase && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ✅ Verified Purchase
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Admin/Owner Actions */}
                  {canModerate && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(review)}
                        className="px-2 py-1 text-sm text-navy-600 dark:text-navy-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="px-2 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Helpful Section */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => handleHelpful(review._id)}
                    className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-navy-600 dark:hover:text-navy-400 transition-colors"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{review.helpfulCount || 0}</span>
                  </button>
                  <button
                    onClick={() => handleUnhelpful(review._id)}
                    className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </button>
                  <button
                    className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    <Flag className="h-4 w-4" />
                    <span className="hidden sm:inline">Report</span>
                  </button>
                </div>

                {/* Admin Response */}
                {review.adminResponse && (
                  <div className="mt-4 p-4 bg-navy-50 dark:bg-navy-900/20 rounded-lg border border-navy-200 dark:border-navy-800">
                    <div className="flex items-start gap-2">
                      <span className="text-navy-600 dark:text-navy-400 font-medium text-sm">
                        🛍️ Admin Response
                      </span>
                    </div>
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
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;