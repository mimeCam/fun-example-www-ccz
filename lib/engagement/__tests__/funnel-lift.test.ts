/**
 * funnel-lift — pure stats kernel: rates, lift, Wilson CI.
 *
 * The kernel has no DB and no React; this suite exercises:
 *  1. `computeRates` — n=0 ⇒ all zeros, NaN-free.
 *  2. `wilsonInterval` — boundary cases (n=0, p=0, p=1) + a textbook anchor.
 *  3. `computeCheckpointLift` — sign and verdict.
 *  4. Formatting helpers — never NaN-leak to the UI.
 */

import {
  computeRates,
  wilsonInterval,
  computeCheckpointLift,
  computeLift,
  formatPercent,
  formatPp,
} from '@/lib/engagement/funnel-lift';
import type { FunnelByArchetypeRow } from '@/lib/engagement/funnel-by-archetype';

function makeRow(over: Partial<FunnelByArchetypeRow> = {}): FunnelByArchetypeRow {
  return {
    week: '2026-17', archetype: 'deep-diver',
    landed: 0, resolved: 0, warmed: 0, keepsaked: 0, shared: 0,
    ...over,
  };
}

describe('computeRates', () => {
  it('returns all zeros when landed=0 — never NaN', () => {
    const r = computeRates(makeRow({ landed: 0 }));
    expect(r).toEqual({ resolved: 0, warmed: 0, keepsaked: 0, shared: 0 });
  });

  it('divides each checkpoint by landed', () => {
    const r = computeRates(makeRow({
      landed: 100, resolved: 80, warmed: 60, keepsaked: 25, shared: 10,
    }));
    expect(r.resolved).toBeCloseTo(0.80);
    expect(r.warmed).toBeCloseTo(0.60);
    expect(r.keepsaked).toBeCloseTo(0.25);
    expect(r.shared).toBeCloseTo(0.10);
  });
});

describe('wilsonInterval', () => {
  it('n=0 collapses to all-zero', () => {
    expect(wilsonInterval(0, 0)).toEqual({ rate: 0, low: 0, high: 0, n: 0 });
  });

  it('p=0 anchors low at 0', () => {
    const ci = wilsonInterval(0, 100);
    expect(ci.rate).toBe(0);
    expect(ci.low).toBeCloseTo(0, 10); // float epsilon ⇒ allow ~1e-18 slop
    expect(ci.high).toBeGreaterThan(0);
    expect(ci.high).toBeLessThan(0.05); // ~3.7% upper bound for 0/100
  });

  it('p=1 anchors high at 1', () => {
    const ci = wilsonInterval(100, 100);
    expect(ci.rate).toBe(1);
    expect(ci.high).toBe(1);
    expect(ci.low).toBeLessThan(1);
    expect(ci.low).toBeGreaterThan(0.95);
  });

  it('reproduces a classic Wilson textbook value (50/100)', () => {
    // 50/100, z=1.96 → CI ≈ [0.404, 0.596]
    const ci = wilsonInterval(50, 100);
    expect(ci.rate).toBe(0.5);
    expect(ci.low).toBeCloseTo(0.404, 2);
    expect(ci.high).toBeCloseTo(0.596, 2);
  });

  it('clamps numerator above n', () => {
    const ci = wilsonInterval(200, 100);
    expect(ci.rate).toBe(1);
  });
});

describe('computeCheckpointLift', () => {
  it('sign matches absolute lift', () => {
    const up = computeCheckpointLift(50, 100, 0.30);
    expect(up.absolute).toBeCloseTo(0.20, 5);
    expect(up.relative).toBeCloseTo(0.20 / 0.30, 5);
    const down = computeCheckpointLift(20, 100, 0.30);
    expect(down.absolute).toBeCloseTo(-0.10, 5);
  });

  it('verdict=signal when CI excludes the control rate', () => {
    // 80/100 vs control 0.30 — wide gap, will exclude.
    const lift = computeCheckpointLift(80, 100, 0.30);
    expect(lift.verdict).toBe('signal');
  });

  it('verdict=noise when CI overlaps the control rate', () => {
    // 31/100 vs control 0.30 — basically the same.
    const lift = computeCheckpointLift(31, 100, 0.30);
    expect(lift.verdict).toBe('noise');
  });

  it('verdict=noise when n=0', () => {
    const lift = computeCheckpointLift(0, 0, 0.30);
    expect(lift.verdict).toBe('noise');
  });

  it('relative lift = 0 when control rate is 0 — never NaN', () => {
    const lift = computeCheckpointLift(10, 100, 0);
    expect(lift.relative).toBe(0);
    expect(Number.isFinite(lift.relative)).toBe(true);
  });
});

describe('computeLift — fans across the 4 checkpoints', () => {
  it('returns one CheckpointLift per checkpoint', () => {
    const arm = makeRow({
      landed: 100, resolved: 80, warmed: 60, keepsaked: 25, shared: 10,
    });
    const out = computeLift(arm, { resolved: 0.7, warmed: 0.5, keepsaked: 0.2, shared: 0.05 });
    expect(out.resolved.absolute).toBeCloseTo(0.10, 5);
    expect(out.warmed.absolute).toBeCloseTo(0.10, 5);
    expect(out.shared.absolute).toBeCloseTo(0.05, 5);
    expect(out.keepsaked.absolute).toBeCloseTo(0.05, 5);
  });
});

describe('formatting helpers', () => {
  it('formatPercent never returns NaN', () => {
    expect(formatPercent(NaN)).toBe('—');
    expect(formatPercent(Infinity)).toBe('—');
    expect(formatPercent(0.123)).toBe('12.3%');
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('formatPp signs the absolute value', () => {
    expect(formatPp(0)).toBe('0.0 pp');
    expect(formatPp(0.034)).toBe('+3.4 pp');
    expect(formatPp(-0.012)).toBe('−1.2 pp');
  });
});
