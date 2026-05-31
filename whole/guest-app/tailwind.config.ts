import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pista: {
          50: '#F5FDF5',
          100: '#E8F9E8',
          200: '#C8EFC8',
          300: '#A8E5A8',
          400: '#88DB88',
          500: '#93C572',
          600: '#7AB55E',
          700: '#5F9147',
          800: '#4A7036',
          900: '#355024',
        },
      },
    },
  },
  plugins: [],
}
export default config
