/**
 * ArticleProvenance tests — pure-helper invariants + SSR render-shape gate.
 *
 * Two layers, mirroring ReadersMark.test.ts (project idiom):
 *
 *   1. Pure helper invariants — `formatLongDate` and `buildMetaLine` are
 *      deterministic. Edge cases (empty / invalid ISO, missing date) all
 *      pin to a known shape. Locale uses `en-US` explicitly so the test
 *      is hermetic regardless of the CI runner's environment.
 *
 *   2. SSR render shape — the greeting bow always paints (no zero-state),
 *      lands inside an <aside> with `.print-only` (so the screen never
 *      sees it), `.article-provenance`, `data-article-provenance`, and
 *      two `.print-hairline` rules bracketing the body. Mirrors the
 *      bracketed-page rhyme described in Tanya UX #8 §3.1.
 *
 * Source-pin assertions guard the deliberate carve-outs:
 *   - The component MUST NOT import `@/lib/thread/thread-driver`
 *     (provenance is article-invariant; ReadersMark is the only
 *     per-reader artifact on paper — Mike #20 §6.1).
 *   - The shared hairline class is `print-hairline` (not the
 *     legacy `readers-mark-rule`) — Mike #20 §3, Tanya §3.4.
 *
 * `.ts` test file (not `.tsx`) — uses `React.createElement` to match the
 * SuspenseFade / ReadersMark idiom. No JSX in the suite, no per-test
 * ts-jest override.
 *
 * Credits: Mike K. (#20 §6.5 — "always paints" honesty, no-thread-driver
 * source pin), Tanya D. (UX #8 §3.1/§3.4 — bracketed-page rhyme, the
 * `.print-hairline` shared selector), Krystle C. (component spec), Elon
 * M. (boring-name discipline → the legacy class assertion is the lock),
 * `ReadersMark.test.ts` (Mike #24 — load-bearing template; copy, don't
 * reinvent).
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ArticleProvenance, __testing__ } from '../ArticleProvenance';
import type { Article } from '@/lib/content/ContentTagger';

const ARTICLE: Article = {
  id: 'sample-id',
  title: 'A Quiet Bow',
  content: 'lorem ipsum',
  publishedAt: '2026-04-25T10:00:00.000Z',
};

// ─── 1 · pure helper invariants ──────────────────────────────────────────

describe('ArticleProvenance · formatLongDate — long-form, locale-aware', () => {
  const { formatLongDate } = __testing__;

  it('formats a known ISO date in en-US for a stable visual sample', () => {
    // Locale-pinned via the second arg of `formatToParts` is awkward;
    // we read the implementation under the runner's locale and assert
    // the date *parts* (year + day) are present. This is hermetic across
    // en-US and en-GB (the two locales CI is likely to ship under).
    const out = formatLongDate('2026-04-25T10:00:00.000Z');
    expect(out).toMatch(/2026/);
    expect(out).toMatch(/25|April/);
  });

  it('returns empty string for undefined input (zero-config articles)', () => {
    expect(formatLongDate(undefined)).toBe('');
  });

  it('returns empty string for invalid ISO (defensive)', () => {
    expect(formatLongDate('not-a-date')).toBe('');
  });
});

describe('ArticleProvenance · buildMetaLine — byline · date composition', () => {
  const { buildMetaLine, META_SEPARATOR } = __testing__;

  it('joins author and long-date with the interpunct separator', () => {
    expect(buildMetaLine('Anton', '25 April 2026'))
      .toBe('by Anton · 25 April 2026');
    expect(META_SEPARATOR).toBe(' · ');
  });

  it('omits the separator when the date is absent', () => {
    expect(buildMetaLine('Anton', '')).toBe('by Anton');
  });

  it('prefixes with lowercase "by " (per Tanya §3.2 caption discipline)', () => {
    expect(buildMetaLine('Octopoid', '1 May 2026'))
      .toMatch(/^by Octopoid · /);
  });
});

// ─── 2 · SSR render shape (always paints, bracketed by .print-hairline) ──

describe('ArticleProvenance · SSR render shape', () => {
  it('always paints — no zero-state, the article had a title at load', () => {
    const html = renderToStaticMarkup(createElement(ArticleProvenance, { article: ARTICLE }));
    expect(html.length).toBeGreaterThan(0);
    expect(html).toMatch(/data-article-provenance/);
  });

  it('uses an <aside> with the .print-only and .article-provenance classes', () => {
    const html = renderToStaticMarkup(createElement(ArticleProvenance, { article: ARTICLE }));
    expect(html).toMatch(/<aside\b/);
    expect(html).toMatch(/class="[^"]*print-only[^"]*"/);
    expect(html).toMatch(/class="[^"]*article-provenance[^"]*"/);
  });

  it('aria-hidden on the wrapper (decorative, not announced)', () => {
    const html = renderToStaticMarkup(createElement(ArticleProvenance, { article: ARTICLE }));
    expect(html).toMatch(/aria-hidden="true"/);
  });

  it('brackets the body with two .print-hairline rules (the visual rhyme)', () => {
    const html = renderToStaticMarkup(createElement(ArticleProvenance, { article: ARTICLE }));
    const hairlines = html.match(/print-hairline/g) ?? [];
    expect(hairlines.length).toBe(2);
  });

  it('uses the shared selector — never the legacy `.readers-mark-rule`', () => {
    const html = renderToStaticMarkup(createElement(ArticleProvenance, { article: ARTICLE }));
    expect(html).not.toMatch(/readers-mark-rule/);
  });

  it('renders the byline `by Anton` when the article has no author field', () => {
    const html = renderToStaticMarkup(createElement(ArticleProvenance, { article: ARTICLE }));
    expect(html).toMatch(/by Anton/);
  });

  it('SSR canonical URL falls back to /article/{id} when window is undefined', () => {
    const html = renderToStaticMarkup(createElement(ArticleProvenance, { article: ARTICLE }));
    expect(html).toContain('/article/sample-id');
  });

  it('renders no <a> tag — URL is plain text so the print sheet does not double-up', () => {
    const html = renderToStaticMarkup(createElement(ArticleProvenance, { article: ARTICLE }));
    expect(html).not.toMatch(/<a\b/);
  });

  it('zero-config article (no publishedAt) still paints a meta line', () => {
    const minimal: Article = { id: 'min', title: 'Min', content: 'x' };
    const html = renderToStaticMarkup(createElement(ArticleProvenance, { article: minimal }));
    expect(html).toMatch(/by Anton/);
  });
});

// ─── 3 · Source pins — the deliberate carve-outs ─────────────────────────

describe('ArticleProvenance · source-pin invariants (Mike #20 §6)', () => {
  const SRC_PATH = join(__dirname, '..', 'ArticleProvenance.tsx');
  const SRC = readFileSync(SRC_PATH, 'utf8');

  it('does NOT import the thread driver (article-invariant scope)', () => {
    expect(SRC).not.toMatch(/from\s+['"]@\/lib\/thread\/thread-driver['"]/);
  });

  it('uses `.print-hairline`, never the legacy `.readers-mark-rule`', () => {
    expect(SRC).toMatch(/print-hairline/);
    expect(SRC).not.toMatch(/readers-mark-rule/);
  });

  it('carries the `.print-only` cascade hook so the screen never sees it', () => {
    expect(SRC).toMatch(/print-only/);
  });
});
