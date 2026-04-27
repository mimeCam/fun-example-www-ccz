/**
 * QuoteKeepsake.alpha — per-file SSR pin for the keepsake's frame snap.
 *
 * The single drift site in `QuoteKeepsake.tsx` (Tanya UIX #92, Mike napkin
 * #92) is now spoken in the role-based 4-rung vocabulary owned by
 * `lib/design/alpha.ts`. The preview frame routes through
 * `alphaClassOf('fog', 'muted', 'border')` — the JIT-safe literal-table
 * factory — instead of the hand-typed `border-fog/20` it shipped at.
 *
 * What this pin enforces:
 *
 *   1. The `__testing__.PREVIEW_FRAME` handle resolves to the canonical
 *      literal AND matches `alphaClassOf('fog', 'muted', 'border')`. A
 *      future swap of the rung vocabulary cannot silently shift the
 *      register without flipping this test (Mike §6d, Tanya UIX §3).
 *
 *   2. The `KeepsakePreview` SSR markup carries the snapped class verbatim
 *      and **does not** carry the pre-snap drift value (`/20`). Drift
 *      absence is positive evidence that the file no longer needs a
 *      grandfather entry on `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`
 *      (it never had one — the fence was already armed; this pin is what
 *      keeps it that way).
 *
 *   3. Drift sweep — no off-ledger `(bg|text|border|shadow)-<color>/N`
 *      shorthand anywhere in the rendered preview (10/30/50/70/100 only).
 *
 * Mirrors the `ReturnLetter.alpha.test.ts` shape: `testEnvironment: 'node'`,
 * `react-dom/server` `renderToStaticMarkup`, `React.createElement`. No
 * jsdom dependency added. Per-file pin only — no pair invariant
 * (ThreadKeepsake exists but does not yet share this rung by intent;
 * pinning that pair would be premature coupling — Mike §PoI 6, rule of three).
 *
 * Credits: Mike K. (architect napkin #92 — per-file SSR pin shape, the
 * snap-not-preserve doctrine, the JIT-safe-literal-table pattern, the
 * three-assertion shape lifted from `ReturnLetter.alpha.test.ts`),
 * Tanya D. (UIX spec #92 §2 — felt-sentence calibration that picked
 * `muted` over `hairline`; §3 — the +0.10 alpha is the photographable
 * frame; §4 — layer audit confirming no covered surfaces), Krystle C.
 * (drift-density ranking that picked this surface as the snap), Sid
 * (this lift; no new primitives, the diff is two lines + a per-file pin).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { alphaClassOf } from '@/lib/design/alpha';
import { chromeMutedBorder } from '@/lib/design/chrome-paint';
import { __testing__ } from '../QuoteKeepsake';

const { KeepsakePreview, PREVIEW_FRAME } = __testing__;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/**
 * Render `KeepsakePreview` with an empty `dataUrl` — exercises the
 * placeholder branch (the spinner-less empty frame the modal holds during
 * the ~30ms canvas paint). The frame's classes are static; the dataUrl
 * branch does not change them.
 */
function renderEmpty(): string {
  return renderToStaticMarkup(
    createElement(KeepsakePreview, { dataUrl: '', title: 'A line worth carrying' }),
  );
}

/**
 * Render `KeepsakePreview` with a real (data-URL-shaped) string — exercises
 * the `<img>` branch. The frame's classes must remain identical to the
 * empty branch (the frame is the chrome; the card is the subject).
 */
function renderWithCard(): string {
  return renderToStaticMarkup(
    createElement(KeepsakePreview, {
      dataUrl: 'data:image/png;base64,iVBORw0KGgo=',
      title: 'A line worth carrying',
    }),
  );
}

// ─── 1 · Module-level rung handle points at the canonical rung ─────────────

describe('QuoteKeepsake — alpha-ledger handle points at the canonical rung', () => {
  it('PREVIEW_FRAME is border-fog/30 (the `muted` rung wire format)', () => {
    expect(PREVIEW_FRAME).toBe(alphaClassOf('fog', 'muted', 'border'));
    expect(PREVIEW_FRAME).toBe('border-fog/30');
  });

  it('PREVIEW_FRAME routes through the chrome-paint kernel', () => {
    // Mike napkin §1 — five chrome edges, one paint can.
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

  it('the dataUrl branch (rendered card) keeps the same frame chrome', () => {
    const filled = renderWithCard();
    expect(filled).toContain(PREVIEW_FRAME);
    expect(filled).not.toContain('border-fog/20');
    expect(filled).toContain('rounded-sys-medium');
  });
});

// ─── 3 · Drift absence — full SSR carries zero off-ledger color-alpha ────

describe('KeepsakePreview — full SSR shows zero off-ledger color-alpha drift', () => {
  it('no /N outside {10,30,50,70,100} in any (bg|text|border|shadow) shorthand', () => {
    const html = renderEmpty() + renderWithCard();
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const offLedger: string[] = [];
    for (const m of html.matchAll(RX)) {
      // Legal rungs: 10/30/50/70 (+ /100 motion endpoint).
      if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(m[0]);
    }
    expect(offLedger).toEqual([]);
  });
});
