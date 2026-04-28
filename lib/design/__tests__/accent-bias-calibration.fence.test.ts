/**
 * Accent-bias calibration — Recognition Whisper Budget (warm + cool baselines)
 * with panel white-point sensitivity (D50 today + D55 / D75 mirror columns).
 *
 *   Measured threshold:  ΔE2000 ∈ [FLOOR, 1.8] vs. each stranger baseline.
 *                        FLOOR = 0.8 at the warm spine fill stop (BRAND.gold)
 *                        FLOOR = 0.7 at the cool spine fill stop (BRAND.primary)
 *   JND class:           sub-conscious recognition (signature, not status).
 *   Failure mode fenced: signature → status drift, in either direction,
 *                        at either end of the violet→gold thermal gradient,
 *                        across ±1000K of panel white-point calibration.
 *
 * The two window literals (`RECOGNITION_WHISPER_BUDGET_WARM`,
 * `RECOGNITION_WHISPER_BUDGET_COOL`) live as exported tuples in
 * `lib/design/accent-bias.ts` (the carrier module owns the budget; the
 * fence consumes it — Mike #56 §POI 1, AGENTS.md §16). Two named tuples,
 * two baselines. No `whisperBudgetAt(stop)` primitive at N=2 — see the
 * COOL tuple's docblock for the rule-of-three argument.
 *
 * The 0.04 ΔE asymmetry between the two floors (0.8 warm vs. 0.7 cool) is
 * documented at the COOL tuple as "sub-metric-noise-floor": ΔE2000's own
 * inter-observer variability is ~0.5–1.0 ΔE per Sharma/Wu/Dalal 2005, so
 * the 0.04 gap is below the metric's ability to resolve. Felt-experience
 * is identical at the warm peak (Tanya UIX #78 §3a — felt-equivalent, not
 * numerically equivalent); the contract becomes honestly enforceable at
 * the cool stop instead of aspirational.
 *
 * Panel white-point sensitivity (Mike #7 — White-Point Sensitivity slice;
 * Mike #9 — cool-side closure): the §1c / §1e mirrored columns ask the
 * falsifiable question — does the ±3° geometry guard hold under ±1000K
 * of panel white-point drift, on the warm baseline? Yes: all five
 * archetypes stay inside `[0.8, 1.8]` at D55 (~5500K, warm panel) and
 * D75 (~7500K, cool panel). The cool-baseline mirrors (§1d / §1f) close
 * the ladder with a ceiling-only window: under D55 the resonator (-1.5°)
 * lands at ~0.698 (0.002 below the on-panel 0.7 cool floor), and under
 * D75 the ±1.5° pair falls to ~0.55 — both inside Sharma/Wu/Dalal 2005's
 * ~0.5–1.0 inter-observer noise floor. Promising a floor the metric
 * cannot resolve is aspirational, not falsifiable; the off-panel cool
 * cells therefore promise the **ceiling** (≤ 1.8 — `RECOGNITION_WHISPER_
 * CEILING_COOL_OFF_PANEL`) and concede the floor mechanically. Tanya
 * UIX #28's pair invariant (faithful/resonator share magnitude by design)
 * is preserved — the budget shape changes, not the magnitudes. Receipt
 * (`scripts/measure-thread-bias-deltaE.ts`) prints all six combinations
 * with a designer-facing pass/fail glyph at the tail.
 *
 * Imports `measureDeltaE2000` (and `D55_WHITE`, `D75_WHITE` for the
 * sensitivity columns) from `scripts/...` — intentional per Elon §6 (rule-
 * of-three has not fired on calibration count; the helper co-locates with
 * its caller until calibration #2 lands and earns a `lib/design/perceptual/`
 * move). Rule-of-three *has* fired *inside the helper* — three calibration
 * targets (D50/D55/D75) — so the Bradford adaptation is now parametric.
 */

