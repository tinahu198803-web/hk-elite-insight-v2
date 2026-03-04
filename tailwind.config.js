/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#c7d9ff',
          300: '#a4beff',
          400: '#7a9aff',
          500: '#5679ff',
          600: '#3d5afe',
          700: '#2b47fe',
          800: '#1a36e8',
          900: '#0a2463',
          950: '#071a3d',
        },
        gold: {
          50: '#fdfbf7',
          100: '#faf5eb',
          200: '#f5ead4',
          300: '#edd8b5',
          400: '#e3c18d',
          500: '#d4af37',
          600: '#c49d2a',
          700: '#a67d21',
          800: '#89631d',
          900: '#6f4f1a',
          950: '#3d2d0f',
        },
        success: '#52c41a',
        warning: '#fa8c16',
        error: '#ff4d4f',
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
