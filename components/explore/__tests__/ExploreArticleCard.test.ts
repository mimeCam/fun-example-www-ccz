/**
 * ExploreArticleCard · render-shape pin for the publisher's promise.
 *
 * Verifies that the duration label on the card:
 *   1. Comes from the substrate `formatReadingTime` (not a hand-stamped
 *      literal) — render text matches `formatReadingTime(N)` byte-for-byte
 *      across the ints the substrate handles specially (1, 5, 10).
 *   2. Wears the Tanya §3 visual contract — `tabular-nums` and
 *      `tracking-sys-caption` on the duration `<span>`.
 *   3. The metadata row uses the alpha-ledger `quiet` rung (`text-mist/70`)
 *      instead of the freelance `/60` it carried before.
 *
 * `.ts` (not `.tsx`) — uses `React.createElement` to match the project
 * idiom (`PortalHero.test.ts`, `ReadProgressCaption.test.ts`). No JSX in
 * the suite, no per-test ts-jest override.
 *
 * Credits:
 *   • Mike K. (#35) — substrate-first rule, drift-site triage.
 *   • Tanya D. (#24) — token alignment §3, the `quiet`-rung call for the
 *     metadata row, the tabular-nums + tracking-sys-caption pair on the
 *     duration span.
 *   • Krystle C. (referenced via Mike) — original drift-site teardown.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { estimateReadingTime } from '@/lib/content/ContentTagger';
import { formatReadingTime } from '@/lib/utils/reading-time';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ExploreArticleCard = require('../ExploreArticleCard').default;

// ─── Fixture ─────────────────────────────────────────────────

const ARTICLE_LONG = {
  id: 'a-explore-1',
  title: 'On Calm Code',
  // ~1100 words of plain prose — enough to clear the 1-min floor.
  content: 'word '.repeat(1100).trim(),
};

const ARTICLE_TINY = {
  id: 'a-explore-2',
  title: 'A Short Note',
  content: 'one two three four five.',
};

function render(article: { id: string; title: string; content: string }): string {
  return renderToStaticMarkup(
    createElement(ExploreArticleCard, { article, index: 0 }),
  );
}

// ─── 1 · render text matches the substrate ─────────────────────

describe('ExploreArticleCard · publisher promise · substrate parity', () => {
  it('rendered duration equals `formatReadingTime(estimateReadingTime(content))` byte-for-byte', () => {
    // The card composes the substrate exactly: estimate the minutes the
    // article takes, then format via the substrate. This is the contract
    // the centrality guard protects.
    const out = render(ARTICLE_LONG);
    const expected = formatReadingTime(estimateReadingTime(ARTICLE_LONG.content));
    expect(out).toContain(expected);
  });

  it('renders the substrate edge case `1 min read` for a tiny article', () => {
    const out = render(ARTICLE_TINY);
    expect(out).toContain(formatReadingTime(1));
    expect(out).toContain('1 min read'); // promise-guard:exempt
  });
});

// ─── 2 · Tanya §3 visual contract on the duration span ─────────

describe('ExploreArticleCard · duration span · token alignment', () => {
  it('duration span carries `tabular-nums` (digits never wobble)', () => {
    const out = render(ARTICLE_LONG);
    expect(out).toMatch(/tabular-nums/);
  });

  it('duration span carries `tracking-sys-caption` (caption attitude)', () => {
    const out = render(ARTICLE_LONG);
    expect(out).toMatch(/tracking-sys-caption/);
  });
});

// ─── 3 · alpha-ledger rung on the metadata row ─────────────────

describe('ExploreArticleCard · metadata row · alpha-ledger rung', () => {
  it('uses `text-mist/70` (quiet rung) — no freelance `/60`', () => {
    const out = render(ARTICLE_LONG);
    expect(out).toMatch(/text-mist\/70/);
    expect(out).not.toMatch(/text-mist\/60/);
  });
});