import {
  __testing__,
  THREAD_BIAS_MAX_ABS_DEG,
  RECOGNITION_WHISPER_BUDGET_WARM,
  RECOGNITION_WHISPER_BUDGET_COOL,
  RECOGNITION_WHISPER_CEILING_COOL_OFF_PANEL,
} from '@/lib/design/accent-bias';
import { BRAND } from '@/lib/design/color-constants';
import {
  measureDeltaE2000,
  D55_WHITE,
  D75_WHITE,
} from '../../../scripts/measure-thread-bias-deltaE';
import type { ArchetypeKey } from '@/types/content';

const { THREAD_BIAS_BY_ARCHETYPE } = __testing__;

// ─── Spec — the two Recognition Whisper Budgets (Mike #56 / Elon §1.5) ──────

const WARM_BASELINE_HEX = BRAND.gold;     // #f0c674 — warm spine fill stop
const COOL_BASELINE_HEX = BRAND.primary;  // #7b2cbf — cool spine fill stop

/**
 * Two window shapes — `[floor, ceiling]` for on-panel cells, `{ ceiling }`
 * for the off-panel cool cells (cool × {D55, D75}). The asymmetry is the
 * honesty: `{ ceiling: 1.8 }` is the smallest one-sided shape the metric
 * can witness without over-promising on a sub-noise floor (Mike #9 §1).
 *
 * Polymorphism is a killer (Mike #9 §7 POI 9): no `whisperBudgetAt(stop)`
 * primitive at N=2 baselines × {tuple, ceiling-only} window shapes.
 * Calibration #2 (motion-JND on crossfades, or Slice 3's second surface)
 * earns the lift into `lib/design/perceptual/whisper-budgets.ts`.
 */
type Window = readonly [number, number] | { readonly ceiling: number };

/** True when the window is the on-panel `[floor, ceiling]` tuple shape. */
function hasFloor(w: Window): w is readonly [number, number] {
  return Array.isArray(w);
}

// ─── Failure-message-is-documentation (Mike §4 POI 7) ───────────────────────

/** Format the ref-white tag printed in fail messages (`D50`, `D55`, `D75`). */
function refWhiteLabel(refWhite?: readonly [number, number, number]): string {
  if (!refWhite) return 'D50';
  if (refWhite === D55_WHITE) return 'D55';
  if (refWhite === D75_WHITE) return 'D75';
  return `XYZ(${refWhite.join(',')})`;
}

/** Render a `Window` as `[floor, ceiling]` or `(−∞, ceiling]` for diagnostics. */
function windowLabel(w: Window): string {
  return hasFloor(w) ? `[${w[0]}, ${w[1]}]` : `(−∞, ${w.ceiling}]`;
}

/** True when `dE` lies inside `w` — both shapes share the same upper bound. */
function dEInside(dE: number, w: Window): boolean {
  return hasFloor(w) ? (dE >= w[0] && dE <= w[1]) : (dE <= w.ceiling);
}

/**
 * Compose the diagnostic prose printed when an archetype falls outside a
 * window. Accepts both window shapes — the printed form names the shape
 * that failed (`[floor, ceiling]` on-panel, `(−∞, ceiling]` off-panel
 * cool) so a future drift sees *which* contract broke (Mike #9 §7 POI 4
 * — failure-message-is-documentation, sub-noise floor honesty).
 */
function failMessage(
  arch: ArchetypeKey,
  bias: number,
  dE: number,
  baselineHex: string,
  window: Window,
  refWhite?: readonly [number, number, number],
): string {
  const sign = bias > 0 ? '+' : '';
  return `\n  archetype:        ${arch}` +
         `\n  --thread-bias:    ${sign}${bias}°` +
         `\n  measured ΔE2000:  ${dE.toFixed(3)}  vs ${baselineHex}  (refWhite: ${refWhiteLabel(refWhite)})` +
         `\n  expected window:  ${windowLabel(window)}  (sub-JND; signature, not status)` +
         `\n  fix: re-calibrate the ° value in app/globals.css (the SSOT truth table)` +
         `\n       and the mirror in lib/design/accent-bias.ts THREAD_BIAS_BY_ARCHETYPE.`;
}

