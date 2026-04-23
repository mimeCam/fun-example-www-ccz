/**
 * Skeleton Ledger — the 5th primitive's ledger mirror.
 *
 * CSS (`app/globals.css`) is canonical. TypeScript mirrors it.
 * `lib/design/__tests__/skeleton-sync.test.ts` enforces kinship. If a
 * number changes in one place it must change in the other — or the test
 * fails. Same discipline as `alpha-sync.test.ts` and `motion-sync.test.ts`.
 *
 * This module names three things, nothing more:
 *   1. The breath cadence — SKELETON.beat (= MOTION.linger, 1000ms).
 *   2. The oscillation floor/ceiling — SKELETON.low / SKELETON.high,
 *      composed from the Alpha ledger (hairline ↔ muted). No new rung.
 *   3. The three variant shapes — `line` · `block` · `card`. Sealed.
 *
 * No shimmer. No delay. No speed prop. No count. No tone prop. If a
 * caller needs a repeated line, the existing `Array.from({length}).map(…)`
 * pattern at the call-site already works. If a caller wants a tint, the
 * thermal system already warms `bg-surface` ambiently via the inline
 * blocking script at `app/layout.tsx`. The primitive is a composition
 * of what already exists — nothing new.
 *
 * Credits: Mike K. (napkin — CSS-canonical + sync/adoption pattern,
 * three-variant fence, the "11 sites is a real case" green light),
 * Tanya D. (the UX discipline of NOT adding a fourth variant until a
 * fourth real site justifies it), Paul K. (priority call: Skeleton
 * before Silence), Elon M. (the YAGNI bar that produced zero props
 * beyond `variant` + `className`). Existing primitives (Threshold.tsx,
 * alpha.ts, motion.ts) — load-bearing prior art.
 */

import { ALPHA, type AlphaRung } from './alpha';
import { MOTION, type MotionBeat } from './motion';

// ─── Breath atoms — composed from sealed ledgers ─────────────────────────

/**
 * SKELETON is a *composition* of two sealed ledgers, not a new ledger.
 * `beat` reads from MOTION, `low`/`high` read from ALPHA. Changing any
 * value here means changing it in the source ledger — which is the point.
 */
export const SKELETON = {
  beat: MOTION.linger,     // 1000ms — passage breathing
  low:  ALPHA.hairline,     // 0.10 — valley of the breath
  high: ALPHA.muted,        // 0.30 — peak of the breath
} as const;

/** Named rung the floor reads from. Pinned for the sync test. */
export const SKELETON_LOW_RUNG: AlphaRung = 'hairline';

/** Named rung the peak reads from. Pinned for the sync test. */
export const SKELETON_HIGH_RUNG: AlphaRung = 'muted';

/** Named beat the cadence reads from. Pinned for the sync test. */
export const SKELETON_BEAT: MotionBeat = 'linger';

// ─── Variant vocabulary — three shapes, sealed ───────────────────────────

/**
 * Three shapes, sealed. Naming is by *posture*, not by use-site.
 *   line  — a hairline bar of copy (titles, metadata, paragraph slivers)
 *   block — a small rectangular placeholder (CTAs, chips, inline tags)
 *   card  — a thermal-aware padded surface (list cards, hero surfaces)
 *
 * Do NOT add variants like `title`, `meta`, or `hero` — those are uses,
 * not atoms. If a fourth real site earns a fourth shape, design that
 * shape against its actual constraints, not against imagined ones.
 */
export const SKELETON_SHAPES = {
  line:  'rounded-sys-soft bg-surface',
  block: 'rounded-sys-medium bg-surface',
  card:  'rounded-sys-medium thermal-radius bg-surface',
} as const;

export type SkeletonShape = keyof typeof SKELETON_SHAPES;

/** Ordered line → block → card, by "posture weight". */
export const SKELETON_ORDER: readonly SkeletonShape[] =
  ['line', 'block', 'card'] as const;

/** The one CSS class that carries the breath. Applied by the primitive. */
export const SKELETON_CSS_CLASS = 'sys-skeleton';

// ─── Helpers — pure, each ≤ 10 LOC ───────────────────────────────────────

/** Tailwind class fragment for a named shape. Pure. */
export const shapeClassOf = (v: SkeletonShape): string => SKELETON_SHAPES[v];

/** CSS custom-property reference for the breath beat. Pure. */
export const cssBeatVar = (): string => 'var(--sys-skeleton-beat)';

/**
 * Compose the final className: the breath carrier + the shape + caller's
 * sizing/spacing pass-through. Falsy segments drop out. Pure.
 */
export function composeSkeletonClass(
  variant: SkeletonShape,
  extra?: string,
): string {
  return [SKELETON_CSS_CLASS, shapeClassOf(variant), extra]
    .filter(Boolean)
    .join(' ');
}

// ─── Invariants — a test can lock these down ─────────────────────────────

/**
 * Must hold: beat equals MOTION.linger; low equals ALPHA[LOW_RUNG]; high
 * equals ALPHA[HIGH_RUNG]; low < high. Breaking any of these is drift.
 * Pure.
 */
export function skeletonInvariantHolds(): boolean {
  if (SKELETON.beat !== MOTION[SKELETON_BEAT]) return false;
  if (SKELETON.low !== ALPHA[SKELETON_LOW_RUNG]) return false;
  if (SKELETON.high !== ALPHA[SKELETON_HIGH_RUNG]) return false;
  return SKELETON.low < SKELETON.high;
}

/**
 * Must hold: three shapes, ordered list matches keys exactly. Pure.
 */
export function skeletonShapesInvariantHolds(): boolean {
  const keys = Object.keys(SKELETON_SHAPES) as SkeletonShape[];
  if (keys.length !== 3) return false;
  if (SKELETON_ORDER.length !== 3) return false;
  return SKELETON_ORDER.every((v, i) => keys[i] === v);
}
