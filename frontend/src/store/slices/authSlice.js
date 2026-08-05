import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Register
export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Login
export const loginUser = createAsyncThunk(
  'auth/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get Profile
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Update Profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await axios.put(`${API_URL}/auth/profile`, userData, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Logout
export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      await axios.post(`${API_URL}/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${auth.accessToken}` }
      });
      return { success: true };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  refreshToken: localStorage.getItem('refreshToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  error: null,
  success: false
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.success = false;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.data.accessToken);
        localStorage.setItem('refreshToken', action.payload.data.refreshToken);
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Registration failed';
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.user = action.payload.data.user;
        state.accessToken = action.payload.data.accessToken;
        state.refreshToken = action.payload.data.refreshToken;
        state.isAuthenticated = true;
        localStorage.setItem('accessToken', action.payload.data.accessToken);
        localStorage.setItem('refreshToken', action.payload.data.refreshToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Login failed';
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
      })
      .addCase(getProfile.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.success = true;
        state.user = action.payload.data;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || 'Failed to update profile';
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.success = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      });
  }
});

export const { clearError, clearSuccess, logout } = authSlice.actions;
export default authSlice.reducer;