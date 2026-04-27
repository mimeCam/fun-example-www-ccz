/**
 * ThreadKeepsake — modal that turns the reader's Golden Thread into a
 * shareable, cropable, DM-able artifact. The site's "invite engine."
 *
 * Action layout (Tanya UX §4.1 — single-primary + secondary cluster):
 *   ┌──────────────────────────────────────────────┐
 *   │  Keep this thread                       [✕]  │
 *   │  A mirror of what you just read.             │
 *   ├──────────────────────────────────────────────┤
 *   │   [ SVG keepsake — 1200×630 viewBox ]        │
 *   ├──────────────────────────────────────────────┤
 *   │      ┌────────────────────────────┐          │
 *   │      │  ↗  Share this thread      │          │
 *   │      └────────────────────────────┘          │
 *   │   ⧉  Copy     ⤓  Save     🔗  Link           │
 *   └──────────────────────────────────────────────┘
 *
 * Why one primary verb? Logic-driven UI principle #3 (`openloop/14-…`):
 * one primary action per screen. The earlier 2×2 grid asked the reader to
 * choose between "Copy image" and "Download PNG" — two intents that say
 * the same thing — and diluted the moment Paul named non-negotiable
 * (Tier 1, "the reader sends a thread to a friend without being asked
 * to"). Share leads, the rest cluster.
 *
 * Async-action settled-state pulse (Mike #18 / Tanya #11; primary lift —
 * Mike #26 / Tanya #81): Share / Copy / Save / Link all route through
 * `<ActionPressable>` so the witness lands at the fingertip — glyph swaps
 * to a checkmark, verb shifts to past tense ("Shared" / "Copied" / "Saved"),
 * holds ~1000 ms, then quietly idles. **No success toast** on any of the
 * four; the room voice survives only on the primary's `runShareFailover`
 * (no `navigator.share` API → clipboard fallback) where the fingertip has
 * no organ left to speak from. Failure still escalates one level by design.
 *
 * Implementation notes:
 *  - Preview SVG is the SAME `buildThreadSVG` used by the inline plate AND
 *    `/api/og/thread`. Preview === unfurl (Mike §6.2).
 *  - All actions gracefully fall back: no `navigator.share` → copy-link;
 *    no `ClipboardItem` for images → download path stays available.
 *  - Modal mechanics (ESC, backdrop, focus trap, scroll-lock, focus return)
 *    live in the shared `<Threshold>` primitive.
 *  - `SHARED` checkpoint emits on every successful share-or-copy path so
 *    the reader-loop funnel stays honest about the win Paul named.
 *
 * Credits: Paul K. ("must be beautiful in isolation"; Tier-1 share
 * outcome), Mike K. ("mirror the Thread can walk through"; preview ===
 * unfurl; #18 — `ActionPressable` napkin; #26 — primary-CTA lift via
 * variant pass-through, no new primitive), Tanya D. (UX §4 — single-
 * primary action layout, icon + verb balance, modal motion discipline;
 * UX §0 — the "loop's last syllable" brief; #11 — the settled-state
 * spec; #81 — the gold button speaks its own resolution, the room
 * stops talking over the gesture), Krystle C. (original keepsake-feedback
 * covenant — primary excluded, ~1200 ms, fail-quiet recovery), Elon M.
 * (engineering call — extend, don't sibling), Sid (this refactor — action
 * collapse, SHARED checkpoint emission, icon-set extraction, ActionPressable
 * adoption; this round — primary CTA wears the fingertip witness).
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildThreadSVG,
  KEEPSAKE_DIMENSIONS,
  type ThreadSnapshot,
} from '@/lib/sharing/thread-render';
import { buildKeepsakeHref, buildUnfurlUrl } from '@/lib/sharing/thread-snapshot';
import { copyWithFeedback } from '@/lib/sharing/clipboard-utils';
import { copyPngToClipboard, downloadPng } from '@/lib/sharing/svg-to-png';
import { swapWidthClassOf } from '@/lib/design/swap-width';
import { Threshold } from '@/components/shared/Threshold';
import { DismissButton } from '@/components/shared/DismissButton';
import { ActionPressable } from '@/components/shared/ActionPressable';
import {
  ShareIcon, CopyIcon, DownloadIcon, LinkIcon,
} from '@/components/shared/Icons';
import { useActionPhase, type UseActionPhaseResult } from '@/lib/hooks/useActionPhase';
import { CHECKPOINTS, emitCheckpoint } from '@/lib/hooks/useLoopFunnel';

interface ThreadKeepsakeProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: ThreadSnapshot | null;
}

/** Busy slot for the action buttons. One verb at a time. */
type Busy = null | 'copy' | 'download' | 'share' | 'link';

