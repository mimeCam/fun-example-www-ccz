/**
 * ThreadKeepsake — modal that turns the reader's Golden Thread into a
 * shareable, cropable, DM-able artifact. The site's "invite engine."
 *
 * Paul: "must be beautiful in isolation." Mike: "mirror the Thread can
 * walk through." Tanya: micro-animation discipline — modal fade only,
 * no lift, no scale; SVG preview is static.
 *
 * Polish notes:
 *  - Preview SVG is the SAME buildThreadSVG used by /api/og/thread.
 *  - All actions gracefully fall back (no navigator.share → share-links;
 *    no ClipboardItem → download).
 *  - Escape closes; backdrop click closes; focus trap TODO (see below).
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

interface ThreadKeepsakeProps {
  isOpen: boolean;
  onClose: () => void;
  snapshot: ThreadSnapshot | null;
}

function filenameFor(snapshot: ThreadSnapshot): string {
  const safeSlug = snapshot.slug.replace(/[^a-z0-9-]/gi, '-').slice(0, 40);
  return `thread-${safeSlug}.png`;
}

function useKeyboardClose(isOpen: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);
}

function absoluteHref(relative: string): string {
  if (typeof window === 'undefined') return relative;
  return `${window.location.origin}${relative}`;
}

export function ThreadKeepsake({ isOpen, onClose, snapshot }: ThreadKeepsakeProps) {
  useKeyboardClose(isOpen, onClose);
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

  if (!isOpen || !snapshot) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-sys-backdrop bg-void/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="keepsake-title"
        className="fixed inset-0 z-sys-drawer flex items-center justify-center
                   p-sys-6 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-2xl bg-surface/95 backdrop-blur-sm
                        border border-fog/30 rounded-sys-medium thermal-shadow
                        overflow-hidden animate-fade-in">
          <KeepsakeHeader onClose={onClose} />
          <KeepsakePreview svg={svg} title={snapshot.title} />
          <KeepsakeActions
            svg={svg}
            snapshot={snapshot}
            deepLink={deepLink}
            unfurlUrl={unfurlUrl}
          />
        </div>
      </div>
    </>
  );
}

/* ─── Subcomponents ──────────────────────────────────────── */

function KeepsakeHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between p-sys-6 pb-sys-4">
      <div>
        <h3 id="keepsake-title"
            className="text-sys-lg font-display font-sys-display text-foreground">
          Keep this thread
        </h3>
        <p className="text-mist text-sys-caption mt-sys-1">
          A mirror of what you just read, made shareable.
        </p>
      </div>
      <button onClick={onClose}
        className="p-sys-3 -mr-sys-3 text-mist hover:text-foreground
                   transition-colors rounded-sys-medium hover:bg-fog/20"
        aria-label="Close keepsake">
        <CloseIcon />
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

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

interface ActionsProps {
  svg: string;
  snapshot: ThreadSnapshot;
  deepLink: string;
  unfurlUrl: string;
}

function KeepsakeActions({ svg, snapshot, deepLink, unfurlUrl }: ActionsProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const [busy, setBusy] = useState<null | 'copy' | 'download' | 'share'>(null);

  const onCopyImage = useCallback(async () => {
    setBusy('copy');
    try {
      const ok = await copyPngToClipboard(svg);
      showCopyFeedback(ok ? 'Keepsake copied.' : 'Copy unsupported — try Download.');
    } finally { setBusy(null); }
  }, [svg]);

  const onDownload = useCallback(async () => {
    setBusy('download');
    try { await downloadPng(svg, filenameFor(snapshot)); }
    finally { setBusy(null); }
  }, [svg, snapshot]);

  const onCopyLink = useCallback(async () => {
    await copyWithFeedback(deepLink, 'Link copied — the thread travels with it.');
  }, [deepLink]);

  const onShare = useCallback(async () => {
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
    } catch { /* user cancelled — silent */ }
    finally { setBusy(null); }
  }, [deepLink, snapshot]);

  return (
    <div className="px-sys-6 pb-sys-6 grid grid-cols-2 gap-sys-3">
      <ActionButton onClick={onCopyImage} busy={busy === 'copy'} label="Copy image" />
      <ActionButton onClick={onDownload} busy={busy === 'download'} label="Download PNG" />
      <ActionButton onClick={onCopyLink} label="Copy link" ghost />
      <ActionButton onClick={onShare} busy={busy === 'share'} label="Share…" ghost />
      {isDev && (
        <p className="col-span-2 text-mist/60 text-sys-micro break-all">unfurl: {unfurlUrl}</p>
      )}
    </div>
  );
}

interface ActionButtonProps {
  onClick: () => void; label: string; busy?: boolean; ghost?: boolean;
}

function ActionButton({ onClick, label, busy, ghost }: ActionButtonProps) {
  const base = 'px-sys-4 py-sys-3 rounded-sys-medium text-sys-caption transition-colors';
  const solid = 'bg-primary text-foreground hover:bg-secondary disabled:opacity-50';
  const soft  = 'bg-background text-mist hover:bg-fog disabled:opacity-50';
  return (
    <button onClick={onClick} disabled={!!busy}
      className={`${base} ${ghost ? soft : solid}`}>
      {busy ? '…' : label}
    </button>
  );
}
