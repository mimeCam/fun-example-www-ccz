/**
 * SelectionShareTrigger — copy-link icon button inside the selection popover.
 *
 * The orphan graduates: `lib/sharing/share-links.ts` +
 * `lib/sharing/highlight-finder.ts` were shipped fully-formed and then
 * left without a single non-test caller (Mike #39 §1 — "the actual broken
 * contract"). This is that first caller. Sender highlights a sentence,
 * presses the link icon, the URL gains `#highlight=HASH&text=ENCODED`,
 * the clipboard fills, the fingertip witness pulses Copied. Recipient's
 * `useSharedHighlightOnLand` picks the fragment up on mount, centers the
 * paragraph, fires a one-shot pulse, then `clearHighlightFragment` so a
 * subsequent share starts clean.
 *
 * Reuses, never reinvents:
 *   • `<ActionPressable>` + `useActionPhase` — the canonical Copy→Copied
 *     witness with `<PhaseAnnouncement>` SR peer (Mike #71 / Tanya UIX
 *     #99). Same primitive ReturnLetter / QuoteKeepsake / ThreadKeepsake /
 *     ShareOverlay-CopyLink ride.
 *   • `generateShareLink` — the URL contract is already there; do not
 *     invent a parallel one (Mike #39 §"Begin from shared code").
 *   • `copyToClipboard` — fingertip-quiet on success, room-loud on
 *     failure. The toast-store is consulted only on the failure branch.
 *   • `LinkIcon` — already in the shared icon set; sister to Copy and
 *     Download silhouettes.
 *
 * Disjoint from `deep-link.ts` by design (Mike §POI 7 — selection-share is
 * "this exact sentence", deep-link is "this archetype's article"). The two
 * URLs never combine.
 *
 * Share-pulse symmetry (Mike #92, Tanya #68): on `ok=true`, after the
 * popover-exit beat clears the stage, the *paragraph itself* blooms gold
 * via `pulseElementGold` — the same primitive the recipient uses on
 * `useSharedHighlightOnLand`. Two callers, one atom, one source of gold.
 * The fence (`share-pulse-symmetry.fence.test.ts`) keeps it that way.
 *
 * Credits: Mike K. (#39 + #92 — the napkin, the wiring, "begin from
 * shared code", the symmetry extraction), Tanya D. (#68 — the witness-
 * gate timing, "one layer at a time", reduced-motion parity), Sid
 * (this lift; ≤ 10 LOC per helper, single home for the gate constant).
 */
'use client';

import { LinkIcon } from '@/components/shared/Icons';
import { ActionPressable } from '@/components/shared/ActionPressable';
import { useActionPhase } from '@/lib/hooks/useActionPhase';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';
import { copyToClipboard } from '@/lib/sharing/clipboard-utils';
import { generateShareLink } from '@/lib/sharing/share-links';
import { findTextInDocument } from '@/lib/sharing/highlight-finder';
import {
  pulseElementGold,
  PULSE_DWELL_MS,
} from '@/lib/sharing/highlight-pulse';
import { MOTION, MOTION_REDUCED_MS } from '@/lib/design/motion';
import { useState, useCallback } from 'react';

/**
 * The witness gate — sender-side pulse fires AFTER the popover-exit beat.
 * Equals `MOTION.crossfade + MOTION_REDUCED_MS` (= 130 ms), the same value
 * `usePopoverPhase` waits before unmounting the portal. The paragraph
 * cannot speak while the popover is mid-dismiss (Tanya UIX §2 sequence).
 */
const SHARE_PULSE_GATE_MS = MOTION.crossfade + MOTION_REDUCED_MS;

interface ShareTriggerProps {
  /** Snapshot of selected text at mousedown — captured by parent. */
  getQuote: () => string;
  /** Called after the copy resolves so the parent can dismiss the popover. */
  onAfterCopy?: (ok: boolean) => void;
}

/** Build the share URL for the current page + selected sentence. Pure-ish. */
function buildShareUrl(quote: string): string {
  const here = typeof window !== 'undefined' ? window.location.href : '';
  return generateShareLink(here, quote);
}

/** Run the copy. Returns the boolean outcome so the caller can pulse. */
async function runCopy(quote: string): Promise<boolean> {
  if (!quote.trim()) return false;
  return copyToClipboard(buildShareUrl(quote));
}

