import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// ASYNC THUNKS
// ============================================

// Get cart
export const getCart = createAsyncThunk(
  'cart/get',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add to cart
export const addToCart = createAsyncThunk(
  'cart/add',
  async ({ productId, quantity = 1, variation }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(
        `${API_URL}/cart`,
        { productId, quantity, variation },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update cart item
export const updateCartItem = createAsyncThunk(
  'cart/update',
  async ({ productId, quantity, variation }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(
        `${API_URL}/cart/${productId}`,
        { quantity, variation },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Remove from cart
export const removeFromCart = createAsyncThunk(
  'cart/remove',
  async ({ productId, variation }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const query = variation ? `?variation=${encodeURIComponent(JSON.stringify(variation))}` : '';
      await axios.delete(`${API_URL}/cart/${productId}${query}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return { productId, variation };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Clear cart
export const clearCart = createAsyncThunk(
  'cart/clear',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await axios.delete(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Apply coupon
export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (couponCode, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(
        `${API_URL}/cart/coupon`,
        { couponCode },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Remove coupon
export const removeCoupon = createAsyncThunk(
  'cart/removeCoupon',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.delete(`${API_URL}/cart/coupon`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  items: [],
  subtotal: 0,
  taxAmount: 0,
  shippingAmount: 0,
  discountAmount: 0,
  couponCode: null,
  couponDiscount: 0,
  totalPrice: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
  success: false
};

// ============================================
// SLICE
// ============================================

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
    clearCartSuccess: (state) => {
      state.success = false;
    },
    resetCart: (state) => {
      return initialState;
    },
    // Local cart update (for optimistic updates)
    localAddItem: (state, action) => {
      const { product, quantity, variation } = action.payload;
      const existingItem = state.items.find(
        item =>
          item.product._id === product._id &&
          JSON.stringify(item.variation) === JSON.stringify(variation)
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity,
          image: product.images?.[0]?.url,
          variation,
          totalPrice: product.price * quantity
        });
      }

      // Recalculate totals
      state.subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0);
      state.totalPrice = state.subtotal + state.taxAmount + state.shippingAmount - state.discountAmount - state.couponDiscount;
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    }
  },
  extraReducers: (builder) => {
    builder
      // ==========================================
      // Get Cart
      // ==========================================
      .addCase(getCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.isLoading = false;
        const data = action.payload.data;
        state.items = data.items || [];
        state.subtotal = data.subtotal || 0;
        state.taxAmount = data.taxAmount || 0;
        state.shippingAmount = data.shippingAmount || 0;
        state.discountAmount = data.discountAmount || 0;
        state.couponCode = data.couponCode || null;
        state.couponDiscount = data.couponDiscount || 0;
        state.totalPrice = data.totalPrice || 0;
        state.itemCount = data.itemCount || 0;
      })
      .addCase(getCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load cart';
      })

      // ==========================================
      // Add to Cart
      // ==========================================
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        const data = action.payload.data;
        state.items = data.items || [];
        state.subtotal = data.subtotal || 0;
        state.totalPrice = data.totalPrice || 0;
        state.itemCount = data.itemCount || 0;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to add to cart';
      })

      // ==========================================
      // Update Cart Item
      // ==========================================
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        const data = action.payload.data;
        state.items = data.items || [];
        state.subtotal = data.subtotal || 0;
        state.totalPrice = data.totalPrice || 0;
        state.itemCount = data.itemCount || 0;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to update cart';
      })

      // ==========================================
      // Remove from Cart
      // ==========================================
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        // Remove item from local state
        state.items = state.items.filter(
          item =>
            !(item.product === action.payload.productId &&
              JSON.stringify(item.variation) === JSON.stringify(action.payload.variation))
        );
        // Recalculate totals
        state.subtotal = state.items.reduce((sum, item) => sum + item.totalPrice, 0);
        state.totalPrice = state.subtotal + state.taxAmount + state.shippingAmount - state.discountAmount - state.couponDiscount;
        state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to remove from cart';
      })

      // ==========================================
      // Clear Cart
      // ==========================================
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.subtotal = 0;
        state.totalPrice = 0;
        state.itemCount = 0;
        state.couponCode = null;
        state.couponDiscount = 0;
        state.success = true;
      })

      // ==========================================
      // Apply Coupon
      // ==========================================
      .addCase(applyCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        const data = action.payload.data;
        state.couponCode = data.couponCode || null;
        state.couponDiscount = data.couponDiscount || 0;
        state.totalPrice = data.totalPrice || 0;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to apply coupon';
      })

      // ==========================================
      // Remove Coupon
      // ==========================================
      .addCase(removeCoupon.fulfilled, (state, action) => {
        state.couponCode = null;
        state.couponDiscount = 0;
        state.totalPrice = action.payload.data.totalPrice || state.totalPrice;
        state.success = true;
      });
  }
});

export const {
  clearCartError,
  clearCartSuccess,
  resetCart,
  localAddItem
} = cartSlice.actions;

export default cartSlice.reducer;