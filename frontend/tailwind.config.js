/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // ✨ For Dark Mode
  theme: {
    extend: {
      colors: {
        // ✨ Mood-Based Colors
        calm: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ...
        },
        energetic: {
          50: '#fef2f2',
          100: '#fee2e2',
          // ...
        },
        luxury: {
          50: '#faf5ff',
          100: '#f3e8ff',
          // ...
        }
      }
    },
  },
  plugins: [],
}