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
const BG = { dormant: '#1a1a2e', warm: '#382238' };
const SURFACE = { dormant: '#16213e', warm: '#1e2a3e' };
const FOREGROUND = { dormant: '#e8e8f0', warm: '#f5ede0' };
const ACCENT = { dormant: '#7b2cbf', warm: '#f0c674' };
const BORDER = { dormant: '#222244', warm: '#2e2e50' };

// Typography anchors — line-height is the PRIMARY thermal signal (per Tanya's spec).
// Felt even when not consciously seen; color on dark backgrounds is invisible.
const LINE_HEIGHT = { dormant: 1.75, warm: 1.95 };      // unitless — 3.5px total delta

// Shadow depth anchor — alpha multiplier for shadow intensity.
const SHADOW_DEPTH = { dormant: 0.3, warm: 0.5 };

// Radius softening bonus — additive to base rounded-lg in warm state.
const RADIUS_SOFT = { dormant: 0, warm: 0.5 };          // rem

// Accent opacity — raised from 0.30 to make accent visible from the start.
const ACCENT_OPACITY = { dormant: 0.5, warm: 1.0 };     // 0-1

// Typography depth anchors — "the room warms, the text breathes".
// Font-weight crosses JND: 400→450 is one grade shift that the reader feels
// as "the text gained confidence". 400→420 was literally imperceptible.
// Combined with letter-spacing and para-rhythm, creates cumulative warmth.
const FONT_WEIGHT = { dormant: 400, warm: 450 };          // crosses JND
const LETTER_SPACING = { dormant: -0.01, warm: 0.01 };    // em — tight→open
const PARA_RHYTHM = { dormant: 0, warm: 8 };              // px — additive para gap

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

// ─── Public API ───────────────────────────────────────────

/** Compute thermal CSS tokens from a 0-100 score. */
export function computeThermalTokens(score: number, _state: ThermalState): ThermalTokens {
  const t = Math.max(0, Math.min(1, score / 100));
  return {
    '--token-bg': lerpColor(BG.dormant, BG.warm, t),
    '--token-surface': lerpColor(SURFACE.dormant, SURFACE.warm, t),
    '--token-foreground': lerpColor(FOREGROUND.dormant, FOREGROUND.warm, t),
    '--token-accent': lerpColor(ACCENT.dormant, ACCENT.warm, t),
    '--token-glow': glowValue(t),
    '--token-shadow': shadowValue(t),
    '--token-border': lerpColor(BORDER.dormant, BORDER.warm, t),
    '--token-spacing-breath': `${Math.round(t * 10)}px`,
    // Typography — line-height breathing (perceptible 3.5px total delta)
    '--token-line-height': lerp(LINE_HEIGHT.dormant, LINE_HEIGHT.warm, t).toFixed(3),
    // Shadow depth — continuous alpha scaling
    '--token-shadow-depth': lerp(SHADOW_DEPTH.dormant, SHADOW_DEPTH.warm, t).toFixed(2),
    // Radius softening — additive bonus on top of base rounded-lg
    '--token-radius-soft': `${lerp(RADIUS_SOFT.dormant, RADIUS_SOFT.warm, t).toFixed(2)}rem`,
    // Accent opacity — controls visibility of accent elements
    '--token-accent-opacity': lerp(ACCENT_OPACITY.dormant, ACCENT_OPACITY.warm, t).toFixed(2),
    // Typography depth — font-weight, letter-spacing, paragraph rhythm, text glow
    '--token-font-weight': lerp(FONT_WEIGHT.dormant, FONT_WEIGHT.warm, t).toFixed(1),
    '--token-letter-spacing': `${lerp(LETTER_SPACING.dormant, LETTER_SPACING.warm, t).toFixed(3)}em`,
    '--token-para-rhythm': `${Math.round(lerp(PARA_RHYTHM.dormant, PARA_RHYTHM.warm, t))}px`,
    '--token-text-glow': textGlowValue(t),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function glowValue(t: number): string {
  if (t < 0.18) return 'none';
  const alpha = (t * 0.18).toFixed(3);
  return `0 0 ${Math.round(40 + t * 60)}px rgba(240,198,116,${alpha})`;
}

function shadowValue(t: number): string {
  const alpha = lerp(SHADOW_DEPTH.dormant, SHADOW_DEPTH.warm, t).toFixed(2);
  return `0 ${Math.round(1 + t * 7)}px ${Math.round(2 + t * 30)}px rgba(0,0,0,${alpha})`;
}

/** Text glow — warm gold shadow on .thermal-typography, only at warm+.
 *  Alpha capped at 0.05 — peripheral warmth, not "glowing text". */
function textGlowValue(t: number): string {
  if (t < 0.5) return 'none';
  const alpha = Math.min(0.05, t * 0.06).toFixed(3);
  return `0 0 40px rgba(240,198,116,${alpha})`;
}
