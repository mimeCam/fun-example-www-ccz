/**
 * Accent-bias calibration — Recognition Whisper Budget (warm + cool baselines).
 *
 *   Measured threshold:  ΔE2000 ∈ [FLOOR, 1.8] vs. each stranger baseline.
 *                        FLOOR = 0.8 at the warm spine fill stop (BRAND.gold)
 *                        FLOOR = 0.7 at the cool spine fill stop (BRAND.primary)
 *   JND class:           sub-conscious recognition (signature, not status).
 *   Failure mode fenced: signature → status drift, in either direction,
 *                        at either end of the violet→gold thermal gradient.
 *
 * The two window literals (`RECOGNITION_WHISPER_BUDGET_WARM`,
 * `RECOGNITION_WHISPER_BUDGET_COOL`) live as exported tuples in
 * `lib/design/accent-bias.ts` (the carrier module owns the budget; the
 * fence consumes it — Mike #56 §POI 1, AGENTS.md §16). Two named tuples,
 * two baselines, ten fence pins. No `whisperBudgetAt(stop)` primitive at
 * N=2 — see the COOL tuple's docblock for the rule-of-three argument.
 *
 * The 0.04 ΔE asymmetry between the two floors (0.8 warm vs. 0.7 cool) is
 * documented at the COOL tuple as "sub-metric-noise-floor": ΔE2000's own
 * inter-observer variability is ~0.5–1.0 ΔE per Sharma/Wu/Dalal 2005, so
 * the 0.04 gap is below the metric's ability to resolve. Felt-experience
 * is identical at the warm peak (Tanya UIX #78 §3a — felt-equivalent, not
 * numerically equivalent); the contract becomes honestly enforceable at
 * the cool stop instead of aspirational.
 *
 * Imports `measureDeltaE2000` from `scripts/...` — intentional per Elon
 * §6 (rule-of-three has not fired; the helper co-locates with its caller
 * until calibration #2 lands and earns a `lib/design/perceptual/` move).
 */

import {
  __testing__,
  THREAD_BIAS_MAX_ABS_DEG,
  RECOGNITION_WHISPER_BUDGET_WARM,
  RECOGNITION_WHISPER_BUDGET_COOL,
} from '@/lib/design/accent-bias';
import { BRAND } from '@/lib/design/color-constants';
import { measureDeltaE2000 } from '../../../scripts/measure-thread-bias-deltaE';
import type { ArchetypeKey } from '@/types/content';

const { THREAD_BIAS_BY_ARCHETYPE } = __testing__;

// ─── Spec — the two Recognition Whisper Budgets (Mike #56 / Elon §1.5) ──────

const WARM_BASELINE_HEX = BRAND.gold;     // #f0c674 — warm spine fill stop
const COOL_BASELINE_HEX = BRAND.primary;  // #7b2cbf — cool spine fill stop

// ─── Failure-message-is-documentation (Mike §4 POI 7) ───────────────────────

/**
 * Compose the diagnostic prose printed when an archetype falls outside a
 * window. The baseline + window are part of the message so a future drift
 * names *which* baseline failed (Mike #56 §POI 3 — the diagnostic prints
 * its own context).
 */
function failMessage(
  arch: ArchetypeKey,
  bias: number,
  dE: number,
  baselineHex: string,
  window: readonly [number, number],
): string {
  const sign = bias > 0 ? '+' : '';
  const [floor, ceiling] = window;
  return `\n  archetype:        ${arch}` +
         `\n  --thread-bias:    ${sign}${bias}°` +
         `\n  measured ΔE2000:  ${dE.toFixed(3)}  vs ${baselineHex}` +
         `\n  expected window:  [${floor}, ${ceiling}]  (sub-JND; signature, not status)` +
         `\n  fix: re-calibrate the ° value in app/globals.css (the SSOT truth table)` +
         `\n       and the mirror in lib/design/accent-bias.ts THREAD_BIAS_BY_ARCHETYPE.`;
}

/**
 * Assert one archetype's lean lands inside the perceptual signature
 * window for the given baseline. Parametric over `(arch, baselineHex,
 * window)` — not a new abstraction, just a parameter that already
 * existed implicitly when the function read a global baseline (Mike #56
 * §POI 2).
 */
function assertWindow(
  arch: ArchetypeKey,
  baselineHex: string,
  window: readonly [number, number],
): void {
  const bias = THREAD_BIAS_BY_ARCHETYPE[arch];
  const dE = measureDeltaE2000(baselineHex, bias);
  const [floor, ceiling] = window;
  if (dE < floor || dE > ceiling) {
    throw new Error(failMessage(arch, bias, dE, baselineHex, window));
  }
  expect(dE).toBeGreaterThanOrEqual(floor);
  expect(dE).toBeLessThanOrEqual(ceiling);
}

// ─── §1 · Five named per-archetype window assertions, WARM baseline ─────────

