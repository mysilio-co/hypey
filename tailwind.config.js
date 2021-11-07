const colors = require('tailwindcss/colors')

module.exports = {
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        teal: colors.teal,
        fuchsia: colors.fuchsia,
        'my-purple': '#944c7d',
        'my-orange': '#f27a22',
        'my-yellow': '#f2b822',
        'my-green': '#0e90a3',
        'my-ocean': '#2d6da6',
        'my-ember': '#d44d51'
      },
      fontFamily: {
        logo: ['Paytone One', 'sans-serif'],
        mono: ['Inconsolata', 'monospace']
      },
      cursor: {
        grab: 'grab',
        grabbing: 'grabbing'
      }
    },

  },
  variants: {
    extend: {},
  },
  plugins: [],
}
