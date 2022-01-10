module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      height: {
        '128': '32rem',
        '70s': '70vh'
      }
      
    },
  },
  variants: { 
    extend: {
      animation: ['group-hover'],
    },
  },
  plugins: [
  ],
}