function filenameFor(snapshot: ThreadSnapshot): string {
  const safeSlug = snapshot.slug.replace(/[^a-z0-9-]/gi, '-').slice(0, 40);
  return `thread-${safeSlug}.png`;
}

function absoluteHref(relative: string): string {
  if (typeof window === 'undefined') return relative;
  return `${window.location.origin}${relative}`;
}

function useKeepsakeDerivations(snapshot: ThreadSnapshot | null) {
  const svg = useMemo(() => (snapshot ? buildThreadSVG(snapshot) : ''), [snapshot]);
  const deepLink = useMemo(
    () => (snapshot ? absoluteHref(buildKeepsakeHref(snapshot)) : ''),
    [snapshot],
  );
  const unfurlUrl = useMemo(
    () => (snapshot && typeof window !== 'undefined'
      ? buildUnfurlUrl(window.location.origin, snapshot) : ''),
    [snapshot],
  );
  return { svg, deepLink, unfurlUrl };
}

export function ThreadKeepsake({ isOpen, onClose, snapshot }: ThreadKeepsakeProps) {
  const { svg, deepLink, unfurlUrl } = useKeepsakeDerivations(snapshot);
  // Reader-loop checkpoint #3: keepsake rendered. Fires once per session
  // when the modal first opens with a real snapshot. (Mike §5 row 3.)
  useEffect(() => {
    if (!isOpen || !snapshot) return;
    emitCheckpoint(CHECKPOINTS.KEEPSAKED);
  }, [isOpen, snapshot]);
  if (!snapshot) return null;
  return (
    <Threshold isOpen={isOpen} onClose={onClose}
      labelledBy="keepsake-title" describedBy="keepsake-blurb"
      variant="center">
      <KeepsakeHeader onClose={onClose} />
      <KeepsakePreview svg={svg} title={snapshot.title} />
      <KeepsakeActions
        svg={svg}
        snapshot={snapshot}
        deepLink={deepLink}
        unfurlUrl={unfurlUrl}
      />
    </Threshold>
  );
}

/* ─── Header ─────────────────────────────────────────────────────────────── */

function KeepsakeHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between p-sys-6 pb-sys-4">
      <div>
        <h3 id="keepsake-title"
            className="text-sys-lg font-display font-sys-display text-foreground">
          Keep this thread
        </h3>
        <p id="keepsake-blurb" className="text-mist text-sys-caption mt-sys-1">
          A mirror of what you just read.
        </p>
      </div>
      <DismissButton.Inline onClose={onClose} />
    </div>
  );
}

/* ─── Preview ────────────────────────────────────────────────────────────── */

