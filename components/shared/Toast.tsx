/**
 * Toast — the 6th shared primitive's visible surface.
 *
 * Portal-mounted pill, position:fixed, single instance. Owns a four-state
 * phase machine isomorphic to `useThreshold`'s (`hidden → entering →
 * shown → leaving → hidden`). The host (`<ToastHost>`) drives the slot;
 * this component renders one phase of one slot.
 *
 * Locked decisions (do not parameterise):
 *  - Anchor: bottom-right desktop, bottom-center mobile (Mike §6.5 —
 *    button-anchor deferred to follow-up sprint).
 *  - Dwell: 2000 ms confirm / 3000 ms warn, fixed (Tanya §5.2).
 *  - Surface: `bg-foreground text-background` — the dark theme's honest
 *    inverse pill (light surface, dark ink). One posture, no warmth.
 *  - Shadow: `shadow-sys-float` — depth event, not a glow event.
 *  - Radius: `rounded-sys-medium` — the held / confirmation rung.
 *  - Padding: `px-sys-4 py-sys-3` — one beat, no overflow.
 *
 * Six `:exempt` comments across `clipboard-utils.ts` and `export-utils.ts`
 * disappear as a byproduct: the toast now lives INSIDE React's tree, so
 * every `var(--sys-*)` resolves at paint time. The receipt is the test;
 * the feel is the product (Tanya §11, Mike §6.10).
 *
 * Credits: Mike K. (phase-machine isomorphism with `useThreshold`, the
 * single-host portal mount), Tanya D. (UX spec — surface posture, ARIA,
 * fixed-dwell discipline, the no-glow / no-warmth carve-outs), Elon M.
 * (mount-physics teardown — the entire reason this primitive exists),
 * Paul K. (the "the room speaks once, then listens" contract).
 */

'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MOTION, MOTION_REDUCED_MS, EASE } from '@/lib/design/motion';
import { useReducedMotionFlag } from '@/lib/utils/reduced-motion';
import { type ToastMsg, type ToastIntent } from '@/lib/sharing/toast-store';

// ─── Phase machine ─────────────────────────────────────────────────────────

/** Four-state lifecycle. `hidden` ⇒ portal renders nothing for the slot. */
export type ToastPhase = 'hidden' | 'entering' | 'shown' | 'leaving';

interface ToastProps {
  /** The slot value. Owned by the host. */
  msg: ToastMsg;
  /** Called once the leaving animation has settled — host clears the slot. */
  onDismissed: () => void;
}

// ─── Visual constants — every token routes through the design system ──────

/**
 * Surface composition — uses only ledger tokens via Tailwind aliases:
 *   `rounded-sys-medium` → `--sys-radius-medium`
 *   `shadow-sys-float`   → `--sys-elev-float`
 *   `px-sys-4 py-sys-3`  → `--sys-space-4` / `--sys-space-3`
 *   `text-sys-caption`   → `--sys-text-caption`
 *   `font-sys-accent`    → `--sys-weight-accent`
 *   `bg-foreground`      → `--token-foreground` (light, the inverse)
 *   `text-background`    → `--token-bg`         (dark, on inverse)
 *
 * Z-stacking honors the existing `z-sys-toast` rung (60). The host carries
 * `aria-live="polite"`; this surface is silent at the ARIA layer.
 */
// // reader-invariant:forced-colors — `bg-foreground` / `text-background` /
// `shadow-sys-float` / `border-fog/15` all strip by spec. Replace with a
// `1px solid CanvasText` edge on `Canvas` so the pill still reads as a
// surface, not a floating string (Tanya UX #53 §3.6).
const SURFACE_BASE =
  'rounded-sys-medium shadow-sys-float px-sys-4 py-sys-3 ' +
  'text-sys-caption font-sys-accent ' +
  'bg-foreground text-background select-none ' +
  'max-w-[18rem] w-max ' +
  'border border-fog/15 ' +
  'forced-colors:border-[CanvasText] forced-colors:bg-[Canvas] ' +
  'forced-colors:text-[CanvasText] forced-colors:shadow-none';

/**
 * Anchor + flip rules (Tanya §3.1 fallback path):
 *  desktop: bottom-right with `--sys-space-7` inset.
 *  mobile : bottom-center with `--sys-space-5` inset; never wider than
 *           viewport minus `--sys-space-7`.
 * Honors a 16 px left-edge exclusion for the Golden Thread (`pl-sys-5`).
 */
