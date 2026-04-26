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
 * unfurl), Tanya D. (UX §4 — single-primary action layout, icon + verb
 * balance, modal motion discipline; UX §0 — the "loop's last syllable"
 * brief), Sid (this refactor — action collapse, SHARED checkpoint
 * emission, icon-set extraction).
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildThreadSVG,
  KEEPSAKE_DIMENSIONS,
  type ThreadSnapshot,
} from '@/lib/sharing/thread-render';
import { buildKeepsakeHref, buildUnfurlUrl } from '@/lib/sharing/thread-snapshot';
import { copyWithFeedback, showCopyFeedback } from '@/lib/sharing/clipboard-utils';
import { copyPngToClipboard, downloadPng } from '@/lib/sharing/svg-to-png';
import { Threshold } from '@/components/shared/Threshold';
import { Pressable } from '@/components/shared/Pressable';
import {
  CloseIcon, ShareIcon, CopyIcon, DownloadIcon, LinkIcon,
} from '@/components/shared/Icons';
import { CHECKPOINTS, emitCheckpoint } from '@/lib/hooks/useLoopFunnel';

interface ThreadKeepsakeProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: ThreadSnapshot | null;
}

/** Busy slot for the action buttons. One verb at a time. */
type Busy = null | 'copy' | 'download' | 'share';

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
      <PrimaryShare onClick={a.onShare} busy={a.busy === 'share'} />
      <SecondaryRow
        onCopy={a.onCopyImage} busyCopy={a.busy === 'copy'}
        onSave={a.onDownload} busySave={a.busy === 'download'}
        onLink={a.onCopyLink}
      />
      {isDev && (
        <p className="mt-sys-4 text-mist/60 text-sys-micro break-all">
          unfurl: {unfurlUrl}
        </p>
      )}
    </div>
  );
}

/** Primary "Share this thread" — gold solid, ↗ glyph, single verb. */
function PrimaryShare({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <div className="mb-sys-4 flex justify-center">
      <Pressable
        variant="solid"
        size="md"
        onClick={onClick}
        disabled={busy}
        aria-label="Share this thread"
        className="min-w-[14rem] gap-sys-2"
      >
        <ShareIcon size={16} />
        <span>{busy ? 'Sharing…' : 'Share this thread'}</span>
      </Pressable>
    </div>
  );
}

interface SecondaryRowProps {
  onCopy: () => void; busyCopy: boolean;
  onSave: () => void; busySave: boolean;
  onLink: () => void;
}

/**
 * Three icon-led ghost siblings — Copy / Save / Link. Verbs balance with
 * the primary's two-word verb (logic principle #14). Distribution is
 * centered-by-spacing, not centered-by-text (Tanya §4.4 alignment rule).
 */
function SecondaryRow(p: SecondaryRowProps) {
  return (
    <div className="flex items-center justify-center gap-sys-3 flex-wrap">
      <SecondaryAction onClick={p.onCopy} busy={p.busyCopy}
        icon={<CopyIcon size={14} />} label="Copy" hint="Copy image" />
      <SecondaryAction onClick={p.onSave} busy={p.busySave}
        icon={<DownloadIcon size={14} />} label="Save" hint="Download PNG" />
      <SecondaryAction onClick={p.onLink}
        icon={<LinkIcon size={14} />} label="Link" hint="Copy link" />
    </div>
  );
}

interface SecondaryActionProps {
  onClick: () => void;
  busy?: boolean;
  icon: JSX.Element;
  label: string;
  /** Long-form name surfaced via `aria-label` and `title` for tool-tip. */
  hint: string;
}

function SecondaryAction({ onClick, busy, icon, label, hint }: SecondaryActionProps) {
  return (
    <Pressable
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={!!busy}
      aria-label={hint}
      title={hint}
      className="gap-sys-2"
    >
      {icon}
      <span>{busy ? '…' : label}</span>
    </Pressable>
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
 * a time). Pulled into its own hook so the render fn stays presentational
 * and each callback is independently grep-recoverable.
 */
function useKeepsakeActions(inputs: ActionHandlerInputs) {
  const { svg, snapshot, deepLink } = inputs;
  const [busy, setBusy] = useState<Busy>(null);
  const onCopyImage = useCallback(() => runCopyImage(svg, setBusy), [svg]);
  const onDownload  = useCallback(() => runDownload(svg, snapshot, setBusy), [svg, snapshot]);
  const onCopyLink  = useCallback(() => runCopyLink(deepLink), [deepLink]);
  const onShare     = useCallback(
    () => runShare(snapshot, deepLink, setBusy),
    [snapshot, deepLink],
  );
  return { busy, onCopyImage, onDownload, onCopyLink, onShare };
}

async function runCopyImage(svg: string, setBusy: (b: Busy) => void): Promise<void> {
  setBusy('copy');
  try {
    const ok = await copyPngToClipboard(svg);
    if (ok) emitCheckpoint(CHECKPOINTS.SHARED);
    showCopyFeedback(ok ? 'Keepsake copied.' : 'Copy unsupported — try Save.');
  } finally { setBusy(null); }
}

async function runDownload(
  svg: string, snapshot: ThreadSnapshot, setBusy: (b: Busy) => void,
): Promise<void> {
  setBusy('download');
  try {
    await downloadPng(svg, filenameFor(snapshot));
    emitCheckpoint(CHECKPOINTS.SHARED);
  } finally { setBusy(null); }
}

async function runCopyLink(deepLink: string): Promise<void> {
  // copyWithFeedback already emits SHARED on the clipboard-utils path.
  await copyWithFeedback(deepLink, 'Link copied — the thread travels with it.');
}

async function runShare(
  snapshot: ThreadSnapshot, deepLink: string, setBusy: (b: Busy) => void,
): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    await copyWithFeedback(deepLink, 'Share unsupported — link copied instead.');
    return;
  }
  setBusy('share');
  try {
    await navigator.share({
      title: snapshot.title || 'A thread I kept',
      text: 'This is what reading felt like.',
      url: deepLink,
    });
    emitCheckpoint(CHECKPOINTS.SHARED);
  } catch { /* user cancelled — silent */ }
  finally { setBusy(null); }
}