/**
 * Schedule the gold pulse on the *paragraph* the sender just shared.
 * Lookup parity with the recipient: same `findTextInDocument` walker,
 * same `pulseElementGold` primitive, same `PULSE_DWELL_MS` hold. Fires
 * after the witness gate so the popover-exit chrome has cleared the
 * stage (Tanya UIX §2). Returns a no-op if the lookup misses — silent
 * on success, just like the recipient (no toast, no recovery prompt).
 */
function pulseSharedParagraph(quote: string, reduced: boolean): void {
  if (typeof window === 'undefined') return;
  const el = findTextInDocument(quote);
  if (!el) return;
  const cleanup = pulseElementGold(el, reduced);
  window.setTimeout(cleanup, PULSE_DWELL_MS);
}

/** Witness gate — defer the pulse until popover-exit completes. */
function scheduleSharePulse(quote: string, reduced: boolean): void {
  if (typeof window === 'undefined') return;
  window.setTimeout(
    () => pulseSharedParagraph(quote, reduced),
    SHARE_PULSE_GATE_MS,
  );
}

/**
 * The link icon button. Inside the selection popover, sits as a sibling to
 * `<SelectionPopoverTrigger>` (the gem). Press-down captures the quote;
 * click runs the copy, pulses the fingertip witness, and (on success) the
 * paragraph itself blooms gold once the popover has dismissed.
 */
export function SelectionShareTrigger({ getQuote, onAfterCopy }: ShareTriggerProps) {
  const [busy, setBusy] = useState(false);
  const slot = useActionPhase(busy);
  const reduced = useReducedMotion();
  const handleClick = useShareClick(setBusy, slot.pulse, getQuote, onAfterCopy, reduced);
  return (
    // swap-width:exempt — icon-only host (variant='icon' + labelMode='hidden').
    // The visible label is suppressed by labelMode; only the glyph swaps
    // (LinkIcon size=14 ↔ CheckIcon size=14, byte-identical width). Zero ch
    // of bounding-box reflow, no rung needed — same exemption shape as
    // ShareOverlay.CopyLinkBtn. (Mike #94 §POI-4 host-bound scope.)
    <ActionPressable
      onClick={handleClick}
      phase={slot.phase}
      reduced={slot.reduced}
      icon={<LinkIcon size={14} />}
      idleLabel="Link"
      settledLabel="Copied"
      hint="Copy a link to this passage"
      variant="icon"
      size="sm"
      labelMode="hidden"
      className="!rounded-sys-full"
    />
  );
}

/** Settle the share — fingertip pulse + popover dismiss + paragraph bloom. */
function settleShare(
  ok: boolean,
  quote: string,
  reduced: boolean,
  pulse: (ok: boolean) => void,
  onAfterCopy?: (ok: boolean) => void,
): void {
  pulse(ok);
  onAfterCopy?.(ok);
  if (ok) scheduleSharePulse(quote, reduced);
}

/** Click handler wiring — pulled out so the component body stays ≤ 10 LOC. */
function useShareClick(
  setBusy: (b: boolean) => void,
  pulse: (ok: boolean) => void,
  getQuote: () => string,
  onAfterCopy?: (ok: boolean) => void,
  reduced = false,
): () => void {
  return useCallback(() => {
    const quote = getQuote();
    setBusy(true);
    runCopy(quote)
      .then((ok) => settleShare(ok, quote, reduced, pulse, onAfterCopy))
      .catch(() => settleShare(false, quote, reduced, pulse, onAfterCopy))
      .finally(() => setBusy(false));
  }, [setBusy, pulse, getQuote, onAfterCopy, reduced]);
}

// ─── Test seam — pure handles for the per-file SSR pin ─────────────────────
//
// `buildShareUrl` consults `window`; `runCopy` is the side-effect path.
// `scheduleSharePulse` carries the witness-gate timeout — exposed so the
// fence + unit tests can pin the gate beat without mounting React (jest's
// testEnvironment is `node`, no jsdom).
export const __testing__ = {
  buildShareUrl,
  runCopy,
  pulseSharedParagraph,
  scheduleSharePulse,
  settleShare,
  SHARE_PULSE_GATE_MS,
} as const;
