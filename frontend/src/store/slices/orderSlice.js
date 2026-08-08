import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// ASYNC THUNKS
// ============================================

// Create order
export const createOrder = createAsyncThunk(
  'orders/create',
  async (orderData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(`${API_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get my orders
export const getMyOrders = createAsyncThunk(
  'orders/getMyOrders',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/orders/my-orders?${query}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single order
export const getOrder = createAsyncThunk(
  'orders/getOne',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/orders/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Cancel order
export const cancelOrder = createAsyncThunk(
  'orders/cancel',
  async ({ id, reason }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(
        `${API_URL}/orders/${id}/cancel`,
        { reason },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get order tracking
export const getOrderTracking = createAsyncThunk(
  'orders/getTracking',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/orders/${id}/tracking`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Get order stats (Admin)
export const getOrderStats = createAsyncThunk(
  'orders/getStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/orders/stats`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Get daily order stats (Admin)
export const getDailyOrderStats = createAsyncThunk(
  'orders/getDailyStats',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/orders/daily-stats?${query}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all orders (Admin)
export const getAllOrders = createAsyncThunk(
  'orders/getAll',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/orders?${query}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update order status (Admin)
export const updateOrderStatus = createAsyncThunk(
  'orders/updateStatus',
  async ({ id, status, note }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(
        `${API_URL}/orders/${id}/status`,
        { status, note },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add tracking info (Admin)
export const addTrackingInfo = createAsyncThunk(
  'orders/addTracking',
  async ({ id, trackingData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(
        `${API_URL}/orders/${id}/tracking`,
        trackingData,
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Export orders (Admin)
export const exportOrders = createAsyncThunk(
  'orders/export',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/orders/export?${query}`, {
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  orders: [],
  order: null,
  tracking: null,
  stats: null,
  dailyStats: [],
  isLoading: false,
  error: null,
  success: false,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  },
  filters: {
    status: '',
    paymentStatus: '',
    startDate: '',
    endDate: ''
  }
};

// ============================================
// SLICE
// ============================================

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearOrderSuccess: (state) => {
      state.success = false;
    },
    clearOrder: (state) => {
      state.order = null;
    },
    clearTracking: (state) => {
      state.tracking = null;
    },
    setOrderFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearOrderFilters: (state) => {
      state.filters = {
        status: '',
        paymentStatus: '',
        startDate: '',
        endDate: ''
      };
    }
  },
  extraReducers: (builder) => {
    builder
      // ==========================================
      // Create Order
      // ==========================================
      .addCase(createOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.order = action.payload.data;
        state.orders.unshift(action.payload.data);
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to create order';
      })

      // ==========================================
      // Get My Orders
      // ==========================================
      .addCase(getMyOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMyOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data;
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        };
      })
      .addCase(getMyOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load orders';
      })

      // ==========================================
      // Get Single Order
      // ==========================================
      .addCase(getOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.order = null;
      })
      .addCase(getOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.order = action.payload.data;
      })
      .addCase(getOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Order not found';
      })

      // ==========================================
      // Cancel Order
      // ==========================================
      .addCase(cancelOrder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        const updatedOrder = action.payload.data;
        const index = state.orders.findIndex(o => o._id === updatedOrder._id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        if (state.order?._id === updatedOrder._id) {
          state.order = updatedOrder;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to cancel order';
      })

      // ==========================================
      // Get Order Tracking
      // ==========================================
      .addCase(getOrderTracking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderTracking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tracking = action.payload.data;
      })
      .addCase(getOrderTracking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load tracking';
      })

      // ==========================================
      // ✅ Get Order Stats
      // ==========================================
      .addCase(getOrderStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.data;
      })
      .addCase(getOrderStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load stats';
      })

      // ==========================================
      // ✅ Get Daily Order Stats
      // ==========================================
      .addCase(getDailyOrderStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getDailyOrderStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dailyStats = action.payload.data || [];
      })
      .addCase(getDailyOrderStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load daily stats';
      })

      // ==========================================
      // Get All Orders (Admin)
      // ==========================================
      .addCase(getAllOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.data;
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        };
      })
      .addCase(getAllOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load orders';
      })

      // ==========================================
      // Update Order Status (Admin)
      // ==========================================
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        const updatedOrder = action.payload.data;
        const index = state.orders.findIndex(o => o._id === updatedOrder._id);
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
        if (state.order?._id === updatedOrder._id) {
          state.order = updatedOrder;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to update order status';
      });
  }
});

export const {
  clearOrderError,
  clearOrderSuccess,
  clearOrder,
  clearTracking,
  setOrderFilters,
  clearOrderFilters
} = orderSlice.actions;

export default orderSlice.reducer;