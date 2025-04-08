/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'qb-blue': '#2CA01C', // QuickBooks green color
        'qb-green-dark': '#0D8390',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
      screens: {
        'print': {'raw': 'print'},
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
  // Ensure print classes are not purged
  safelist: [
    'print:hidden',
    'print:block',
    'print:text-sm',
    'print:text-2xl',
  ]
}
