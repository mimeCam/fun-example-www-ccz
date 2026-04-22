/**
 * Thermal Tokens — maps a thermal score (0-100) to CSS custom property values.
 *
 * Uses HSL interpolation for smooth, natural color transitions.
 * RGB lerp would produce muddy midpoints; HSL lerp keeps colours vibrant.
 *
 * Returns a flat Record<string, string> of CSS custom property key→value pairs.
 * V2: continuous color + typography + spacing + shadow + radius interpolation.
 */

import type { ThermalState } from './thermal-score';

export type ThermalTokens = Record<string, string>;

// ─── Anchor values per state ──────────────────────────────

// Color endpoints — dormant is cool navy, warm shifts hue toward magenta + raises lightness.
// Delta: 60° hue (240→300), 4% lightness (14→18) — crosses JND threshold on dark surfaces.
export const BG = { dormant: '#1a1a2e', warm: '#382238' };
export const SURFACE = { dormant: '#16213e', warm: '#1e2a3e' };
export const FOREGROUND = { dormant: '#e8e8f0', warm: '#f5ede0' };
export const ACCENT = { dormant: '#7b2cbf', warm: '#f0c674' };
export const BORDER = { dormant: '#222244', warm: '#2e2e50' };

// Typography anchors — line-height is the PRIMARY thermal signal (per Tanya's spec).
// Felt even when not consciously seen; color on dark backgrounds is invisible.
export const LINE_HEIGHT = { dormant: 1.75, warm: 1.95 };      // unitless — 3.5px total delta

// Shadow depth anchor — alpha multiplier for shadow intensity.
export const SHADOW_DEPTH = { dormant: 0.3, warm: 0.5 };

// Radius softening bonus — additive to base rounded-lg in warm state.
export const RADIUS_SOFT = { dormant: 0, warm: 0.5 };          // rem

// Accent opacity — raised from 0.30 to make accent visible from the start.
export const ACCENT_OPACITY = { dormant: 0.5, warm: 1.0 };     // 0-1

// Gesture-mix — alpha the reader's selection wash carries above the page.
// 28% at dormant → 36% at radiant (Tanya §2 / Paul §6). Boosted via the same
// tp curve as --token-accent so the highlight warms in lock-step with the room.
// Owns `::selection`, `::-moz-selection` in lib/design/ambient-surfaces.css.
export const GESTURE_MIX = { dormant: 0.28, warm: 0.36 };      // 0-1

// Typography depth anchors — "the room warms, the text breathes".
// Font-weight crosses JND: 400→450 is one grade shift that the reader feels
// as "the text gained confidence". 400→420 was literally imperceptible.
// Combined with letter-spacing and para-rhythm, creates cumulative warmth.
export const FONT_WEIGHT = { dormant: 400, warm: 500 };          // crosses JND — text gains confidence
export const LETTER_SPACING = { dormant: -0.01, warm: 0.02 };    // em — wider opening, visible relaxation
export const PARA_RHYTHM = { dormant: 0, warm: 12 };             // px — paragraphs breathe open

// Spacing lift — scale-aware thermal interpolation for --sys-space-* tokens.
// Larger spacing steps get proportionally more lift via sqrt(N/6).
// Dormant (score < 25) = zero lift. The room doesn't expand for strangers.
export const SPACING_LIFT_MAX = 5.66;   // calibrates to 8px max lift at step 12
export const SPACING_SCALE_REF = 6;     // normalization reference step
export const SPACING_THRESHOLD = 25;    // dormant cutoff — zero lift below this

// ─── HSL interpolation ────────────────────────────────────

interface HSL { h: number; s: number; l: number }

function hexToHsl(hex: string): HSL {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = hueFromRgb(r, g, b, max, d);
  return { h, s, l };
}

function hueFromRgb(r: number, g: number, b: number, max: number, d: number): number {
  if (max === r) return ((g - b) / d + (g < b ? 6 : 0)) * 60;
  if (max === g) return ((b - r) / d + 2) * 60;
  return ((r - g) / d + 4) * 60;
}

function lerpHsl(a: HSL, b: HSL, t: number): HSL {
  let dh = b.h - a.h;
  if (dh > 180) dh -= 360;
  if (dh < -180) dh += 360;
  return {
    h: (a.h + dh * t + 360) % 360,
    s: a.s + (b.s - a.s) * t,
    l: a.l + (b.l - a.l) * t,
  };
}

function hslToHex({ h, s, l }: HSL): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  return hslToHexChannel(h, c, x, m);
}

