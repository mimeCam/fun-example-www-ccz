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
      /* Elevation Ledger — drop-shadow variants for non-rectangular SVG icons.
         The shadow follows the alpha silhouette (filter), unlike box-shadow
         which paints a rectangular halo. Same beat names, different CSS axis.
         Used by GemIcon and other glyph chrome. */
      dropShadow: {
        'sys-whisper': '0 0 6px color-mix(in srgb, var(--gold) 40%, transparent)',
        'sys-bloom':   '0 0 10px color-mix(in srgb, var(--gold) 50%, transparent)',
      },
      boxShadow: {
        /* Elevation Ledger — six beats, mirror of --sys-elev-* in globals.css.
           Source of truth: lib/design/elevation.ts. Sync test guards drift. */
        'sys-rest':     'var(--sys-elev-rest)',
        'sys-rise':     'var(--sys-elev-rise)',
        'sys-float':    'var(--sys-elev-float)',
        'sys-whisper':  'var(--sys-elev-whisper)',
        'sys-bloom':    'var(--sys-elev-bloom)',
        'sys-radiance': 'var(--sys-elev-radiance)',
        /* Tinted accents — OUTSIDE the six-beat ledger by design.
           Reader-authored warmth (rose = remembered, cyan = discovery),
           not site-authored room temperature. Allow-listed in exactly two
           files by the adoption guard; see TINTED_ACCENTS in
           lib/design/elevation.ts. Follow-up: fold under a `tinted(beat,
           tint)` helper so the halo math lives in one place. */
        'rose-glow':    '0 6px 32px color-mix(in srgb, var(--rose) 20%, transparent)',
        'cyan-whisper': '0 2px 20px color-mix(in srgb, var(--cyan) 15%, transparent)',
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
      /* Typography Ledger — six leading-beats, mirror of --sys-lead-* in
         globals.css. Source of truth: lib/design/typography.ts. The sync
         test guards drift; the adoption guard keeps raw `leading-*` out
         of components. Use via `leading-sys-<beat>` or, preferably, the
         all-in-one `typo-<beat>` utility class (CSS) returned by
         classesOf(beat). */
      lineHeight: {
        'sys-caption': 'var(--sys-lead-caption)',
        'sys-body':    'var(--sys-lead-body)',
        'sys-lede':    'var(--sys-lead-lede)',
        'sys-passage': 'var(--sys-lead-passage)',
        'sys-heading': 'var(--sys-lead-heading)',
        'sys-display': 'var(--sys-lead-display)',
      },
      /* Typography Ledger — six track beats (letter-spacing), mirror of
         --sys-track-* in globals.css. Voice-print anchor — does NOT warm
         with engagement. The body-prose --token-letter-spacing scalar is
         the single thermal carve-out. Source of truth:
         lib/design/typography.ts. Use via `tracking-sys-<beat>` or the
         all-in-one `typo-<beat>` utility class (CSS) returned by
         classesOf(beat). */
      letterSpacing: {
        'sys-caption': 'var(--sys-track-caption)',
        'sys-body':    'var(--sys-track-body)',
        'sys-lede':    'var(--sys-track-lede)',
        'sys-passage': 'var(--sys-track-passage)',
        'sys-heading': 'var(--sys-track-heading)',
        'sys-display': 'var(--sys-track-display)',
      },
      /* Alpha Ledger — four presence rungs, mirror of --sys-alpha-* in
         globals.css. Source of truth: lib/design/alpha.ts. Applies BOTH to
         the standalone `opacity-*` utility AND Tailwind's `/modifier` color
         shorthand (e.g. `text-mist/recede`). Tailwind's `theme.opacity`
         controls both surfaces from one definition.

         Named by UX role in attention, not by volume. Motion owns the
         endpoints: opacity-0 / opacity-100 live in lib/utils/animation-phase.ts.
         Sync test guards drift; adoption test keeps raw `opacity-\d+` out. */
      opacity: {
        'hairline': 'var(--sys-alpha-hairline)',
        'muted':    'var(--sys-alpha-muted)',
        'recede':   'var(--sys-alpha-recede)',
        'quiet':    'var(--sys-alpha-quiet)',
      },
      /* System radius scale — absorbs ad-hoc rounded-* values.
         Thermal bonus adds 0–0.5rem on top of --sys-radius-medium at warm+. */
      borderRadius: {
        'sys-soft':   'var(--sys-radius-soft)',
        'sys-medium': 'var(--sys-radius-medium)',
        'sys-wide':   'var(--sys-radius-wide)',
        'sys-full':   'var(--sys-radius-full)',
      },
      /* Z-index scale — ordered stacking layers, no ad-hoc z-values.
         Thread < Nav < Gem < Backdrop < Drawer < Overlay < Toast. */
      zIndex: {
        'sys-base':     'var(--sys-z-base)',
        'sys-thread':   'var(--sys-z-thread)',
        'sys-nav':      'var(--sys-z-nav)',
        'sys-gem':      'var(--sys-z-gem)',
        'sys-popover':  'var(--sys-z-popover)',  // SelectionPopover slot
        'sys-backdrop': 'var(--sys-z-backdrop)',
        'sys-drawer':   'var(--sys-z-drawer)',
        'sys-overlay':  'var(--sys-z-overlay)',
        'sys-toast':    'var(--sys-z-toast)',
      },
      transitionDuration: {
        /* Motion Ledger — 8 beats, mirror of --sys-time-* in globals.css.
           Source of truth: lib/design/motion.ts. Sync test guards drift.
           Beat-pairing contract: see AGENTS.md §Motion Beat Pairing Contract.
           crossfade ≠ hover ≠ settle — semantic roles, not interchangeable. */
        'crossfade': '120ms', /* inline color/border dissolve — "this changed" */
        'instant':   '150ms', /* press receipt — "I heard you" */
        'hover':     '200ms', /* depth/scale gesture — card lift */
        'enter':     '300ms', /* surface arriving — "welcome" */
        'fade':      '500ms', /* neutral content swap */
        'reveal':    '700ms', /* deliberate discovery */
        'linger':   '1000ms', /* ambient pulse / passage breathing */
        'settle':   '1500ms', /* room arriving at rest — NOT for interactive hover */
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
        // Mirror reveal — gold glow pulse (2 cycles during shimmer phase).
        // `mirror-pulse` retired with the bespoke /mirror loading surface
        // (Mike napkin #19): the loading branch now routes through the
        // shared <Skeleton variant="card"> primitive, so the breath cadence
        // matches every other loading surface on the site (`MOTION.linger`).
        'mirror-shimmer': 'mirrorGlow 0.8s ease-in-out infinite',
        // `quick-mirror-glow` retired with `QuickMirrorCard.tsx` (Sid,
        // Tanya UX "One Mirror, One Room") — the inline reveal stopped
        // shipping; the warm-data card on `/mirror` rides `mirror-shimmer`
        // (gold-to-violet) and the archetype-tinted shimmerStyle inline.
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
        // Resonance shimmer — gold border sweep on save
        'resonance-shimmer-sweep': 'resonanceBorderSweep 800ms var(--sys-ease-out) forwards',
        'resonance-success-enter': 'resonanceSuccessFade 600ms var(--sys-ease-out) both',
        'slot-dot-pulse': 'slotDotPulse 400ms var(--sys-ease-out)',
        // Mirror reveal — archetype label blur-to-sharp
        'archetype-reveal': 'archetypeReveal 600ms cubic-bezier(0.0, 0.0, 0.2, 1) both',
        'mirror-radius-breathe': 'mirrorRadiusBreathe 0.8s ease-in-out',
        'share-confirm': 'shareConfirmFlash 300ms ease-out',
        // SelectionPopover — spring bloom on entry, quick retreat on exit
        'popover-enter': 'popoverEnter 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'popover-exit':  'popoverExit 120ms ease-in both',
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
          '0%, 100%': { borderColor: 'var(--fog)' },
          '50%': { borderColor: 'color-mix(in srgb, var(--gold) 20%, transparent)' },
        },
        'resonanceRemembered': {
          '0%': { opacity: '0', transform: 'translateY(6px)', borderLeftColor: 'transparent' },
          '40%': { opacity: '1', transform: 'translateY(0)' },
          '70%': { borderLeftColor: 'var(--rose)', boxShadow: '0 6px 32px color-mix(in srgb, var(--rose) 25%, transparent)' },
          '100%': { borderLeftColor: 'var(--rose)', boxShadow: '0 6px 32px color-mix(in srgb, var(--rose) 12%, transparent)' },
        },
        'portalGlow': {
          '0%, 100%': { boxShadow: '0 0 20px color-mix(in srgb, var(--gold) 8%, transparent)' },
          '50%': { boxShadow: '0 0 40px color-mix(in srgb, var(--gold) 18%, transparent)' },
        },
        mirrorGlow: {
          '0%, 100%': { boxShadow: '0 0 20px color-mix(in srgb, var(--primary) 30%, transparent)' },
          '50%': { boxShadow: '0 0 50px color-mix(in srgb, var(--accent-violet) 50%, transparent)' },
        },
        // `quickMirrorPulse` keyframe retired alongside `QuickMirrorCard.tsx`
        // (Sid, Tanya UX "One Mirror, One Room"). No remaining consumer.
        discoveryShimmer: {
          '0%': { borderLeftColor: 'var(--gold)', boxShadow: `-4px 0 16px color-mix(in srgb, var(--gold) 20%, transparent)` },
          '60%': { borderLeftColor: 'var(--gold)', boxShadow: `-4px 0 8px color-mix(in srgb, var(--gold) 8%, transparent)` },
          '100%': { borderLeftColor: 'var(--cyan)', boxShadow: 'none' },
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
          to: { boxShadow: '0 2px 20px color-mix(in srgb, var(--cyan) 15%, transparent)' },
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
        // SelectionPopover — entry bloom (spring) and exit retreat
        popoverEnter: {
          from: { opacity: '0', transform: 'scale(0.85)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        popoverExit: {
          from: { opacity: '1', transform: 'scale(1)' },
          to:   { opacity: '0', transform: 'scale(0.85)' },
        },
        // Share confirm — brief gold flash
        shareConfirmFlash: {
          '0%': { boxShadow: `0 0 0 0 color-mix(in srgb, var(--gold) 40%, transparent)` },
          '100%': { boxShadow: '0 0 12px 4px transparent' },
        },
        // Resonance shimmer — gold border sweep on quote card
        resonanceBorderSweep: {
          '0%': { transform: 'translateX(-120%)', opacity: '0' },
          '15%': { opacity: '1' },
          '100%': { transform: 'translateX(120%)', opacity: '0' },
        },
        // Resonance success message — warm gold fade-in
        resonanceSuccessFade: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // Slot dot — 3-layer gold glow pulse on newest save
        slotDotPulse: {
          '0%': { boxShadow: 'none' },
          '50%': { boxShadow: '0 0 6px var(--gold), 0 0 12px color-mix(in srgb, var(--gold) 30%, transparent), 0 0 18px color-mix(in srgb, var(--gold) 10%, transparent)' },
          '100%': { boxShadow: '0 0 6px var(--gold), 0 0 8px color-mix(in srgb, var(--gold) 15%, transparent), 0 0 12px color-mix(in srgb, var(--gold) 5%, transparent)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
