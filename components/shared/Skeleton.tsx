/**
 * Skeleton — the transient-absence primitive.
 *
 * One primitive, three sealed variants, zero escape hatches. The shared
 * `.sys-skeleton` class (defined in `app/globals.css`) owns the breath
 * animation and the reduced-motion floor, so every loading surface across
 * the site pulses at the same MOTION.linger cadence and rests at the
 * same α muted when motion is off.
 *
 *   <Skeleton variant="line"  className="h-3 w-3/4" />
 *   <Skeleton variant="block" className="h-sys-7 w-32" />
 *   <Skeleton variant="card"  className="p-sys-6">
 *     <Skeleton variant="line" className="h-4 w-3/4 mb-sys-3" />
 *     <Skeleton variant="line" className="h-3 w-full mb-sys-2" />
 *   </Skeleton>
 *
 * Caller owns sizing/spacing via `className`. The primitive owns surface,
 * radius token, breath cadence, and the reduced-motion rest state. The
 * thermal system warms the surface ambiently via `bg-surface` — no
 * `tone` prop is (or will be) accepted.
 *
 * `aria-hidden="true"` is non-negotiable: skeletons are ambient chrome,
 * not content. Assistive tech ignores them; the caller's Suspense
 * boundary (or role="status") announces "loading" once.
 *
 * Credits: Mike K. (napkin — three-variant fence, className pass-through,
 * no `shimmer`/`speed`/`delay`/`count`/`tone`, one animation owned by
 * CSS), Tanya D. (the UX discipline of not adding a fourth variant until
 * a fourth real site earns it), Elon M. (YAGNI bar: two props, done),
 * Paul K. (priority call: Skeleton first, sealed cadence). Existing
 * primitives (Threshold, Pressable) — load-bearing prior art for the
 * ≤10-LOC helper composition pattern used below.
 */

import { type ReactNode } from 'react';
import {
  composeSkeletonClass,
  type SkeletonShape,
} from '@/lib/design/skeleton';

// ─── Public API — two props, sealed ──────────────────────────────────────

export type { SkeletonShape };

export interface SkeletonProps {
  /** Sealed enum — `line` · `block` · `card`. No "custom" escape hatch. */
  variant: SkeletonShape;
  /** Caller-owned sizing/spacing (e.g. `h-3 w-3/4 mb-sys-3`). */
  className?: string;
  /** Only valid when `variant="card"` — the primitive composes, not extends. */
  children?: ReactNode;
}

// ─── The component — the render is one line; helpers are in skeleton.ts ──

/**
 * The primitive renders a single `<div>` with `aria-hidden="true"`. No
 * ref forwarding (callers don't measure skeletons); no event handlers
 * (skeletons aren't interactive); no role (ambient chrome, not status).
 */
export function Skeleton({
  variant,
  className,
  children,
}: SkeletonProps): JSX.Element {
  return (
    <div
      className={composeSkeletonClass(variant, className)}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}
