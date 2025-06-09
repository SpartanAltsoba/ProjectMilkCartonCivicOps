// tailwind.config.js

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1a202c', // Customize for a dark theme
        secondary: '#2d3748',
        accent: '#4a5568',
        info: '#3182ce',
        success: '#38a169',
        warning: '#dd6b20',
        danger: '#e53e3e',
      },
      fontFamily: {
        body: ['Nunito', 'sans-serif'],
        heading: ['Merriweather', 'serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}