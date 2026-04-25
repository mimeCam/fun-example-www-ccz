/**
 * MirrorLoadingSurface tests — geometry parity with MirrorRevealCard.
 *
 * The killer-feature's loading-to-reveal handoff lands inside two
 * heartbeats. The eye reads the swap as a fade-up of the same surface
 * IFF the skeleton silhouette occupies the same bounding box as the
 * reveal card (Tanya UX #47 §3.1 — anchor principle, "same width, same
 * radius, same vertical center; only contrast and content change").
 *
 * What this test pins:
 *
 *   1. Outer geometry classes — the four shapes that must match the
 *      reveal card: `max-w-md`, `thermal-radius-wide`, `p-sys-8`, plus a
 *      `min-h-[18rem]` floor (≈ 2-line whisper rest height) so the swap
 *      doesn't jump.
 *
 *   2. Cadence routing — the surface mounts the shared `.sys-skeleton`
 *      breath carrier (via `<Skeleton variant="card">`), NOT the
 *      retired bespoke `animate-mirror-pulse` keyframe.
 *
 *   3. No archetype pre-promise — the skeleton DOM never carries an
 *      archetype-color class (`from-primary`, `to-secondary`, etc.).
 *      A reader who lands and never resolves an archetype sees a neutral,
 *      warm, breathing surface — never a hint of the wrong color
 *      (Tanya §4.1).
 *
 *   4. Type-rhythm silhouette — four child `<Skeleton variant="line">`
 *      placeholders match the reveal's voice order (label, name, two
 *      whisper lines), so the words land into "their own slot."
 *
 * Mirrors SuspenseFade.test.ts node-only SSR pattern; no jsdom needed.
 *
 * Credits: Tanya D. (UX spec #47 §3.1 / §4.1 — the geometry-parity bar
 * and the no-archetype-pre-promise rule), Mike K. (napkin #19 §0 — "the
 * skeleton lives inside the card, not as a sibling component"; this test
 * is the receipt that we kept the new file as a *composition*, not a 9th
 * primitive), Paul K. (the first-30-seconds bar this loading surface has
 * to clear).
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import MirrorLoadingSurface from '../MirrorLoadingSurface';

// ─── Tiny pure helpers — ≤ 10 LOC each ──────────────────────────────────

/** Render the loading surface to a static markup string. */
function render(): string {
  return renderToStaticMarkup(createElement(MirrorLoadingSurface));
}

/** Count occurrences of `needle` in `haystack` (substring, non-overlapping). */
function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  return haystack.split(needle).length - 1;
}

// ─── Geometry parity — outer card matches MirrorRevealCard ──────────────

describe('MirrorLoadingSurface — outer geometry mirrors MirrorRevealCard', () => {
  const html = render();

  it('uses max-w-md (same column as the reveal card)', () => {
    expect(html).toContain('max-w-md');
  });

  it('uses thermal-radius-wide (same radius as the reveal card)', () => {
    expect(html).toContain('thermal-radius-wide');
  });

  it('uses p-sys-8 (same padding rhythm as the reveal card)', () => {
    expect(html).toContain('p-sys-8');
  });

  it('floors at min-h-[18rem] so the swap does not jump vertically', () => {
    expect(html).toContain('min-h-[18rem]');
  });
});

// ─── Cadence routing — shared Skeleton primitive owns the breath ────────

describe('MirrorLoadingSurface — routes through the shared Skeleton primitive', () => {
  const html = render();

  it('mounts the shared `.sys-skeleton` breath carrier', () => {
    expect(html).toContain('sys-skeleton');
  });

  it('does NOT use the retired bespoke `animate-mirror-pulse` keyframe', () => {
    expect(html).not.toContain('animate-mirror-pulse');
  });

  it('outer card carries aria-hidden="true" (ambient chrome, not content)', () => {
    expect(countOccurrences(html, 'aria-hidden="true"')).toBeGreaterThanOrEqual(1);
  });
});

// ─── No archetype pre-promise — neutral surface only ────────────────────

describe('MirrorLoadingSurface — does not pre-promise an archetype tint', () => {
  const html = render();

  it('does not paint a from-primary / to-secondary gradient', () => {
    expect(html).not.toContain('from-primary');
    expect(html).not.toContain('to-secondary');
  });

  it('does not carry a border-* class (border is earned by the reveal)', () => {
    expect(html).not.toMatch(/\bborder-(?!transparent)\w/);
  });

  it('does not carry a shadow-* class (bloom is earned by the reveal)', () => {
    expect(html).not.toMatch(/\bshadow-\w/);
  });
});

// ─── Type-rhythm silhouette — four line placeholders ────────────────────

describe('MirrorLoadingSurface — silhouettes the reveal type rhythm', () => {
  const html = render();

  it('renders the outer card + four child line placeholders (5 sys-skeletons)', () => {
    expect(countOccurrences(html, 'sys-skeleton')).toBe(5);
  });

  it('lines are centered (mx-auto on each)', () => {
    expect(countOccurrences(html, 'mx-auto')).toBe(4);
  });
});
