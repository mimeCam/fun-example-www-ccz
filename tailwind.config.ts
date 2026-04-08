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
        background: "#1a1a2e", // Void — Deep Indigo, page background
        primary: "#7b2cbf",    // Pulse — Electric Purple, interactive states
        secondary: "#9d4edd",  // Glow — Violet, hover/focus states
        accent: "#c77dff",     // Shimmer — Light Violet, highlights
        surface: "#16213e",    // Surface — Navy Slate, raised elements
        fog: "#222244",        // Fog — borders, dividers
        mist: "#9494b8",       // Mist — secondary text, metadata
        gold: "#f0c674",       // Gold — mirror reveal, discovery
        cyan: "#4ecdc4",       // Cyan — marginalia, unlocked markers
        rose: "#e88fa7",       // Rose — reader-authored marginalia, "your voice"
        void: "#0d0d1a",       // Void deep — code blocks, pressed surfaces
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'void': '0 1px 2px rgba(0,0,0,0.3)',
        'rise': '0 4px 16px rgba(0,0,0,0.4)',
        'float': '0 8px 32px rgba(0,0,0,0.5)',
        'gold': '0 8px 40px rgba(240,198,116,0.25)',
        'gold-intense': '0 12px 60px rgba(240,198,116,0.40)',
        'rose-glow': '0 6px 32px rgba(232,143,167,0.20)',
      },
      animation: {
        'bounce-subtle': 'bounce-subtle 0.3s ease-in-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'content-lock-breath': 'contentLockBreath 3s ease-in-out infinite',
        'resonance-remembered': 'resonanceRemembered 1s ease-out',
        'portal-glow': 'portalGlow 3s ease-in-out infinite',
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
        'contentLockBreath': {
          '0%, 100%': { borderColor: '#222244' },
          '50%': { borderColor: 'rgba(240, 198, 116, 0.2)' },
        },
        'resonanceRemembered': {
          '0%': { opacity: '0', transform: 'translateY(6px)', borderLeftColor: 'transparent' },
          '40%': { opacity: '1', transform: 'translateY(0)' },
          '70%': { borderLeftColor: '#e88fa7', boxShadow: '0 6px 32px rgba(232,143,167,0.25)' },
          '100%': { borderLeftColor: '#e88fa7', boxShadow: '0 6px 32px rgba(232,143,167,0.12)' },
        },
        'portalGlow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(240,198,116,0.08)' },
          '50%': { boxShadow: '0 0 40px rgba(240,198,116,0.18)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
