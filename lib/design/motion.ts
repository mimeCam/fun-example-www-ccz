/**
 * Motion Tokens — single source of truth for timing across the site.
 *
 * CSS (`app/globals.css`) is canonical. TypeScript mirrors it.
 * `lib/design/__tests__/motion-sync.test.ts` enforces kinship. If a number
 * changes in one place it must change in the other — or the test fails.
 *
 * The site already had seven named beats scattered across phase files and
 * ad-hoc constants. Tanya's UX spec justified an eighth — `crossfade` —
 * because 120ms inline hover is *distinct* from a 200ms depth/scale gesture,
 * and collapsing the two makes text links feel draggy in long passages.
 *
 * No density multiplier, no per-route tempo, no reader-facing motion panel.
 * YAGNI. This module is enforcement, not invention.
 *
 * IMPORTANT: if you change a duration in globals.css, change it here too.
 * The test in __tests__/motion-sync.test.ts catches drift.
 *
 * Credits: Mike K. (napkin — CSS-canonical + sync-test pattern, lifted from
 * color-constants.ts), Tanya D. (UX spec — 8-beat vocabulary with the
 * crossfade justification and the AGENTS.md beat table), Elon M. (seven
 * beats from the CSS, drift-bug catches, Ceremony-as-separate-namespace
 * call), Paul K. (adoption-guard KPI), Jason F. (scattered-constants
 * smell), Krystle C. (module + sync + adoption sprint shape).
 */

// ─── Beat vocabulary — mirrors --sys-time-* in app/globals.css ─────────────

/**
 * Eight named beats, ordered fastest → slowest.
 *
 * Naming is by *duration family*, not by use site. A press-down USES
 * `instant`; a card-lift USES `hover`. Do NOT add beats like `press-down`
 * or `card-lift` — those are uses, not atoms.
 */
export const MOTION = {
  crossfade: 120, // --sys-time-crossfade — inline color/border dissolve
  instant:   150, // --sys-time-instant   — press-down acknowledgement
  hover:     200, // --sys-time-hover     — depth/scale gesture
  enter:     300, // --sys-time-enter     — surface arriving
  fade:      500, // --sys-time-fade      — neutral content swap
  reveal:    700, // --sys-time-reveal    — deliberate discovery
  linger:   1000, // --sys-time-linger    — passage breathing
  settle:   1500, // --sys-time-settle    — signature patience
} as const;

export type MotionBeat = keyof typeof MOTION;

// ─── Easing curves — mirror --sys-ease-* in app/globals.css ────────────────

/**
 * Three curves, each with a distinct feel:
 *  - `out`     — default for entrances and depth gestures.
 *  - `sustain` — neutral dissolves, content swaps.
 *  - `settle`  — long tails, ceremony close, the "room arriving at rest".
 */
export const EASE = {
  out:     'cubic-bezier(0.0, 0.0, 0.2, 1)',
  sustain: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  settle:  'cubic-bezier(0.0, 0.0, 0.2, 0.5)',
} as const;

export type MotionEase = keyof typeof EASE;

// ─── Reduced-motion floor ──────────────────────────────────────────────────

/**
 * Every phase resolver honors this when `prefers-reduced-motion: reduce`.
 * The motion does not perform; the color still lands. Non-negotiable.
 */
export const MOTION_REDUCED_MS = 10;

// ─── Ceremony compositions — a SEPARATE namespace ──────────────────────────

/**
 * These are narrative *pacings*, not transition durations. Kept out of
 * MOTION so contributors don't reach for `ceremony.giftDelay` when they
 * mean a transition, and vice-versa. Per Elon's "honest exception" note
 * and Tanya's §4 sub-table.
 */
export const CEREMONY = {
  breath:     300, // T_BREATH      — inter-phase rest, the "room inhales"
  crossing:   600, // T_CROSSING    — per-threshold state crossing micro-ceremony
  giftDelay:  700, // T_GIFT_DELAY  — pause before NextRead reveal
  glowHold:  2000, // T_GLOW_HOLD   — keepsake halo dwell
  tSuccess:   400, // success message appears after shimmer start
  tSettle:   1500, // all resonance animations resolve (= MOTION.settle)
  tClose:    2600, // resonance drawer auto-closes after ceremony
} as const;

export type CeremonyBeat = keyof typeof CEREMONY;

// ─── Helpers — the only two worth having ───────────────────────────────────

/** Numeric duration (ms) for a named beat. Pure. */
export const msOf = (b: MotionBeat): number => MOTION[b];

/** CSS custom-property reference for a named beat. Pure. */
export const cssVarOf = (b: MotionBeat): string => `var(--sys-time-${b})`;

/** Numeric pacing (ms) for a ceremony composition. Pure. */
export const ceremonyMs = (b: CeremonyBeat): number => CEREMONY[b];

// ─── Invariants — a test can lock these down ───────────────────────────────

/**
 * Must hold: beats are strictly ascending (fastest → slowest), every beat
 * is positive, and reduced floor sits below the fastest beat. Pure.
 */
export function motionInvariantHolds(): boolean {
  const values = Object.values(MOTION);
  for (let i = 0; i < values.length; i++) {
    if (values[i] <= 0) return false;
    if (i > 0 && values[i] <= values[i - 1]) return false;
  }
  return MOTION_REDUCED_MS > 0 && MOTION_REDUCED_MS < values[0];
}
