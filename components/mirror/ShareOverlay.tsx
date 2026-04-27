/**
 * ShareOverlay — icon-based share actions after mirror card reveal.
 *
 * Three icon buttons (Save PNG, Copy Link, Share on X) in a row.
 * Staggered reveal: cadence lives at the paint layer in
 * `app/globals.css` as `.share-stagger-1|2|3` — each class derives its
 * `animation-delay` from `--sys-time-hover` (200ms). One place to retime
 * the breath; the component owns no millisecond literal.
 * Icons > text for instant visual parsing (Picture Superiority effect).
 *
 * Reduced-motion (Tanya UIX #19 §2.1, Mike napkin #96): the
 * `prefers-reduced-motion: reduce` block in globals.css zeroes the
 * per-icon delay so all three icons are present at the same instant the
 * share row mounts. The breath is optional; the receipt is not. The
 * universal `*` reduced-motion rule collapses animation-DURATION but
 * does not zero animation-DELAY — the per-class override is the fix.
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
 * Copy Link receipt (Mike napkin #100, Tanya UIX #99 §3 — *graduated this
 * cycle*): the bespoke `mirror-share-confirm` gold-flash recipe is retired;
 * the Copy Link button now rides the canonical `<ActionPressable>` +
 * `useActionPhase` primitive (verb #4 of `action-swap`, fourth speaker
 * after ReturnLetter, QuoteKeepsake, ThreadKeepsake). The icon glyph swaps
 * Clipboard → Check on settled; the tooltip flips `Copy Link` → `Copied!`
 * sourced from the same phase. The genuine win is the SR receipt — an
 * `aria-live="polite"` peer mounts on the `idle → settled` edge so a blind
 * reader hears "Copied!" once, sourced from the same phase the eye sees.
 * `labelMode='hidden'` keeps the icon row's icon-only aesthetic (the verb
 * paints in the tooltip, not next to the glyph). The `mirror-share-confirm`
 * keyframe is deleted from `app/globals.css` in the same PR — no tombstone
 * comment, the fence + this file's source IS the tombstone (Tanya §7,
 * Elon §4).
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
import { ActionPressable } from '@/components/shared/ActionPressable';
import { useActionPhase, type UseActionPhaseResult } from '@/lib/hooks/useActionPhase';
import { gestureClassesForMotion } from '@/lib/design/gestures';
import { swapWidthClassOf } from '@/lib/design/swap-width';
import {
  staggerClassOf,
  STAGGER_DATA_PROPS,
  type StaggerRung,
} from '@/lib/design/stagger';
import { useReducedMotion } from '@/lib/hooks/useReducedMotion';

/**
 * Stagger rung → paint class — looked up via the canonical Stagger
 * Ledger (`lib/design/stagger.ts`). `family: 'cluster'` is the Share
 * icon row's felt shape: a horizontal politely-yielding cluster.
 *
 * The actual delays live one layer over in `app/globals.css`:
 *   1 → 0ms · 2 → calc(var(--sys-time-hover) / 2) · 3 → var(--sys-time-hover)
 * The `data-sys-stagger` attribute is the silence hook: under
 * `prefers-reduced-motion: reduce`, one selector zeroes the delay so
 * all three icons land instantly.
 */
type StaggerStep = StaggerRung;

interface Props {
  result: QuickMirrorResult;
  articleId?: string;
}

export default function ShareOverlay({ result, articleId }: Props) {
  const [copyBusy, setCopyBusy] = useState(false);
  const copySlot = useActionPhase(copyBusy);
  const reduce = useReducedMotion();
  const deepUrl = encodeDeepLink(result.archetype, articleId);
  const onCopy = useCopyText(result.archetype, articleId, setCopyBusy, copySlot.pulse);

  // Outer column gap stepped from `sys-3` → `sys-4` (Tanya UIX #99 §2b) —
  // gives the DeepLink paragraph below airspace clear of the icon row.
  return (
    <div className="mt-sys-4 flex flex-col items-center gap-sys-4">
      <div className="flex justify-center gap-sys-4">
        <StaggeredIconBtn step={1}
          onClick={useSaveImage(result)}
          label="Save PNG" icon={<DownloadIcon />} reduce={reduce} />
        <StaggeredCopyLink step={2}
          onClick={onCopy} slot={copySlot} reduce={reduce} />
        <StaggeredIconBtn step={3}
          onClick={useXShare(result.archetype, articleId)}
          label="Share on X" icon={<XIcon />} reduce={reduce} />
      </div>
      <DeepLink url={deepUrl} />
    </div>
  );
}

/* ─── Staggered fade-in wrappers ─────────────────────────── */
//
// gesture-ledger:exempt — `animate-fade-in` is a CSS keyframe (paint, not
// gesture) per Tanya UIX §5.3; out of the verb registry's scope, same
// exemption pattern as `mirror-archetype-label` in MirrorRevealCard.
//
// The class string is read off the Stagger Ledger
// (`lib/design/stagger.ts`) for the `cluster` family — the JIT-safe
// table-of-literals lookup pattern this codebase pays for elsewhere.
// `data-sys-stagger` is the silence hook: one CSS selector
// (`[data-sys-stagger]` under `@media (prefers-reduced-motion: reduce)`)
// zeroes both animation-delay and transition-delay for every cascade
// that carries the attribute. The component owns no millisecond literal.

function StaggerSlot({ step, children }: { step: StaggerStep; children: React.ReactNode }) {
  return (
    <div
      className={`animate-fade-in ${staggerClassOf({ family: 'cluster', rung: step })}`}
      {...STAGGER_DATA_PROPS}
    >
      {children}
    </div>
  );
}

