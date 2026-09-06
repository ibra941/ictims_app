/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./resources/**/*.blade.php",
  ],
  theme: {
    extend: {
      colors: {
        'iaa-blue': '#1B3A5C',
        'iaa-gold': '#C5A84E',
      },
    },
  },
  plugins: [],
}
