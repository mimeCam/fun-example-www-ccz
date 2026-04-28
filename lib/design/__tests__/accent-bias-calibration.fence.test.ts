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
 * Panel white-point sensitivity (Mike #7 — White-Point Sensitivity slice):
 * the §1c / §1e mirrored columns ask the falsifiable question — does the
 * ±3° geometry guard hold under ±1000K of panel white-point drift, on the
 * warm baseline? Yes: all five archetypes stay inside `[0.8, 1.8]` at D55
 * (~5500K, warm panel) and D75 (~7500K, cool panel). The cool-baseline
 * mirrors (would-be §1d / §1f) are *deliberately deferred* per Mike #7 §4
 * decision gate — under D55 the resonator (-1.5°) lands at ~0.698 ΔE
 * (0.002 below the 0.7 cool floor, inside Sharma/Wu/Dalal noise), and
 * under D75 the ±1.5° pair falls to ~0.55 (visibly below floor). Recovery
 * by single-° tweak conflicts with Tanya UIX #28's pair invariant
 * (faithful/resonator share magnitude by design); the cool-side drift
 * earns its own re-scope, not a preemptive cap tightening (Elon §4-4).
 * Receipt (`scripts/measure-thread-bias-deltaE.ts`) prints all six
 * combinations so the cool drift is visible to designers running the CLI.
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

// ─── Failure-message-is-documentation (Mike §4 POI 7) ───────────────────────

/** Format the ref-white tag printed in fail messages (`D50`, `D55`, `D75`). */
function refWhiteLabel(refWhite?: readonly [number, number, number]): string {
  if (!refWhite) return 'D50';
  if (refWhite === D55_WHITE) return 'D55';
  if (refWhite === D75_WHITE) return 'D75';
  return `XYZ(${refWhite.join(',')})`;
}

/**
 * Compose the diagnostic prose printed when an archetype falls outside a
 * window. The baseline + window + ref-white tag are part of the message
 * so a future drift names *which* (baseline, refWhite) tuple failed
 * (Mike #56 §POI 3 / Mike #7 §POI 5 — the diagnostic prints its own
 * context, including panel white-point when relevant).
 */
function failMessage(
  arch: ArchetypeKey,
  bias: number,
  dE: number,
  baselineHex: string,
  window: readonly [number, number],
  refWhite?: readonly [number, number, number],
): string {
  const sign = bias > 0 ? '+' : '';
  const [floor, ceiling] = window;
  return `\n  archetype:        ${arch}` +
         `\n  --thread-bias:    ${sign}${bias}°` +
         `\n  measured ΔE2000:  ${dE.toFixed(3)}  vs ${baselineHex}  (refWhite: ${refWhiteLabel(refWhite)})` +
         `\n  expected window:  [${floor}, ${ceiling}]  (sub-JND; signature, not status)` +
         `\n  fix: re-calibrate the ° value in app/globals.css (the SSOT truth table)` +
         `\n       and the mirror in lib/design/accent-bias.ts THREAD_BIAS_BY_ARCHETYPE.`;
}

/**
 * Assert one archetype's lean lands inside the perceptual signature
 * window for the given baseline. Parametric over `(arch, baselineHex,
 * window, refWhite?)` — `refWhite` defaults to D50 (today's behavior),
 * D55/D75 invocations witness panel white-point sensitivity (Mike #7).
 */
function assertWindow(
  arch: ArchetypeKey,
  baselineHex: string,
  window: readonly [number, number],
  refWhite?: readonly [number, number, number],
): void {
  const bias = THREAD_BIAS_BY_ARCHETYPE[arch];
  const dE = refWhite
    ? measureDeltaE2000(baselineHex, bias, refWhite)
    : measureDeltaE2000(baselineHex, bias);
  const [floor, ceiling] = window;
  if (dE < floor || dE > ceiling) {
    throw new Error(failMessage(arch, bias, dE, baselineHex, window, refWhite));
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
});
