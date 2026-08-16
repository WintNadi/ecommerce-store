/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ✅ New Color Scheme: Navy Blue + White + Orange
        navy: {
          50: '#EBEEF5',
          100: '#D5D9E6',
          200: '#AAB3CC',
          300: '#808DB3',
          400: '#556799',
          500: '#1A2B4C',    // Primary Navy - Header/Footer
          600: '#152340',
          700: '#101C33',
          800: '#0A1426',
          900: '#050C19',
        },
        orange: {
          50: '#FDF2ED',
          100: '#FCE5DB',
          200: '#F9CBB7',
          300: '#F6B193',
          400: '#F3976F',
          500: '#E86A33',    // Primary Orange - Buttons, CTA
          600: '#D45A26',
          700: '#BF4A1A',
          800: '#A53A0F',
          900: '#8A2A05',
        },
        red: {
          500: '#D93838',    // Sale tags, alerts
          600: '#C42E2E',
          700: '#AF2424',
        },
        // Keep existing gray values for text
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}