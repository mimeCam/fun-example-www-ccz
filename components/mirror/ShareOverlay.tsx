/**
 * ShareOverlay — icon-based share actions after mirror card reveal.
 *
 * Three icon buttons (Save PNG, Copy Link, Share on X) in a row.
 * Staggered reveal: 0ms / 100ms / 200ms delay for each button.
 * Icons > text for instant visual parsing (Picture Superiority effect).
 */

'use client';

import { useState, useCallback } from 'react';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
import type { ArchetypeKey } from '@/types/content';
import { generateQuickMirrorCard } from '@/lib/mirror/quick-mirror-card-generator';
import {
  generateShareText,
  generateXLink,
  downloadDataURL,
} from '@/lib/sharing/share-card';
import { encodeDeepLink } from '@/lib/sharing/deep-link';

interface Props {
  result: QuickMirrorResult;
  articleId?: string;
}

export default function ShareOverlay({ result, articleId }: Props) {
  const [copied, setCopied] = useState(false);
  const deepUrl = encodeDeepLink(result.archetype, articleId);

  return (
    <div className="mt-sys-4 flex flex-col items-center gap-sys-3">
      <div className="flex justify-center gap-sys-4">
        <StaggeredIconBtn delay={0}
          onClick={useSaveImage(result)}
          label="Save PNG" icon={<DownloadIcon />} />
        <StaggeredIconBtn delay={100}
          onClick={useCopyText(result.archetype, articleId, setCopied)}
          label={copied ? 'Copied!' : 'Copy Link'}
          icon={copied ? <CheckIcon /> : <ClipboardIcon />}
          confirm={copied} />
        <StaggeredIconBtn delay={200}
          onClick={useXShare(result.archetype, articleId)}
          label="Share on X" icon={<XIcon />} />
      </div>
      <DeepLink url={deepUrl} />
    </div>
  );
}

/* ─── Staggered icon button with fade-in ─────────────────── */

function StaggeredIconBtn({ onClick, label, icon, delay, confirm }: {
  onClick: () => void; label: string; icon: React.ReactNode;
  delay: number; confirm?: boolean;
}) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      <IconBtn onClick={onClick} label={label} icon={icon} confirm={confirm} />
    </div>
  );
}

/* ─── Icon button with tooltip ──────────────────────────── */

function IconBtn({ onClick, label, icon, confirm }: {
  onClick: () => void; label: string; icon: React.ReactNode; confirm?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-12 h-12 rounded-sys-medium
        border border-gold/20 text-gold/70
        hover:text-gold hover:bg-gold/10 hover:border-gold/40
        flex items-center justify-center transition-all duration-hover
        ${confirm ? 'mirror-share-confirm' : ''}`}
      aria-label={label}
    >
      {icon}
      <span className="pointer-events-none absolute -bottom-8 left-1/2
        -translate-x-1/2 rounded-sys-medium bg-void text-mist text-sys-micro px-sys-2 py-sys-1
        opacity-0 group-hover:opacity-100 transition-opacity duration-instant whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

/* ─── SVG Icons (inline, no deps) ───────────────────────── */

function DownloadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99
        21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084
        4.126H5.117z" />
    </svg>
  );
}

/* ─── Deep link display ──────────────────────────────────── */

function DeepLink({ url }: { url: string }) {
  return (
    <p className="text-mist/30 text-sys-micro mt-sys-2 max-w-card-body truncate text-center">
      {url}
    </p>
  );
}

/* ─── Hooks (thin wrappers over pure functions) ─────────── */

function useSaveImage(result: QuickMirrorResult) {
  return useCallback(() => {
    const dataUrl = generateQuickMirrorCard(result);
    downloadDataURL(dataUrl, result.archetype);
  }, [result]);
}

function useCopyText(
  archetype: ArchetypeKey, articleId: string | undefined,
  setCopied: (v: boolean) => void,
) {
  return useCallback(async () => {
    const text = generateShareText(archetype, articleId);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [archetype, articleId, setCopied]);
}

function useXShare(archetype: ArchetypeKey, articleId: string | undefined) {
  return useCallback(() => {
    const url = generateXLink(archetype, articleId);
    window.open(url, 'share', 'width=600,height=400');
  }, [archetype, articleId]);
}
