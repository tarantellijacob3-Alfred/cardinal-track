/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cardinal: {
          50: '#fef1f2',
          100: '#fde1e3',
          200: '#fbc8cc',
          300: '#f8a0a6',
          400: '#f26c75',
          500: '#e6404c',
          600: '#C8102E', // PMS 186 — official Bishop Snyder red
          700: '#a80d26',
          800: '#8d0f24',
          900: '#7a1224',
          950: '#43050e',
        },
        navy: {
          50: '#f4f4f5',
          100: '#e4e4e7',
          200: '#c8c8d0',
          300: '#a1a1ad',
          400: '#71717a',
          500: '#52525b',
          600: '#3f3f46',
          700: '#2d2d31',
          800: '#1a1a1e',
          900: '#111114',
          950: '#09090b',
        },
        gold: {
          50: '#fbf9f1',
          100: '#f5f0de',
          200: '#ebe1bd',
          300: '#d9cd96',
          400: '#B3A369', // PMS 4515 — official Bishop Snyder gold
          500: '#9e8d52',
          600: '#877543',
          700: '#6e5c37',
          800: '#5c4c31',
          900: '#4f412d',
          950: '#2c2217',
        },
      },
    },
  },
  plugins: [],
}
