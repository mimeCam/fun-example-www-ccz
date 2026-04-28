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
 * Credits: Mike K. (#39 — the napkin, the wiring, "begin from shared
 * code"), Tanya D. (the icon-only popover row + Copied receipt at the
 * fingertip, no toast on success), Sid (this lift; ≤ 10 LOC per helper).
 */
'use client';

import { LinkIcon } from '@/components/shared/Icons';
import { ActionPressable } from '@/components/shared/ActionPressable';
import { useActionPhase } from '@/lib/hooks/useActionPhase';
import { copyToClipboard } from '@/lib/sharing/clipboard-utils';
import { generateShareLink } from '@/lib/sharing/share-links';
import { useState, useCallback } from 'react';

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
 * The link icon button. Inside the selection popover, sits as a sibling to
 * `<SelectionPopoverTrigger>` (the gem). Press-down captures the quote;
 * click runs the copy and pulses the fingertip witness on success.
 */
export function SelectionShareTrigger({ getQuote, onAfterCopy }: ShareTriggerProps) {
  const [busy, setBusy] = useState(false);
  const slot = useActionPhase(busy);
  const handleClick = useShareClick(setBusy, slot.pulse, getQuote, onAfterCopy);
  return (
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

/** Click handler wiring — pulled out so the component body stays ≤ 10 LOC. */
function useShareClick(
  setBusy: (b: boolean) => void,
  pulse: (ok: boolean) => void,
  getQuote: () => string,
  onAfterCopy?: (ok: boolean) => void,
): () => void {
  return useCallback(() => {
    const quote = getQuote();
    setBusy(true);
    runCopy(quote)
      .then((ok) => { pulse(ok); onAfterCopy?.(ok); })
      .catch(() => { pulse(false); onAfterCopy?.(false); })
      .finally(() => setBusy(false));
  }, [setBusy, pulse, getQuote, onAfterCopy]);
}

// ─── Test seam — pure handles for the per-file SSR pin ─────────────────────
//
// `buildShareUrl` consults `window`; `runCopy` is the side-effect path.
// Exposed so the source-pin tests can assert against the share-link import
// without mounting React (jest's testEnvironment is `node`, no jsdom).
export const __testing__ = { buildShareUrl, runCopy } as const;
