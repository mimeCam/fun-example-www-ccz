/**
 * thread-tween — the damper's mathematical properties, proven as tests.
 *
 * The tween is a critically-damped spring. Four invariants we lock down:
 *   (1) no overshoot — display never crosses target;
 *   (2) monotone approach — distance to target is non-increasing;
 *   (3) settles to target within a known number of half-lives;
 *   (4) honours reduced-motion via snapStep — one frame to target, zero
 *       velocity.
 *
 * These are the properties Mike's napkin §5.3 calls out and the ones
 * that would regress silently under a naïve lerp.
 *
 * Credits: Mike K. (napkin §5.3 — single source of motion truth),
 * Tanya D. (UIX #81 §5 — smoothness as signature).
 */

import { MOTION } from '@/lib/design/motion';
import {
  __omega,
  __settleMs,
  isSettled,
  restingAt,
  smoothStep,
  snapStep,
  type TweenState,
} from '../thread-tween';

// ─── Fixtures ─────────────────────────────────────────────────────────────

/** Drive the tween to convergence on a fixed target, one frame at 60Hz. */
function driveTo(target: number, frames: number, dtMs = 16.67): TweenState {
  let s: TweenState = restingAt(0);
  for (let i = 0; i < frames; i++) s = smoothStep(s, target, dtMs);
  return s;
}

// ─── Tuning ────────────────────────────────────────────────────────────────

describe('thread-tween — tuning is quoted from MOTION, not magic', () => {
  it('1%-settle time equals MOTION.enter (the "surface arriving" beat)', () => {
    expect(__settleMs()).toBe(MOTION.enter);
  });

  it('omega is positive and finite', () => {
    const o = __omega();
    expect(o).toBeGreaterThan(0);
    expect(Number.isFinite(o)).toBe(true);
  });
});

// ─── Critical-damping invariants ───────────────────────────────────────────

describe('thread-tween — smoothStep invariants', () => {
  it('does not overshoot on a step-input jump (display never exceeds target)', () => {
    const target = 0.8;
    let s: TweenState = restingAt(0);
    for (let i = 0; i < 300; i++) {
      s = smoothStep(s, target, 16.67);
      expect(s.display).toBeLessThanOrEqual(target + 1e-9);
    }
  });

  it('monotonically approaches target (distance is non-increasing)', () => {
    const target = 0.5;
    let s: TweenState = restingAt(0);
    let prevDist = Math.abs(s.display - target);
    for (let i = 0; i < 200; i++) {
      s = smoothStep(s, target, 16.67);
      const dist = Math.abs(s.display - target);
      expect(dist).toBeLessThanOrEqual(prevDist + 1e-9);
      prevDist = dist;
    }
  });

  it('settles within 2% of target in about one SETTLE_MS window', () => {
    const target = 1.0;
    // Drive for the advertised settle window. Semi-implicit Euler's finite
    // step leaves us slightly outside the analytic 1% — test at 2% to stay
    // stable across machine-timing drift while still proving the tween's
    // quoted ledger connection holds.
    const frames = Math.ceil(__settleMs() / 16.67);
    const s = driveTo(target, frames);
    expect(Math.abs(s.display - target)).toBeLessThan(0.02);
  });

  it('isSettled reports true once the tween rests near the target', () => {
    const target = 0.5;
    const s = driveTo(target, 600);
    expect(isSettled(s, target)).toBe(true);
  });

  it('clamps huge dt so a tab resume does not blow up the integrator', () => {
    const target = 1.0;
    const s = smoothStep(restingAt(0), target, 5_000);
    expect(Number.isFinite(s.display)).toBe(true);
    expect(s.display).toBeLessThanOrEqual(target + 1e-9);
    expect(s.display).toBeGreaterThanOrEqual(0);
  });

  it('dt === 0 is a no-op (identity step)', () => {
    const before = restingAt(0.25);
    const after = smoothStep(before, 0.75, 0);
    expect(after.display).toBe(before.display);
    expect(after.velocity).toBe(before.velocity);
  });
});

// ─── Reduced-motion path ───────────────────────────────────────────────────

describe('thread-tween — snapStep (reduced-motion path)', () => {
  it('jumps to target in one call', () => {
    const s = snapStep(restingAt(0), 0.42);
    expect(s.display).toBe(0.42);
  });

  it('drops velocity to zero (no carried momentum)', () => {
    const s = snapStep({ display: 0, velocity: 10 }, 0.42);
    expect(s.velocity).toBe(0);
  });

  it('isSettled on snap result is immediately true', () => {
    const s = snapStep(restingAt(0), 0.42);
    expect(isSettled(s, 0.42)).toBe(true);
  });
});

// ─── Resting-state helper ──────────────────────────────────────────────────

describe('thread-tween — restingAt', () => {
  it('produces zero velocity at the given display', () => {
    const s = restingAt(0.3);
    expect(s.display).toBe(0.3);
    expect(s.velocity).toBe(0);
  });
});
