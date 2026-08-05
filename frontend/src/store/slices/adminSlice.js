import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get all users
export const getAllUsers = createAsyncThunk(
  'admin/getUsers',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const query = new URLSearchParams(params).toString();
      const response = await axios.get(`${API_URL}/admin/users?${query}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update user role
export const updateUserRole = createAsyncThunk(
  'admin/updateUserRole',
  async ({ userId, role }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(
        `${API_URL}/admin/users/${userId}/role`,
        { role },
        { headers: { Authorization: `Bearer ${auth.accessToken}` } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Delete user
export const deleteUser = createAsyncThunk(
  'admin/deleteUser',
  async (userId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await axios.delete(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }  
      });
      return { userId };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get admin stats
export const getAdminStats = createAsyncThunk(
  'admin/getStats',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/admin/stats`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  users: [],
  stats: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  }
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all users
      .addCase(getAllUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getAllUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.data || [];
        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 0
        };
      })
      .addCase(getAllUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to load users';
      })
      // Update user role
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const updatedUser = action.payload.data;
        const index = state.users.findIndex(u => u._id === updatedUser._id);
        if (index !== -1) {
          state.users[index] = updatedUser;
        }
      })
      // Delete user
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter(u => u._id !== action.payload.userId);
      })
      // Get admin stats
      .addCase(getAdminStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      });
  }
});

export const { clearUserError } = adminSlice.actions;
export default adminSlice.reducer;