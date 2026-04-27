/**
 * OverlayHeader — kernel unit tests.
 *
 * Five contracts (Mike #77 §"Definition of done"; Tanya UIX #21 §10
 * handoff checklist):
 *
 *   1. Renders the frozen layout literal — `flex items-center
 *      justify-between p-sys-6 pb-sys-4`. Source-pin via
 *      `renderToStaticMarkup` (`testEnvironment: 'node'`, no jsdom; same
 *      shape as `DismissButton.test.ts` and `SkipLink.test.ts`).
 *   2. Renders the title with the type-token triple verbatim
 *      (`text-sys-lg font-display font-sys-display text-foreground`) and
 *      threads `titleId` through to the `<h3>` (the surface's
 *      `aria-labelledby` linkage).
 *   3. Renders the blurb whisper rung (`text-mist text-sys-caption
 *      tracking-sys-caption mt-sys-1`) when blurb is provided, threads
 *      `blurbId`, and accepts `ReactNode` so sr-only enrichments survive.
 *   4. Skips the blurb element entirely when blurb is omitted — the
 *      header is two atoms, not a hollow `<p>` (Tanya UIX #21 §2).
 *   5. Slots the universal exit — `<DismissButton.Inline />` — with the
 *      verb frozen at `aria-label="Close"` and the trailing-slot offset
 *      `-mr-sys-3` inherited from the kernel below it.
 *
 * Test file is `.ts` (not `.tsx`) — `React.createElement` is used so the
 * existing ts-jest preset does not need a per-test override (matches the
 * sibling `DismissButton.test.ts` / `SkipLink.test.ts` shape).
 *
 * Credits: Mike K. (#77 §"Definition of done" — the className-contract
 * assertion as the honest stand-in for the unimplementable ±1px fence),
 * Tanya D. (UIX #21 §10 handoff checklist — the five rendering invariants
 * captured here), Elon M. (#8 — the cut: jsdom cannot render fonts so we
 * assert the contract, not the pixels), Sid (this lift; one test file per
 * kernel, no jsdom).
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { OverlayHeader } from '../OverlayHeader';

// ─── 1 · Layout literal — the row's frozen skeleton ───────────────────────

describe('OverlayHeader — layout literal', () => {
  const html = renderToStaticMarkup(
    createElement(OverlayHeader, {
      title: 'Save Resonance', onClose: () => {},
    }),
  );

  it('renders the frozen layout literal', () => {
    expect(html).toContain(
      'flex items-center justify-between p-sys-6 pb-sys-4',
    );
  });

  it('anchors the row on items-center (not items-start)', () => {
    expect(html).toContain('items-center');
    expect(html).not.toContain('items-start');
  });
});

// ─── 2 · Title — the type-token triple + the id thread ────────────────────

describe('OverlayHeader — title', () => {
  it('renders the title text inside an <h3>', () => {
    const html = renderToStaticMarkup(
      createElement(OverlayHeader, {
        title: 'Save this quote', onClose: () => {},
      }),
    );
    expect(html).toContain('<h3');
    expect(html).toContain('Save this quote');
  });

  it('carries the type-token triple verbatim on the title', () => {
    const html = renderToStaticMarkup(
      createElement(OverlayHeader, {
        title: 'Keep this thread', onClose: () => {},
      }),
    );
    expect(html).toContain(
      'text-sys-lg font-display font-sys-display text-foreground',
    );
  });

  it('threads `titleId` through to the <h3> id attribute', () => {
    const html = renderToStaticMarkup(
      createElement(OverlayHeader, {
        title: 'X', titleId: 'keepsake-title', onClose: () => {},
      }),
    );
    expect(html).toMatch(/<h3[^>]*\bid="keepsake-title"/);
  });
});

// ─── 3 · Blurb — whisper rung + id thread + ReactNode acceptance ──────────

describe('OverlayHeader — blurb', () => {
  it('renders the whisper rung when blurb is provided', () => {
    const html = renderToStaticMarkup(
      createElement(OverlayHeader, {
        title: 'X', blurb: 'A line worth carrying.', onClose: () => {},
      }),
    );
    expect(html).toContain(
      'text-mist text-sys-caption tracking-sys-caption mt-sys-1',
    );
    expect(html).toContain('A line worth carrying.');
  });

  it('threads `blurbId` through to the <p> id attribute', () => {
    const html = renderToStaticMarkup(
      createElement(OverlayHeader, {
        title: 'X', blurb: 'why', blurbId: 'keepsake-blurb',
        onClose: () => {},
      }),
    );
    expect(html).toMatch(/<p[^>]*\bid="keepsake-blurb"/);
  });

  it('accepts ReactNode (so sr-only enrichments survive)', () => {
    const html = renderToStaticMarkup(
      createElement(OverlayHeader, {
        title: 'X',
        blurb: createElement(
          'span', { className: 'sr-only' }, 'Article Foo',
        ),
        onClose: () => {},
      }),
    );
    expect(html).toContain('class="sr-only"');
    expect(html).toContain('Article Foo');
  });
});

// ─── 4 · Blurb omission — the header is two atoms, not a hollow paragraph ─

describe('OverlayHeader — blurb omission', () => {
  it('renders no <p> element when blurb is omitted', () => {
    const html = renderToStaticMarkup(
      createElement(OverlayHeader, {
        title: 'X', onClose: () => {},
      }),
    );
    // Match `<p>` or `<p ` only — the SVG glyph contains a `<path>` element
    // that would false-positive a naive `<p` substring search.
    expect(html).not.toMatch(/<p[\s>]/);
  });
});

// ─── 5 · Universal exit slot — frozen verb, trailing offset ───────────────

describe('OverlayHeader — universal exit slot', () => {
  const html = renderToStaticMarkup(
    createElement(OverlayHeader, {
      title: 'X', onClose: () => {},
    }),
  );

  it('slots <DismissButton.Inline /> with aria-label="Close"', () => {
    expect(html).toContain('aria-label="Close"');
  });

  it('inherits the inline trailing-slot offset (-mr-sys-3)', () => {
    expect(html).toContain('-mr-sys-3');
  });

  it('renders exactly one close affordance (no doubling)', () => {
    expect(html.match(/aria-label="Close"/g)?.length).toBe(1);
  });
});
