/**
 * ReadersMark tests — pure-helper invariants + SSR render-shape gate.
 *
 * Two layers, mirroring the SuspenseFade convention (Mike #24 §1):
 *
 *   1. Pure `buildMark` invariants — the glyph row is a deterministic
 *      function of `maxDepth`. Edge cases (0, 1, midpoints, > 1) all
 *      pin to the documented MARK_GLYPHS count and the FILLED/EMPTY
 *      pair. No randomness, no I/O.
 *
 *   2. SSR render shape — at `maxDepth = 0` the component renders
 *      NOTHING (paint sterile, the room is honest about earned-no-mark);
 *      at `maxDepth ≥ ZERO_DEPTH_FLOOR` it renders the colophon wrapper
 *      with the `.print-only` class (so the screen never sees it) and
 *      `data-readers-mark` (so consumers can query without reaching for
 *      a CSS-in-JS detail).
 *
 * Test file is `.ts` (not `.tsx`) — uses `React.createElement` so the
 * existing ts-jest preset doesn't need a per-test override. Matches the
 * rest of the suite's idiom (`SuspenseFade.test.ts`).
 *
 * The thread-driver is mocked at the module boundary so the SSR test
 * is hermetic — we simulate a believer who read 80% (`maxDepth = 0.8`)
 * and a skimmer who hit ⌘P at zero (`maxDepth = 0`). Both code paths
 * are pinned in the same file.
 *
 * Credits: Tanya D. (UX #13 §5 — buildMark contract, ZERO_DEPTH_FLOOR
 * honesty, the "no mark, sterile page" assertion), Mike K. (#24 §1 —
 * paired-test discipline, the SSR shape pattern lifted from
 * SuspenseFade), Elon M. (the negative path — `maxDepth = 0 →
 * renders nothing` is the failure mode the autograph proposal
 * couldn't honor).
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// ─── Module mocks — thread-driver is the only seam ───────────────────────

/** Module-local stub for the latest ThreadState snapshot. The mock below
 *  reads from this so each test can pin its own `maxDepth`. */
const latest: { maxDepth: number } = { maxDepth: 0 };

jest.mock('@/lib/thread/thread-driver', () => ({
  peek: () => ({
    depth: 0, velocity: 0, mode: 'smooth',
    maxDepth: latest.maxDepth, isSettled: true, tideDelta: 0,
  }),
  subscribe: (_fn: (s: { maxDepth: number }) => void) => () => {},
}));

// Imported AFTER `jest.mock` so the mock is the binding the component sees.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ReadersMark, __testing__ } = require('../ReadersMark');

// ─── 1 · pure helper invariants (Tanya §5.1) ─────────────────────────────

describe('ReadersMark · buildMark — pure glyph row contract', () => {
  const { buildMark, MARK_GLYPHS, ZERO_DEPTH_FLOOR } = __testing__;
  const FILLED = '▰';
  const EMPTY = '▱';

  it('exports the documented constants', () => {
    expect(MARK_GLYPHS).toBe(10);
    expect(ZERO_DEPTH_FLOOR).toBe(0.10);
  });

  it('depth = 0 → all empty glyphs', () => {
    expect(buildMark(0)).toBe(EMPTY.repeat(10));
  });

  it('depth = 1 → all filled glyphs', () => {
    expect(buildMark(1)).toBe(FILLED.repeat(10));
  });

  it('depth = 0.5 → five filled, five empty (rounded to tenth)', () => {
    expect(buildMark(0.5)).toBe(FILLED.repeat(5) + EMPTY.repeat(5));
  });

  it('depth = 0.27 → three filled, seven empty (round half up)', () => {
    expect(buildMark(0.27)).toBe(FILLED.repeat(3) + EMPTY.repeat(7));
  });

  it('always returns exactly MARK_GLYPHS characters', () => {
    for (const d of [0, 0.13, 0.5, 0.71, 1]) {
      expect(buildMark(d)).toHaveLength(10);
    }
  });

  it('clamps out-of-range inputs (defensive)', () => {
    expect(buildMark(-0.5)).toBe(EMPTY.repeat(10));
    expect(buildMark(1.5)).toBe(FILLED.repeat(10));
  });
});

// ─── 2 · SSR render shape (zero-depth honesty + colophon wrapper) ────────

describe('ReadersMark · SSR render shape', () => {
  beforeEach(() => { latest.maxDepth = 0; });

  it('zero depth → renders NOTHING (sterile page, room is honest)', () => {
    latest.maxDepth = 0;
    const html = renderToStaticMarkup(createElement(ReadersMark));
    expect(html).toBe('');
  });

  it('below the 10% floor → still renders nothing (Tanya §5.1)', () => {
    latest.maxDepth = 0.09;
    const html = renderToStaticMarkup(createElement(ReadersMark));
    expect(html).toBe('');
  });

  it('at the floor → the colophon wrapper paints', () => {
    latest.maxDepth = 0.10;
    const html = renderToStaticMarkup(createElement(ReadersMark));
    expect(html).toMatch(/data-readers-mark/);
    expect(html).toMatch(/print-only/);
  });

  it('reads to 80% → glyph row is 8 filled + 2 empty', () => {
    latest.maxDepth = 0.80;
    const html = renderToStaticMarkup(createElement(ReadersMark));
    expect(html).toContain('▰▰▰▰▰▰▰▰▱▱');
    expect(html).toMatch(/read to/);
  });

  it('uses an <aside> with the readers-mark class (break-inside owned by print-surface.css)', () => {
    latest.maxDepth = 0.50;
    const html = renderToStaticMarkup(createElement(ReadersMark));
    expect(html).toMatch(/<aside\b/);
    // `break-inside: avoid` lives in the `.readers-mark` CSS class authored
    // in print-surface.css — print-surface.test.ts asserts the property.
    // SSR output carries the class hook, not the resolved CSS declaration.
    expect(html).toMatch(/class="[^"]*readers-mark[^"]*"/);
  });

  it('uses the shared `.print-hairline` selector (Mike #20 — bracketed-page rhyme)', () => {
    latest.maxDepth = 0.50;
    const html = renderToStaticMarkup(createElement(ReadersMark));
    // Two hairlines bracket the colophon body — top + bottom.
    const hairlines = html.match(/print-hairline/g) ?? [];
    expect(hairlines.length).toBe(2);
    // The legacy class is gone from the SSR output (greppable lock).
    expect(html).not.toMatch(/readers-mark-rule/);
  });

  it('aria-hidden on the colophon (decorative, not announced)', () => {
    latest.maxDepth = 0.50;
    const html = renderToStaticMarkup(createElement(ReadersMark));
    expect(html).toMatch(/aria-hidden="true"/);
  });
});