function StaggeredIconBtn({ onClick, label, icon, step, reduce }: {
  onClick: () => void; label: string; icon: React.ReactNode;
  step: StaggerStep; reduce: boolean;
}) {
  return (
    <StaggerSlot step={step}>
      <IconBtn onClick={onClick} label={label} icon={icon} reduce={reduce} />
    </StaggerSlot>
  );
}

/**
 * Copy Link slot — graduated to `<ActionPressable>` (action-swap verb #4).
 * The tooltip remains the visible verb (`Copy Link` ↔ `Copied!`); the
 * canonical primitive owns the icon glyph swap, the settled hold dwell,
 * and the SR-only `aria-live="polite"` receipt. Wrapper paints
 * `relative group` so the existing tooltip's hover-opacity transition
 * still pivots off the parent's hover state. (Mike napkin #100 §5 path A.)
 *
 * alpha-ledger:exempt — JSDoc reference, not a class literal. The actual
 *   `opacity-0` / `group-hover:opacity-100` Motion fade endpoints live on
 *   `<Tooltip>`'s JSX with their own carve-out comment (see line ~217).
 */
function StaggeredCopyLink({ onClick, slot, step, reduce }: {
  onClick: () => void; slot: UseActionPhaseResult; step: StaggerStep; reduce: boolean;
}) {
  return (
    <StaggerSlot step={step}>
      <CopyLinkBtn onClick={onClick} slot={slot} reduce={reduce} />
    </StaggerSlot>
  );
}

/* ─── Icon button with tooltip ──────────────────────────── */

function IconBtn({ onClick, label, icon, reduce }: {
  onClick: () => void; label: string; icon: React.ReactNode; reduce: boolean;
}) {
  return (
    <Pressable
      variant="icon"
      size="sm"
      onClick={onClick}
      aria-label={label}
      className="group"
    >
      {icon}
      <Tooltip label={label} reduce={reduce} />
    </Pressable>
  );
}

/**
 * Copy Link button — the third sibling, but the only one that owns a
 * receipt (the click resolves locally; no tab leaves, no download begins).
 * `<ActionPressable variant="icon" labelMode="hidden">` pulls in the
 * canonical glyph-swap + SR peer; the tooltip is mounted as a sibling
 * inside a `relative group` wrapper so the existing `group-hover` opacity
 * toggle still resolves. The visible verb in the tooltip flips off the
 * same `phase` the SR peer reads. (Mike #100 path A; Tanya UIX #99 §3.1.)
 */
function CopyLinkBtn({ onClick, slot, reduce }: {
  onClick: () => void; slot: UseActionPhaseResult; reduce: boolean;
}) {
  const tooltipLabel = slot.phase === 'settled' ? 'Copied!' : 'Copy Link';
  return (
    <span className="relative group inline-flex">
      <ActionPressable
        variant="icon"
        size="sm"
        labelMode="hidden"
        onClick={onClick}
        phase={slot.phase}
        reduced={slot.reduced}
        icon={<ClipboardIcon />}
        idleLabel="Copy Link"
        settledLabel="Copied!"
        hint="Copy share link"
      />
      <Tooltip label={tooltipLabel} reduce={reduce} />
    </span>
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
//
// Width discipline (Tanya UIX #99 §5, Tanya UX #41 §5.3, Mike #39 §3):
// the chip width is pinned across the `Copy Link` ↔ `Copied!` swap via
// `swapWidthClassOf(2)` — the canonical 2-word/short-phrase rung from the
// label-swap-width facet. (9 ch ↔ 7 ch is 2 ch off the ±1 ch contract;
// the min-width keeps the caret centred and the chip from jittering.)
// One helper-composed Tailwind class, zero new motion.

function Tooltip({ label, reduce }: { label: string; reduce: boolean }) {
  // alpha-ledger:exempt — motion fade endpoints (hover tooltip α=0/α=1 pair)
  // The verb factory owns the (duration, ease) pair on this transition; the
  // OPACITY endpoints (`opacity-0` / `group-hover:opacity-100`) remain
  // Motion-owned per the alpha-ledger carve-out — same shape Tanya UIX #99
  // §3 named "the carve-out comment can stay; it's still accurate."
  return (
    <span className={`pointer-events-none absolute -top-9 left-1/2
      -translate-x-1/2 rounded-sys-medium bg-void text-mist text-sys-micro px-sys-2 py-sys-1
      shadow-sys-rest whitespace-nowrap ${swapWidthClassOf(2)} text-center
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

/**
 * Copy Link handler — composes the share envelope, drives `copyBusy`, and
 * pulses the action slot with the result. `pulse(false)` returns the slot
 * to idle silently — the fail-quiet covenant Tanya §3.3 / Krystle's
 * original spec named: silence is the receipt for failure.
 */
function useCopyText(
  archetype: ArchetypeKey, articleId: string | undefined,
  setBusy: (v: boolean) => void, pulse: (ok: boolean) => void,
) {
  return useCallback(async () => {
    const text = generateShareText(archetype, articleId);
    setBusy(true);
    const ok = await copyToClipboard(text);
    setBusy(false);
    pulse(ok);
  }, [archetype, articleId, setBusy, pulse]);
}

function useXShare(archetype: ArchetypeKey, articleId: string | undefined) {
  return useCallback(() => {
    const url = generateXLink(archetype, articleId);
    window.open(url, 'share', 'width=600,height=400');
  }, [archetype, articleId]);
}
