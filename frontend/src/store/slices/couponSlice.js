import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// ✅ ADMIN COUPON THUNKS
// ============================================

// ✅ Get all coupons (Admin)
export const getCoupons = createAsyncThunk(
  'coupons/getCoupons',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/coupons?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupons');
    }
  }
);

// ✅ Get single coupon (Admin)
export const getCouponById = createAsyncThunk(
  'coupons/getCouponById',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupon');
    }
  }
);

// ✅ Create coupon (Admin)
export const createCoupon = createAsyncThunk(
  'coupons/createCoupon',
  async (couponData, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${API_URL}/coupons`, couponData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create coupon');
    }
  }
);

// ✅ Update coupon (Admin)
export const updateCoupon = createAsyncThunk(
  'coupons/updateCoupon',
  async ({ id, couponData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(`${API_URL}/coupons/${id}`, couponData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update coupon');
    }
  }
);

// ✅ Delete coupon (Admin)
export const deleteCoupon = createAsyncThunk(
  'coupons/deleteCoupon',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete coupon');
    }
  }
);

// ✅ Toggle coupon status (Admin)
export const toggleCouponStatus = createAsyncThunk(
  'coupons/toggleCouponStatus',
  async (id, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.patch(
        `${API_URL}/coupons/${id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle coupon status');
    }
  }
);

// ✅ Validate coupon (Public)
export const validateCoupon = createAsyncThunk(
  'coupons/validateCoupon',
  async ({ code, userId, cartTotal }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      if (cartTotal) params.append('cartTotal', cartTotal);
      
      const response = await axios.get(
        `${API_URL}/coupons/validate/${code}?${params.toString()}`
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Invalid coupon');
    }
  }
);

// ============================================
// ✅ SELLER COUPON THUNKS
// ============================================

// ✅ Get seller coupons
export const getSellerCoupons = createAsyncThunk(
  'coupons/getSellerCoupons',
  async (params = {}, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/seller/coupons?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch seller coupons');
    }
  }
);

// ✅ Create product coupon (Seller)
export const createProductCoupon = createAsyncThunk(
  'coupons/createProductCoupon',
  async ({ productId, couponData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/seller/coupons/product/${productId}`,
        couponData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create product coupon');
    }
  }
);

// ✅ Update product coupon (Seller)
export const updateProductCoupon = createAsyncThunk(
  'coupons/updateProductCoupon',
  async ({ productId, couponCode, couponData }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_URL}/seller/coupons/product/${productId}/${couponCode}`,
        couponData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update product coupon');
    }
  }
);