const POSITION_BASE =
  'fixed z-sys-toast pointer-events-none ' +
  // desktop: bottom-right
  'sm:right-sys-7 sm:bottom-sys-7 sm:left-auto sm:translate-x-0 ' +
  // mobile: bottom-center
  'left-1/2 -translate-x-1/2 bottom-sys-5 pl-sys-5 pr-sys-5';

// ─── Duration helpers — pure, reduced-motion aware ─────────────────────────

function enterDurationMs(reduced: boolean): number {
  return reduced ? MOTION_REDUCED_MS : MOTION.enter;
}

function leaveDurationMs(reduced: boolean): number {
  return reduced ? MOTION_REDUCED_MS : MOTION.hover;
}

/** Inline style: drives entrance/exit via animation-duration only (no new keyframe duration constants). */
function phaseStyle(phase: ToastPhase, reduced: boolean): CSSProperties | undefined {
  if (phase === 'entering') {
    return {
      animationName: 'toastBloom',
      animationDuration: `${enterDurationMs(reduced)}ms`,
      animationTimingFunction: EASE.out,
      animationFillMode: 'both',
    };
  }
  if (phase === 'leaving') {
    return {
      animationName: 'toastFade',
      animationDuration: `${leaveDurationMs(reduced)}ms`,
      animationTimingFunction: EASE.sustain,
      animationFillMode: 'forwards',
    };
  }
  return undefined;
}

/** Tone → muted intent hint for screen readers. Visual is identical for both. */
function intentToneClass(intent: ToastIntent): string {
  // Same pill, same shadow — no green/red split (Tanya §4.3).
  return intent === 'warn' ? 'opacity-quiet' : '';
}

// ─── Phase reducer (test-friendly: pure transitions) ───────────────────────

/** Clamp duration so cleanup is always defined; returns ms. Pure. */
function clampDwellMs(ms: number): number {
  return Math.max(MOTION_REDUCED_MS, Math.min(ms, 10_000));
}

// ─── The component ─────────────────────────────────────────────────────────

/**
 * Phase progression:
 *  msg arrives  → 'entering'                 (animation plays)
 *  anim end     → 'shown'                    (start dwell timer)
 *  dwell end    → 'leaving'                  (exit animation plays)
 *  anim end     → 'hidden' + onDismissed()   (host nulls the slot)
 *
 * If the slot's `id` changes mid-dwell (replacement), the parent host
 * remounts this component (key on id), which is the cleanest path —
 * no in-component crossfade state machine, no stale timers (Mike §6.2).
 */
export function Toast({ msg, onDismissed }: ToastProps): JSX.Element {
  const reduced = useReducedMotionFlag();
  const [phase, setPhase] = useState<ToastPhase>('entering');
  useDwellTimer(phase, msg.durationMs, () => setPhase('leaving'));
  return (
    <div className={POSITION_BASE} aria-hidden={phase === 'leaving' ? 'true' : undefined}>
      <div
        className={`${SURFACE_BASE} pointer-events-auto ${intentToneClass(msg.intent)}`}
        style={phaseStyle(phase, reduced)}
        onAnimationEnd={() => onPhaseAnimationEnd(phase, setPhase, onDismissed)}
        data-testid="toast-surface"
      >
        {msg.message}
      </div>
    </div>
  );
}

// ─── Tiny effect helpers — keep the component readable ─────────────────────

/** Run dwell timer only while in 'shown'. Cleared on phase change / unmount. */
function useDwellTimer(
  phase: ToastPhase,
  durationMs: number,
  onElapsed: () => void,
): void {
  const onElapsedRef = useRef(onElapsed);
  onElapsedRef.current = onElapsed;
  useEffect(() => {
    if (phase !== 'shown') return undefined;
    const id = window.setTimeout(() => onElapsedRef.current(), clampDwellMs(durationMs));
    return () => window.clearTimeout(id);
  }, [phase, durationMs]);
}

/** Drive the phase transition that the animation just completed. Pure-ish. */
function onPhaseAnimationEnd(
  phase: ToastPhase,
  setPhase: (p: ToastPhase) => void,
  onDismissed: () => void,
): void {
  if (phase === 'entering') setPhase('shown');
  else if (phase === 'leaving') onDismissed();
}
