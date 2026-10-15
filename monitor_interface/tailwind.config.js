/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        ink: '#182230',
        canvas: '#f6f8fb',
        brand: '#087f5b',
      },
    },
  },
  plugins: [],
}
