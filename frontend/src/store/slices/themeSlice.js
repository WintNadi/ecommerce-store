import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  darkMode: localStorage.getItem('darkMode') === 'true',
  mood: localStorage.getItem('mood') || 'default',
  theme: localStorage.getItem('theme') || 'default'
};

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
      if (state.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    },
    setMood: (state, action) => {
      state.mood = action.payload;
      localStorage.setItem('mood', action.payload);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    }
  }
});

export const { toggleDarkMode, setMood, setTheme } = themeSlice.actions;
export default themeSlice.reducer;