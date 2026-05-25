/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}', './src/popup/index.html'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0F62FE',
          dark: '#0043CE',
        },
        success: '#24A148',
        danger: '#DA1E28',
        surface: '#161616',
        card: '#262626',
        border: '#393939',
        muted: '#6F6F6F',
      },
    },
  },
  plugins: [],
};
