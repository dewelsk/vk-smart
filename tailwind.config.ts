import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        heading: ['General Sans', 'var(--font-inter)', 'sans-serif'],
      },
      colors: {
        // Design system colors
        'ds-black': {
          100: '#2A222B',
          30: '#BFBDBF',
        },
        'ds-grey': {
          50: '#F4F3F5',
          40: '#F7F7F8',
        },
        'ds-white': '#FFFFFF',
        'ds-purple': {
          80: '#504EDD',
          10: '#EDEDFC',
        },
        'ds-green': {
          DEFAULT: '#3DAC67',
          light: '#9EE2B5',
        },
        'ds-red': {
          DEFAULT: '#B93429',
          light: '#FDC5BB',
        },
        // IDSK farby (pre budúce použitie)
        primary: {
          DEFAULT: '#0065B3',
          dark: '#004A85',
          light: '#E6F2F8',
        },
        secondary: {
          DEFAULT: '#FFC107',
        },
        success: '#28A745',
        warning: '#FFC107',
        danger: '#DC3545',
        info: '#17A2B8',
      },
    },
  },
  plugins: [],
}
export default config
