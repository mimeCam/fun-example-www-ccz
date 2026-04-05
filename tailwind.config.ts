import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1a1a2e", // Deep Indigo - intellectual, mood-setting
        primary: "#7b2cbf", // Electric Purple - conviction, energy
        secondary: "#9d4edd", // Lighter purple for accents
        accent: "#c77dff", // Even lighter purple for highlights
        surface: "#16213e", // Slightly lighter than background
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'bounce-subtle': 'bounce-subtle 0.3s ease-in-out',
        'fade-in': 'fade-in 0.2s ease-out',
      },
      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-2px)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmerReveal': {
          '0%': { borderColor: '#f0c674', boxShadow: '0 0 12px rgba(240,198,116,0.3)' },
          '100%': { borderColor: 'inherit', boxShadow: 'none' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
