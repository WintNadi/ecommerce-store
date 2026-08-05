import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  query: '',
  results: [],
  isLoading: false,
  error: null,
  recentSearches: []
};

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.query = action.payload;
    },
    setSearchResults: (state, action) => {
      state.results = action.payload;
    },
    setSearchLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setSearchError: (state, action) => {
      state.error = action.payload;
    },
    clearSearchResults: (state) => {
      state.results = [];
      state.query = '';
      state.error = null;
    },
    addRecentSearch: (state, action) => {
      const query = action.payload;
      if (!query.trim()) return;
      state.recentSearches = [
        query,
        ...state.recentSearches.filter(q => q !== query)
      ].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
    },
    clearRecentSearches: (state) => {
      state.recentSearches = [];
      localStorage.removeItem('recentSearches');
    },
    loadRecentSearches: (state) => {
      const saved = localStorage.getItem('recentSearches');
      if (saved) {
        state.recentSearches = JSON.parse(saved);
      }
    }
  }
});

export const {
  setSearchQuery,
  setSearchResults,
  setSearchLoading,
  setSearchError,
  clearSearchResults,
  addRecentSearch,
  clearRecentSearches,
  loadRecentSearches
} = searchSlice.actions;

export default searchSlice.reducer;