function hslToHexChannel(h: number, c: number, x: number, m: number): string {
  let r = 0, g = 0, b = 0;
  if (h < 60)       { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else              { r = c; b = x; }
  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function lerpColor(cold: string, warm: string, t: number): string {
  return hslToHex(lerpHsl(hexToHsl(cold), hexToHsl(warm), t));
}

// ─── Perceptual boost ─────────────────────────────────────
// Power curve (t^0.66) front-loads the dormant→stirring shift.
// At t=0.25 → output ~0.40: first 25% of range = 40% of total shift.
// Applied to color + typography only; glow/shadow/radius keep linear t.
const BOOST_EXPONENT = 0.66;

function perceptualBoost(t: number): number {
  return Math.pow(t, BOOST_EXPONENT);
}

// ─── Public API ───────────────────────────────────────────

/** Compute thermal CSS tokens from a 0-100 score. */
export function computeThermalTokens(score: number, _state: ThermalState): ThermalTokens {
  const t = Math.max(0, Math.min(1, score / 100));
  const tp = perceptualBoost(t);
  return {
    // Colors — boosted: biggest jump at dormant→stirring boundary
    '--token-bg': lerpColor(BG.dormant, BG.warm, tp),
    '--token-surface': lerpColor(SURFACE.dormant, SURFACE.warm, tp),
    '--token-foreground': lerpColor(FOREGROUND.dormant, FOREGROUND.warm, tp),
    '--token-accent': lerpColor(ACCENT.dormant, ACCENT.warm, tp),
    '--token-border': lerpColor(BORDER.dormant, BORDER.warm, tp),
    // Glow/shadow — linear: own thresholds and gating
    '--token-glow': glowValue(t),
    '--token-shadow': shadowValue(t),
    // Typography — boosted: crosses JND faster at low scores
    '--token-line-height': lerp(LINE_HEIGHT.dormant, LINE_HEIGHT.warm, tp).toFixed(3),
    // Shadow depth — linear: continuous alpha scaling
    '--token-shadow-depth': lerp(SHADOW_DEPTH.dormant, SHADOW_DEPTH.warm, t).toFixed(2),
    // Radius — linear: additive bonus on top of base rounded-lg
    '--token-radius-soft': `${lerp(RADIUS_SOFT.dormant, RADIUS_SOFT.warm, t).toFixed(2)}rem`,
    // Accent opacity — linear: controls visibility of accent elements
    '--token-accent-opacity': lerp(ACCENT_OPACITY.dormant, ACCENT_OPACITY.warm, t).toFixed(2),
    // Gesture-mix — boosted: the reader's own highlight flares with the room.
    // Consumed by ::selection/::-moz-selection in ambient-surfaces.css.
    '--token-gesture-mix': lerp(GESTURE_MIX.dormant, GESTURE_MIX.warm, tp).toFixed(3),
    // Typography depth — boosted: font-weight, letter-spacing cross JND sooner
    '--token-font-weight': lerp(FONT_WEIGHT.dormant, FONT_WEIGHT.warm, tp).toFixed(1),
    '--token-letter-spacing': `${lerp(LETTER_SPACING.dormant, LETTER_SPACING.warm, tp).toFixed(3)}em`,
    '--token-para-rhythm': `${Math.round(lerp(PARA_RHYTHM.dormant, PARA_RHYTHM.warm, tp))}px`,
    '--para-offset': `${Math.round(
      lerp(PARA_RHYTHM.dormant, PARA_RHYTHM.warm, tp) +
      t * 14
    )}px`,
    '--token-text-glow': textGlowValue(t),
    ...computeSpacingTokens(score),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function glowValue(t: number): string {
  if (t < 0.25) return 'none';
  const alpha = (t * 0.18).toFixed(3);
  return `0 0 ${Math.round(40 + t * 60)}px rgba(240,198,116,${alpha})`;
}

function shadowValue(t: number): string {
  const alpha = lerp(SHADOW_DEPTH.dormant, SHADOW_DEPTH.warm, t).toFixed(2);
  return `0 ${Math.round(1 + t * 7)}px ${Math.round(2 + t * 30)}px rgba(0,0,0,${alpha})`;
}

/** Text glow — warm gold shadow on .thermal-typography, only at warm+.
 *  Alpha capped at 0.12 — perceivable peripheral warmth (was 0.05, below JND). */
function textGlowValue(t: number): string {
  if (t < 0.5) return 'none';
  const alpha = Math.min(0.12, t * 0.10).toFixed(3);
  return `0 0 40px rgba(240,198,116,${alpha})`;
}

// ─── Spacing interpolation ────────────────────────────────

/** Compute 12 spacing-lift tokens from a thermal score.
 *  Each step gets lift proportional to sqrt(N/6) — macro opens more than micro.
 *  Returns { '--token-space-lift-1': '0px', ..., '--token-space-lift-12': 'Xpx' } */
export function computeSpacingTokens(score: number): Record<string, string> {
  const t = score < SPACING_THRESHOLD ? 0
    : (score - SPACING_THRESHOLD) / (100 - SPACING_THRESHOLD);
  return Object.fromEntries(
    Array.from({ length: 12 }, (_, i) => spacingLiftEntry(i + 1, t)),
  );
}

function spacingLiftEntry(n: number, t: number): [string, string] {
  const lift = t * SPACING_LIFT_MAX * Math.sqrt(n / SPACING_SCALE_REF);
  return [`--token-space-lift-${n}`, `${lift.toFixed(2)}px`];
}
