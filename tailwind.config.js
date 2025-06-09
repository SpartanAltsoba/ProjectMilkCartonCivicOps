/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          500: "#3B82F6",
          600: "#2563EB",
        },
        gray: {
          100: "#F3F4F6",
          300: "#D1D5DB",
          600: "#4B5563",
          700: "#374151",
          800: "#1F2937",
        },
        red: {
          500: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
