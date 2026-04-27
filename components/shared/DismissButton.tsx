/**
 * DismissButton — the universal exit. The same hand closes every overlay.
 *
 * One stateless kernel · two named exports · no `tone` prop, no context.
 * Composes `<Pressable variant="icon">` and renders `<CloseIcon />` — the
 * substrate already owns press-phase, focus, hover, and the icon-square
 * sizing. This file does not re-implement any of that; it picks the
 * placement and freezes the verb. (Mike #90 napkin §"Public API"; Tanya
 * UIX #33 §3 — "two placements, one primitive".)
 *
 * Two named exports — the Pareto pick that resolved the team's only open
 * dispute (named exports vs. `tone` prop vs. `<DismissSurface>` context):
 *
 *   • `<DismissButton.Inline />`   — header trailing slot. Used in three
 *     overlays whose surface owns a header row (`flex items-center
 *     justify-between`). The `-mr-sys-3` negative margin pulls the glyph
 *     to align with the surface's right padding edge — the *visual* edge
 *     sits flush with the title (Tanya UIX #33 §3.1, Mike #90 §"Public
 *     API"). Header surfaces: ResonanceDrawer · ThreadKeepsake ·
 *     QuoteKeepsake.
 *
 *   • `<DismissButton.Absolute />` — corner chrome. Used in surfaces with
 *     no header row to anchor against (today: ReturnLetter only). Lives
 *     `top-sys-4 right-sys-4` — the *protected* corner, not the bleeding
 *     corner; the 16px standoff is symmetric on both axes (Tanya UIX #33
 *     §3.2). The `text-sys-lg leading-none` reserve is preserved so the
 *     historical `&times;` glyph carve-out retires without a layout flinch.
 *
 * Frozen contract — what the kernel owns and the call site cannot override:
 *   1. The verb is `"Close"`, every site, every archetype. Tanya's seven-
 *      word doctrine: "the same hand closes every overlay." The dialog
 *      title carries the keepsake nuance via `aria-labelledby`; doubling
 *      the noun is a confidence smell. (Tanya UIX #33 §5; Mike #90 §"…
 *      Decisions" #2.)
 *   2. The glyph is `<CloseIcon />`. The HTML entity `&times;` is gone;
 *      the SVG is geometrically constant regardless of the parent font-
 *      stack, which fixes the warming-surface drift Tanya flagged in
 *      UIX #33 §4.1. (Mike #90 §"… Decisions" #3.)
 *   3. No `className` escape hatch, no `aria-label` override, no
 *      `tone`. The kernel's invariance IS the trust anchor; an escape
 *      hatch breaks it. If a fifth surface ever genuinely needs a third
 *      placement (`.Sticky`, `.Floating`, …) we add a third named export
 *      — never a `className` prop. (Mike #90 §"Points of interest" #5.)
 *   4. The reader can always close. There is no `disabled` prop. If you
 *      can show the overlay you can close it. Period. (Tanya UIX #33 §2.2.)
 *
 * Adoption fence: `components/shared/__tests__/dismiss-verb-fence.test.ts`
 * pins (A) no caller pairs `<Pressable variant="icon">` with `<CloseIcon
 * />` outside this kernel, (B) the kernel renders `<CloseIcon />` and
 * hardcodes `aria-label="Close"`, (C) `<CloseIcon />` is imported in
 * exactly ONE `.tsx` file (this one), (D) no `&times;` HTML entity remains
 * inside any `<Pressable>` children, (E) the verb's five utterances all
 * spell `dismiss-button` (path · symbol · fence file · …).
 *
 * Credits: Mike K. (#90 napkin — kernel + named exports + five-axis fence
 * shape, "polymorphism is a killer", the `.Inline` / `.Absolute` Pareto
 * pick that resolved the API dispute), Tanya D. (UIX #33 — the felt
 * outcome, the two-placement decision rule, the verb retirement, the
 * narrow-viewport overlap audit, the load-bearing one-liner kept here as
 * docstring — "the same hand closes every overlay"), Krystle C. (the
 * four-call-site audit, the negative-LOC discipline, the morph-kill),
 * Jason F. (#25/#49 — placement-as-grammar framing — `.Inline` /
 * `.Absolute` over a `tone` prop), Elon M. (explicit > implicit on the
 * named-exports decision; the no-context, no-doctrine, no-telemetry
 * cuts), Paul K. (the trust-anchor thesis — the dismiss is not just
 * affordance, it is the receipt that the room is honest), Sid (this
 * lift; one kernel, four callers, no class hierarchy).
 */

