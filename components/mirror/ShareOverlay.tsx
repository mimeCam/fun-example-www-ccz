/**
 * ShareOverlay — icon-based share actions after mirror card reveal.
 *
 * Three icon buttons (Save PNG, Copy Link, Share on X) in a row.
 * Staggered reveal: delays sourced from `lib/design/motion.ts` so every
 * stagger on the site reads from the same motion ledger.
 * Icons > text for instant visual parsing (Picture Superiority effect).
 *
 * Verb graduation (Mike napkin #92, Tanya UIX #99) — the hover tooltip's
 * opacity transition reads off the Gesture Atlas via
 * `gestureClassesForMotion('crossfade-inline', reduce)`. Felt sentence:
 * *"One label replacing another — instant enough I don't see the seam."*
 * The verb's `reduced: 'perform'` row keeps the gesture as authored even
 * under `prefers-reduced-motion: reduce` — labels stay fast and predictable.
 *
 * Layout polish (Tanya UIX #99 §2): the tooltip is pinned ABOVE the icon
 * (`-top-9`), out of the gutter where the DeepLink paragraph lives. The
 * outer column gap stepped one rung wider (`gap-sys-4`) and the DeepLink
 * lifted from `muted` (30) to `recede` (50) — the alpha-ledger rung for
 * "context around the subject" — so the URL reads as quietly informational
 * rather than decorative noise. A 6×6 `rotate-45 bg-void` caret pins the
 * tooltip to its anchor button.
 *
 * The post-click "Copied!" handoff is intentionally NOT graduated this
 * cycle (Tanya UIX #99 §7) — that surface is a *receipt*, not a label,
 * and earns `action-swap` on its own micro-PR once the rule-of-three has
 * fired. The current `mirror-share-confirm` recipe stays in place.
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
import { copyToClipboard } from '@/lib/sharing/clipboard-utils';
import { Pressable } from '@/components/shared/Pressable';
import { MOTION } from '@/lib/design/motion';
import { gestureClassesForMotion } from '@/lib/design/gestures';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

/**
 * Stagger step between icon reveals — half the `instant` beat (75ms… but
 * we want 100ms, which is a half-`hover` or 5x `MOTION_REDUCED_MS`).
 * The siblings reveal at 0, STAGGER, 2×STAGGER so each button is its own
 * held breath before landing. Sourced so every stagger on the site reads
 * from motion tokens.
 */
const SHARE_STAGGER_MS = MOTION.hover / 2;              // 100
/** Copy toast dwell — two `linger` beats; Matches ReturnLetter COPY_TOAST_MS. */
const COPY_TOAST_MS    = MOTION.linger * 2;             // 2000

interface Props {
  result: QuickMirrorResult;
  articleId?: string;
}

export default function ShareOverlay({ result, articleId }: Props) {
  const [copied, setCopied] = useState(false);
  const reduce = useReducedMotion();
  const deepUrl = encodeDeepLink(result.archetype, articleId);

  // Outer column gap stepped from `sys-3` → `sys-4` (Tanya UIX #99 §2b) —
  // gives the DeepLink paragraph below airspace clear of the icon row.
  return (
    <div className="mt-sys-4 flex flex-col items-center gap-sys-4">
      <div className="flex justify-center gap-sys-4">
        <StaggeredIconBtn delay={0}
          onClick={useSaveImage(result)}
          label="Save PNG" icon={<DownloadIcon />} reduce={reduce} />
        <StaggeredIconBtn delay={SHARE_STAGGER_MS}
          onClick={useCopyText(result.archetype, articleId, setCopied)}
          label={copied ? 'Copied!' : 'Copy Link'}
          icon={copied ? <CheckIcon /> : <ClipboardIcon />}
          confirm={copied} reduce={reduce} />
        <StaggeredIconBtn delay={SHARE_STAGGER_MS * 2}
          onClick={useXShare(result.archetype, articleId)}
          label="Share on X" icon={<XIcon />} reduce={reduce} />
      </div>
      <DeepLink url={deepUrl} />
    </div>
  );
}

/* ─── Staggered icon button with fade-in ─────────────────── */
//
// gesture-ledger:exempt — `animate-fade-in` is a CSS keyframe (paint, not
// gesture) per Tanya UIX §5.3; out of the verb registry's scope, same
// exemption pattern as `mirror-archetype-label` in MirrorRevealCard.

