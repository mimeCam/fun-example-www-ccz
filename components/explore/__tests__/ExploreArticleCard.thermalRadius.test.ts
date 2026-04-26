/**
 * ExploreArticleCard.thermalRadius — per-file SSR pin for the radius graduation.
 *
 * The two `'thermal-radius'` literals on the cold-start card collapsed into
 * one module-scope `THERM_HELD = thermalRadiusClassByPosture('held')` binding
 * (Mike napkin #92 / Tanya UX #100 §8). Output is **byte-identical** — the
 * helper resolves to the canonical `'thermal-radius'` class — and the
 * grandfather list shrinks 4 → 3 in the same PR. This pin is the receipt
 * that lets the entry come off the list without losing review evidence.
 *
 * Pinned invariants:
 *
 *   1. `__testing__.THERM_HELD` resolves to `thermalRadiusClassByPosture('held')`
 *      — helper-handle equivalence. A future swap of the helper cannot
 *      silently shift the corner without flipping this test.
 *
 *   2. The SSR markup carries `thermal-radius` exactly twice — once on the
 *      outer `<a>` (so the global `:focus-visible` ring honors the curve)
 *      and once on the inner `<article>` (so the painted surface does).
 *      Two callsites, one binding, one posture word.
 *
 *   3. The SSR markup never carries the wide variant — `held ≠ ceremony`,
 *      and a card is not a hero moment. (Tanya §4 — radius is the slowest
 *      ledger; one rung per posture.)
 *
 *   4. The SSR markup never carries `thermal-radius` outside a `class=`
 *      attribute boundary (defensive — guards against an inline-style
 *      regression that would slip past the radius adoption fence).
 *
 * Mirrors the `ReturnLetter.alpha.test.ts` § 6 shape: `testEnvironment: 'node'`,
 * `react-dom/server` `renderToStaticMarkup`, `React.createElement`. No jsdom.
 *
 * Credits: Mike K. (architect napkin #92 — the per-file SSR pin shape, the
 * helper-handle equivalence assertion, the cadence-as-product rule:
 * decrement, do not bundle), Tanya D. (UX spec #100 §8 — the cold-start
 * surface as the highest-leverage polish surface, the felt-parity rule),
 * Krystle C. (VP Product #77 — the original mechanical pattern: decrementing
 * grandfather list + typed helper + adoption guard test), Paul K. (Business
 * Analyst — the cold-start anchor framing this PR accepts), Elon M.
 * (the falsifiability check that kept this plan to mechanics).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { thermalRadiusClassByPosture } from '@/lib/design/radius';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ExploreArticleCard = require('../ExploreArticleCard').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __testing__ } = require('../ExploreArticleCard');

const { THERM_HELD } = __testing__;

// ─── Tiny pure helpers — ≤ 10 LOC each ─────────────────────────────────────

/**
 * Fixture article — minimal shape for a deterministic SSR render. The id
 * deliberately avoids the substring `thermal-radius` (which would otherwise
 * leak into the rendered `href="/article/<id>"` and inflate the occurrence
 * count past the two real class-attribute hits we are pinning).
 */
function fixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'a-held-corner',
    title: 'On Held Corners',
    content: 'word '.repeat(400).trim(),
    tags: ['design'],
    worldview: 'philosophical',
    ...overrides,
  };
}

/** Render the default-variant card to a static markup string. */
function renderDefault(): string {
  return renderToStaticMarkup(
    createElement(ExploreArticleCard, { article: fixture() }),
  );
}

/** Render the curated-variant card so curated path is also pinned. */
function renderCurated(): string {
  return renderToStaticMarkup(
    createElement(ExploreArticleCard, {
      article: fixture(), variant: 'curated',
    }),
  );
}

/** Count occurrences of `needle` in `hay` — pure substring count. */
function countOccurrences(hay: string, needle: string): number {
  if (!needle) return 0;
  return hay.split(needle).length - 1;
}

// ─── 1 · Helper-handle equivalence — the binding routes through radius.ts ──

describe('ExploreArticleCard — THERM_HELD resolves through the posture helper', () => {
  it('THERM_HELD === thermalRadiusClassByPosture("held")', () => {
    expect(THERM_HELD).toBe(thermalRadiusClassByPosture('held'));
  });

  it('THERM_HELD === the canonical "thermal-radius" class literal', () => {
    expect(THERM_HELD).toBe('thermal-radius');
  });

  it('thermalRadiusClassByPosture("held") is the held-rung wire format', () => {
    expect(thermalRadiusClassByPosture('held')).toBe('thermal-radius');
  });
});

// ─── 2 · SSR markup carries the class on both surfaces ─────────────────────

describe('ExploreArticleCard — SSR markup paints the held corner twice', () => {
  it('default-variant markup carries thermal-radius exactly twice', () => {
    expect(countOccurrences(renderDefault(), 'thermal-radius')).toBe(2);
  });

  it('curated-variant markup carries thermal-radius exactly twice', () => {
    expect(countOccurrences(renderCurated(), 'thermal-radius')).toBe(2);
  });

  it('default-variant markup carries the resolved THERM_HELD class', () => {
    expect(renderDefault()).toContain(THERM_HELD);
  });
});

// ─── 3 · No wide variant — held ≠ ceremony ─────────────────────────────────

describe('ExploreArticleCard — held card never paints the ceremony rung', () => {
  it('default markup never carries thermal-radius-wide', () => {
    expect(renderDefault()).not.toContain('thermal-radius-wide');
  });

  it('curated markup never carries thermal-radius-wide', () => {
    expect(renderCurated()).not.toContain('thermal-radius-wide');
  });
});

// ─── 4 · Defensive — no thermal-radius outside class= attributes ───────────
//
// The radius adoption fence scans source files; this pin scans rendered
// markup. The literal must only appear inside a `class="..."` attribute
// — never inline-styled, never as a data-attribute, never as text content,
// never as part of an `id` or `href` value. Any drift here means the helper
// has leaked into a non-class surface.

/** Sum of `thermal-radius` occurrences across every `class="..."` value. */
function classAttrThermalCount(html: string): number {
  const ATTR_RX = /class="([^"]*)"/g;
  let total = 0;
  for (const m of html.matchAll(ATTR_RX)) {
    total += (m[1].split('thermal-radius').length - 1);
  }
  return total;
}

describe('ExploreArticleCard — thermal-radius lives only inside class attributes', () => {
  it('every occurrence in default markup is inside a class= attribute', () => {
    const html = renderDefault();
    expect(classAttrThermalCount(html)).toBe(2);
  });

  it('every occurrence in curated markup is inside a class= attribute', () => {
    const html = renderCurated();
    expect(classAttrThermalCount(html)).toBe(2);
  });
});
