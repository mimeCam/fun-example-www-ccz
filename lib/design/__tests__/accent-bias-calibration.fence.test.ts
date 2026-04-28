/**
 * Accent-bias calibration — Recognition Whisper Budget.
 *
 *   Measured threshold:  ΔE2000 ∈ [0.8, 1.8] vs. the stranger baseline.
 *   JND class:           sub-conscious recognition (signature, not status).
 *   Failure mode fenced: signature → status drift, in either direction.
 *
 * The window literal (`RECOGNITION_WHISPER_BUDGET = [0.8, 1.8]`) is the
 * felt-experience contract: above 1.8 ΔE the lean becomes status (the
 * returner *notices*, recognition collapses); below 0.8 ΔE the lean is
 * indistinguishable from byte-noise — the room never leaned at all
 * (Paul / Jason — #92; Tanya UIX #92 §1).
 *
 * Calibration receipt (#92 — `THREAD_BIAS_MAX_ABS_DEG: 6 → 3`, five
 * magnitudes recalibrated from ±[3..6]° to ±[1.5..2.5]°): every archetype
 * now lands inside the window with margin both sides; the five per-
 * archetype assertions below are LIVE (`it`, not `it.failing`).
 *
 * Imports `measureDeltaE2000` from `scripts/...` — intentional per Elon
 * §6 (rule-of-three has not fired; the helper co-locates with its caller
 * until calibration #2 lands and earns a `lib/design/perceptual/` move).
 */

import { __testing__, THREAD_BIAS_MAX_ABS_DEG } from '@/lib/design/accent-bias';
import { BRAND } from '@/lib/design/color-constants';
import { measureDeltaE2000 } from '../../../scripts/measure-thread-bias-deltaE';
import type { ArchetypeKey } from '@/types/content';

const { THREAD_BIAS_BY_ARCHETYPE } = __testing__;

// ─── Spec — the Recognition Whisper Budget (Tanya §6 / Jason / Paul #92) ────

const BASELINE_HEX = BRAND.gold;                 // #f0c674 — the warm spine fill stop

/**
 * The perceptual whisper window: a returner's lean must measure inside
 * `[0.8, 1.8]` ΔE2000 against the stranger baseline. Above 1.8 the lean
 * becomes status (the room shouts); below 0.8 the lean is byte-noise
 * (the room never leaned). One named constant — `[FLOOR, CEILING]` are
 * its tuple positions, kept as locals so the failure prose stays
 * literal-readable.
 */
const RECOGNITION_WHISPER_BUDGET: readonly [number, number] = [0.8, 1.8];
const [FLOOR, CEILING] = RECOGNITION_WHISPER_BUDGET;

// ─── Failure-message-is-documentation (Mike §4 POI 7) ───────────────────────

/** Compose the diagnostic prose printed when an archetype falls outside the window. */
function failMessage(arch: ArchetypeKey, bias: number, dE: number): string {
  const sign = bias > 0 ? '+' : '';
  return `\n  archetype:        ${arch}` +
         `\n  --thread-bias:    ${sign}${bias}°` +
         `\n  measured ΔE2000:  ${dE.toFixed(3)}  vs ${BASELINE_HEX}` +
         `\n  expected window:  [${FLOOR}, ${CEILING}]  (sub-JND; signature, not status)` +
         `\n  fix: re-calibrate the ° value in app/globals.css (the SSOT truth table)` +
         `\n       and the mirror in lib/design/accent-bias.ts THREAD_BIAS_BY_ARCHETYPE.`;
}

/** Assert one archetype's lean lands inside the perceptual signature window. */
function assertWindow(arch: ArchetypeKey): void {
  const bias = THREAD_BIAS_BY_ARCHETYPE[arch];
  const dE = measureDeltaE2000(BASELINE_HEX, bias);
  if (dE < FLOOR || dE > CEILING) throw new Error(failMessage(arch, bias, dE));
  expect(dE).toBeGreaterThanOrEqual(FLOOR);
  expect(dE).toBeLessThanOrEqual(CEILING);
}

// ─── §1 · Five named per-archetype window assertions (Mike §4 POI 5) ────────

describe('accent-bias — RECOGNITION_WHISPER_BUDGET (ΔE2000 ∈ [0.8, 1.8])', () => {
  it('deep-diver renders inside the whisper budget', () => assertWindow('deep-diver'));
  it('explorer renders inside the whisper budget',   () => assertWindow('explorer'));
  it('faithful renders inside the whisper budget',   () => assertWindow('faithful'));
  it('resonator renders inside the whisper budget',  () => assertWindow('resonator'));
  it('collector renders inside the whisper budget',  () => assertWindow('collector'));
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

  it('THREAD_BIAS_MAX_ABS_DEG is 3 (cap and whisper-budget agree at the gold stop)', () => {
    // 3° × ΔE/° ≈ 0.66 ≈ 1.98 ΔE — the cap can no longer mechanically
    // permit a value that violates the perceptual ceiling at the warmest
    // baseline. One source of truth in degrees, mechanically enforced.
    expect(THREAD_BIAS_MAX_ABS_DEG).toBe(3);
  });
});

// ─── §3 · Matrix-sanity pins on the helper this fence depends on ────────────

describe('accent-bias — measureDeltaE2000 helper sanity', () => {
  it('stranger floor: 0° lean produces ΔE2000 = 0 (byte-equal pixels)', () => {
    // Tanya §7 acceptance #1 — stranger ≡ today, byte-identical.
    expect(measureDeltaE2000(BASELINE_HEX, 0)).toBe(0);
  });

  it('360° round-trip: a full-wheel rotation returns ΔE2000 ≈ 0 (matrix sanity)', () => {
    expect(measureDeltaE2000(BASELINE_HEX, 360)).toBeCloseTo(0, 6);
  });

  it('neutral gray is invariant under hue-rotate (Δa* = Δb* = 0)', () => {
    // Hue-rotate has zero effect on grayscale pixels; the matrix is
    // luminance-preserving by construction. Independent witness for the
    // CSS-spec matrix coefficients (Mike §4 POI 2).
    expect(measureDeltaE2000('#888888', 6)).toBeCloseTo(0, 6);
  });
});
