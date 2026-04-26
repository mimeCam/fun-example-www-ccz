/**
 * Icons — the site's small, shared SVG glyph set.
 *
 * One Glyph wrapper, many tiny icons. Each named icon is a one-shot
 * declaration (≤ 10 LOC) so adding the next stays subtractive: pick a
 * stroke path, name the verb, export. No icon library, no SVG import
 * pipeline; the strings are tiny and live with their callers' bundle.
 *
 * `currentColor` cascades from the consumer — a `text-mist` parent paints
 * mist; a `text-gold` parent paints gold. Reduced-motion is a non-concern
 * (icons do not animate); colourblind discriminators are a non-concern
 * (every consumer pairs the glyph with a verbal label per Tanya UX §4.1).
 *
 * Sized via Tailwind utility on the consumer (`w-* h-*`) when consistent
 * sizing matters; the `size` prop is escape-hatch only. `aria-hidden` is
 * applied by default — icons are decorative; the verb beside them is the
 * accessible name.
 *
 * Credits: Tanya D. (UX §4.1 — icon + verb balance, Picture Superiority),
 * Mike K. (one stateless wrapper, multiple callers — "polymorphism is a
 * killer"), Sid (the lift; one home so the next icon does not invent its
 * own viewBox).
 */

import type { ReactNode } from 'react';

interface GlyphProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
  /** Defaults to `aria-hidden="true"`. Pass a label to make the icon speak. */
  label?: string;
  children: ReactNode;
}

/**
 * Shared SVG wrapper. `viewBox="0 0 24 24"` is the family contract — every
 * icon below paints inside that grid, so swapping one for another never
 * shifts the optical centre. Pure, ≤ 10 LOC of body.
 */
function Glyph(props: GlyphProps): JSX.Element {
  const { size = 18, className = '', strokeWidth = 1.75, label, children } = props;
  const aria = label
    ? { role: 'img' as const, 'aria-label': label }
    : { 'aria-hidden': true as const };
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} {...aria}>
      {children}
    </svg>
  );
}

// ─── Public icons ──────────────────────────────────────────────────────────

/**
 * The keepsake modal's close affordance. Replaces the inline copy that used
 * to live at the foot of `ThreadKeepsake.tsx` — same path, one home now.
 */
export function CloseIcon(props: Omit<GlyphProps, 'children'> = {}): JSX.Element {
  return <Glyph {...props}><path d="M18 6L6 18M6 6l12 12" /></Glyph>;
}

/**
 * Share — the diagonal arrow leaving a square. The verb the keepsake's
 * primary CTA names; the glyph travels with it (Tanya UX §4.1, principle
 * #7 — never rely on color alone).
 */
export function ShareIcon(props: Omit<GlyphProps, 'children'> = {}): JSX.Element {
  return (
    <Glyph {...props}>
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </Glyph>
  );
}

/**
 * Copy — two stacked rectangles. Used for "copy image" + "copy link" so the
 * verb travels with one consistent silhouette.
 */
export function CopyIcon(props: Omit<GlyphProps, 'children'> = {}): JSX.Element {
  return (
    <Glyph {...props}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </Glyph>
  );
}

/**
 * Download — the tray with an arrow falling into it. Saves to disk; the
 * silhouette differs from Share so the two never read as siblings.
 */
export function DownloadIcon(props: Omit<GlyphProps, 'children'> = {}): JSX.Element {
  return (
    <Glyph {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </Glyph>
  );
}

/**
 * Link — a chain of two slanted ovals. The "address travels with it" verb;
 * shares the secondary row with Copy and Download.
 */
export function LinkIcon(props: Omit<GlyphProps, 'children'> = {}): JSX.Element {
  return (
    <Glyph {...props}>
      <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 1 0-7.07-7.07l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 1 0 7.07 7.07l1.5-1.5" />
    </Glyph>
  );
}

/**
 * Check — the settled-state witness. Replaces the action glyph during
 * the ~1200 ms confirmation pulse on async-action buttons (`ActionPressable`).
 * Optical-center on the same grid axis as Copy/Download/Link so the row
 * never "ticks" in width when one button enters `settled`. Tanya UX §5.1.
 */
export function CheckIcon(props: Omit<GlyphProps, 'children'> = {}): JSX.Element {
  return <Glyph {...props}><path d="M5 12l5 5L20 7" /></Glyph>;
}