'use client';

import { forwardRef, type Ref } from 'react';
import { Pressable } from '@/components/shared/Pressable';
import { CloseIcon } from '@/components/shared/Icons';

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * The two axes that survive into the kernel: `onClose` (the verb the
 * caller is responsible for) and `size` (density — sm | md, default md).
 * Placement is NOT a prop; placement is a named export. (Mike #90 §"Public
 * API" — locked.)
 */
export interface DismissButtonProps {
  /** Fires when the reader closes the overlay. The kernel does not legislate
   *  what `onClose` does — it just delivers the gesture. */
  onClose: () => void;
  /** Density of the icon substrate. Default `md`. (`sm` is preserved for
   *  ReturnLetter's small-on-card placement; density ≠ placement.) */
  size?: 'sm' | 'md';
}

// ─── Inline placement — header trailing slot (3 of 4 sites) ───────────────

/**
 * `-mr-sys-3` is the optical-edge alignment classed in. The header pattern
 * (`flex items-center justify-between p-sys-6 pb-sys-4`) lives on the
 * caller; this export only owns the trailing-slot offset. (Tanya UIX #33
 * §3.1; Mike #90 §"Public API".)
 */
const InlineImpl = forwardRef<HTMLButtonElement, DismissButtonProps>(
  function DismissButtonInline(props, ref) {
    return renderDismiss(props, ref, '-mr-sys-3');
  },
);

// ─── Absolute placement — corner chrome (1 of 4 sites today) ──────────────

/**
 * The protected corner — `top-sys-4 right-sys-4` (16px in / 16px down).
 * No `text-sys-lg leading-none` reserve: the historical `&times;` carve-
 * out needed the line-box budget, but the SVG `<CloseIcon />` is
 * geometrically constant and the typography-ledger:exempt comment retires
 * with it (Mike #90 §"Modules involved" #7 — "the line-box quirk goes
 * away"). (Tanya UIX #33 §3.2 — protected-corner placement only.)
 */
const AbsoluteImpl = forwardRef<HTMLButtonElement, DismissButtonProps>(
  function DismissButtonAbsolute(props, ref) {
    return renderDismiss(props, ref, ABSOLUTE_PLACEMENT);
  },
);

const ABSOLUTE_PLACEMENT = 'absolute top-sys-4 right-sys-4';

// ─── Shared renderer — picks the placement, freezes the verb ──────────────

function renderDismiss(
  props: DismissButtonProps,
  ref: Ref<HTMLButtonElement>,
  placement: string,
): JSX.Element {
  const { onClose, size = 'md' } = props;
  return (
    <Pressable
      ref={ref}
      variant="icon"
      size={size}
      onClick={onClose}
      aria-label="Close"
      className={placement}
    >
      <CloseIcon />
    </Pressable>
  );
}

// ─── Exported namespace — `.Inline` / `.Absolute` are the two callers ─────

/**
 * The `DismissButton` namespace exports the two placements as static
 * properties. There is no default export and no bare `<DismissButton />`
 * — the call site declares its surface explicitly. (Mike #90 §"…
 * Decisions" #1: "explicit > implicit … no magic at a distance.")
 */
export const DismissButton = {
  Inline: InlineImpl,
  Absolute: AbsoluteImpl,
} as const;
