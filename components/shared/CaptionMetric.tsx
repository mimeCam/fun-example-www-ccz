/**
 * CaptionMetric — the standard caption-metric primitive.
 *
 * One face, four classes, three tags. Every metric-looking caption on the
 * site (Mirror MetaLine, hero reading-time, Explore card duration, print
 * read-progress) wears the same dialect:
 *
 *   • `text-sys-(micro|caption)`   — whisper register (size knob)
 *   • `tracking-sys-caption`        — caption-attitude letter-spacing
 *   • `tabular-nums`                — digit columns lock; "5" → "12" no waltz
 *   • `text-mist/70`                — alpha-ledger `quiet` rung
 *
 * **Why a component, not a class-string helper**: a `<CaptionMetric>` JSX
 * node is unambiguous in code review and in the adoption test (it greps
 * for the open tag). A class string is not. Future surfaces (a `<small>`
 * semantic, an `aria-label` for screen-reader politeness) change one file,
 * not five. Mike K. napkin §5 — *polymorphism is a killer when the
 * polymorphic surface is exactly one knob wide*. Two knobs here:
 *
 *   • `as`    — `'p' | 'span' | 'div'` (default `'p'`)
 *   • `size`  — `'micro' | 'caption'`  (default `'micro'`)
 *
 * Anything more (color props, weight props, spacing props) is feature
 * creep wearing a primitive's hat — refused by design.
 *
 * **JIT-safety**: classes are LITERAL string constants. Do NOT replace
 * with template strings — Tailwind's JIT cannot see dynamic class names
 * and the surface loses its tracking/alpha at runtime. Same trap solved
 * once in `lib/design/alpha.ts` (`alphaClassOf`); this primitive consumes
 * that helper to stay on the ledger.
 *
 * **No motion**. CaptionMetric does not animate. The numbers sit. Stillness
 * is the feature — a flicker on the line that just claimed to *see* the
 * reader is the worst possible micro-betrayal (Tanya UX §3.1). The parent
 * may carry `animate-fade-in`; the primitive itself is silent.
 *
 * **Empty-state guard**: never render an empty caption. Callers check
 * `articlesRead === 0` upstream and return `null` themselves; this
 * component renders whatever children it receives — no auto-suppression
 * (that would hide bugs upstream).
 *
 * Credits: Mike K. (architect napkin #38 — primitive shape, polymorphic-
 * `as` constraint, JIT-safe class-factory pattern lifted from `alpha.ts`,
 * grandfather-removal pair-rule), Tanya D. (UIX spec — caption-attitude /
 * caption-metric / tabular-nums standard, role-based 4-rung alpha
 * vocabulary, `quiet` rung as "content but not THE content"), Paul K.
 * (P&L framing — every wobble is a silent refund request, the next
 * caption added by the next engineer cannot drift), Elon M. (pair-rule
 * discipline — primitive + adoption test + migration + grandfather
 * removal in one PR; metaphor-as-marketing kill-list).
 */

import type { ReactNode } from 'react';
import { alphaClassOf } from '@/lib/design/alpha';

// ─── Public API — sealed, two knobs ───────────────────────────────────────

/** The HTML tag the caption renders as. Constrained — anything else is creep. */
export type CaptionMetricTag = 'p' | 'span' | 'div';

/** Whisper register. `micro` = 11–12px (Mirror MetaLine, Explore duration);
 * `caption` = 13–14px (hero reading-time). */
export type CaptionMetricSize = 'micro' | 'caption';

export interface CaptionMetricProps {
  /** HTML tag. Default `'p'` — single-line whisper paragraph. */
  as?: CaptionMetricTag;
  /** Size register. Default `'micro'`. */
  size?: CaptionMetricSize;
  /** Extra className appended AFTER the standard classes. Never overrides
   * the alpha-ledger rung (Tailwind cascades — same property wins later;
   * callers should not pass `text-mist/N`). */
  className?: string;
  /** The caption content — typically `"5 articles · since 4 Apr"` or
   * `"4 min read"`. */
  children: ReactNode;
}

// ─── Style atoms — JIT-safe LITERAL class strings ─────────────────────────

/**
 * Size → text-sys class. Literal map, JIT-visible. Do NOT inline as a
 * template string. The two entries match the Typography ledger's `caption`
 * size + the `--sys-text-micro` whisper carve-out.
 */
const SIZE_CLASS: Record<CaptionMetricSize, string> = {
  micro:   'text-sys-micro',
  caption: 'text-sys-caption',
};

/**
 * The four classes every CaptionMetric surface carries, no matter the
 * size or tag. `tracking-sys-caption` + `tabular-nums` are typography;
 * `alphaClassOf('mist','quiet','text')` returns the literal `'text-mist/70'`
 * (alpha ledger `quiet` rung — "content, but not THE content").
 *
 * Hoisted so a render does not re-compute the join. Pure, ≤ 10 LOC.
 */
const STANDARD_CLASSES = [
  'tracking-sys-caption',
  'tabular-nums',
  alphaClassOf('mist', 'quiet', 'text'),
].join(' ');

// ─── Helpers — pure, ≤ 10 LOC each ────────────────────────────────────────

/** Compose the className: standard + size + caller-extra. Pure. */
function composeClass(size: CaptionMetricSize, extra?: string): string {
  const base = `${STANDARD_CLASSES} ${SIZE_CLASS[size]}`;
  return extra ? `${base} ${extra}` : base;
}

// ─── Component — three render legs, each ≤ 10 LOC ─────────────────────────

/**
 * The primitive. Polymorphic over `'p' | 'span' | 'div'`. Renders a single
 * element with the standard caption-metric classes; nothing else.
 *
 * Render legs are split by tag (one branch per tag) so each leg stays
 * trivially short and TypeScript's element-type narrowing stays intact —
 * `React.createElement(as, ...)` would lose the prop check.
 */
export function CaptionMetric({
  as = 'p',
  size = 'micro',
  className,
  children,
}: CaptionMetricProps): JSX.Element {
  const cls = composeClass(size, className);
  if (as === 'span') return <span className={cls}>{children}</span>;
  if (as === 'div')  return <div className={cls}>{children}</div>;
  return <p className={cls}>{children}</p>;
}

// ─── Test seam — internals exposed for unit tests, not for callers ────────

export const __testing__ = {
  STANDARD_CLASSES,
  SIZE_CLASS,
  composeClass,
} as const;
