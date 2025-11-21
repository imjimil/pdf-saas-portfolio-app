/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          primary: '#10b981',
          dark: '#059669',
          light: '#34d399',
        },
        cream: {
          light: '#fefbf3',
          base: '#f5f5dc',
          dark: '#e8e8d3',
        },
      },
    },
  },
  plugins: [],
}

