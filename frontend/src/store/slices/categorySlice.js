import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// ASYNC THUNKS
// ============================================

// Get all categories
export const getCategories = createAsyncThunk(
  'categories/getAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/categories?${query}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get single category
export const getCategory = createAsyncThunk(
  'categories/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/categories/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Create category (Admin only)
export const createCategory = createAsyncThunk(
  'categories/create',
  async (categoryData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.post(`${API_URL}/categories`, categoryData, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update category (Admin only)
export const updateCategory = createAsyncThunk(
  'categories/update',
  async ({ id, categoryData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(`${API_URL}/categories/${id}`, categoryData, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete category (Admin only)
export const deleteCategory = createAsyncThunk(
  'categories/delete',
  async (id, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await axios.delete(`${API_URL}/categories/${id}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return { id };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================
// INITIAL STATE
// ============================================

const initialState = {
  categories: [],
  category: null,
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

const categorySlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    clearCategoryError: (state) => {
      state.error = null;
    },
    clearCategorySuccess: (state) => {
      state.success = false;
    },
    clearCategory: (state) => {
      state.category = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // ==========================================
      // Get All Categories
      // ==========================================
      .addCase(getCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0
        };
      })
      .addCase(getCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load categories';
      })

      // ==========================================
      // Get Single Category
      // ==========================================
      .addCase(getCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.category = null;
      })
      .addCase(getCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.category = action.payload.data;
      })
      .addCase(getCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Category not found';
      })

      // ==========================================
      // Create Category
      // ==========================================
      .addCase(createCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.categories.unshift(action.payload.data);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to create category';
      })

      // ==========================================
      // Update Category
      // ==========================================
      .addCase(updateCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        const index = state.categories.findIndex(c => c._id === action.payload.data._id);
        if (index !== -1) {
          state.categories[index] = action.payload.data;
        }
        if (state.category?._id === action.payload.data._id) {
          state.category = action.payload.data;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to update category';
      })

      // ==========================================
      // Delete Category
      // ==========================================
      .addCase(deleteCategory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.categories = state.categories.filter(c => c._id !== action.payload.id);
        if (state.category?._id === action.payload.id) {
          state.category = null;
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to delete category';
      });
  }
});

export const { clearCategoryError, clearCategorySuccess, clearCategory } = categorySlice.actions;
export default categorySlice.reducer;