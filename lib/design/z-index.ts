/**
 * Z-Index Tokens — single source of truth for stack order across the site.
 *
 * The 8th ledger. Mirrors the 9 `--sys-z-*` rungs already declared in
 * `app/globals.css`. CSS is canonical; this module mirrors it; the
 * `z-index-sync.test.ts` enforces kinship. If a number changes in one
 * place it must change in the other — or the test fails.
 *
 * ─── The two-axis distinction (load-bearing) ──────────────────────────
 *
 * Elevation (`lib/design/elevation.ts`) = expressive lift (gold-α, shadow).
 * Z (this module)                       = structural stack order.
 * They are orthogonal axes; historically conflated under "depth," now
 * aren't. A `drawer` lives at `Z.drawer` regardless of whether its
 * elevation is `rest` or `radiance`. A `toast` always outranks a `drawer`
 * in occlusion even though a drawer carries heavier shadow.
 *
 * ─── Slots, not a scale ───────────────────────────────────────────────
 *
 * The 9 rungs are *named slots* — a topological lookup, not a continuous
 * axis. New slots require napkin-level justification. Do NOT add rung #10
 * "just in case." The `backdrop:39 → drawer:40` adjacency is deliberate;
 * the single integer gap is the seam where modal + scrim bind.
 *
 * ─── Never warms ──────────────────────────────────────────────────────
 *
 * Z is the purest non-reactive ledger. No thermal input, no archetype
 * input, no phase input. If you ever find yourself writing `z * warmth`,
 * stop.
 *
 * Credits: Mike K. (napkin §1–7 — three-mirror invariant, slot-not-scale,
 * never-warms, sync+adoption pair-rule, allow-list shape), Tanya D. (UX
 * spec §1–3 — two-axis model, character-sheet defaults, coexistence
 * matrix), Elon M. (the Elevation-vs-Z axis distinction; the
 * one-name-top-to-bottom invariant), Paul K. (Keepsake-never-clipped,
 * Toast-above-Drawer, zero-stacking-bugs business outcomes), Krystle C.
 * (pair-rule sprint shape: TS mirror + sync + adoption in one PR).
 */

// ─── The 9 named slots — mirrors --sys-z-* in app/globals.css ──────────────

/**
 * Nine named stack slots, ordered back-to-front.
 *
 * Naming is by *role in the room*, not by integer. A reader greps "drawer"
 * once and finds the CSS var, the Tailwind class, and the TS const.
 * One name flows top-to-bottom — the invariant every other ledger honors.
 */
export const Z = {
  base:      1, // --sys-z-base     — the page; prose; everything that isn't chrome
  thread:    2, // --sys-z-thread   — ambient chrome; the reader's pulse
  nav:      10, // --sys-z-nav      — ceiling waypoint; always present, never proud
  gem:      15, // --sys-z-gem      — the hearth; a home light, not a button
  popover:  20, // --sys-z-popover  — selection-anchored whisper; in-context, small
  backdrop: 39, // --sys-z-backdrop — scrim that dims the room so a modal can speak
  drawer:   40, // --sys-z-drawer   — resonance chamber; side-room (also Keepsake host)
  overlay:  50, // --sys-z-overlay  — system-level interrupt; rare
  toast:    60, // --sys-z-toast    — confirm-verb; a word from the room, then silence
} as const;

export type ZSlot = keyof typeof Z;

/**
 * Back-to-front order. The sync test asserts strict-ascending and full
 * coverage; downstream tooling can rely on `Z_ORDER[i] < Z_ORDER[i+1]`.
 */
export const Z_ORDER: readonly ZSlot[] = [
  'base', 'thread', 'nav', 'gem', 'popover',
  'backdrop', 'drawer', 'overlay', 'toast',
] as const;

// ─── Helpers — three mirrors, one slot name ────────────────────────────────

/** Numeric stack value for a named slot. Pure. */
export const zIndexOf = (s: ZSlot): number => Z[s];

/** CSS custom-property reference for a named slot. Pure. */
export const cssVarOf = (s: ZSlot): string => `var(--sys-z-${s})`;

/** Tailwind class name for a named slot. Pure. */
export const classOf = (s: ZSlot): string => `z-sys-${s}`;

// ─── Invariants — locked by the sync test ──────────────────────────────────

/**
 * Must hold: `Z_ORDER` covers every slot exactly once, values are strictly
 * ascending (back → front), every value is a positive integer. Pure.
 * Strict-ascending implicitly forbids duplicates, so no `seen` Set needed.
 */
export function zInvariantHolds(): boolean {
  if (Z_ORDER.length !== Object.keys(Z).length) return false;
  let prev = 0;
  for (const slot of Z_ORDER) {
    const val = Z[slot];
    if (!Number.isInteger(val) || val <= prev) return false;
    prev = val;
  }
  return true;
}