// ✅ Delete product coupon (Seller)
export const deleteProductCoupon = createAsyncThunk(
  'coupons/deleteProductCoupon',
  async ({ productId, couponCode }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(
        `${API_URL}/seller/coupons/product/${productId}/${couponCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return { productId, couponCode };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete product coupon');
    }
  }
);

// ✅ Toggle product coupon status (Seller)
export const toggleProductCoupon = createAsyncThunk(
  'coupons/toggleProductCoupon',
  async ({ productId, couponCode }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.patch(
        `${API_URL}/seller/coupons/product/${productId}/${couponCode}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to toggle product coupon');
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  coupons: [],
  selectedCoupon: null,
  sellerCoupons: [],
  validatedCoupon: null,
  isLoading: false,
  error: null,
  success: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  }
};

// ============================================
// SLICE
// ============================================

const couponSlice = createSlice({
  name: 'coupons',
  initialState,
  reducers: {
    clearCouponError: (state) => {
      state.error = null;
    },
    clearCouponSuccess: (state) => {
      state.success = false;
    },
    clearSelectedCoupon: (state) => {
      state.selectedCoupon = null;
    },
    clearValidatedCoupon: (state) => {
      state.validatedCoupon = null;
    },
    clearCoupons: (state) => {
      state.coupons = [];
      state.sellerCoupons = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // ==========================================
      // GET COUPONS (Admin)
      // ==========================================
      .addCase(getCoupons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCoupons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.coupons = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        };
      })
      .addCase(getCoupons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch coupons';
      })

      // ==========================================
      // GET COUPON BY ID (Admin)
      // ==========================================
      .addCase(getCouponById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCouponById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedCoupon = action.payload;
      })
      .addCase(getCouponById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch coupon';
      })

      // ==========================================
      // CREATE COUPON (Admin)
      // ==========================================
      .addCase(createCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.coupons.unshift(action.payload);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create coupon';
      })

      // ==========================================
      // UPDATE COUPON (Admin)
      // ==========================================
      .addCase(updateCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        const index = state.coupons.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
        if (state.selectedCoupon?._id === action.payload._id) {
          state.selectedCoupon = action.payload;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update coupon';
      })

      // ==========================================
      // DELETE COUPON (Admin)
      // ==========================================
      .addCase(deleteCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.coupons = state.coupons.filter(c => c._id !== action.payload);
        if (state.selectedCoupon?._id === action.payload) {
          state.selectedCoupon = null;
        }
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete coupon';
      })

      // ==========================================
      // TOGGLE COUPON STATUS (Admin)
      // ==========================================
      .addCase(toggleCouponStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.coupons.findIndex(c => c._id === action.payload._id);
        if (index !== -1) {
          state.coupons[index] = action.payload;
        }
        if (state.selectedCoupon?._id === action.payload._id) {
          state.selectedCoupon = action.payload;
        }
      })
      .addCase(toggleCouponStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to toggle coupon status';
      })

      // ==========================================
      // VALIDATE COUPON (Public)
      // ==========================================
      .addCase(validateCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.validatedCoupon = null;
      })
      .addCase(validateCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.validatedCoupon = action.payload;
      })
      .addCase(validateCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Invalid coupon';
        state.validatedCoupon = null;
      })

      // ==========================================
      // GET SELLER COUPONS
      // ==========================================
      .addCase(getSellerCoupons.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSellerCoupons.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sellerCoupons = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        };
      })
      .addCase(getSellerCoupons.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch seller coupons';
      })

      // ==========================================
      // CREATE PRODUCT COUPON (Seller)
      // ==========================================
      .addCase(createProductCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createProductCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        // The response is the updated product, so we need to extract coupon info
        // The seller coupons will be refreshed via getSellerCoupons
      })
      .addCase(createProductCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to create product coupon';
      })

      // ==========================================
      // UPDATE PRODUCT COUPON (Seller)
      // ==========================================
      .addCase(updateProductCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProductCoupon.fulfilled, (state) => {
        state.isLoading = false;
        state.success = true;
      })
      .addCase(updateProductCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update product coupon';
      })

      // ==========================================
      // DELETE PRODUCT COUPON (Seller)
      // ==========================================
      .addCase(deleteProductCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProductCoupon.fulfilled, (state) => {
        state.isLoading = false;
        state.success = true;
      })
      .addCase(deleteProductCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to delete product coupon';
      })

      // ==========================================
      // TOGGLE PRODUCT COUPON (Seller)
      // ==========================================
      .addCase(toggleProductCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleProductCoupon.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(toggleProductCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to toggle product coupon';
      });
  }
});

// ============================================
// SELECTORS
// ============================================

export const selectAllCoupons = (state) => state.coupons.coupons;
export const selectSelectedCoupon = (state) => state.coupons.selectedCoupon;
export const selectSellerCoupons = (state) => state.coupons.sellerCoupons;
export const selectValidatedCoupon = (state) => state.coupons.validatedCoupon;
export const selectCouponLoading = (state) => state.coupons.isLoading;
export const selectCouponError = (state) => state.coupons.error;
export const selectCouponSuccess = (state) => state.coupons.success;
export const selectCouponPagination = (state) => state.coupons.pagination;

// ============================================
// EXPORT ACTIONS
// ============================================

export const {
  clearCouponError,
  clearCouponSuccess,
  clearSelectedCoupon,
  clearValidatedCoupon,
  clearCoupons
} = couponSlice.actions;

export default couponSlice.reducer;