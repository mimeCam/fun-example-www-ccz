/**
 * CollapsibleSlot — the 9th shared primitive: a layout envelope that
 * always mounts a `<div>` even when its children render `null`.
 *
 *   <CollapsibleSlot bottom={8}>
 *     <SomePortalThatMayReturnNull />
 *   </CollapsibleSlot>
 *
 * The single legal use case (Mike #2 §6.2):
 *   *A child that may render `null` and whose absent margin would
 *    collapse a sibling's expected gap.*
 *
 * The bug class this prevents (Mike #2 §1):
 *   When a portal returns `null` for one reader class, every sibling's
 *   top margin silently absorbs the absent portal's bottom breath. That
 *   is implicit polymorphism leaking across a component boundary. The
 *   envelope owns the gap; the child owns whether content paints. One
 *   owner per concern.
 *
 * Why a wrapper instead of bumping the sibling's margin (Tanya #3 §5):
 *   Either path closes the bug. We pick this one when the portal is the
 *   shared seam — moving the breath to the envelope keeps recognition
 *   state out of the surrounding layout.
 *
 * Sealed API — `top` + `bottom` only. No `className`, no `tone`, no
 * `as`, no `padding`. Escape hatches re-introduce the polymorphism this
 * primitive exists to prevent. If a future surface needs a different
 * envelope shape, write a *different* primitive (the `SuspenseFade`
 * pattern — compose, do not extend; Mike SuspenseFade §4 #4).
 *
 * Reduced-motion / forced-colors: the envelope renders only margin
 * utilities — no animation, no color, no border. There is nothing to
 * adapt; the wrapper is geometry, not chrome.
 *
 * SSR pin (Krystle, Tanya #3 §4): the envelope is a static `<div>` whose
 * className depends only on its props. Server and client emit identical
 * markup. No hook, no hydration shift.
 *
 * Credits: Mike K. (#2 napkin §3–§5 — envelope shape, sealed two-prop
 * API, the polymorphism kill, the "compose don't extend" rule), Tanya D.
 * (#3 §5 — the "either path is fine; pick the one with less coupling"
 * lens), Krystle C. (the SSR pin — envelope class string is identical
 * server-side and client-side), Existing primitives (`Skeleton`,
 * `SuspenseFade`) — the sealed-API + helper-composition shape.
 */

import { type ReactNode } from 'react';
import {
  slotEnvelopeClasses,
  type CollapsibleSlotMargins,
} from '@/lib/design/collapsible-slot';

// ─── Public API — sealed at margins + children ────────────────────────────

export type { CollapsibleSlotMargins };

export interface CollapsibleSlotProps extends CollapsibleSlotMargins {
  /**
   * The conditionally-rendering content. May return `null` for any
   * reader class — the envelope still mounts and still owns the gap.
   */
  children: ReactNode;
}

// ─── The component — one element, no phase, no hooks ─────────────────────

/**
 * Renders a `<div>` carrying `mt-sys-N` / `mb-sys-N` from the canonical
 * spacing ledger. The wrapper is the seam; children are the content.
 * Pure render — no `useEffect`, no state, no portal, no measurement.
 *
 * If `children` is `null` the envelope is still in the DOM and still
 * carries its margins; downstream siblings see the same rhythm whether
 * the inner painted or not. That invariance is the entire feature.
 */
export function CollapsibleSlot(props: CollapsibleSlotProps): JSX.Element {
  const className = slotEnvelopeClasses({ top: props.top, bottom: props.bottom });
  return <div className={className}>{props.children}</div>;
}
