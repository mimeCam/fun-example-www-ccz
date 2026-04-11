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

const BG = { dormant: '#1a1a2e', warm: '#1e1a38' };
const SURFACE = { dormant: '#16213e', warm: '#1e284c' };
const FOREGROUND = { dormant: '#e8e8f0', warm: '#f0f0f5' };
const ACCENT = { dormant: '#7b2cbf', warm: '#f0c674' };
const BORDER = { dormant: '#222244', warm: '#2e2e60' };

// Typography anchors — letter-spacing and line-height breathe with score.
// Conservative range: readers should feel it, not see it.
const LETTER_SPACING = { dormant: 0, warm: 0.01 };     // em
const LINE_HEIGHT = { dormant: 1.75, warm: 1.85 };      // unitless

// Shadow depth anchor — alpha multiplier for shadow intensity.
const SHADOW_DEPTH = { dormant: 0.3, warm: 0.5 };

// Radius softening bonus — additive to base rounded-lg in warm state.
const RADIUS_SOFT = { dormant: 0, warm: 0.25 };         // rem

// Accent opacity — controls accent element visibility.
const ACCENT_OPACITY = { dormant: 0.3, warm: 1.0 };     // 0-1

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

// ─── Non-linear interpolation ─────────────────────────────
// The dormant→stirring band (0→25) must show more visual shift
// per point than the higher bands. A slight exponential curve
// in the low range ensures first-time readers see the page transform.

function easeLowEnd(raw: number): number {
  // Apply subtle power curve: more change at low end
  return raw < 0.25
    ? Math.pow(raw / 0.25, 0.7) * 0.25
    : 0.25 + (raw - 0.25) * (0.75 / 0.75);
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
    '--token-spacing-breath': `${Math.round(t * 4)}px`,
    // Typography — subtle breathing via letter-spacing + line-height
    '--token-letter-spacing': `${lerp(LETTER_SPACING.dormant, LETTER_SPACING.warm, t).toFixed(3)}em`,
    '--token-line-height': lerp(LINE_HEIGHT.dormant, LINE_HEIGHT.warm, t).toFixed(3),
    // Shadow depth — continuous alpha scaling
    '--token-shadow-depth': lerp(SHADOW_DEPTH.dormant, SHADOW_DEPTH.warm, t).toFixed(2),
    // Radius softening — additive bonus on top of base rounded-lg
    '--token-radius-soft': `${lerp(RADIUS_SOFT.dormant, RADIUS_SOFT.warm, t).toFixed(2)}rem`,
    // Accent opacity — controls visibility of accent elements
    '--token-accent-opacity': lerp(ACCENT_OPACITY.dormant, ACCENT_OPACITY.warm, t).toFixed(2),
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function glowValue(t: number): string {
  if (t < 0.25) return 'none';
  const alpha = (t * 0.10).toFixed(3);
  return `0 0 ${Math.round(40 + t * 40)}px rgba(240,198,116,${alpha})`;
}

function shadowValue(t: number): string {
  const alpha = lerp(SHADOW_DEPTH.dormant, SHADOW_DEPTH.warm, t).toFixed(2);
  return `0 ${Math.round(1 + t * 7)}px ${Math.round(2 + t * 30)}px rgba(0,0,0,${alpha})`;
}
