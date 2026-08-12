import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// ASYNC THUNKS
// ============================================

// ✅ Get cart
export const getCart = createAsyncThunk(
  'cart/getCart',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

// ✅ Add to cart
export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/cart`,
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
    }
  }
);

// ✅ Update cart item
export const updateCartItem = createAsyncThunk(
  'cart/updateCartItem',
  async ({ productId, quantity }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_URL}/cart/${productId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart');
    }
  }
);

// ✅ Remove from cart
export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (productId, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(`${API_URL}/cart/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
    }
  }
);

// ✅ Clear cart
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

// ✅ Apply coupon to cart
export const applyCoupon = createAsyncThunk(
  'cart/applyCoupon',
  async (couponCode, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/cart/apply-coupon`,
        { couponCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply coupon');
    }
  }
);

// ✅ Remove coupon from cart
export const removeCoupon = createAsyncThunk(
  'cart/removeCoupon',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.delete(`${API_URL}/cart/remove-coupon`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove coupon');
    }
  }
);

// ✅ Apply product-specific coupon
export const applyProductCoupon = createAsyncThunk(
  'cart/applyProductCoupon',
  async ({ productId, couponCode }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${API_URL}/cart/apply-product-coupon`,
        { productId, couponCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to apply product coupon');
    }
  }
);

// ✅ Update shipping method
export const updateShipping = createAsyncThunk(
  'cart/updateShipping',
  async ({ shippingMethod, shippingAddress }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `${API_URL}/cart/shipping`,
        { shippingMethod, shippingAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update shipping');
    }
  }
);

// ✅ Get cart summary
export const getCartSummary = createAsyncThunk(
  'cart/getCartSummary',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/cart/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get cart summary');
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
  shippingMethod: 'standard',
  discountAmount: 0,
  couponCode: null,
  couponDiscount: 0,
  couponApplied: false,
  productCoupons: [],
  totalPrice: 0,
  itemCount: 0,
  isLoading: false,
  error: null,
  isOpen: false,
};

