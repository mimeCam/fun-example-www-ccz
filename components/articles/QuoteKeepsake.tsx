/**
 * QuoteKeepsake — the second native speaker of the direct-gesture asymmetry.
 *
 * A direct sibling of `<ThreadKeepsake>` (Tanya #75 §4.2 — "same shell, same
 * action vocabulary"). Where ThreadKeepsake speaks for the Golden Thread,
 * QuoteKeepsake speaks for a quote a reader chose to remember (a Resonance
 * quote, today; any selection-derived passage tomorrow).
 *
 *   ┌──────────────────────────────────────────────┐
 *   │  Save this quote                       [✕]   │
 *   │  A line worth carrying.                      │
 *   ├──────────────────────────────────────────────┤
 *   │   [ rendered 1080×1080 quote card preview ]  │
 *   ├──────────────────────────────────────────────┤
 *   │      ┌────────────────────────────┐          │
 *   │      │  ↗  Share this card        │          │
 *   │      └────────────────────────────┘          │
 *   │   ⧉  Copy     ⤓  Save     🔗  Link           │
 *   └──────────────────────────────────────────────┘
 *
 * The whole point of this host (Mike #81 §1, Tanya #75 §4.3): N=2 native
 * speakers of the direct-gesture asymmetry contract. Same `<ActionPressable>`,
 * same `useActionPhase`, same sr-only `<PhaseAnnouncement>`, same
 * `min-w-[14rem]` width discipline on the primary CTA. **No success toast
 * on any of the four verbs.** Failure escalates one level via the existing
 * `showExportError` (warn intent) or `copyWithFeedback`'s default warn path.
 *
 * Reuse audit (per AGENTS.md "begin from shared code"):
 *   • <Threshold>          — modal mechanics (ESC / backdrop / focus / scroll-lock)
 *   • <ActionPressable>    — the fingertip witness
 *   • useActionPhase       — idle ↔ busy ↔ settled phase machine
 *   • copyWithFeedback     — clipboard helper with default-quiet covenant
 *   • exportQuoteCard      — the lib's retry orchestrator (refactored, silent on success)
 *   • copyQuoteCardToClipboard / downloadQuoteCard — the two atoms
 *   • emitCheckpoint(SHARED) — reader-loop funnel parity with ThreadKeepsake
 *
 * Net new shared code: zero. The "second host" earns its keep by speaking
 * the existing dialect, not by inventing a sibling primitive (Mike rule of
 * three; doctrine: AGENTS.md §"Direct-gesture asymmetry").
 *
 * Credits: Mike K. (#81 napkin — host #2, the same-source rule, the
 * inventory check; the `useKeepsakeActions`-shaped hook lift), Tanya D.
 * (#75 — the focused-frame layout, the cut list (no template picker, no
 * deep-link printout, no Share-on-X peer), the verb table, the bounding-
 * box discipline), Krystle C. (the original sprint pick — quote-card as
 * the second native speaker), Paul K. (the asymmetric-failure-path rule
 * §5.4), Elon M. (the cut-the-colophon-line verdict — no slogan in
 * reader chrome), Sid (this lift; no new primitives).
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  generateQuoteCard, type QuoteCardData,
} from '@/lib/quote-cards/card-generator';
import {
  copyQuoteCardToClipboard, downloadQuoteCard, generateFilename,
  showExportError,
} from '@/lib/quote-cards/export-utils';
import { copyWithFeedback } from '@/lib/sharing/clipboard-utils';
import { Threshold } from '@/components/shared/Threshold';
import { Pressable } from '@/components/shared/Pressable';
import { ActionPressable } from '@/components/shared/ActionPressable';
import {
  CloseIcon, ShareIcon, CopyIcon, DownloadIcon, LinkIcon,
} from '@/components/shared/Icons';
import { useActionPhase, type UseActionPhaseResult } from '@/lib/hooks/useActionPhase';
import { CHECKPOINTS, emitCheckpoint } from '@/lib/hooks/useLoopFunnel';

interface QuoteKeepsakeProps {
  isOpen: boolean;
  onClose: () => void;
  /** The quote + article context the card paints. `null` renders nothing. */
  data: QuoteCardData | null;
  /** Optional deep-link to the originating article — drives the Link verb. */
  deepLink?: string;
  /**
   * Fired exactly once on a successful **Save** (download) — the one
   * artifact-producing verb on this surface. Mounted by
   * `<ResonanceEntry>` so the originating `<QuoteCardLauncher>` can
   * repaint in `gold/quiet` for the rest of the session (the visited-
   * foreshadow sentence; Tanya UIX #98 §0, Mike #31 §1).
   *
   * Deliberately NOT fired on Copy / Link / Share. Save is the artifact
   * verb (a durable file lands in the reader's downloads); the other
   * three are reach. If product later wants Share to also count, we add
   * a second prop (`onShared`) — never a generic "anything happened"
   * callback (Mike #31 §4).
   */
  onSaved?: () => void;
}

