/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bsp: {
          dark: '#0A361E',
          primary: '#115E34',
          accent: '#1E7E48',
          gold: '#D97706',
        }
      }
    },
  },
  plugins: [],
}
