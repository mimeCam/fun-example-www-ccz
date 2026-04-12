import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Thermal-aware tokens — shift with reader engagement
        background: 'var(--token-bg)',
        surface: 'var(--token-surface)',
        foreground: 'var(--token-foreground)',
        // Thermal-interpolated accent — shifts violet→gold with warmth
        'thermal-accent': 'var(--token-accent)',
        // Static tokens — never change with thermal state
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent-violet)",
        fog: "var(--fog)",
        mist: "var(--mist)",
        gold: "var(--gold)",
        amber: "var(--amber)",
        cyan: "var(--cyan)",
        rose: "var(--rose)",
        void: "var(--void-deep)",
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
        'gold-intense': '0 10px 48px rgba(240,198,116,0.25)',
        'rose-glow': '0 6px 32px rgba(232,143,167,0.20)',
        'cyan-whisper': '0 2px 20px rgba(78,205,196,0.15)',
      },
      maxWidth: {
        'prose': 'var(--sys-maxw-prose)',
        'prose-ch': 'var(--sys-maxw-prose-ch)',
        'prose-sm': 'var(--sys-maxw-prose-sm)',
        'card': 'var(--sys-maxw-card)',
        'card-body': 'var(--sys-maxw-card-body)',
        'divider': 'var(--sys-maxw-divider)',
      },
      /* System spacing scale — maps --sys-space-* to Tailwind spacing utilities.
         Usage: p-sys-5, gap-sys-3, my-sys-8, etc. */
      spacing: {
        'sys-1': 'var(--sys-space-1)',
        'sys-2': 'var(--sys-space-2)',
        'sys-3': 'var(--sys-space-3)',
        'sys-4': 'var(--sys-space-4)',
        'sys-5': 'var(--sys-space-5)',
        'sys-6': 'var(--sys-space-6)',
        'sys-7': 'var(--sys-space-7)',
        'sys-8': 'var(--sys-space-8)',
        'sys-9': 'var(--sys-space-9)',
        'sys-10': 'var(--sys-space-10)',
        'sys-11': 'var(--sys-space-11)',
        'sys-12': 'var(--sys-space-12)',
      },
      /* System typography scale — semantic text sizes with baked line-heights. */
      fontSize: {
        'sys-micro':   ['var(--sys-text-micro)',   { lineHeight: '1.5' }],
        'sys-caption': ['var(--sys-text-caption)',  { lineHeight: '1.5' }],
        'sys-body':    ['var(--sys-text-body)',     { lineHeight: 'var(--token-line-height)' }],
        'sys-md':      ['var(--sys-text-md)',       { lineHeight: 'var(--token-line-height)' }],
        'sys-lg':      ['var(--sys-text-lg)',       { lineHeight: '1.4' }],
        'sys-xl':      ['var(--sys-text-xl)',       { lineHeight: '1.4' }],
        'sys-h4':      ['var(--sys-text-h4)',       { lineHeight: '1.3', fontWeight: 'var(--sys-weight-heading)' }],
        'sys-h3':      ['var(--sys-text-h3)',       { lineHeight: '1.3', fontWeight: 'var(--sys-weight-heading)' }],
        'sys-h2':      ['var(--sys-text-h2)',       { lineHeight: '1.2', fontWeight: 'var(--sys-weight-heading)' }],
        'sys-h1':      ['var(--sys-text-h1)',       { lineHeight: '1.1', fontWeight: 'var(--sys-weight-display)' }],
      },
      /* System font weights — semantic names, not absolute numbers.
         Future: ThermalProvider can shift --sys-weight-body for JND crossing. */
      fontWeight: {
        'sys-body':    'var(--sys-weight-body)',
        'sys-heading': 'var(--sys-weight-heading)',
        'sys-display': 'var(--sys-weight-display)',
        'sys-accent':  'var(--sys-weight-accent)',
      },
      /* System radius scale — absorbs ad-hoc rounded-* values.
         Thermal bonus adds 0–0.5rem on top of --sys-radius-medium at warm+. */
      borderRadius: {
        'sys-soft':   'var(--sys-radius-soft)',
        'sys-medium': 'var(--sys-radius-medium)',
        'sys-wide':   'var(--sys-radius-wide)',
        'sys-full':   'var(--sys-radius-full)',
      },
      transitionDuration: {
        'hover': '200ms',
        'enter': '300ms',
        'reveal': '700ms',
        'linger': '1000ms',
        'fade': '500ms',
        'instant': '150ms',
      },
      transitionTimingFunction: {
        'out': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        'sustain': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'settle': 'cubic-bezier(0.0, 0.0, 0.2, 0.5)',
      },
      translate: {
        'enter-sm': '2px',
        'enter-md': '4px',
        'micro': '1px',
      },
      animation: {
        'bounce-subtle': 'bounce-subtle 0.3s ease-in-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'content-lock-breath': 'contentLockBreath 3s ease-in-out infinite',
        'resonance-remembered': 'resonanceRemembered 1s ease-out',
        'portal-glow': 'portalGlow 3s ease-in-out infinite',
        // Mirror reveal — gold glow pulse (2 cycles during shimmer phase)
        'mirror-shimmer': 'mirrorGlow 0.8s ease-in-out infinite',
        'mirror-pulse': 'mirrorGlow 1.5s ease-in-out infinite',
        // QuickMirrorCard — 2-cycle gold glow during emergence
        'quick-mirror-glow': 'quickMirrorPulse 600ms ease-in-out 2',
        // Discovery — one-shot gold-to-cyan border transition
        'discovery-shimmer': 'discoveryShimmer 1.2s ease-out forwards',
        // Toast transitions
        'fade-out': 'fadeOut 0.3s ease-out',
        // Thermal animations
        'slide-up': 'slideUp 300ms ease-out',
        'gem-appear': 'gemAppear 600ms ease-out',
        'whisper-shadow': 'whisperShadow 400ms ease-out',
        // Thermal breathing — CSS custom properties drive duration/intensity
        'thermal-breath': 'thermalBreath 4s ease-in-out infinite',
        'thermal-glow': 'thermalGlow 4s ease-in-out infinite',
        'thermal-drift': 'thermalDrift 6s ease-in-out infinite',
        // Resonance drawer — ceremony, not form
        'slide-in-right': 'slideInRight 300ms var(--sys-ease-out)',
        'slide-out-right': 'slideInRight 150ms var(--sys-ease-settle) reverse',
        // Mirror reveal — archetype label blur-to-sharp
        'archetype-reveal': 'archetypeReveal 600ms cubic-bezier(0.0, 0.0, 0.2, 1) both',
        'mirror-radius-breathe': 'mirrorRadiusBreathe 0.8s ease-in-out',
        'share-confirm': 'shareConfirmFlash 300ms ease-out',
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
        mirrorGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(123, 44, 191, 0.3)' },
          '50%': { boxShadow: '0 0 50px rgba(199, 125, 255, 0.5)' },
        },
        quickMirrorPulse: {
          '0%, 100%': { boxShadow: '0 8px 40px rgba(240, 198, 116, 0.25)' },
          '50%': { boxShadow: '0 12px 60px rgba(240, 198, 116, 0.40)' },
        },
        discoveryShimmer: {
          '0%': { borderLeftColor: '#f0c674', boxShadow: '-4px 0 16px rgba(240, 198, 116, 0.20)' },
          '60%': { borderLeftColor: '#f0c674', boxShadow: '-4px 0 8px rgba(240, 198, 116, 0.08)' },
          '100%': { borderLeftColor: '#4ecdc4', boxShadow: 'none' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        gemAppear: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        whisperShadow: {
          from: { boxShadow: 'none' },
          to: { boxShadow: '0 2px 20px rgba(78,205,196,0.15)' },
        },
        // Thermal breathing — duration/intensity driven by CSS custom properties
        thermalBreath: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(calc(1 + var(--token-breath-scale)))' },
        },
        thermalGlow: {
          '0%, 100%': { opacity: 'var(--token-glow-min)' },
          '50%': { opacity: 'var(--token-glow-max)' },
        },
        thermalDrift: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(var(--token-drift-range))' },
        },
        // Mirror reveal — archetype label emergence (blur-to-sharp)
        archetypeReveal: {
          '0%': { opacity: '0', transform: 'translateY(4px) scale(0.98)', filter: 'blur(2px)' },
          '60%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        // Mirror card — radius breathe during shimmer phase
        mirrorRadiusBreathe: {
          '0%, 100%': { borderRadius: 'calc(var(--sys-radius-wide) + var(--token-radius-soft))' },
          '50%': { borderRadius: 'calc(var(--sys-radius-wide) + var(--token-radius-soft) + 4px)' },
        },
        // Share confirm — brief gold flash
        shareConfirmFlash: {
          '0%': { boxShadow: '0 0 0 0 rgba(240, 198, 116, 0.4)' },
          '100%': { boxShadow: '0 0 12px 4px rgba(240, 198, 116, 0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
