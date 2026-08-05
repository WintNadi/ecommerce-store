import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// ASYNC THUNKS
// ============================================

// Get all products
export const getProducts = createAsyncThunk(
  'products/getAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/products?${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single product
export const getProduct = createAsyncThunk(
  'products/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create product (Admin/Seller)
export const createProduct = createAsyncThunk(
  'products/create',
  async (productData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(`${API_URL}/products`, productData, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update product (Admin/Seller)
export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, productData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(`${API_URL}/products/${id}`, productData, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete product (Admin/Seller)
export const deleteProduct = createAsyncThunk(
  'products/delete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return { id };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get featured products
export const getFeaturedProducts = createAsyncThunk(
  'products/getFeatured',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/featured?limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get top selling products
export const getTopSelling = createAsyncThunk(
  'products/getTopSelling',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/products/top-selling?limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Search products
export const searchProducts = createAsyncThunk(
  'products/search',
  async ({ query, filters = {} }, { rejectWithValue }) => {
    try {
      const params = { q: query, ...filters };
      const queryString = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/products/search?${queryString}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Add review
export const addReview = createAsyncThunk(
  'products/addReview',
  async ({ productId, reviewData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(
        `${API_URL}/products/${productId}/reviews`,
        reviewData,
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get product stats (Admin)
export const getProductStats = createAsyncThunk(
  'products/getStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/products/stats`, {
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
  products: [],
  product: null,
  featuredProducts: [],
  topSelling: [],
  searchResults: [],
  stats: null,
  isLoading: false,
  error: null,
  success: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  },
  filters: {
    category: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    sort: '-createdAt'
  }
};

// ============================================
// SLICE
// ============================================

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    clearProductError: (state) => {
      state.error = null;
    },
    clearProductSuccess: (state) => {
      state.success = false;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        minPrice: '',
        maxPrice: '',
        rating: '',
        sort: '-createdAt'
      };
    },
    clearProduct: (state) => {
      state.product = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // ==========================================
      // Get All Products
      // ==========================================
      .addCase(getProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        };
      })
      .addCase(getProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load products';
      })

      // ==========================================
      // Get Single Product
      // ==========================================
      .addCase(getProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.product = null;
      })
      .addCase(getProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.product = action.payload.data;
      })
      .addCase(getProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Product not found';
      })

      // ==========================================
      // Create Product
      // ==========================================
      .addCase(createProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.products.unshift(action.payload.data);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to create product';
      })

      // ==========================================
      // Update Product
      // ==========================================
      .addCase(updateProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        const index = state.products.findIndex(p => p._id === action.payload.data._id);
        if (index !== -1) {
          state.products[index] = action.payload.data;
        }
        if (state.product?._id === action.payload.data._id) {
          state.product = action.payload.data;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to update product';
      })

      // ==========================================
      // Delete Product
      // ==========================================
      .addCase(deleteProduct.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.products = state.products.filter(p => p._id !== action.payload.id);
        if (state.product?._id === action.payload.id) {
          state.product = null;
        }
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to delete product';
      })

      // ==========================================
      // Featured Products
      // ==========================================
      .addCase(getFeaturedProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getFeaturedProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredProducts = action.payload.data || [];
      })
      .addCase(getFeaturedProducts.rejected, (state) => {
        state.isLoading = false;
      })

      // ==========================================
      // Top Selling Products
      // ==========================================
      .addCase(getTopSelling.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTopSelling.fulfilled, (state, action) => {
        state.isLoading = false;
        state.topSelling = action.payload.data || [];
      })
      .addCase(getTopSelling.rejected, (state) => {
        state.isLoading = false;
      })

      // ==========================================
      // Search Products
      // ==========================================
      .addCase(searchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        };
      })
      .addCase(searchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Search failed';
      })

      // ==========================================
      // Add Review
      // ==========================================
      .addCase(addReview.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        if (state.product) {
          state.product.reviews = action.payload.data;
        }
      })
      .addCase(addReview.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to add review';
      })

      // ==========================================
      // Get Product Stats
      // ==========================================
      .addCase(getProductStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProductStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload.data;
      })
      .addCase(getProductStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load product stats';
      });
  }
});

export const {
  clearProductError,
  clearProductSuccess,
  setFilters,
  clearFilters,
  clearProduct,
  clearSearchResults
} = productSlice.actions;

export default productSlice.reducer;