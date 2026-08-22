import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Get product reviews
 */
export const getProductReviews = createAsyncThunk(
  'reviews/getProductReviews',
  async ({ productId, page = 1, limit = 10, sort = '-createdAt', minRating = 0 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/reviews/product/${productId}`, {
        params: { page, limit, sort, minRating }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

/**
 * Get user's reviews
 */
export const getMyReviews = createAsyncThunk(
  'reviews/getMyReviews',
  async ({ page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/reviews/my-reviews`, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch your reviews');
    }
  }
);

/**
 * Get all reviews (Admin only)
 */
export const getAllReviews = createAsyncThunk(
  'reviews/getAllReviews',
  async ({ page = 1, limit = 20, status = 'all', rating = '', sort = '-createdAt' }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/reviews`, {
        params: { page, limit, status, rating, sort },
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
    }
  }
);

/**
 * Create a review
 */
export const createReview = createAsyncThunk(
  'reviews/createReview',
  async ({ productId, rating, title, comment }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/reviews`,
        { productId, rating, title, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create review');
    }
  }
);

/**
 * Update a review
 */
export const updateReview = createAsyncThunk(
  'reviews/updateReview',
  async ({ id, rating, title, comment }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_URL}/reviews/${id}`,
        { rating, title, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update review');
    }
  }
);

/**
 * Delete a review
 */
export const deleteReview = createAsyncThunk(
  'reviews/deleteReview',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/reviews/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete review');
    }
  }
);

/**
 * Mark review as helpful
 */
export const markHelpful = createAsyncThunk(
  'reviews/markHelpful',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/reviews/${id}/helpful`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { id, helpfulCount: response.data.data.helpfulCount };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as helpful');
    }
  }
);

/**
 * Mark review as unhelpful
 */
export const markUnhelpful = createAsyncThunk(
  'reviews/markUnhelpful',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/reviews/${id}/unhelpful`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { id, helpfulCount: response.data.data.helpfulCount };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark as unhelpful');
    }
  }
);

/**
 * Approve a review (Admin only)
 */
export const approveReview = createAsyncThunk(
  'reviews/approveReview',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_URL}/reviews/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve review');
    }
  }
);

/**
 * Reject a review (Admin only)
 */
export const rejectReview = createAsyncThunk(
  'reviews/rejectReview',
  async ({ id, reason }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_URL}/reviews/${id}/reject`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reject review');
    }
  }
);

/**
 * Add admin response to review
 */
export const addAdminResponse = createAsyncThunk(
  'reviews/addAdminResponse',
  async ({ reviewId, comment }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/reviews/${reviewId}/response`,
        { comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add admin response');
    }
  }
);

/**
 * Get review statistics (Admin only)
 */
export const getReviewStats = createAsyncThunk(
  'reviews/getReviewStats',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/reviews/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch review stats');
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  reviews: [],
  productReviews: [],
  myReviews: [],
  stats: null,
  loading: false,
  error: null,
  success: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
};

// ============================================
// SLICE
// ============================================

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
    clearReviewSuccess: (state) => {
      state.success = false;
    },
    resetReviewState: (state) => {
      state.reviews = [];
      state.productReviews = [];
      state.myReviews = [];
      state.loading = false;
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // ============================================
      // GET PRODUCT REVIEWS
      // ============================================
      .addCase(getProductReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProductReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.productReviews = action.payload.reviews || [];
        state.stats = action.payload.stats || null;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(getProductReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch reviews';
      })

      // ============================================
      // GET MY REVIEWS
      // ============================================
      .addCase(getMyReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.myReviews = action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(getMyReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch your reviews';
      })

      // ============================================
      // GET ALL REVIEWS (Admin)
      // ============================================
      .addCase(getAllReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.data || [];
        state.stats = action.payload.stats || null;
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(getAllReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch reviews';
      })

      // ============================================
      // CREATE REVIEW
      // ============================================
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.reviews.unshift(action.payload);
      })
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create review';
        state.success = false;
      })

      // ============================================
      // UPDATE REVIEW
      // ============================================
      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        const index = state.reviews.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
        const productIndex = state.productReviews.findIndex(r => r._id === action.payload._id);
        if (productIndex !== -1) {
          state.productReviews[productIndex] = action.payload;
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update review';
        state.success = false;
      })

      // ============================================
      // DELETE REVIEW
      // ============================================
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = state.reviews.filter(r => r._id !== action.payload);
        state.productReviews = state.productReviews.filter(r => r._id !== action.payload);
        state.myReviews = state.myReviews.filter(r => r._id !== action.payload);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete review';
      })

      // ============================================
      // MARK HELPFUL / UNHELPFUL
      // ============================================
      .addCase(markHelpful.fulfilled, (state, action) => {
        const { id, helpfulCount } = action.payload;
        const review = state.reviews.find(r => r._id === id);
        if (review) review.helpfulCount = helpfulCount;
        const productReview = state.productReviews.find(r => r._id === id);
        if (productReview) productReview.helpfulCount = helpfulCount;
      })
      .addCase(markUnhelpful.fulfilled, (state, action) => {
        const { id, helpfulCount } = action.payload;
        const review = state.reviews.find(r => r._id === id);
        if (review) review.helpfulCount = helpfulCount;
        const productReview = state.productReviews.find(r => r._id === id);
        if (productReview) productReview.helpfulCount = helpfulCount;
      })

      // ============================================
      // APPROVE REVIEW
      // ============================================
      .addCase(approveReview.fulfilled, (state, action) => {
        const index = state.reviews.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
      })

      // ============================================
      // REJECT REVIEW
      // ============================================
      .addCase(rejectReview.fulfilled, (state, action) => {
        const index = state.reviews.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
      })

      // ============================================
      // ADD ADMIN RESPONSE
      // ============================================
      .addCase(addAdminResponse.fulfilled, (state, action) => {
        const index = state.reviews.findIndex(r => r._id === action.payload._id);
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
      })

      // ============================================
      // GET REVIEW STATS
      // ============================================
      .addCase(getReviewStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  }
});

// ============================================
// EXPORT
// ============================================

export const { clearReviewError, clearReviewSuccess, resetReviewState } = reviewSlice.actions;

export default reviewSlice.reducer;