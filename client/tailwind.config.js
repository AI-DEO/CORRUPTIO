/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#1A1A2E',
        'bg-secondary': '#16213E',
        'bg-panel': '#0F3460',
        'accent-red': '#E94560',
        'accent-gold': '#F5A623',
        'accent-teal': '#26C2B7',
        'camp-order': '#1A3A5C',
        'camp-shadow': '#2D1B4E',
        'camp-neutral': '#2D4A2D',
        'text-primary': '#F0F0F0',
        'text-secondary': '#888888',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