/** One verb at a time. Mirrors ThreadKeepsake's `Busy` slot vocabulary. */
type Busy = null | 'copy' | 'download' | 'share' | 'link';

// ─── Public surface ────────────────────────────────────────────────────────

/**
 * Mounts only when `isOpen && data`. Generates the rendered card lazily
 * (the canvas paint costs ~30 ms; deferring it past first frame keeps the
 * reveal animation honest — Tanya #75 §3.4 "modal enter ≤ 150 ms").
 */
export function QuoteKeepsake(props: QuoteKeepsakeProps): JSX.Element | null {
  const { isOpen, onClose, data, deepLink, onSaved } = props;
  const dataUrl = useGeneratedCard(data, isOpen);
  if (!data) return null;
  return (
    <Threshold isOpen={isOpen} onClose={onClose}
      labelledBy="quote-keepsake-title" describedBy="quote-keepsake-blurb"
      variant="center">
      <KeepsakeHeader onClose={onClose} />
      <KeepsakePreview dataUrl={dataUrl} title={data.articleTitle} />
      <KeepsakeActions data={data} dataUrl={dataUrl}
        deepLink={deepLink ?? ''} onSaved={onSaved} />
    </Threshold>
  );
}

/* ─── Lazy card generation ──────────────────────────────────────────────── */

/**
 * Fire `generateQuoteCard()` once per (data, open) tuple. Pure-client; the
 * canvas paint is SSR-illegal and the modal renders inside a portal mounted
 * on `document.body`, so the `'use client'` boundary covers us. Errors fall
 * back to an empty string — the preview frame stays empty rather than
 * crashing the modal (the failure escalates when the verb is pressed).
 */
function useGeneratedCard(
  data: QuoteCardData | null,
  isOpen: boolean,
): string {
  const [dataUrl, setDataUrl] = useState('');
  const key = data ? `${data.quote}|${data.author}|${data.articleTitle}` : '';
  useEffect(() => {
    if (!isOpen || !data) { setDataUrl(''); return; }
    let cancelled = false;
    generateQuoteCard(data)
      .then(url => { if (!cancelled) setDataUrl(url); })
      .catch(err => { console.error('Failed to render quote card:', err); });
    return () => { cancelled = true; };
  }, [key, isOpen, data]);
  return dataUrl;
}

/* ─── Header ─────────────────────────────────────────────────────────────── */

function KeepsakeHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between p-sys-6 pb-sys-4">
      <div>
        <h3 id="quote-keepsake-title"
            className="text-sys-lg font-display font-sys-display text-foreground">
          Save this quote
        </h3>
        <p id="quote-keepsake-blurb" className="text-mist text-sys-caption mt-sys-1">
          A line worth carrying.
        </p>
      </div>
      <Pressable
        variant="icon"
        onClick={onClose}
        className="-mr-sys-3"
        aria-label="Close keepsake">
        <CloseIcon />
      </Pressable>
    </div>
  );
}

/* ─── Preview ────────────────────────────────────────────────────────────── */

interface PreviewProps { dataUrl: string; title: string }

/**
 * Opaque preview frame — `bg-void` is deliberate (Tanya #75 §3.5: the card
 * IS the subject; layering it over a translucent panel produces a busy
 * composite). Aspect ratio pinned to 1:1, matching the renderer's 1080×1080.
 */
