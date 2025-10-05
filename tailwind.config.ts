import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
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