function StaggeredIconBtn({ onClick, label, icon, delay, confirm, reduce }: {
  onClick: () => void; label: string; icon: React.ReactNode;
  delay: number; confirm?: boolean; reduce: boolean;
}) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${delay}ms`, animationFillMode: 'both' }}>
      <IconBtn onClick={onClick} label={label} icon={icon} confirm={confirm} reduce={reduce} />
    </div>
  );
}

/* ─── Icon button with tooltip ──────────────────────────── */

function IconBtn({ onClick, label, icon, confirm, reduce }: {
  onClick: () => void; label: string; icon: React.ReactNode;
  confirm?: boolean; reduce: boolean;
}) {
  return (
    <Pressable
      variant="icon"
      size="sm"
      onClick={onClick}
      aria-label={label}
      className={`group ${confirm ? 'mirror-share-confirm' : ''}`}
    >
      {icon}
      <Tooltip label={label} reduce={reduce} />
    </Pressable>
  );
}

/* ─── Tooltip — verb-graduated hover label ──────────────── */
//
// Mike napkin #92 / Tanya UIX #99 §1: the opacity transition rides
// `gestureClassesForMotion('crossfade-inline', reduce)` — one verb names
// the (duration, ease) pair at the call site. The verb's `reduced:
// 'perform'` row keeps the gesture as authored under
// `prefers-reduced-motion: reduce` — labels stay fast and predictable.
// The composer is JIT-safe by table-of-literals construction (same lesson
// `alphaClassOf` paid for); never template-interpolate the duration class.
//
// Layout (Tanya UIX #99 §2a): tooltip pinned ABOVE the icon (`-top-9`),
// out of the DeepLink paragraph's gutter; caret rotated from the bottom
// edge points down to its anchor button.

function Tooltip({ label, reduce }: { label: string; reduce: boolean }) {
  // alpha-ledger:exempt — motion fade endpoints (hover tooltip α=0/α=1 pair)
  // The verb factory owns the (duration, ease) pair on this transition; the
  // OPACITY endpoints (`opacity-0` / `group-hover:opacity-100`) remain
  // Motion-owned per the alpha-ledger carve-out — same shape Tanya UIX #99
  // §3 named "the carve-out comment can stay; it's still accurate."
  return (
    <span className={`pointer-events-none absolute -top-9 left-1/2
      -translate-x-1/2 rounded-sys-medium bg-void text-mist text-sys-micro px-sys-2 py-sys-1
      shadow-sys-rest whitespace-nowrap
      opacity-0 group-hover:opacity-100 transition-opacity
      ${gestureClassesForMotion('crossfade-inline', reduce)}`}>
      {label}
      <TooltipCaret />
    </span>
  );
}

/** 6×6 caret pinned to the tooltip's bottom edge — roots the chip to its
 *  anchor button so the eye knows which icon owns the noun. (Tanya UIX
 *  #99 §3 — "tooltip without a caret reads as a free-floating brand chip".) */
function TooltipCaret() {
  return (
    <span className="pointer-events-none absolute left-1/2 -bottom-0.5
      h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-void shadow-sys-rest" />
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
//
// Alpha-ledger snap (Tanya UIX #99 §2c): `/30` (muted) → `/50` (recede).
// Tanya's spec named `/40` for the felt sentence; the alpha ledger only
// recognises 10/30/50/70 (`hairline | muted | recede | quiet`), so the
// snap-up rung is `recede` — *"context around the subject"* per the
// alpha-ledger JSDoc. The URL now reads as quietly informational rather
// than decorative noise, which is the exact intent Tanya named.
// TODO: when the next alpha-ledger pass earns a /40 rung (or a "soft
// muted" name), revisit. For now the canonical rung lands the felt
// sentence and stays inside the call-site fence.

function DeepLink({ url }: { url: string }) {
  return (
    <p className="text-mist/50 text-sys-micro mt-sys-2 max-w-card-body truncate text-center">
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
    const ok = await copyToClipboard(text);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), COPY_TOAST_MS);
  }, [archetype, articleId, setCopied]);
}

function useXShare(archetype: ArchetypeKey, articleId: string | undefined) {
  return useCallback(() => {
    const url = generateXLink(archetype, articleId);
    window.open(url, 'share', 'width=600,height=400');
  }, [archetype, articleId]);
}
