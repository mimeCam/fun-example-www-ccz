/**
 * ThreadDriver — single-RAF, passive-scroll, pub/sub depth publisher.
 *
 * One publisher, N subscribers. One scroll listener on window. One RAF
 * loop. Every consumer of continuous Thread depth (the fill, a future
 * ceremony damper, the dev overlay) plugs into the same port:
 *
 *     subscribe((state) => void)  // ThreadState = { depth, velocity, mode }
 *
 * The driver owns the scroll listener, computes the normalized depth
 * (0..1, sub-pixel), runs the critical-damped tween, and broadcasts the
 * result every frame a subscriber is present. When the last subscriber
 * unsubscribes, the RAF stops, the listener is removed, and `window`
 * goes back to paying zero cost.
 *
 * Architectural contract (Mike K. napkin §2 + §5):
 *   - NOT a React component. Plain module, client-side singleton.
 *   - NO React state on the scroll path. Subscribers write to the DOM
 *     (CSS vars, aria attributes) directly.
 *   - ONE scroll listener, `{ passive: true }`. ONE RAF. No setTimeout.
 *   - ONE truth source for Thread depth. `useScrollDepth` still owns
 *     the `isReading` / `isFinished` gates — we only replace the
 *     continuous scalar.
 *
 * Credits: Mike K. (architect napkin — the whole shape, every section),
 * Tanya D. (UIX #81 §5 — smoothness as the signature polish).
 */

import { MOTION } from '@/lib/design/motion';
import { readReducedMotion, subscribeReducedMotion } from '@/lib/utils/reduced-motion';
import {
  DEFAULT_MODE,
  isSnap,
  resolveMode,
  type ThreadMode,
} from './thread-modes';
import {
  isSettled,
  restingAt,
  smoothStep,
  snapStep,
  type TweenState,
} from './thread-tween';

// ─── Public surface ────────────────────────────────────────────────────────

/** A single tick's broadcast. One shape for every subscriber. Stable. */
export interface ThreadState {
  /** Normalized depth 0..1, sub-pixel precision. */
  depth: number;
  /** d(depth)/dt, 1/s. Positive = scrolling down. */
  velocity: number;
  /** Current driver posture. Resolved from reduced-motion. */
  mode: ThreadMode;
}

/** Every subscriber is the same shape. Polymorphism = killer. */
export type ThreadSubscriber = (state: ThreadState) => void;

/** Unsubscribe handle; idempotent, safe to call after driver teardown. */
export type Unsubscribe = () => void;

// ─── Module-local state ────────────────────────────────────────────────────

const subs = new Set<ThreadSubscriber>();
let mode: ThreadMode = DEFAULT_MODE;
let tween: TweenState = restingAt(0);
let rawTarget = 0;
let lastFrameMs = 0;
let rafId: number | null = null;
let motionUnsub: (() => void) | null = null;
let scrollAttached = false;

/** Latest tick's snapshot — served to late subscribers so they don't flash 0. */
let latest: ThreadState = { depth: 0, velocity: 0, mode };

// ─── Raw scroll read (pure, env-guarded) ───────────────────────────────────

/** Normalized 0..1 target. Pure read of the viewport. Returns 1 on short pages. */
function readRawTarget(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 0;
  const el = document.documentElement;
  const scrollable = el.scrollHeight - window.innerHeight;
  if (scrollable <= 0) return 1;
  return Math.max(0, Math.min(1, window.scrollY / scrollable));
}

// ─── Listener wiring (each ≤ 10 LOC) ───────────────────────────────────────

function onScroll(): void {
  rawTarget = readRawTarget();
  ensureLoop();
}

function attachListeners(): void {
  if (scrollAttached || typeof window === 'undefined') return;
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  motionUnsub = subscribeReducedMotion((flag) => { mode = resolveMode(flag); });
  scrollAttached = true;
}

function detachListeners(): void {
  if (!scrollAttached || typeof window === 'undefined') return;
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onScroll);
  if (motionUnsub) motionUnsub();
  motionUnsub = null;
  scrollAttached = false;
}

// ─── RAF loop (each ≤ 10 LOC) ──────────────────────────────────────────────

function step(nowMs: number): void {
  const dt = lastFrameMs === 0 ? 0 : nowMs - lastFrameMs;
  lastFrameMs = nowMs;
  tween = isSnap(mode) ? snapStep(tween, rawTarget) : smoothStep(tween, rawTarget, dt);
  publish(tween.display, dt === 0 ? 0 : tween.velocity);
  if (isSettled(tween, rawTarget) && !isSnap(mode)) { rafId = null; lastFrameMs = 0; return; }
  rafId = requestAnimationFrame(step);
}

function ensureLoop(): void {
  if (rafId !== null || typeof window === 'undefined') return;
  lastFrameMs = 0;
  rafId = requestAnimationFrame(step);
}

function stopLoop(): void {
  if (rafId !== null && typeof window !== 'undefined') cancelAnimationFrame(rafId);
  rafId = null;
  lastFrameMs = 0;
}

// ─── Pub/sub (each ≤ 10 LOC) ───────────────────────────────────────────────

function publish(depth: number, velocity: number): void {
  latest = { depth, velocity, mode };
  subs.forEach((s) => s(latest));
}

/**
 * Subscribe to Thread state updates. Returns an unsubscribe fn. The first
 * subscriber lazy-attaches listeners + kicks the loop; the last unsubscribe
 * tears them down. The new subscriber receives the latest snapshot
 * synchronously so it never paints a stale 0.
 */
export function subscribe(fn: ThreadSubscriber): Unsubscribe {
  if (subs.size === 0) { attachListeners(); rawTarget = readRawTarget(); ensureLoop(); }
  subs.add(fn);
  fn(latest);
  return () => { subs.delete(fn); if (subs.size === 0) { stopLoop(); detachListeners(); } };
}

/** Read the latest snapshot without subscribing. Pure read. */
export function peek(): ThreadState {
  return latest;
}

// ─── Test hooks (dev-only; tree-shakeable) ─────────────────────────────────

/** Reset all driver state. For tests only. */
export function __resetDriverForTests(): void {
  stopLoop();
  detachListeners();
  subs.clear();
  mode = DEFAULT_MODE;
  tween = restingAt(0);
  rawTarget = 0;
  latest = { depth: 0, velocity: 0, mode };
}

/** Read current subscriber count. For tests only. */
export function __subscriberCountForTests(): number {
  return subs.size;
}

/** Seed the mode from reduced-motion probe without subscribing. For tests. */
export function __syncModeForTests(): ThreadMode {
  mode = resolveMode(readReducedMotion());
  return mode;
}

/** Quoted from MOTION so the test locks the wiring, not a literal. */
export const __MOTION_HALF_LIFE = MOTION.enter;
