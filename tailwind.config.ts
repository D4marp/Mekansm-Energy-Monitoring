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
        primary: '#DC2626',
        secondary: '#991B1B',
        accent: '#F59E0B',
        dark: '#7F1D1D',
        light: '#ffffff',
        gray: '#cbcbcb',
      },
    },
  },
  plugins: [],
}
export default config