/**
 * Assert one archetype's lean lands inside the perceptual signature
 * window for the given baseline. Parametric over `(arch, baselineHex,
 * window, refWhite?)` — the window may be a `[floor, ceiling]` tuple
 * (on-panel cells) or a `{ ceiling }` shape (off-panel cool cells where
 * the floor is honestly conceded sub-JND, Mike #9 §1 / §6).
 */
function assertWindow(
  arch: ArchetypeKey,
  baselineHex: string,
  window: Window,
  refWhite?: readonly [number, number, number],
): void {
  const bias = THREAD_BIAS_BY_ARCHETYPE[arch];
  const dE = refWhite
    ? measureDeltaE2000(baselineHex, bias, refWhite)
    : measureDeltaE2000(baselineHex, bias);
  if (!dEInside(dE, window)) {
    throw new Error(failMessage(arch, bias, dE, baselineHex, window, refWhite));
  }
  expect(dE).toBeLessThanOrEqual(hasFloor(window) ? window[1] : window.ceiling);
  if (hasFloor(window)) expect(dE).toBeGreaterThanOrEqual(window[0]);
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

// ─── §1c · Warm baseline × D55 panel (~5500K, warm-calibrated panel) ────────
//
// Mirrors §1 with `refWhite = D55_WHITE`. Same Whisper Budget literal — the
// slice asserts the *existing* contract holds across white-point drift, not
// a new contract (Mike #7 §POI 7). All five archetypes pass: the warm-side
// guard is robust under ±1000K of warm panel calibration drift.

describe('accent-bias — WARM × D55 panel sensitivity (~5500K)', () => {
  const W = RECOGNITION_WHISPER_BUDGET_WARM;
  it('deep-diver holds whisper budget on a warm-calibrated panel', () => assertWindow('deep-diver', WARM_BASELINE_HEX, W, D55_WHITE));
  it('explorer holds whisper budget on a warm-calibrated panel',   () => assertWindow('explorer',   WARM_BASELINE_HEX, W, D55_WHITE));
  it('faithful holds whisper budget on a warm-calibrated panel',   () => assertWindow('faithful',   WARM_BASELINE_HEX, W, D55_WHITE));
  it('resonator holds whisper budget on a warm-calibrated panel',  () => assertWindow('resonator',  WARM_BASELINE_HEX, W, D55_WHITE));
  it('collector holds whisper budget on a warm-calibrated panel',  () => assertWindow('collector',  WARM_BASELINE_HEX, W, D55_WHITE));
});

// ─── §1e · Warm baseline × D75 panel (~7500K, cool-calibrated panel) ────────
//
// Mirrors §1 with `refWhite = D75_WHITE`. Same Whisper Budget literal. All
// five archetypes pass: the warm-side guard survives 1000K of *cool* panel
// drift. The cool-side mirror (would-be §1f) is deliberately deferred —
// see file docblock for the decision-gate note (Mike #7 §4 footer).

describe('accent-bias — WARM × D75 panel sensitivity (~7500K)', () => {
  const W = RECOGNITION_WHISPER_BUDGET_WARM;
  it('deep-diver holds whisper budget on a cool-calibrated panel', () => assertWindow('deep-diver', WARM_BASELINE_HEX, W, D75_WHITE));
  it('explorer holds whisper budget on a cool-calibrated panel',   () => assertWindow('explorer',   WARM_BASELINE_HEX, W, D75_WHITE));
  it('faithful holds whisper budget on a cool-calibrated panel',   () => assertWindow('faithful',   WARM_BASELINE_HEX, W, D75_WHITE));
  it('resonator holds whisper budget on a cool-calibrated panel',  () => assertWindow('resonator',  WARM_BASELINE_HEX, W, D75_WHITE));
  it('collector holds whisper budget on a cool-calibrated panel',  () => assertWindow('collector',  WARM_BASELINE_HEX, W, D75_WHITE));
});

// ─── §1d · Cool baseline × D55 panel — ceiling-only off-panel window ────────
//
// Closing slice (Mike #9). The cool baseline at D55 lifts the smallest
// magnitudes (±1.5°) to ~0.698 ΔE — 0.002 below the on-panel 0.7 floor,
// inside Sharma/Wu/Dalal 2005's ~0.5–1.0 inter-observer noise. We promise
// the ceiling (≤ 1.8) and concede the floor mechanically.

describe('accent-bias — COOL × D55 panel sensitivity (off-panel ceiling)', () => {
  const W: Window = { ceiling: RECOGNITION_WHISPER_CEILING_COOL_OFF_PANEL };
  it('deep-diver holds the cool ceiling on a warm-calibrated panel', () => assertWindow('deep-diver', COOL_BASELINE_HEX, W, D55_WHITE));
  it('explorer holds the cool ceiling on a warm-calibrated panel',   () => assertWindow('explorer',   COOL_BASELINE_HEX, W, D55_WHITE));
  it('faithful holds the cool ceiling on a warm-calibrated panel',   () => assertWindow('faithful',   COOL_BASELINE_HEX, W, D55_WHITE));
  it('resonator holds the cool ceiling on a warm-calibrated panel',  () => assertWindow('resonator',  COOL_BASELINE_HEX, W, D55_WHITE));
  it('collector holds the cool ceiling on a warm-calibrated panel',  () => assertWindow('collector',  COOL_BASELINE_HEX, W, D55_WHITE));
});

// ─── §1f · Cool baseline × D75 panel — ceiling-only off-panel window ────────
//
// Closing slice (Mike #9). The cool baseline at D75 falls further: ±1.5°
// pair lands at ~0.55 ΔE — visibly sub-JND. The ceiling (≤ 1.8) still
// pins "the room never shouts" at the deepest cool-leaning OLED panel a
// stranger could plausibly own. The pair invariant (faithful/resonator
// share magnitude by design — Tanya UIX #28) is preserved by changing
// the budget shape, not the magnitudes.

describe('accent-bias — COOL × D75 panel sensitivity (off-panel ceiling)', () => {
  const W: Window = { ceiling: RECOGNITION_WHISPER_CEILING_COOL_OFF_PANEL };
  it('deep-diver holds the cool ceiling on a cool-calibrated panel', () => assertWindow('deep-diver', COOL_BASELINE_HEX, W, D75_WHITE));
  it('explorer holds the cool ceiling on a cool-calibrated panel',   () => assertWindow('explorer',   COOL_BASELINE_HEX, W, D75_WHITE));
  it('faithful holds the cool ceiling on a cool-calibrated panel',   () => assertWindow('faithful',   COOL_BASELINE_HEX, W, D75_WHITE));
  it('resonator holds the cool ceiling on a cool-calibrated panel',  () => assertWindow('resonator',  COOL_BASELINE_HEX, W, D75_WHITE));
  it('collector holds the cool ceiling on a cool-calibrated panel',  () => assertWindow('collector',  COOL_BASELINE_HEX, W, D75_WHITE));
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

  it('360° round-trip under D55 returns ΔE2000 ≈ 0 (parametric Bradford)', () => {
    // Parametric correctness witness for the ref-white change. Bradford
    // forward + inverse + cone-space scaling must compose to identity at a
    // 360° rotation (Math.sin(2π) ≠ 0 exactly, ~1e-16; but Lab pipeline
    // round-trips it back inside 1e-6). If a coefficient drifts in BFD or
    // BFD_INV, this pin catches it before any window assertion blames the
    // CSS truth table (Mike #7 §POI 6 — cheap insurance).
    expect(measureDeltaE2000(WARM_BASELINE_HEX, 360, D55_WHITE)).toBeCloseTo(0, 6);
  });

  it('stranger floor under D75 (cool baseline): 0° lean ⇒ ΔE2000 = 0', () => {
    // Cool-side closure (Mike #9 §6) — pin the stranger floor at the
    // deepest cool-leaning OLED panel a stranger could plausibly own.
    // Three-layer zero in the carrier expression guarantees this by
    // construction; the test makes the construction falsifiable.
    expect(measureDeltaE2000(COOL_BASELINE_HEX, 0, D75_WHITE)).toBe(0);
  });
});
