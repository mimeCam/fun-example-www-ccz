/**
 * thread-tide — pure tide mark calculations.
 *
 * Isolated for testability: no DOM, no React, no imports from the rest of
 * the thread system. Pattern mirrors `thermal-score.ts` — pure functions
 * only. The driver calls these; subscribers and components call the driver.
 *
 * "A tide mark never retreats — it shows the high-water line."
 * — Tanya D. UIX spec §1
 *
 * Persistence: `persistMaxDepth` / `readMaxDepth` use `localStorage` keyed
 * by a slug derived from `window.location.pathname`. Called once on driver
 * mount (synchronous read), then debounced-written (500ms) on increase.
 *
 * Credits: Mike K. (napkin — module shape, function signatures),
 *          Tanya D. (UIX spec §1 — 2% threshold, "dried ink" metaphor).
 */

// ─── Constants ─────────────────────────────────────────────────────────────

const TIDE_KEY_PREFIX = 'thread-tide:';

/** 2% tolerance — prevents settled↔advancing flicker at the tide mark edge. */
export const TIDE_SETTLED_THRESHOLD = 0.02;

/** CustomEvent name emitted when the tide mark crosses a depth band. */
export const TIDE_CROSSING_EVENT = 'thread:tide-crossing';

// ─── Types ──────────────────────────────────────────────────────────────────

/** Notable depth bands — "new territory" milestones. */
export type TideBand = 0.25 | 0.50 | 0.75 | 1.0;

/** Payload for TIDE_CROSSING_EVENT. */
export interface TideCrossingDetail {
  band: TideBand;
}

// ─── Pure calculations ──────────────────────────────────────────────────────

/**
 * How far the reader is below their tide mark. 0 = at or ahead of mark.
 * Output range: 0..1. Pure.
 */
export function calcTideDelta(raw: number, max: number): number {
  return Math.max(0, max - raw);
}

/**
 * True iff the reader has retreated more than `threshold` below their
 * high-water mark. At threshold=0.02 a 2% retreat triggers "settled".
 * Pure, no side-effects.
 */
export function isTideSettled(
  raw: number,
  max: number,
  threshold = TIDE_SETTLED_THRESHOLD,
): boolean {
  return max - raw > threshold;
}

/**
 * If advancing from `prev` to `next` crosses a TideBand milestone, return
 * that band. Otherwise null. Strictly forward — never fires on retreat. Pure.
 */
export function shouldEmitCrossing(prev: number, next: number): TideBand | null {
  const bands: TideBand[] = [0.25, 0.50, 0.75, 1.0];
  return bands.find((b) => prev < b && next >= b) ?? null;
}

// ─── LocalStorage persistence ───────────────────────────────────────────────

function tideKey(slug: string): string {
  return `${TIDE_KEY_PREFIX}${slug}`;
}

/**
 * Derive a stable localStorage slug from a URL pathname.
 * Leading/trailing slashes stripped; empty path → 'root'.
 */
export function slugFromPathname(pathname: string): string {
  return pathname.replace(/^\/|\/$/g, '') || 'root';
}

/**
 * Read persisted tide mark for this slug. Returns 0 if absent or corrupt.
 * Synchronous — called once on driver mount, not on every frame.
 */
export function readMaxDepth(slug: string): number {
  if (typeof localStorage === 'undefined') return 0;
  const stored = localStorage.getItem(tideKey(slug));
  if (!stored) return 0;
  return Math.max(0, Math.min(1, parseFloat(stored) || 0));
}

/**
 * Persist tide mark for this slug to localStorage.
 * Called via debounced timer in the driver — not on every frame.
 */
export function persistMaxDepth(slug: string, depth: number): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(tideKey(slug), String(depth));
}
