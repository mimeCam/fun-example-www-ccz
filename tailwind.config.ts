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
    },
  },
  plugins: [],
};
export default config;
