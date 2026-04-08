/**
 * ShareOverlay — share actions that appear after QuickMirrorCard rest phase.
 *
 * Shows: Download PNG, Copy text, Share on X, and a deep-link URL
 * that friends can click to see "A Deep Diver sent you here."
 *
 * Design tokens: gold for actions, mist for links, fog for borders.
 */
'use client';

import { useState, useCallback } from 'react';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
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

  const handleCopyText = useCopyText(result.archetype, articleId, setCopied);
  const handleSaveImage = useSaveImage(result);
  const handleX = useXShare(result.archetype, articleId);

  return (
    <div className="mt-4 flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        <ActionBtn onClick={handleSaveImage} label="Save Image" />
        <ActionBtn onClick={handleCopyText} label={copied ? '✓ Copied' : 'Copy Text'} />
        <ActionBtn onClick={handleX} label="Share on X" external />
      </div>
      <DeepLink url={deepUrl} />
    </div>
  );
}

/* ─── Sub-components (each ≤ 10 lines) ──────────────────── */

function ActionBtn({ onClick, label, external }: {
  onClick: () => void; label: string; external?: boolean;
}) {
  return (
    <button onClick={onClick} className={btnClass()}>
      {label}{external && ' ↗'}
    </button>
  );
}

function DeepLink({ url }: { url: string }) {
  return (
    <p className="text-mist/40 text-xs mt-2 max-w-[320px] truncate text-center">
      {url}
    </p>
  );
}

/* ─── Style helper ──────────────────────────────────────── */

function btnClass(): string {
  return 'px-4 py-1.5 rounded-lg border border-gold/30 text-gold text-xs'
    + ' hover:bg-gold/10 transition-colors duration-200';
}

/* ─── Hooks (thin wrappers over pure functions) ─────────── */

function useSaveImage(result: QuickMirrorResult) {
  return useCallback(() => {
    const dataUrl = generateQuickMirrorCard(result);
    downloadDataURL(dataUrl, result.archetype);
  }, [result]);
}

function useCopyText(
  archetype: string, articleId: string | undefined,
  setCopied: (v: boolean) => void,
) {
  return useCallback(async () => {
    const text = generateShareText(archetype as any, articleId);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [archetype, articleId, setCopied]);
}

function useXShare(archetype: string, articleId: string | undefined) {
  return useCallback(() => {
    const url = generateXLink(archetype as any, articleId);
    window.open(url, 'share', 'width=600,height=400');
  }, [archetype, articleId]);
}