// ============================================
// SLICE
// ============================================

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // ✅ Open/close cart drawer
    openCart: (state) => {
      state.isOpen = true;
    },
    closeCart: (state) => {
      state.isOpen = false;
    },
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    
    // ✅ Clear cart error
    clearCartError: (state) => {
      state.error = null;
    },
    
    // ✅ Update shipping method locally
    setShippingMethod: (state, action) => {
      state.shippingMethod = action.payload;
      state.shippingAmount = getShippingCost(action.payload);
    },
    
    // ✅ Update shipping address locally
    setShippingAddress: (state, action) => {
      state.shippingAddress = action.payload;
    },
    
    // ✅ Remove coupon locally (if API fails)
    removeCouponLocal: (state) => {
      state.couponCode = null;
      state.couponDiscount = 0;
      state.couponApplied = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ==========================================
      // GET CART
      // ==========================================
      .addCase(getCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.taxAmount = action.payload.taxAmount || 0;
        state.shippingAmount = action.payload.shippingAmount || 0;
        state.discountAmount = action.payload.discountAmount || 0;
        state.couponCode = action.payload.couponCode || null;
        state.couponDiscount = action.payload.couponDiscount || 0;
        state.couponApplied = action.payload.couponApplied || false;
        state.productCoupons = action.payload.productCoupons || [];
        state.totalPrice = action.payload.totalPrice || 0;
        state.itemCount = action.payload.itemCount || 0;
        state.shippingMethod = action.payload.shippingMethod || 'standard';
      })
      .addCase(getCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to load cart';
      })

      // ==========================================
      // ADD TO CART
      // ==========================================
      .addCase(addToCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.taxAmount = action.payload.taxAmount || 0;
        state.shippingAmount = action.payload.shippingAmount || 0;
        state.discountAmount = action.payload.discountAmount || 0;
        state.totalPrice = action.payload.totalPrice || 0;
        state.itemCount = action.payload.itemCount || 0;
        state.isOpen = true;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to add to cart';
      })

      // ==========================================
      // UPDATE CART ITEM
      // ==========================================
      .addCase(updateCartItem.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.taxAmount = action.payload.taxAmount || 0;
        state.shippingAmount = action.payload.shippingAmount || 0;
        state.discountAmount = action.payload.discountAmount || 0;
        state.totalPrice = action.payload.totalPrice || 0;
        state.itemCount = action.payload.itemCount || 0;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update cart';
      })

      // ==========================================
      // REMOVE FROM CART
      // ==========================================
      .addCase(removeFromCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.taxAmount = action.payload.taxAmount || 0;
        state.shippingAmount = action.payload.shippingAmount || 0;
        state.discountAmount = action.payload.discountAmount || 0;
        state.totalPrice = action.payload.totalPrice || 0;
        state.itemCount = action.payload.itemCount || 0;
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to remove from cart';
      })

      // ==========================================
      // CLEAR CART
      // ==========================================
      .addCase(clearCart.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.isLoading = false;
        state.items = [];
        state.subtotal = 0;
        state.taxAmount = 0;
        state.shippingAmount = 0;
        state.discountAmount = 0;
        state.couponCode = null;
        state.couponDiscount = 0;
        state.couponApplied = false;
        state.productCoupons = [];
        state.totalPrice = 0;
        state.itemCount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to clear cart';
      })

      // ==========================================
      // ✅ APPLY COUPON
      // ==========================================
      .addCase(applyCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.couponCode = action.payload.coupon || action.payload.couponCode;
        state.couponDiscount = action.payload.discountAmount || 0;
        state.couponApplied = true;
        state.totalPrice = action.payload.newTotal || action.payload.cart?.totalPrice || state.totalPrice;
        if (action.payload.cart) {
          state.items = action.payload.cart.items || [];
          state.subtotal = action.payload.cart.subtotal || 0;
          state.taxAmount = action.payload.cart.taxAmount || 0;
          state.shippingAmount = action.payload.cart.shippingAmount || 0;
          state.discountAmount = action.payload.cart.discountAmount || 0;
          state.itemCount = action.payload.cart.itemCount || 0;
        }
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to apply coupon';
        state.couponApplied = false;
      })

      // ==========================================
      // ✅ REMOVE COUPON
      // ==========================================
      .addCase(removeCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.couponCode = null;
        state.couponDiscount = 0;
        state.couponApplied = false;
        state.totalPrice = action.payload.totalPrice || state.totalPrice;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.subtotal = action.payload.subtotal || 0;
          state.taxAmount = action.payload.taxAmount || 0;
          state.shippingAmount = action.payload.shippingAmount || 0;
          state.discountAmount = action.payload.discountAmount || 0;
          state.itemCount = action.payload.itemCount || 0;
        }
      })
      .addCase(removeCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to remove coupon';
      })

      // ==========================================
      // ✅ APPLY PRODUCT COUPON
      // ==========================================
      .addCase(applyProductCoupon.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(applyProductCoupon.fulfilled, (state, action) => {
        state.isLoading = false;
        state.couponApplied = true;
        if (action.payload.cart) {
          state.items = action.payload.cart.items || [];
          state.subtotal = action.payload.cart.subtotal || 0;
          state.taxAmount = action.payload.cart.taxAmount || 0;
          state.shippingAmount = action.payload.cart.shippingAmount || 0;
          state.discountAmount = action.payload.cart.discountAmount || 0;
          state.totalPrice = action.payload.cart.totalPrice || 0;
          state.itemCount = action.payload.cart.itemCount || 0;
          state.productCoupons = action.payload.cart.productCoupons || [];
        }
      })
      .addCase(applyProductCoupon.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to apply product coupon';
      })

      // ==========================================
      // UPDATE SHIPPING
      // ==========================================
      .addCase(updateShipping.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateShipping.fulfilled, (state, action) => {
        state.isLoading = false;
        state.shippingMethod = action.payload.shippingMethod || 'standard';
        state.shippingAmount = action.payload.shippingAmount || 0;
        state.totalPrice = action.payload.totalPrice || state.totalPrice;
        if (action.payload) {
          state.items = action.payload.items || [];
          state.subtotal = action.payload.subtotal || 0;
          state.taxAmount = action.payload.taxAmount || 0;
          state.discountAmount = action.payload.discountAmount || 0;
          state.itemCount = action.payload.itemCount || 0;
        }
      })
      .addCase(updateShipping.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to update shipping';
      })

      // ==========================================
      // GET CART SUMMARY
      // ==========================================
      .addCase(getCartSummary.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCartSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.items || [];
        state.subtotal = action.payload.subtotal || 0;
        state.taxAmount = action.payload.taxAmount || 0;
        state.shippingAmount = action.payload.shippingAmount || 0;
        state.discountAmount = action.payload.discountAmount || 0;
        state.couponCode = action.payload.couponCode || null;
        state.couponDiscount = action.payload.couponDiscount || 0;
        state.couponApplied = !!action.payload.couponCode;
        state.totalPrice = action.payload.totalPrice || 0;
        state.itemCount = action.payload.itemCount || 0;
      })
      .addCase(getCartSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to get cart summary';
      });
  }
});

// ============================================
// HELPERS
// ============================================

const getShippingCost = (method) => {
  const costs = {
    standard: 5.99,
    express: 12.99,
    international: 25.99
  };
  return costs[method] || 5.99;
};

// ============================================
// SELECTORS
// ============================================

export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.totalPrice;
export const selectCartItemCount = (state) => state.cart.itemCount;
export const selectCartSubtotal = (state) => state.cart.subtotal;
export const selectCouponDiscount = (state) => state.cart.couponDiscount;
export const selectIsCouponApplied = (state) => state.cart.couponApplied;
export const selectCartLoading = (state) => state.cart.isLoading;
export const selectCartError = (state) => state.cart.error;

// ============================================
// EXPORT ACTIONS
// ============================================

export const {
  openCart,
  closeCart,
  toggleCart,
  clearCartError,
  setShippingMethod,
  setShippingAddress,
  removeCouponLocal
} = cartSlice.actions;

export default cartSlice.reducer;