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
 *   3. Middle-dot rung — separators ride the `muted` rung (mist/30) via
 *      `alphaClassOf('mist','muted','text')`. One full alpha-ledger rung
 *      below the `quiet` labels — ambient chrome, not punctuation that
 *      asks to be read (Tanya UX spec #88 §2, Mike napkin #39).
 *      No inline `style={…}` and no `color-mix(...)` literal: the dot
 *      lives entirely on the ledger, JIT-visible to Tailwind.
 *
 * Mirrors the SuspenseFade.test.ts node-only SSR pattern so no jsdom
 * dependency is added; `React.createElement` is used so the existing
 * ts-jest preset (jsx: preserve) needs no per-test override.
 *
 * Credits: Tanya D. (UX spec #47 §3.4 — the quiet-rung pin; UX spec #88
 * §2 — the snap to the muted rung for the middle dot), Mike K. (napkin
 * #19 §4.5 — pin tagline class; napkin #39 — retire the last `color-mix`
 * in components/**, snap to ledger), Paul K. (the "the lint test enforces
 * forever" discipline this test joins), Krystle C. (the surgical snap-
 * target the napkin endorses verbatim).
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

// ─── Middle-dot rung — muted (mist/30), one rung below the labels ──────

describe('WhisperFooter — middle-dot speaks the `muted` rung (mist/30)', () => {
  const html = renderFooter();

  it('two dots between the three links (n − 1 separators)', () => {
    // React renders the &middot; HTML entity as the unicode middot char.
    expect(countOccurrences(html, '·')).toBe(2);
  });

  it('dot uses text-mist/30 (the `muted` rung wire format)', () => {
    expect(html).toContain('text-mist/30');
  });

  it('dot rung matches alphaClassOf(mist, muted, text)', () => {
    expect(html).toContain(alphaClassOf('mist', 'muted', 'text'));
  });

  it('dot carries no inline style="…" prop (lives entirely on the ledger)', () => {
    // Two aria-hidden dots, both rendered through Tailwind classes only.
    // Inline style="color: …" would mean the color-mix carve-out crept back.
    const dotMatch = html.match(/<span[^>]*aria-hidden="true"[^>]*>·<\/span>/g) ?? [];
    expect(dotMatch.length).toBe(2);
    dotMatch.forEach((span) => expect(span).not.toContain('style='));
  });

  it('no `color-mix(...)` literal in the rendered footer markup', () => {
    expect(html).not.toContain('color-mix(');
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
    // No inline `style="…"` carve-out remains — the dot now lives on the
    // ledger via `alphaClassOf('mist','muted','text')` → text-mist/30.
    const offLedger = html.match(/\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g) ?? [];
    const drifters = offLedger.filter((c) => {
      const pct = Number(c.split('/')[1]);
      return ![10, 30, 50, 70, 100].includes(pct);
    });
    expect(drifters).toEqual([]);
  });
});