function KeepsakePreview({ svg, title }: { svg: string; title: string }) {
  // Render trusted, locally-built SVG. dangerouslySetInnerHTML is safe here
  // because the string is produced by our pure builder with escaped inputs.
  return (
    <div className="mx-sys-6 mb-sys-5 rounded-sys-medium overflow-hidden
                    border border-fog/20 bg-void">
      <div
        role="img"
        aria-label={`Golden thread keepsake: ${title}`}
        className="w-full"
        style={{ aspectRatio: `${KEEPSAKE_DIMENSIONS.width} / ${KEEPSAKE_DIMENSIONS.height}` }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

/* ─── Actions — single primary + 3 icon-led secondaries ──────────────────── */

interface ActionsProps {
  svg: string;
  snapshot: ThreadSnapshot;
  deepLink: string;
  unfurlUrl: string;
}

function KeepsakeActions({ svg, snapshot, deepLink, unfurlUrl }: ActionsProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const a = useKeepsakeActions({ svg, snapshot, deepLink });
  return (
    <div className="px-sys-6 pb-sys-6">
      <PrimaryShare onClick={a.onShare} slot={a.shareSlot} />
      <SecondaryRow
        onCopy={a.onCopyImage} copySlot={a.copySlot}
        onSave={a.onDownload}  saveSlot={a.saveSlot}
        onLink={a.onCopyLink}  linkSlot={a.linkSlot}
      />
      {isDev && (
        <p className="mt-sys-4 text-mist/60 text-sys-micro break-all">
          unfurl: {unfurlUrl}
        </p>
      )}
    </div>
  );
}

/**
 * Primary "Share this thread" — gold solid, ↗ glyph, single verb.
 *
 * Wears the same `<ActionPressable>` covenant as the secondary row
 * (Mike #26 §3 / Tanya #81 §5–§6): on a successful native share the glyph
 * crossfades to a checkmark and the label flips to "Shared", held ~1000 ms.
 * The bounding box is pinned by `swapWidthClassOf(3)` so the 12-character
 * shrink (Share this thread → Shared) is a content swap, not a reshape
 * (Tanya UX #41 §3, Mike #39 §3 — three-rung label-swap floor; rung 3
 * derived from the 17-ch idle label). No toast on success; the failover
 * keeps the room voice.
 */
function PrimaryShare({ onClick, slot }: { onClick: () => void; slot: UseActionPhaseResult }) {
  return (
    <div className="mb-sys-4 flex justify-center">
      <ActionPressable
        variant="solid"
        size="md"
        onClick={onClick}
        phase={slot.phase}
        reduced={slot.reduced}
        icon={<ShareIcon size={16} />}
        idleLabel="Share this thread"
        settledLabel="Shared"
        hint="Share this thread"
        className={swapWidthClassOf(3)}
      />
    </div>
  );
}

interface SecondaryRowProps {
  onCopy: () => void; copySlot: UseActionPhaseResult;
  onSave: () => void; saveSlot: UseActionPhaseResult;
  onLink: () => void; linkSlot: UseActionPhaseResult;
}

/**
 * Three icon-led ghost siblings — Copy / Save / Link. Verbs balance with
 * the primary's two-word verb (logic principle #14). Distribution is
 * centered-by-spacing, not centered-by-text (Tanya §4.4 alignment rule).
 *
 * Each slot owns its own `useActionPhase` so the settled-state witness
 * lives at the fingertip independently per-button (Tanya §5 / Mike §4).
 */
function SecondaryRow(p: SecondaryRowProps) {
  return (
    <div className="flex items-center justify-center gap-sys-3 flex-wrap">
      <SecondaryAction onClick={p.onCopy} slot={p.copySlot}
        icon={<CopyIcon size={14} />}
        idleLabel="Copy" settledLabel="Copied" hint="Copy image" />
      <SecondaryAction onClick={p.onSave} slot={p.saveSlot}
        icon={<DownloadIcon size={14} />}
        idleLabel="Save" settledLabel="Saved" hint="Download PNG" />
      <SecondaryAction onClick={p.onLink} slot={p.linkSlot}
        icon={<LinkIcon size={14} />}
        idleLabel="Link" settledLabel="Copied" hint="Copy link" />
    </div>
  );
}

interface SecondaryActionProps {
  onClick: () => void;
  slot: UseActionPhaseResult;
  icon: JSX.Element;
  idleLabel: string;
  settledLabel: string;
  hint: string;
}

function SecondaryAction(p: SecondaryActionProps) {
  return (
    <ActionPressable
      onClick={p.onClick}
      phase={p.slot.phase}
      reduced={p.slot.reduced}
      icon={p.icon}
      idleLabel={p.idleLabel}
      settledLabel={p.settledLabel}
      hint={p.hint}
    />
  );
}

/* ─── Action handlers (extracted hook — keeps each fn ≤ 10 LOC) ─────────── */

interface ActionHandlerInputs {
  svg: string;
  snapshot: ThreadSnapshot;
  deepLink: string;
}

/**
 * The four verbs the modal speaks, plus a single busy slot (one action at
 * a time) and per-slot phase machines for the three secondaries. Pulled
 * into its own hook so the render fn stays presentational and each
 * callback is independently grep-recoverable.
 */
function useKeepsakeActions(inputs: ActionHandlerInputs) {
  const { svg, snapshot, deepLink } = inputs;
  const [busy, setBusy] = useState<Busy>(null);
  const copySlot = useActionPhase(busy === 'copy');
  const saveSlot = useActionPhase(busy === 'download');
  const linkSlot = useActionPhase(busy === 'link');
  const shareSlot = useActionPhase(busy === 'share');
  const onCopyImage = useCallback(
    () => runCopyImage(svg, setBusy, copySlot.pulse), [svg, copySlot.pulse]);
  const onDownload  = useCallback(
    () => runDownload(svg, snapshot, setBusy, saveSlot.pulse),
    [svg, snapshot, saveSlot.pulse]);
  const onCopyLink  = useCallback(
    () => runCopyLink(deepLink, setBusy, linkSlot.pulse),
    [deepLink, linkSlot.pulse]);
  const onShare = useCallback(
    () => runShare(snapshot, deepLink, setBusy, shareSlot.pulse),
    [snapshot, deepLink, shareSlot.pulse]);
  return { busy, copySlot, saveSlot, linkSlot, shareSlot,
    onCopyImage, onDownload, onCopyLink, onShare };
}

type Pulse = (ok: boolean) => void;

async function runCopyImage(
  svg: string, setBusy: (b: Busy) => void, pulse: Pulse,
): Promise<void> {
  setBusy('copy');
  try {
    const ok = await copyPngToClipboard(svg);
    if (ok) emitCheckpoint(CHECKPOINTS.SHARED);
    // Quiet-on-success: the ActionPressable.pulse(ok) glow + sr-only
    // <PhaseAnnouncement> is the receipt. Failure escalates via
    // copyWithFeedback's failure path on the link/share verbs (Mike #21).
    pulse(ok);
  } finally { setBusy(null); }
}

async function runDownload(
  svg: string, snapshot: ThreadSnapshot,
  setBusy: (b: Busy) => void, pulse: Pulse,
): Promise<void> {
  setBusy('download');
  try {
    await downloadPng(svg, filenameFor(snapshot));
    emitCheckpoint(CHECKPOINTS.SHARED);
    pulse(true);
  } catch { pulse(false); } finally { setBusy(null); }
}

async function runCopyLink(
  deepLink: string, setBusy: (b: Busy) => void, pulse: Pulse,
): Promise<void> {
  setBusy('link');
  try {
    // Quiet-on-success: the Link button's pulse(ok) is the receipt.
    // Failure still toasts (warn) — see copyWithFeedback's contract.
    // copyWithFeedback emits SHARED on the clipboard-utils path.
    // `announce: 'fingertip'` is **explicit** here (Mike #voice-peer §4
    // axis A) — the fence in `lib/sharing/__tests__/voice-call-site-
    // fence.test.ts` fails the build if this literal goes missing.
    const ok = await copyWithFeedback(deepLink, {
      successMessage: 'Link copied — the thread travels with it.',
      failureMessage: "Couldn't copy — try Save instead.",
      announce: 'fingertip',
    });
    pulse(ok);
  } finally { setBusy(null); }
}

async function runShare(
  snapshot: ThreadSnapshot, deepLink: string,
  setBusy: (b: Busy) => void, pulse: Pulse,
): Promise<void> {
  // No-fingertip case: `navigator.share` is missing entirely, so the
  // primary CTA never enters `busy`/`settled` — the room voice is the
  // only available witness, opted into explicitly via `runShareFailover`
  // (Mike #26 §5; Tanya #81 §6 — failure/no-API still escalates).
  if (typeof navigator === 'undefined' || !navigator.share) {
    await runShareFailover(deepLink);
    return;
  }
  setBusy('share');
  try { await runNativeShare(snapshot, deepLink); pulse(true); }
  catch { /* user cancelled — silent (no pulse, no toast) */ }
  finally { setBusy(null); }
}

async function runShareFailover(deepLink: string): Promise<void> {
  await copyWithFeedback(deepLink, {
    successMessage: 'Share unsupported — link copied instead.',
    announce: 'room',
  });
}

async function runNativeShare(snapshot: ThreadSnapshot, deepLink: string): Promise<void> {
  await navigator.share({
    title: snapshot.title || 'A thread I kept',
    text: 'This is what reading felt like.',
    url: deepLink,
  });
  emitCheckpoint(CHECKPOINTS.SHARED);
}
