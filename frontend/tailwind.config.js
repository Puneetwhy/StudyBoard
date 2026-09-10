/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#3b5fe0',
          600: '#2f4bc0',
          700: '#28409e',
        },
      },
    },
  },
  plugins: [],
};
