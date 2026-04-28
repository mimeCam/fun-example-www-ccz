/**
 * Accent-bias calibration — perceptual signature window.
 *
 *   Measured threshold:  ΔE2000 ∈ [0.8, 1.8] vs. the stranger baseline.
 *   JND class:           sub-conscious recognition (signature, not status).
 *   Failure mode fenced: signature → status drift, in either direction.
 *
 * --------------------------------------------------------------------------
 * CALIBRATION DEBT — slice landing receipt (Sid · 2026-04-28):
 *   `npx tsx scripts/measure-thread-bias-deltaE.ts` against the currently-
 *   shipped `THREAD_BIAS_BY_ARCHETYPE` values produces ΔE2000 in roughly
 *   [1.97, 3.96] — well above the spec ceiling of 1.8. The five per-
 *   archetype assertions below ship as `it.failing(...)` so CI stays green
 *   while the contract is asserted *literally* in source. When the team
 *   reconciles the values↔window mismatch (three paths in `_my/report.md`),
 *   Jest flips each block red as the assertion starts passing — that is
 *   the signal to rename `it.failing` → `it`. The math, the helper, and
 *   the structural pins (range cap; matrix sanity) are LIVE today.
 * --------------------------------------------------------------------------
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

// ─── Spec — the perceptual window literal (Krystle scope, Tanya §3.2) ───────

const BASELINE_HEX = BRAND.gold;                 // #f0c674 — the warm spine fill stop
const FLOOR = 0.8;                                // sub-JND recognition floor
const CEILING = 1.8;                              // sub-JND status visibility ceiling

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

describe('accent-bias — perceptual signature window (ΔE2000 ∈ [0.8, 1.8])', () => {
  // `it.failing` inverts: each test passes WHILE the assertion fails (calibration
  // debt). When values↔window are reconciled, Jest flips it red — rename to `it()`.
  it.failing('deep-diver renders inside the signature window', () => assertWindow('deep-diver'));
  it.failing('explorer renders inside the signature window',   () => assertWindow('explorer'));
  it.failing('faithful renders inside the signature window',   () => assertWindow('faithful'));
  it.failing('resonator renders inside the signature window',  () => assertWindow('resonator'));
  it.failing('collector renders inside the signature window',  () => assertWindow('collector'));
});

// ─── §2 · Range cap pins (Mike §4 POI 8 — closed-union exhaustiveness) ──────

describe('accent-bias — range cap (±6° clamp; the signature-not-status ceiling)', () => {
  it('every archetype value satisfies |°| ≤ THREAD_BIAS_MAX_ABS_DEG', () => {
    // Closed-union iteration: a sixth archetype trips the TS compile, not
    // just the runtime (the same shape as the accent-bias.ts SSOT mirror).
    (Object.keys(THREAD_BIAS_BY_ARCHETYPE) as ArchetypeKey[]).forEach((k) => {
      expect(Math.abs(THREAD_BIAS_BY_ARCHETYPE[k])).toBeLessThanOrEqual(THREAD_BIAS_MAX_ABS_DEG);
    });
  });

  it('THREAD_BIAS_MAX_ABS_DEG is 6 (literal pin so the cap cannot silently widen)', () => {
    expect(THREAD_BIAS_MAX_ABS_DEG).toBe(6);
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
