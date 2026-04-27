/**
 * funnel-lift — pure stats kernel for the archetype A/B readout.
 *
 * Three families, no DB, no React, no I/O:
 *   1. `computeRates`     — { resolved%, warmed%, keepsaked%, shared% } per arm.
 *   2. `computeLift`      — relative + absolute lift of treatment vs. control.
 *   3. `wilsonInterval`   — 95% CI for a binomial proportion + a `signal/noise`
 *                           verdict ("does the CI exclude the control rate?").
 *
 * Wilson chosen over Wald: rates are bounded [0, 1], counts are often small
 * for the `shared` checkpoint, and Wilson handles `p ∈ {0, 1}` and `n=0`
 * gracefully. ~10 LOC of formula vs. shipping `simple-statistics`.
 *
 * No imports from `@/lib/db` — this file is unit-testable without a DB
 * fixture and is candidate for graduation to `lib/utils/` if a second
 * caller appears (rule of three; AGENTS.md). For now, it lives next to
 * its only consumer.
 *
 * Credits: Mike K. (napkin §4 file-3 + §6 — pure, no DB, Wilson over t-test,
 * promote on rule of three), Paul K. (Keepsake share rate per archetype is
 * the only KPI worth lifting), Elon M. (§3 — without a comparison and a
 * confidence read, polish is sanding in the dark).
 */

import { CHECKPOINT_NAMES } from '@/lib/engagement/loop-checkpoints';
import type { FunnelByArchetypeRow } from '@/lib/engagement/funnel-by-archetype';

// ─── Types ────────────────────────────────────────────────────────────────

/** Conversion rates per checkpoint, in [0, 1]. NaN-free; n=0 ⇒ 0. */
export interface CheckpointRates {
  resolved: number;
  warmed: number;
  keepsaked: number;
  shared: number;
}

/** Wilson 95% CI for a single proportion. `signal` ⇒ excludes the baseline. */
export interface WilsonCI {
  rate: number;
  low: number;
  high: number;
  n: number;
}

/** Lift readout for one checkpoint vs. a control rate. NaN-safe. */
export interface CheckpointLift {
  rate: number;
  control: number;
  absolute: number;     // rate - control       (signed pp)
  relative: number;     // (rate-control)/c     (NaN-safe; 0 when control=0)
  ci: WilsonCI;
  verdict: 'signal' | 'noise';
}

// ─── Constants ────────────────────────────────────────────────────────────

/** z for 95% two-sided. 1.96 is the textbook constant. */
const Z_95 = 1.959963984540054;

// ─── Rates ────────────────────────────────────────────────────────────────

/**
 * Conversion rates for one arm. Denominator = `landed` (every funnel row
 * has `landed=1`); numerator = `landed` & checkpoint flag both true.
 * `landed=0` collapses every rate to 0 — never NaN.
 */
export function computeRates(row: FunnelByArchetypeRow): CheckpointRates {
  const n = Math.max(0, row.landed);
  if (n === 0) return { resolved: 0, warmed: 0, keepsaked: 0, shared: 0 };
  return {
    resolved:  row.resolved  / n,
    warmed:    row.warmed    / n,
    keepsaked: row.keepsaked / n,
    shared:    row.shared    / n,
  };
}

// ─── Wilson interval ──────────────────────────────────────────────────────

/**
 * Wilson 95% CI for a proportion. Pure, branchless on n=0 (returns rate=0,
 * low=0, high=0). Formula: see Wilson (1927).
 *   center = (p + z²/(2n)) / (1 + z²/n)
 *   spread = z · √(p(1-p)/n + z²/(4n²)) / (1 + z²/n)
 */
export function wilsonInterval(numerator: number, denom: number): WilsonCI {
  const n = Math.max(0, Math.floor(denom));
  if (n === 0) return { rate: 0, low: 0, high: 0, n: 0 };
  const x = Math.max(0, Math.min(numerator, n));
  const p = x / n;
  const z2n = (Z_95 * Z_95) / n;
  const denomCi = 1 + z2n;
  const center = (p + z2n / 2) / denomCi;
  const spread = (Z_95 * Math.sqrt(p * (1 - p) / n + z2n / (4 * n))) / denomCi;
  return { rate: p, low: clamp01(center - spread), high: clamp01(center + spread), n };
}

/** Numeric clamp into [0, 1]. Pure. */
function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

// ─── Lift ─────────────────────────────────────────────────────────────────

/**
 * Lift readout for one (treatment, control) pair on a single checkpoint.
 * The verdict is `'signal'` only when the treatment's Wilson 95% CI
 * excludes the control point estimate — a clean, conservative readout
 * suitable for ops eyes (not a formal A/B significance test).
 */
export function computeCheckpointLift(
  numerator: number,
  denom: number,
  controlRate: number,
): CheckpointLift {
  const ci = wilsonInterval(numerator, denom);
  const absolute = ci.rate - controlRate;
  const relative = controlRate > 0 ? absolute / controlRate : 0;
  const excludesControl = controlRate < ci.low || controlRate > ci.high;
  return {
    rate: ci.rate, control: controlRate,
    absolute, relative, ci,
    verdict: excludesControl && ci.n > 0 ? 'signal' : 'noise',
  };
}

/** All four checkpoint lifts for one (treatment, control) pair. ≤ 10 LOC. */
export function computeLift(
  treatment: FunnelByArchetypeRow,
  controlRates: CheckpointRates,
): Record<string, CheckpointLift> {
  const out: Record<string, CheckpointLift> = {};
  CHECKPOINT_NAMES.forEach((c) => {
    const numerator = (treatment as unknown as Record<string, number>)[c] ?? 0;
    out[c] = computeCheckpointLift(numerator, treatment.landed, controlRates[c]);
  });
  return out;
}

// ─── Formatting helpers — pure, presentation only ─────────────────────────

/** "12.3%" — one decimal, never NaN. Pure. */
export function formatPercent(rate: number): string {
  if (!Number.isFinite(rate)) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

/** "+3.4 pp" / "−1.2 pp" — signed, one decimal. Pure. */
export function formatPp(absolute: number): string {
  if (!Number.isFinite(absolute) || absolute === 0) return '0.0 pp';
  const sign = absolute > 0 ? '+' : '−';
  return `${sign}${Math.abs(absolute * 100).toFixed(1)} pp`;
}
