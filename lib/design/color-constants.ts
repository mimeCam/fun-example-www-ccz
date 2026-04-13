/**
 * Color Constants — single source of truth for canvas contexts.
 *
 * Canvas API cannot read CSS custom properties at runtime.
 * This module provides the same color values that CSS `:root` defines,
 * so canvas-generated images stay visually in sync with the thermal system.
 *
 * Thermal tokens (dormant anchors): match `--token-*` defaults in globals.css.
 * Archetype tokens: match `--arch-*` in globals.css.
 * Brand tokens: match `--gold`, `--mist`, `--fog`, etc. in globals.css.
 *
 * IMPORTANT: If you change a color in globals.css, change it here too.
 * The test in __tests__/color-constants-sync.test.ts catches drift.
 */

// ─── Thermal dormant anchors (match globals.css :root defaults) ───

export const THERMAL = {
  bg:         '#1a1a2e',
  surface:    '#16213e',
  foreground: '#e8e8f0',
  accent:     '#7b2cbf',
  border:     '#222244',
} as const;

// ─── Thermal warm anchors (match thermal-tokens.ts BG.warm etc.) ───

export const THERMAL_WARM = {
  bg:         '#382238',
  surface:    '#1e2a3e',
  foreground: '#f5ede0',
  accent:     '#f0c674',
  border:     '#2e2e50',
} as const;

// ─── Brand / static tokens (match --gold, --mist, --fog etc.) ───

export const BRAND = {
  gold:    '#f0c674',
  amber:   '#d4922a',
  cyan:    '#4ecdc4',
  rose:    '#e88fa7',
  mist:    '#9494b8',
  fog:     '#222244',
  void:    '#0d0d1a',
  primary: '#7b2cbf',
  secondary: '#9d4edd',
} as const;

// ─── Archetype colors (match --arch-* in globals.css) ───

export const ARCHETYPE = {
  'deep-diver': '#4ecdc4',
  'explorer':   '#c77dff',
  'faithful':   '#9d4edd',
  'resonator':  '#e88fa7',
  'collector':  '#d4922a',
} as const;

export type ArchetypeColorKey = keyof typeof ARCHETYPE;

// ─── Canvas utility ───────────────────────────────────────────

/** Resolve a CSS token at runtime, falling back to a constant. */
export function cssOr(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(name).trim();
  return v || fallback;
}
