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
  'explorer':   '#7fdbda',
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

// ─── Color-Adoption Ledger (the 7th gate) ─────────────────────────
//
// Mirrors the Alpha / Elevation pattern: one inline exempt token plus
// a path-grandfather list absorbs pre-gate drift. Together with
// `color-adoption.test.ts` this closes the 7-for-7 symmetry: every
// ledger now carries a sync test AND an adoption guard.
//
// Credits: Mike K. (napkin #10 §2/§3 — allow-list + grandfather shape,
// mirror `alpha.ts`), Elon M. (one-sentence AGENTS.md over a keystone
// meta-test), Tanya D. (UX spec #29 §4 — NextRead drift audit gave
// the initial grandfather receipts), Krystle C. (7-for-7 framing).

/**
 * Inline `// color-ledger:exempt — <reason>` comment marks a line as an
 * honest exception. Reviewer-visible tokens beat invisible drift — same
 * rule as `ALPHA_LEDGER_EXEMPT_TOKEN`. Legitimate reasons are rare:
 *
 *   • Canvas / SVG contexts where CSS custom properties cannot resolve —
 *     prefer routing those files through the ALLOW list in the adoption
 *     test instead. The per-line token is for one-off cases, not backlog.
 *
 * Usage in source:
 *   bg.value = '#1a1a2e'; // color-ledger:exempt — canvas fallback default
 */
export const COLOR_LEDGER_EXEMPT_TOKEN = 'color-ledger:exempt';

/**
 * Grandfathered drift inventory — files with color literals outside the
 * ledger at the moment the 7th gate landed. This list is drift-in-progress,
 * not policy: each entry is a micro-PR receipt waiting to be redeemed.
 * Removing a file from this list is how a future PR says "this file now
 * routes through the ledger." The list should ONLY shrink.
 *
 * When migrating a file off this list, prefer one of:
 *   (a) route through `BRAND.*` / `THERMAL.*` / `ARCHETYPE[...]` from this
 *       module (the canvas-safe ledger — one source of truth),
 *   (b) use `color-mix(in srgb, var(--<token>) <N>%, transparent)` in CSS
 *       strings so the thermal engine can repaint it, OR
 *   (c) snap to an alpha rung + token via `alphaClassOf(color, rung, kind)`
 *       from `lib/design/alpha.ts` when the only degree of freedom is alpha.
 *
 * Every entry ships with a one-line comment receipt (who drifted, why
 * migration is deferred). A PR that re-adds a grandfather path should
 * fail review on the invariant "list shrinks only."
 */
export const COLOR_GRANDFATHERED_PATHS: readonly string[] = [
  // Temporary in-page highlight tint. Gold rgba literal (`#f0c674` @ 15%).
  // Migrate to `color-mix(in srgb, var(--gold) 10%, transparent)` (hairline)
  // so it warms with the thermal engine. Tracked: follow-up sprint.
  'lib/sharing/highlight-finder.ts',
] as const;