function KeepsakePreview({ dataUrl, title }: PreviewProps) {
  return (
    <div className="mx-sys-6 mb-sys-5 rounded-sys-medium overflow-hidden
                    border border-fog/20 bg-void">
      <div
        role="img"
        aria-label={`Quote card: ${title}`}
        className="w-full"
        style={{ aspectRatio: '1 / 1' }}
      >
        {dataUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={dataUrl} alt="" className="block w-full h-full" />
          : <div className="w-full h-full" aria-hidden="true" />}
      </div>
    </div>
  );
}

/* ─── Actions — single primary + 3 icon-led secondaries ──────────────────── */

interface ActionsProps {
  data: QuoteCardData;
  dataUrl: string;
  deepLink: string;
  /** Optional Save-success witness — propagates to `runDownload`. See
   *  the file-level prop docs for the artifact-verb-only rationale. */
  onSaved?: () => void;
}

function KeepsakeActions({ data, dataUrl, deepLink, onSaved }: ActionsProps) {
  const a = useQuoteActions({ data, dataUrl, deepLink, onSaved });
  return (
    <div className="px-sys-6 pb-sys-6">
      <PrimaryShare onClick={a.onShare} slot={a.shareSlot} />
      <SecondaryRow
        onCopy={a.onCopy}     copySlot={a.copySlot}
        onSave={a.onDownload} saveSlot={a.saveSlot}
        onLink={a.onCopyLink} linkSlot={a.linkSlot}
      />
    </div>
  );
}

/**
 * Primary "Share this card" — gold solid, ↗ glyph, single verb. Wears the
 * same fingertip witness as the secondary row (Mike #26 §3 / Tanya #81 §5).
 * `min-w-[14rem]` pins the bounding box across the "Share this card" →
 * "Shared" content swap (Tanya §6 width discipline).
 */
