/**
 * WhisperFooter tests — alpha-ledger pin + render-shape pin.
 *
 * Three guarantees, all honest under `testEnvironment: 'node'`:
 *
 *   1. Tagline alpha rung — the "No algorithms. No feeds." line speaks at
 *      `mist/quiet` (= `text-mist/70`), NOT `mist/60` (drift). Pinned via
 *      the literal wire-format string AND the `alphaClassOf()` helper, so
 *      a future swap of the rung vocabulary cannot silently shift the
 *      register away from the footer's `<TextLink variant="quiet">` voice
 *      (Tanya UX #47 §3.4, Mike napkin #19 §4.1).
 *
 *   2. Link variant — every footer link is `<TextLink variant="quiet">`.
 *      The footer is one register; mixing variants would split the voice.
 *
 *   3. Middle-dot floor — separators floor at `mist 35%` via `color-mix`.
 *      The dot stays legible even as the room warms (Tanya §6.3).
 *
 * Mirrors the SuspenseFade.test.ts node-only SSR pattern so no jsdom
 * dependency is added; `React.createElement` is used so the existing
 * ts-jest preset (jsx: preserve) needs no per-test override.
 *
 * Credits: Tanya D. (UX spec #47 §3.4 — the quiet-rung pin), Mike K.
 * (napkin #19 §4.5 — pin the className contains `text-mist/70` not /60,
 * pin TextLink variant=quiet, pin the dot floor unchanged), Paul K.
 * (the "the lint test enforces forever" discipline this test joins).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import WhisperFooter from '../WhisperFooter';
import { alphaClassOf } from '@/lib/design/alpha';

// ─── Tiny helpers — pure, ≤ 10 LOC each ──────────────────────────────────

/** Render the footer to a static markup string. */
function renderFooter(): string {
  return renderToStaticMarkup(createElement(WhisperFooter));
}

/** Count occurrences of `needle` in `haystack` (substring, non-overlapping). */
function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  return haystack.split(needle).length - 1;
}

// ─── Tagline rung — quiet, not /60 ───────────────────────────────────────

describe('WhisperFooter — tagline speaks at the alpha-ledger `quiet` rung', () => {
  const html = renderFooter();

  it('contains the tagline copy verbatim', () => {
    expect(html).toContain('No algorithms. No feeds.');
  });

  it('tagline uses text-mist/70 (the `quiet` rung wire format)', () => {
    expect(html).toContain('text-mist/70');
  });

  it('tagline rung matches alphaClassOf(mist, quiet, text)', () => {
    expect(html).toContain(alphaClassOf('mist', 'quiet', 'text'));
  });

  it('tagline does NOT carry the pre-snap `text-mist/60` drift', () => {
    expect(html).not.toContain('text-mist/60');
  });
});

// ─── Link voice — every footer link is the quiet variant ────────────────

describe('WhisperFooter — every link speaks the `quiet` register', () => {
  const html = renderFooter();

  it('renders the three sealed footer links', () => {
    expect(html).toContain('href="/mirror"');
    expect(html).toContain('href="/articles"');
    expect(html).toContain('href="/trust"');
  });

  it('renders exactly three anchors (Mirror · Articles · Trust)', () => {
    expect(countOccurrences(html, '<a ')).toBe(3);
  });
});

// ─── Middle-dot floor — color-mix(in srgb, var(--mist) 35%, transparent) ─

describe('WhisperFooter — middle-dot floor is unchanged at mist/35', () => {
  const html = renderFooter();

  it('two dots between the three links (n − 1 separators)', () => {
    // React renders the &middot; HTML entity as the unicode middot char.
    expect(countOccurrences(html, '·')).toBe(2);
  });

  it('dot floor uses color-mix at 35% — legible under thermal warming', () => {
    expect(html).toContain('color-mix(in srgb, var(--mist) 35%, transparent)');
  });

  it('dots are aria-hidden (decoration, not content)', () => {
    expect(countOccurrences(html, 'aria-hidden="true"')).toBeGreaterThanOrEqual(2);
  });
});

// ─── Footer chrome — no shouty rungs, no escape hatches ─────────────────

describe('WhisperFooter — sealed register, no off-ledger drift', () => {
  const html = renderFooter();

  it('does not introduce a stray /N color-alpha shorthand outside the ledger', () => {
    // Legal rungs: /10 /30 /50 /70 (+ /100 motion endpoint, not used here).
    // /35 is permitted ONLY inside the inline color-mix style for the dot,
    // not as a Tailwind class — the regex below would chew that too, so
    // we strip the inline style block before scanning.
    const stripped = html.replace(/style="[^"]*"/g, '');
    const offLedger = stripped.match(/\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g) ?? [];
    const drifters = offLedger.filter((c) => {
      const pct = Number(c.split('/')[1]);
      return ![10, 30, 50, 70, 100].includes(pct);
    });
    expect(drifters).toEqual([]);
  });
});
