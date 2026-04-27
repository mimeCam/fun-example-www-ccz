/**
 * ThreadKeepsake.alpha — per-file SSR pin for the keepsake's frame snap.
 *
 * Mirror of `components/articles/__tests__/QuoteKeepsake.alpha.test.ts`
 * (Mike napkin #92 shape; Mike #110 — pair-snap). The single drift site
 * in `ThreadKeepsake.tsx:149` is now spoken in the role-based 4-rung
 * vocabulary owned by `lib/design/alpha.ts`. The preview frame routes
 * through `alphaClassOf('fog', 'muted', 'border')` — the JIT-safe
 * literal-table factory — instead of the hand-typed `border-fog/20` it
 * shipped at.
 *
 * What this pin enforces (line-for-line peer of the Quote sibling):
 *
 *   1. The `__testing__.PREVIEW_FRAME` handle resolves to the canonical
 *      literal AND matches `alphaClassOf('fog', 'muted', 'border')`. A
 *      future swap of the rung vocabulary cannot silently shift the
 *      register without flipping this test (Mike §6d, Tanya UIX §3).
 *
 *   2. The `KeepsakePreview` SSR markup carries the snapped class verbatim
 *      and **does not** carry the pre-snap drift value (`/20`). Drift
 *      absence is positive evidence that the file no longer needs a
 *      grandfather entry on `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.
 *      The list shrinks 13 → 12 because of this receipt.
 *
 *   3. Drift sweep — no off-ledger `(bg|text|border|shadow)-<color>/N`
 *      shorthand anywhere in the rendered preview (10/30/50/70/100 only).
 *
 * Per-file pin only — NO pair invariant asserting `Quote.PREVIEW_FRAME ≡
 * Thread.PREVIEW_FRAME`. The pair-coupling pin is **premature** at N=2
 * (Mike §PoI 4, rule of three, Elon §2 — wait for the third caller before
 * carving the noun). Each file owns its own per-file SSR pin; the
 * grandfather-list shrink is the project-level receipt that the pair now
 * speaks the same rung.
 *
 * Mirrors the `QuoteKeepsake.alpha.test.ts` shape: `testEnvironment:
 * 'node'`, `react-dom/server` `renderToStaticMarkup`,
 * `React.createElement`. No jsdom dependency added.
 *
 * Credits: Mike K. (architect napkin #92 — per-file SSR pin shape, the
 * JIT-safe-literal-table pattern; #110 — pair-snap heuristic, narrowly
 * justified, no `preview-frame.ts` kernel-lift before N=3),
 * Tanya D. (UIX spec #43 — felt-sentence calibration that picked `muted`
 * over `hairline`; §1.2 concentric nesting; §3 layer audit confirming no
 * covered surfaces), Krystle C. (drift-density ranking that picked this
 * surface as the next snap), Elon M. (first-principles audit verifying
 * the two-sibling physics and rejecting the "export voice" doctrine
 * stapled to it; the pair-snap atom survives because of his cut),
 * Paul K. (departure dignity / commercial framing of the export
 * boundary), Sid (this lift; no new primitives, the diff is four lines
 * + a per-file pin).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { alphaClassOf } from '@/lib/design/alpha';
import { chromeMutedBorder } from '@/lib/design/chrome-paint';
import { __testing__ } from '../ThreadKeepsake';

const { KeepsakePreview, PREVIEW_FRAME } = __testing__;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/**
 * Render `KeepsakePreview` with an empty SVG — exercises the empty
 * `dangerouslySetInnerHTML` branch. The frame's classes are static; the
 * SVG payload does not change them. This is what the modal renders for
 * the brief moment before `buildThreadSVG` resolves.
 */
function renderEmpty(): string {
  return renderToStaticMarkup(
    createElement(KeepsakePreview, { svg: '', title: 'A thread I kept' }),
  );
}

/**
 * Render `KeepsakePreview` with a real SVG payload — exercises the
 * populated branch. The frame's classes must remain identical to the
 * empty branch (the frame is the chrome; the artifact is the subject).
 */
function renderWithSvg(): string {
  return renderToStaticMarkup(
    createElement(KeepsakePreview, {
      svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630"></svg>',
      title: 'A thread I kept',
    }),
  );
}

// ─── 1 · Module-level rung handle points at the canonical rung ─────────────

describe('ThreadKeepsake — alpha-ledger handle points at the canonical rung', () => {
  it('PREVIEW_FRAME is border-fog/30 (the `muted` rung wire format)', () => {
    expect(PREVIEW_FRAME).toBe(alphaClassOf('fog', 'muted', 'border'));
    expect(PREVIEW_FRAME).toBe('border-fog/30');
  });

  it('PREVIEW_FRAME routes through the chrome-paint kernel', () => {
    // Mike napkin §1 — five chrome edges, one paint can; the keepsake
    // frame's call site is byte-identical to its sister surfaces.
    expect(PREVIEW_FRAME).toBe(chromeMutedBorder());
  });

  it('PREVIEW_FRAME is NOT the pre-snap drift value (border-fog/20)', () => {
    expect(PREVIEW_FRAME).not.toBe('border-fog/20');
    expect(PREVIEW_FRAME).not.toBe(alphaClassOf('fog', 'hairline', 'border'));
  });
});

// ─── 2 · KeepsakePreview SSR — the snapped surface paints the right rung ──

describe('KeepsakePreview — frame paints the `muted` rung verbatim', () => {
  const html = renderEmpty();

  it('frame uses border-fog/30 (= `muted`, not /20 drift)', () => {
    expect(html).toContain(PREVIEW_FRAME);
    expect(html).toContain(alphaClassOf('fog', 'muted', 'border'));
  });

  it('frame does NOT carry the pre-snap /20 drift literal', () => {
    expect(html).not.toContain('border-fog/20');
  });

  it('frame is composed onto the rounded-sys-medium opaque void surface', () => {
    expect(html).toContain('rounded-sys-medium');
    expect(html).toContain('overflow-hidden');
    expect(html).toContain('bg-void');
  });

  it('the populated SVG branch keeps the same frame chrome', () => {
    const filled = renderWithSvg();
    expect(filled).toContain(PREVIEW_FRAME);
    expect(filled).not.toContain('border-fog/20');
    expect(filled).toContain('rounded-sys-medium');
  });
});

// ─── 3 · Drift absence — full SSR carries zero off-ledger color-alpha ────

describe('KeepsakePreview — full SSR shows zero off-ledger color-alpha drift', () => {
  it('no /N outside {10,30,50,70,100} in any (bg|text|border|shadow) shorthand', () => {
    const html = renderEmpty() + renderWithSvg();
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const offLedger: string[] = [];
    for (const m of html.matchAll(RX)) {
      // Legal rungs: 10/30/50/70 (+ /100 motion endpoint).
      if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(m[0]);
    }
    expect(offLedger).toEqual([]);
  });
});