function PrimaryShare({ onClick, slot }: {
  onClick: () => void; slot: UseActionPhaseResult;
}) {
  return (
    <div className="mb-sys-4 flex justify-center">
      <ActionPressable
        variant="solid"
        size="md"
        onClick={onClick}
        phase={slot.phase}
        reduced={slot.reduced}
        icon={<ShareIcon size={16} />}
        idleLabel="Share this card"
        settledLabel="Shared"
        hint="Share this card"
        className="min-w-[14rem]"
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
 * Three icon-led ghost siblings. Distribution centered-by-spacing; each
 * slot owns its own `useActionPhase` so the receipt lives at the fingertip
 * independently per-button (Tanya §5 / Mike §4).
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
  data: QuoteCardData;
  dataUrl: string;
  deepLink: string;
  /** Save-success witness; threaded into `runDownload` only. */
  onSaved?: () => void;
}

/**
 * Four verbs the modal speaks + a single `busy` slot (one verb at a time)
 * + per-slot phase machines. Same shape as `useKeepsakeActions` in
 * ThreadKeepsake — the dialect is identical, only the work changes.
 */
function useQuoteActions(inputs: ActionHandlerInputs) {
  const { data, dataUrl, deepLink, onSaved } = inputs;
  const [busy, setBusy] = useState<Busy>(null);
  const copySlot  = useActionPhase(busy === 'copy');
  const saveSlot  = useActionPhase(busy === 'download');
  const linkSlot  = useActionPhase(busy === 'link');
  const shareSlot = useActionPhase(busy === 'share');
  const onCopy = useCallback(
    () => runCopyImage(dataUrl, setBusy, copySlot.pulse), [dataUrl, copySlot.pulse]);
  const onDownload = useCallback(
    () => runDownload(dataUrl, data, setBusy, saveSlot.pulse, onSaved),
    [dataUrl, data, saveSlot.pulse, onSaved]);
  const onCopyLink = useCallback(
    () => runCopyLink(deepLink, setBusy, linkSlot.pulse),
    [deepLink, linkSlot.pulse]);
  const onShare = useCallback(
    () => runShare(data, deepLink, setBusy, shareSlot.pulse),
    [data, deepLink, shareSlot.pulse]);
  return { copySlot, saveSlot, linkSlot, shareSlot,
    onCopy, onDownload, onCopyLink, onShare };
}

type Pulse = (ok: boolean) => void;

/**
 * Copy-as-image verb. Failure routes through `showExportError` (warn) so
 * the room voice still speaks when the contract breaks; success stays at
 * the fingertip via `pulse(true)` (Mike #81 §8.3).
 */
async function runCopyImage(
  dataUrl: string, setBusy: (b: Busy) => void, pulse: Pulse,
): Promise<void> {
  setBusy('copy');
  try {
    const ok = dataUrl ? await copyQuoteCardToClipboard(dataUrl) : false;
    if (ok) emitCheckpoint(CHECKPOINTS.SHARED);
    else showExportError('clipboard');
    pulse(ok);
  } finally { setBusy(null); }
}

/**
 * Save (download) verb — the single artifact-producing path. On success
 * we fire (in order):
 *   1. `emitCheckpoint(SHARED)`  — reader-loop funnel parity
 *   2. `pulse(ok)`               — fingertip witness lands first (room
 *                                  voice silent — direct-gesture asymmetry)
 *   3. `onSaved?.()`             — the room-scale visited foreshadow,
 *                                  fired *after* pulse so the reader's
 *                                  fingertip sees the receipt first and
 *                                  discovers the launcher repaint when
 *                                  they look back at the card (Mike #31
 *                                  §7 PoI #1; Tanya #98 §3).
 *
 * Failure escalates via `showExportError('download')` (warn intent —
 * the asymmetry contract). `onSaved` is NOT fired on failure: the visited
 * paint marks a durable artifact in the reader's downloads, and a
 * failed download is the absence of that artifact (Mike #31 §4).
 */
async function runDownload(
  dataUrl: string, data: QuoteCardData,
  setBusy: (b: Busy) => void, pulse: Pulse,
  onSaved?: () => void,
): Promise<void> {
  setBusy('download');
  try {
    const ok = await tryDownload(dataUrl, data);
    if (ok) emitCheckpoint(CHECKPOINTS.SHARED);
    else showExportError('download');
    pulse(ok);
    if (ok) onSaved?.();
  } finally { setBusy(null); }
}

/** Pure helper: only attempt the download when we actually have a dataUrl. */
async function tryDownload(dataUrl: string, data: QuoteCardData): Promise<boolean> {
  if (!dataUrl) return false;
  return downloadQuoteCard(dataUrl, { filename: generateFilename(data.quote, data.author) });
}

/**
 * Copy-the-deep-link verb. `copyWithFeedback`'s default-quiet covenant
 * already honours the asymmetry (success silent, failure warn), so the
 * Link slot adopts it byte-for-byte from ThreadKeepsake (Mike #21 / Tanya #10).
 */
async function runCopyLink(
  deepLink: string, setBusy: (b: Busy) => void, pulse: Pulse,
): Promise<void> {
  setBusy('link');
  try {
    if (!deepLink) { pulse(false); return; }
    const ok = await copyWithFeedback(deepLink, {
      successMessage: 'Link copied — the quote travels with it.',
      failureMessage: "Couldn't copy — try Save instead.",
    });
    pulse(ok);
  } finally { setBusy(null); }
}

/**
 * `navigator.share` primary — same two-branch shape as ThreadKeepsake's
 * `runShare`. The no-API failover routes through `copyWithFeedback` with
 * an explicit `announce: 'room'` opt-in (no fingertip witness available
 * in that branch — Mike #26 §5).
 */
async function runShare(
  data: QuoteCardData, deepLink: string,
  setBusy: (b: Busy) => void, pulse: Pulse,
): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    await runShareFailover(deepLink || data.url || '');
    return;
  }
  setBusy('share');
  try { await runNativeShare(data, deepLink); pulse(true); }
  catch { /* user cancelled — silent (no pulse, no toast) */ }
  finally { setBusy(null); }
}

async function runShareFailover(url: string): Promise<void> {
  if (!url) return;
  await copyWithFeedback(url, {
    successMessage: 'Share unsupported — link copied instead.',
    announce: 'room',
  });
}

async function runNativeShare(
  data: QuoteCardData, deepLink: string,
): Promise<void> {
  await navigator.share({
    title: data.articleTitle || 'A quote I kept',
    text: `"${data.quote}" — ${data.author}`,
    url: deepLink || data.url || '',
  });
  emitCheckpoint(CHECKPOINTS.SHARED);
}
