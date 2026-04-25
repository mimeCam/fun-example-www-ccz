/**
 * PortalHero — Trust at the Threshold (Tanya §2 typographic contract).
 *
 * Two layers, mirroring `ReadersMark.test.ts`:
 *
 *   1. Pure helper invariants — `paragraphsFrom`, `dropTitleEcho`,
 *      `preferProse`, `heroParagraphs`. Deterministic. No I/O.
 *
 *   2. SSR render shape — a heavily marked-up fixture article must
 *      paint zero markdown glyphs at the threshold. A second fixture
 *      (plain prose) must paint identically clean.
 *
 * `.ts` (not `.tsx`) — uses `React.createElement` so the existing
 * ts-jest preset doesn't need a per-test override. Same idiom as
 * `ReadersMark.test.ts`.
 *
 * Credits:
 *   • Tanya D. (UX #72) — the typographic contract, Findings A/B/C/D.
 *   • Mike K. (architect #78) — the SSR render-shape pattern,
 *     fixture-with-markdown vs. fixture-plain-prose pairing.
 *   • Krystle Clear (VP Product) — the original bug report.
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

// Imported via require() to keep the test layer parallel to ReadersMark.test.ts.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PortalHero = require('../PortalHero').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __testing__ } = require('../PortalHero');

// ─── Fixtures ─────────────────────────────────────────────────

const HEAVY = {
  id: 'a-1',
  title: 'On Quiet Mornings',
  content:
    '# On Quiet Mornings\n\n' +
    '**Bold** thoughts and _italic_ ones blur at the seam, ' +
    'and the [docs](https://example.com) speak of `useEffect` carefully ' +
    'before any reader has had their first cup.\n\n' +
    '> A quoted aside that the typographer should silence.\n\n' +
    '- one tiny bullet\n- another tiny bullet\n\n' +
    'The morning is itself a long passage, unhurried, ' +
    'and the reader settles into the prose as though into a chair ' +
    'that knows their shape already.',
};

const PLAIN = {
  id: 'a-2',
  title: 'Plain Prose Mornings',
  content:
    'A morning of plain prose where the typographer has nothing ' +
    'left to silence — every word the author chose, every word the ' +
    'reader sees.\n\n' +
    'A second paragraph follows the first, also plain, also unhurried, ' +
    'and the cadence of the page is the cadence of the writing.',
};

const TITLE_ECHO = {
  id: 'a-3',
  title: 'On Beginnings',
  content:
    '# On Beginnings\n\n' +
    'On Beginnings\n\n' +
    'The real lede begins here in the second body paragraph, ' +
    'unhurried and full of the kind of clauses that earn their commas.',
};

// ─── 1 · pure helper invariants ───────────────────────────────

describe('PortalHero · paragraphsFrom — paragraph-honest projection', () => {
  const { paragraphsFrom } = __testing__;

  it('strips markdown but preserves paragraph rhythm', () => {
    const out = paragraphsFrom('**bold**\n\n_em_');
    expect(out).toEqual(['bold', 'em']);
  });

  it('soft single-newline within a paragraph collapses to a space', () => {
    const out = paragraphsFrom('one line\nstill one paragraph\n\nsecond');
    expect(out).toEqual(['one line still one paragraph', 'second']);
  });

  it('drops empty paragraphs', () => {
    const out = paragraphsFrom('a\n\n\n\nb\n\n   \n\nc');
    expect(out).toEqual(['a', 'b', 'c']);
  });
});

describe('PortalHero · dropTitleEcho — Tanya Finding C', () => {
  const { dropTitleEcho } = __testing__;

  it('drops the leading paragraph when it equals the title', () => {
    expect(dropTitleEcho(['Hello World', 'lede'], 'Hello World'))
      .toEqual(['lede']);
  });

  it('case-insensitive equality', () => {
    expect(dropTitleEcho(['hello world', 'lede'], 'Hello World'))
      .toEqual(['lede']);
  });

  it('whitespace-tolerant equality (collapses runs)', () => {
    expect(dropTitleEcho(['Hello   World', 'lede'], 'Hello World'))
      .toEqual(['lede']);
  });

  it('leaves the leading paragraph alone when it does NOT echo', () => {
    expect(dropTitleEcho(['A real lede', 'more'], 'Title'))
      .toEqual(['A real lede', 'more']);
  });

  it('safe on empty input', () => {
    expect(dropTitleEcho([], 'Title')).toEqual([]);
  });
});

describe('PortalHero · preferProse — Tanya Finding D', () => {
  const { preferProse, MIN_PARAGRAPH_CHARS } = __testing__;

  it('keeps only paragraphs at or above the soft floor when any qualify', () => {
    const longProse = 'x'.repeat(MIN_PARAGRAPH_CHARS);
    const out = preferProse(['stub', longProse, 'tiny']);
    expect(out).toEqual([longProse]);
  });

  it('falls back to the originals when none qualify (never empty)', () => {
    const out = preferProse(['short', 'tiny']);
    expect(out).toEqual(['short', 'tiny']);
  });
});

describe('PortalHero · heroParagraphs — full pipeline', () => {
  const { heroParagraphs, MAX_HERO_PARAGRAPHS } = __testing__;

  it('caps at MAX_HERO_PARAGRAPHS', () => {
    expect(heroParagraphs(HEAVY).length).toBeLessThanOrEqual(MAX_HERO_PARAGRAPHS);
  });

  it('produces zero markdown glyphs (all four anchor classes)', () => {
    const out = heroParagraphs(HEAVY).join(' ');
    expect(out).not.toMatch(/\*/);
    expect(out).not.toMatch(/_/);
    expect(out).not.toMatch(/\[|\]/);
    expect(out).not.toMatch(/`/);
    expect(out).not.toMatch(/^#|\s#\s/);
    expect(out).not.toMatch(/^>|\s>\s/);
  });

  it('drops the title-echoing first paragraph (Finding C)', () => {
    const out = heroParagraphs(TITLE_ECHO);
    expect(out[0]).not.toBe('On Beginnings');
    expect(out[0]?.startsWith('The real lede')).toBe(true);
  });

  it('plain prose passes through unchanged in spirit', () => {
    const out = heroParagraphs(PLAIN);
    expect(out).toHaveLength(2);
    expect(out[0]).toContain('plain prose');
    expect(out[1]).toContain('second paragraph');
  });
});

// ─── 2 · SSR render shape ────────────────────────────────────

describe('PortalHero · SSR render shape — Trust at the Threshold', () => {
  it('heavy markdown fixture renders zero markdown glyphs', () => {
    const html = renderToStaticMarkup(createElement(PortalHero, { article: HEAVY }));
    // Title text appears only as the <h1> string — markdown anchors don't.
    // These regex literals VERIFY the guard, they don't IMPLEMENT a strip:
    expect(html).not.toMatch(/\*\*/); // markdown-guard:exempt
    expect(html).not.toMatch(/!\[/);
    expect(html).not.toMatch(/\]\(/); // markdown-guard:exempt
    expect(html).not.toMatch(/`[^`]+`/);
    // No leading heading hash anywhere in the rendered output.
    expect(html).not.toMatch(/>#\s/);
    // No leading blockquote `>` glyph in the rendered prose.
    expect(html).not.toMatch(/<p[^>]*>&gt;/);
  });

  it('plain prose fixture renders identically clean (no false positives)', () => {
    const html = renderToStaticMarkup(createElement(PortalHero, { article: PLAIN }));
    expect(html).toContain('plain prose');
    expect(html).not.toMatch(/\*|_|`/);
  });

  it('renders the title once — never twice (Finding C, hydration-stable)', () => {
    const html = renderToStaticMarkup(
      createElement(PortalHero, { article: TITLE_ECHO }),
    );
    const occurrences = html.match(/On Beginnings/g) ?? [];
    expect(occurrences).toHaveLength(1);
  });

  it('paints two paragraph nodes for a markup-heavy fixture (no list-stub stutter)', () => {
    const html = renderToStaticMarkup(createElement(PortalHero, { article: HEAVY }));
    // The hero paragraphs use `text-sys-lg typo-passage` — count those.
    const paragraphs = html.match(/typo-passage/g) ?? [];
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
    expect(paragraphs.length).toBeLessThanOrEqual(2);
  });
});
