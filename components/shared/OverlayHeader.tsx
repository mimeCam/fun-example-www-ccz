/**
 * OverlayHeader — the room's nameplate. Reader-invariant chrome.
 *
 * The room's name is steady so the room's voice can flex. No `className`,
 * no archetype tint, no thermal warmth, no animation — pick `items-center`
 * and freeze it. The kernel's invariance IS the trust anchor; an escape
 * hatch breaks it (Tanya UIX #21 §4 — the four refusals; Mike #77 §"Public
 * API"). The same hand opens every overlay.
 *
 *   ┌────────────────────────────────────────────────────┐
 *   │  Title                                       [✕]   │
 *   │  Optional blurb (recedes one rung)                 │
 *   └────────────────────────────────────────────────────┘
 *
 * Three atoms, no fourth:
 *   1. `<h3>` — the room's name. `text-sys-lg font-display
 *      font-sys-display text-foreground`. Required. Carries the `id` the
 *      surface's `aria-labelledby` points at.
 *   2. `<p>`  — the quiet sub-line. `text-mist text-sys-caption
 *      tracking-sys-caption mt-sys-1`. Optional but recommended (every
 *      current call site has one). `ReactNode`, not `string`, so a
 *      `<span class="sr-only">` enrichment survives migration. Carries
 *      the `id` for `aria-describedby`.
 *   3. `<DismissButton.Inline />` — the universal exit. The kernel
 *      already exists, already fenced, already verb-frozen at "Close"
 *      (Tanya UIX #33; Mike #90). The header does not re-implement; it
 *      slots.
 *
 * `items-center` is the row's anchor, not `items-start`. Cap-height of
 * the title and centroid of the close glyph approximately co-center; the
 * `items-start` drift on `QuoteKeepsake` / `ThreadKeepsake` pulled the
 * glyph above the title's optical mid-line and read as "the close
 * floating up off the row" (Tanya UIX #21 §3). Frozen via fence.
 *
 * Adoption fence: `components/shared/__tests__/overlay-header-fence.test.ts`
 * pins (A) no caller hand-rolls `flex … justify-between p-sys-6 pb-sys-4`
 * paired with `<DismissButton.Inline>` outside the kernel; (B) the kernel
 * carries `items-center` and the type-token triple verbatim; (C) the
 * literal layout substring lives in exactly ONE `.tsx` (this one); (D)
 * no `items-start` paired with the layout literal anywhere; (E) five
 * utterances all spell `overlay-header`.
 *
 * Credits: Mike K. (#77 napkin — kernel + five-axis fence + three
 * migrations + the no-`className` discipline; the rule-of-three trigger
 * for the address-test pattern), Tanya D. (UIX #21 — reader-invariant
 * chrome doctrine, the four refusals, the `items-center` decisive call,
 * the `tracking-sys-caption` polish that earns the AAA bar), Jason F.
 * (#74 — the keeper sentence "the room's name is steady so the room's
 * voice can flex"), Elon M. (#8 — the BS-detector that killed the
 * unimplementable ±1px fence and kept the contract assertion honest),
 * Paul K. (#31 — the chrome-invariance-unlocks-voice-variance framing),
 * Krystle C. (#47 — the original engineering scope and negative-LOC
 * discipline), Sid (this lift — same shape as DismissButton, second time,
 * right neighborhood; one kernel, three callers, no `tone` prop).
 */

'use client';

import type { ReactNode } from 'react';
import { DismissButton } from '@/components/shared/DismissButton';

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * The four axes that survive into the kernel: `title` (required name),
 * `titleId` / `blurbId` (the surface threads them into `aria-labelledby` /
 * `aria-describedby`), `blurb` (`ReactNode` — sr-only enrichments
 * survive), and `onClose` (the verb the caller owns). No `className`, no
 * `align`, no `tone`, no `as`. Placement is the kernel's job, not a prop.
 */
export interface OverlayHeaderProps {
  /** The room's name. Reader-invariant chrome — never tinted. */
  title: string;
  /** Optional id for the surface's `aria-labelledby` linkage. */
  titleId?: string;
  /** Optional sub-line. `ReactNode` so sr-only enrichments survive. */
  blurb?: ReactNode;
  /** Optional id for the surface's `aria-describedby` linkage. */
  blurbId?: string;
  /** Fires when the reader closes the overlay. The verb the caller owns. */
  onClose: () => void;
}

// ─── Kernel — one row, three atoms, frozen ────────────────────────────────

/**
 * Renders the row. The literal `flex items-center justify-between p-sys-6
 * pb-sys-4` lives only here; the fence's Axis C confirms it.
 */
export function OverlayHeader(props: OverlayHeaderProps): JSX.Element {
  const { title, titleId, blurb, blurbId, onClose } = props;
  return (
    <div className="flex items-center justify-between p-sys-6 pb-sys-4">
      <HeaderColumn title={title} titleId={titleId}
        blurb={blurb} blurbId={blurbId} />
      <DismissButton.Inline onClose={onClose} />
    </div>
  );
}

// ─── Internal: title + optional blurb stack ────────────────────────────────

interface HeaderColumnProps {
  title: string;
  titleId?: string;
  blurb?: ReactNode;
  blurbId?: string;
}

/**
 * Title leads (full presence); blurb whispers (mist rung). The 4 px
 * `mt-sys-1` is the only inter-atom rhythm in the row — no border, no
 * divider; the body's `pb-sys-4` is the seam (Tanya UIX #21 §5.1, #33 §5).
 *
 * The doorway-is-air doctrine binds out into Axis F of `overlay-header-
 * fence`: no `<div border-t>`, `<hr>`, or `<Divider>` may follow an
 * `<OverlayHeader>` outside this kernel. The breath here is the breath
 * everywhere; ink at the doorway is rejected at lint level (Mike #4
 * §"Decision" — fence the doctrine, do not crown the drift).
 */
function HeaderColumn(props: HeaderColumnProps): JSX.Element {
  const { title, titleId, blurb, blurbId } = props;
  return (
    <div>
      <h3 id={titleId}
        className="text-sys-lg font-display font-sys-display text-foreground">
        {title}
      </h3>
      {blurb !== undefined && blurb !== null && (
        <p id={blurbId}
          className="text-mist text-sys-caption tracking-sys-caption mt-sys-1">
          {blurb}
        </p>
      )}
    </div>
  );
}
