/**
 * thread-tween — critically-damped tween from raw depth → display depth.
 *
 * The IntersectionObserver path quantizes scroll to 5% steps; the RAF
 * driver publishes the continuous target. This tween is the bridge —
 * it smooths the last-mile delivery without introducing the lag of a
 * CSS `transition: height` fight between the driver and the browser.
 *
 * Critical damping (ζ = 1) guarantees: no overshoot, no oscillation,
 * fastest return-to-target within those two constraints. Exactly what
 * the Thread wants — the fill climbs, it never wobbles.
 *
 * The natural frequency ω is derived from the Motion ledger's `enter`
 * beat (300ms) so the tween's half-life kinship with the rest of the
 * site is visible in code, not a magic number. MOTION owns time; the
 * tween is a reader, not an author.
 *
 * Reduced-motion: the driver swaps in the `snapStep` path (see
 * `thread-modes.ts`) — no tween, raw depth copied to display. One
 * subscriber surface, two step functions — polymorphism, the killer.
 *
 * Credits: Mike K. (napkin §4 — 80 LOC tween module; §5.5 — velocity
 * for free), Tanya D. (UIX #81 §5.4 — the "slow-to-cool" asymmetry
 * is expressed here as: smooth tween on warm-up AND cool-down, same
 * critical-damping curve — no separate cooldown beat needed).
 */

import { MOTION } from '@/lib/design/motion';

// ─── Tuning — ω derived from MOTION.enter, no magic numbers ────────────────

/**
 * Target settle time (ms) for the tween to reach within 1% of target
 * from rest. Quoted from the Motion ledger's `enter` beat — the
 * "surface arriving" cadence. At ζ=1, for a 2nd-order system with zero
 * initial velocity, t₁% = K₀₁/ω where K₀₁ ≈ 6.64 is a physical constant
 * of the critical-damping solution (1+ωt)e^(-ωt) = 0.01. We name it
 * plainly rather than let it read as a magic number.
 */
const SETTLE_MS = MOTION.enter;

/** Critical-damping time-to-1% constant. Physics, not site-specific. */
const K01 = 6.6384;

/** Natural angular frequency for critical damping, rad/s. Derived, pure. */
const OMEGA = K01 / (SETTLE_MS / 1000);

/**
 * Maximum integrator sub-step (ms). Semi-implicit Euler on a critical
 * spring becomes oscillatory once ω·dt grows past 1; we hold the
 * sub-step comfortably below that ceiling (half the limit). Derived
 * from the same ω as the tween itself — numerical-stability knob,
 * not a ledger beat. dt_max = 0.5 / ω = 0.5 × SETTLE_MS / K01 ms.
 */
const SUBSTEP_MS = (0.5 * SETTLE_MS) / K01;

/** Total simulated dt is hard-capped so tab-resume can't spin forever. */
const MAX_DT_MS = 1000;

// ─── Public state ──────────────────────────────────────────────────────────

/** The tween's two-scalar state. Position + velocity, that's it. */
export interface TweenState {
  display: number;   // current shown depth, 0..1
  velocity: number;  // d(display)/dt, 1/s
}

/** Canonical at-rest state. Reused by driver + tests. Pure. */
export function restingAt(value: number): TweenState {
  return { display: value, velocity: 0 };
}

// ─── Core step ─────────────────────────────────────────────────────────────

/**
 * One semi-implicit Euler step at a sub-step interval `dt` (seconds).
 * Pure, ≤ 10 LOC. Semi-implicit means velocity updates first, then
 * position uses the new velocity — stable against mild overshoot.
 */
function microStep(state: TweenState, target: number, dt: number): TweenState {
  const offset = state.display - target;
  const accel = -2 * OMEGA * state.velocity - OMEGA * OMEGA * offset;
  const velocity = state.velocity + accel * dt;
  const display = state.display + velocity * dt;
  return { display, velocity };
}

/**
 * Advance the tween a whole frame's worth of time. Large dt is
 * subdivided into `SUBSTEP_MS`-sized micro-steps so a tab resume with
 * a multi-hundred-ms gap integrates without overshoot. Pure, ≤ 10 LOC.
 */
export function smoothStep(state: TweenState, target: number, dtMs: number): TweenState {
  const clamped = Math.min(MAX_DT_MS, Math.max(0, dtMs));
  if (clamped === 0) return state;
  const subCount = Math.max(1, Math.ceil(clamped / SUBSTEP_MS));
  const subDt = clamped / subCount / 1000;
  let s = state;
  for (let i = 0; i < subCount; i++) s = microStep(s, target, subDt);
  return s;
}

/** Reduced-motion path: jump to target, drop velocity. Pure. */
export function snapStep(_state: TweenState, target: number): TweenState {
  return { display: target, velocity: 0 };
}

// ─── Observables ───────────────────────────────────────────────────────────

/**
 * True iff |display − target| < epsilon AND |velocity| < epsilon. Pure.
 * Used by the driver to know when it can park RAF (no subscribers starve,
 * we just stop re-publishing zeros). One-pixel-at-1920 ≈ 5e-4, so 1e-4
 * is comfortably sub-pixel across any reasonable viewport.
 */
export function isSettled(state: TweenState, target: number, epsilon = 1e-4): boolean {
  return Math.abs(state.display - target) < epsilon
      && Math.abs(state.velocity) < epsilon;
}

/** Exposed for tests — the ω derived from MOTION.enter. Pure. */
export function __omega(): number {
  return OMEGA;
}

/** Exposed for tests — the 1%-settle time (ms) quoted from MOTION.enter. Pure. */
export function __settleMs(): number {
  return SETTLE_MS;
}
