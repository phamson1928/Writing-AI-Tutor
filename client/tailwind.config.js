/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
        },
        canvas: {
          DEFAULT: '#F8FAFC',
          subtle: '#F1F5F9',
          card: '#FFFFFF',
          border: '#E2E8F0',
        },
        slate: {
          850: '#172033',
          950: '#0B0F19',
        },
        ivory: {
          light: '#FFFFFF',
          DEFAULT: '#F8FAFC',
          dark: '#F1F5F9',
          card: '#FFFFFF',
        },
        retro: {
          navy: '#285737',
          navyHover: '#1E4329',
          amber: '#F59E0B',
          amberLight: '#FEF3C7',
          pink: '#FCE7F3',
          pinkText: '#9D174D',
          orange: '#FFEDD5',
          orangeText: '#C2410C',
          mint: '#D1FAE5',
          mintText: '#065F46',
          border: '#0F172A',
        }
      },
      boxShadow: {
        'neo-sm': '2px 2px 0px #0F172A',
        'neo': '3px 3px 0px #0F172A',
        'neo-lg': '4.5px 4.5px 0px #0F172A',
        'neo-active': '1px 1px 0px #0F172A',
        'card-soft': '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
      },
      borderRadius: {
        'neo': '1rem',
        'neo-lg': '1.25rem',
        'neo-xl': '1.5rem',
      }
    },
  },
  plugins: [],
}

