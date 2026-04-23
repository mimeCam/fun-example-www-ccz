/**
 * SuspenseFade — the 7th shared primitive: a sealed `<Suspense>` wrapper
 * that runs the content-enter crossfade the moment the fallback skeleton
 * is replaced by streamed content.
 *
 *   <SuspenseFade fallback={<Skeleton variant="card" className="h-40" />}>
 *     <AsyncDataChunk />
 *   </SuspenseFade>
 *
 * The whole grammar: one wrapper, one CSS hook (`data-sys-enter="fade"`),
 * one sealed Skeleton-handoff composition (`MOTION.crossfade × ALPHA.muted
 * → 1`). Chrome yields to data the moment data arrives; data arrives with
 * a 120 ms softening. No phase-lock, no global clock, no added latency.
 *
 * Why this shape (Mike K. tech-lead call):
 *   • A second concern (the soft fade) belongs at a single seam — here.
 *     Without this primitive, every consumer hand-rolls its own fade and
 *     the discipline rots within three PRs.
 *   • Phase-locked valley handoff was killed for cause: up to 900 ms of
 *     post-arrival linger for a sub-threshold opacity delta, plus a new
 *     primitive (global clock) the Skeleton ledger is sealed against.
 *   • The fade is a *composition* of existing sealed ledgers (Motion +
 *     Alpha + Skeleton). It earns no new beat, no new rung, no 9th ledger.
 *
 * Two props, sealed. No `duration`, no `ease`, no `from`/`to`, no `tone`,
 * no `disabled`, no per-call className — escape hatches re-introduce the
 * polymorphism this primitive exists to prevent. If a future surface
 * needs a different enter beat, compose a *new* `data-sys-enter` value
 * in `app/globals.css` behind its own sealed composition (Mike §4 #4).
 *
 * Reduced-motion: piggybacks on the site-wide `prefers-reduced-motion:
 * reduce` block in `globals.css`, which collapses every animation to
 * 0.01ms — well under SKELETON.handoff.reducedFloor (MOTION_REDUCED_MS =
 * 10ms). The reveal still lands; the ornament does not perform.
 *
 * Credits: Mike K. (napkin — `<SuspenseFade>` shape, sealed two-prop API,
 * the kill-list of escape hatches, the "compose, don't extend" rule),
 * Tanya D. (the "chrome yields to data" UX outcome, radius-parity audit
 * on call-sites, the shape of the §1 keyframe), Elon M. (the 3-line
 * `animation-fill-mode: forwards` salvage on the skeleton's exit, the
 * physics critique that produced the no-phase-lock decision), Paul K.
 * (must-have #1 ledger-visible budget, four-surface migration scope),
 * Krystle C. (the sealed `MOTION.crossfade × ALPHA.muted` composition
 * this primitive ships in a wrapper). Existing primitives — Threshold,
 * Skeleton, Pressable — set the headless / sealed / one-concern shape.
 */

'use client';

import { Suspense, type ReactNode } from 'react';
import { SKELETON_ENTER_ATTR } from '@/lib/design/skeleton';

// ─── Public API — two props, sealed ──────────────────────────────────────

export interface SuspenseFadeProps {
  /**
   * The skeleton (or any reduced-motion-respecting placeholder) shown
   * while `children` suspend. Pass a `<Skeleton variant="…">` whose
   * radius matches the arriving content's radius — radius parity at the
   * seam is what makes the crossfade read as "the same shape settling"
   * rather than "two shapes dissolving through each other" (Tanya §1.2).
   */
  fallback: ReactNode;
  /**
   * The content that lands into the arrival slot. Server Components are
   * fine — React streams them into this client boundary. The slot's CSS
   * hook (`data-sys-enter="fade"`) runs the sealed enter beat once on
   * mount via the `[data-sys-enter="fade"]` rule in `app/globals.css`.
   */
  children: ReactNode;
}

// ─── The component — sealed wrapper, no phase machine ────────────────────

/**
 * Renders `<Suspense>` with the fallback verbatim. The arrival slot is a
 * thin `<div>` carrying the single CSS hook the design system ships for
 * content-enter animations. No `useEffect`, no `startTransition`, no
 * phase machine — React swaps fallback for content; the keyframe runs
 * once on the mount of the arrival div; the compositor owns every frame.
 *
 * The arrival div is the smallest possible layout footprint that still
 * paints (`display: contents` would skip painting entirely and the
 * opacity animation would have nothing to act on). Per Mike §4 #1: the
 * single concern of this primitive is to host the keyframe, period.
 */
export function SuspenseFade(props: SuspenseFadeProps): JSX.Element {
  return (
    <Suspense fallback={props.fallback}>
      <ArrivalSlot>{props.children}</ArrivalSlot>
    </Suspense>
  );
}

// ─── Arrival slot — the one CSS hook, sealed inline ──────────────────────

/**
 * The arrival slot carries `data-sys-enter="fade"` exactly once. Pure;
 * inert; no props beyond children. Renders a single `<div>` so the
 * keyframe rule in `app/globals.css` has a paint target for the opacity
 * transition.
 */
function ArrivalSlot({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div {...{ [SKELETON_ENTER_ATTR.name]: SKELETON_ENTER_ATTR.value }}>
      {children}
    </div>
  );
}