describe('accent-bias — RECOGNITION_WHISPER_BUDGET_WARM (ΔE2000 ∈ [0.8, 1.8])', () => {
  const W = RECOGNITION_WHISPER_BUDGET_WARM;
  it('deep-diver renders inside the whisper budget', () => assertWindow('deep-diver', WARM_BASELINE_HEX, W));
  it('explorer renders inside the whisper budget',   () => assertWindow('explorer',   WARM_BASELINE_HEX, W));
  it('faithful renders inside the whisper budget',   () => assertWindow('faithful',   WARM_BASELINE_HEX, W));
  it('resonator renders inside the whisper budget',  () => assertWindow('resonator',  WARM_BASELINE_HEX, W));
  it('collector renders inside the whisper budget',  () => assertWindow('collector',  WARM_BASELINE_HEX, W));
});

// ─── §1b · Five named per-archetype window assertions, COOL baseline ────────

describe('accent-bias — RECOGNITION_WHISPER_BUDGET_COOL (ΔE2000 ∈ [0.7, 1.8])', () => {
  const W = RECOGNITION_WHISPER_BUDGET_COOL;
  it('deep-diver renders inside the whisper budget (cool)', () => assertWindow('deep-diver', COOL_BASELINE_HEX, W));
  it('explorer renders inside the whisper budget (cool)',   () => assertWindow('explorer',   COOL_BASELINE_HEX, W));
  it('faithful renders inside the whisper budget (cool)',   () => assertWindow('faithful',   COOL_BASELINE_HEX, W));
  it('resonator renders inside the whisper budget (cool)',  () => assertWindow('resonator',  COOL_BASELINE_HEX, W));
  it('collector renders inside the whisper budget (cool)',  () => assertWindow('collector',  COOL_BASELINE_HEX, W));
});

// ─── §2 · Range cap pins (Mike §4 POI 8 — closed-union exhaustiveness) ──────

describe('accent-bias — range cap (±3° geometry guard; whisper-budget enforceable)', () => {
  it('every archetype value satisfies |°| ≤ THREAD_BIAS_MAX_ABS_DEG', () => {
    // Closed-union iteration: a sixth archetype trips the TS compile, not
    // just the runtime (the same shape as the accent-bias.ts SSOT mirror).
    (Object.keys(THREAD_BIAS_BY_ARCHETYPE) as ArchetypeKey[]).forEach((k) => {
      expect(Math.abs(THREAD_BIAS_BY_ARCHETYPE[k])).toBeLessThanOrEqual(THREAD_BIAS_MAX_ABS_DEG);
    });
  });

  it('THREAD_BIAS_MAX_ABS_DEG is 3 (cap honors both whisper-budget ceilings)', () => {
    // 3° × 0.66 ΔE/° ≈ 1.98 at warm; 3° × 0.51 ΔE/° ≈ 1.53 at cool — both
    // sit at-or-inside the 1.8 ceiling. One geometry guard, two baselines,
    // mechanically enforced. Mike #56 §POI 6 — *don't* introduce a per-
    // stop cap; the single number covers both ends with margin.
    expect(THREAD_BIAS_MAX_ABS_DEG).toBe(3);
  });
});

// ─── §3 · Matrix-sanity pins on the helper this fence depends on ────────────

describe('accent-bias — measureDeltaE2000 helper sanity', () => {
  it('stranger floor (warm): 0° lean produces ΔE2000 = 0 (byte-equal pixels)', () => {
    // Tanya §7 acceptance #1 — stranger ≡ today, byte-identical, warm baseline.
    expect(measureDeltaE2000(WARM_BASELINE_HEX, 0)).toBe(0);
  });

  it('stranger floor (cool): 0° lean produces ΔE2000 = 0 (byte-equal pixels)', () => {
    // Same invariant at the cool baseline — the three-layer floor holds at
    // both ends of the gradient (Mike #56 §POI 8). Cheap insurance against
    // a future matrix coefficient drift on the hue-dependent RT term that
    // rotates around 275° = blue-violet (right where BRAND.primary lives).
    expect(measureDeltaE2000(COOL_BASELINE_HEX, 0)).toBe(0);
  });

  it('360° round-trip (warm): a full-wheel rotation returns ΔE2000 ≈ 0', () => {
    expect(measureDeltaE2000(WARM_BASELINE_HEX, 360)).toBeCloseTo(0, 6);
  });

  it('360° round-trip (cool): a full-wheel rotation returns ΔE2000 ≈ 0', () => {
    // Per-baseline matrix sanity — the matrix is hue-dependent in ΔE-space
    // because RT rotates around 275° = blue-violet, exactly where
    // BRAND.primary = #7b2cbf sits (Mike #56 §POI 10).
    expect(measureDeltaE2000(COOL_BASELINE_HEX, 360)).toBeCloseTo(0, 6);
  });

  it('neutral gray is invariant under hue-rotate (Δa* = Δb* = 0)', () => {
    // Hue-rotate has zero effect on grayscale pixels; the matrix is
    // luminance-preserving by construction. Independent witness for the
    // CSS-spec matrix coefficients (Mike §4 POI 2).
    expect(measureDeltaE2000('#888888', 6)).toBeCloseTo(0, 6);
  });
});
