/**
 * ArticlesPageClient.alpha — per-file SSR pin for the curated-heading snap.
 *
 * The single drift site in `ArticlesPageClient.tsx` (Mike napkin #116,
 * Tanya UIX #3 §2.1, Krystle drift-density pick) is now spoken in the
 * role-based 4-rung vocabulary owned by `lib/design/alpha.ts`. The curated
 * heading rule routes through `alphaClassOf('gold', 'muted', 'bg')` — the
 * JIT-safe literal-table factory — instead of the hand-typed `bg-gold/30`
 * it shipped at. The wire output is byte-identical (`/30` ≡ the `muted`
 * rung); the behavioural change is "the call site stops whispering 'two
 * authors' and starts whispering 'one room'" (Tanya UIX #3 §2.1).
 *
 * What this pin enforces:
 *
 *   1. The `__testing__.CURATED_HEADING_RULE` handle resolves to the
 *      canonical literal AND matches `alphaClassOf('gold', 'muted', 'bg')`.
 *      A future swap of the rung vocabulary cannot silently shift the
 *      register without flipping this test (Mike #116 §PoI 2, Tanya
 *      UIX #3 §2.1).
 *
 *   2. The `CuratedRow` SSR markup carries the snapped class verbatim
 *      and **does not** carry any drift `/N` literal outside the legal
 *      rungs. Drift absence is positive evidence the file earned its
 *      graduation off `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.
 *
 *   3. Drift sweep — no off-ledger `(bg|text|border|shadow)-<color>/N`
 *      shorthand anywhere in the rendered curated row (10/30/50/70/100
 *      only). The grep-fence is the contract; this is the receipt.
 *
 * Mirrors the `QuoteKeepsake.alpha.test.ts` /
 * `ExploreArticleCard.alpha.test.ts` shape: `testEnvironment: 'node'`,
 * `react-dom/server` `renderToStaticMarkup`, `React.createElement`. No
 * jsdom dependency added. Per-file pin only — no pair-rule pin yet
 * (rule-of-three not earned: only one site touches this rung in
 * `ArticlesPageClient.tsx`; the cousin `ExploreArticleCard.CURATED_REST`
 * is its own per-file pin — Mike #116 §PoI 3).
 *
 * Credits: Mike K. (architect napkin #116 — per-file SSR pin shape, the
 * snap-as-routing doctrine, the JIT-safe-literal-table pattern, the
 * rule-of-three carve-out keeping this PR honest), Tanya D. (UIX #3 §2.1
 * — felt-sentence calibration that names the polish "one breath of gold";
 * §4.1 layer audit confirming `/articles` is single-base-plane), Krystle
 * C. (drift-density ranking that picked this surface as the next
 * graduation), Sid (this lift; no new primitives, the diff is one helper
 * call + a per-file pin).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { alphaClassOf } from '@/lib/design/alpha';
import { __testing__ } from '../ArticlesPageClient';
import type { Article } from '@/lib/content/ContentTagger';

const { CuratedRow, CURATED_HEADING_RULE } = __testing__;

// ─── Tiny pure helpers — ≤ 10 LOC each ─────────────────────────────────────

/** Fixture article minimal shape — just what `ExploreArticleCard` needs. */
function fixture(id: string, overrides: Partial<Article> = {}): Article {
  return {
    id,
    title: `Quiet piece ${id}`,
    content: 'word '.repeat(600).trim(),
    tags: ['practice'],
    ...overrides,
  };
}

/** Render `CuratedRow` with three fixture articles for `deep-diver`. */
function renderCuratedRow(): string {
  return renderToStaticMarkup(
    createElement(CuratedRow, {
      curated: [fixture('a'), fixture('b'), fixture('c')],
      archetype: 'deep-diver',
    }),
  );
}

/** Pull off-ledger `/N` shorthand percentages out of a markup string. */
function offLedgerPercents(html: string): string[] {
  const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
  const hits: string[] = [];
  for (const m of html.matchAll(RX)) {
    if (![10, 30, 50, 70, 100].includes(Number(m[1]))) hits.push(m[0]);
  }
  return hits;
}

// ─── 1 · Module-level rung handle points at the canonical rung ─────────────

describe('ArticlesPageClient — alpha-ledger handle points at the canonical rung', () => {
  it('CURATED_HEADING_RULE is bg-gold/30 (the `muted` rung wire format)', () => {
    expect(CURATED_HEADING_RULE).toBe(alphaClassOf('gold', 'muted', 'bg'));
    expect(CURATED_HEADING_RULE).toBe('bg-gold/30');
  });

  it('CURATED_HEADING_RULE shares its rung with the curated card border', () => {
    // Tanya UIX #3 §2.1 — "one breath of gold". The heading rule (`bg`)
    // and `ExploreArticleCard.CURATED_REST` (`border`) both resolve to
    // the `muted` rung; only the `kind` differs by surface role.
    const cardBorder = alphaClassOf('gold', 'muted', 'border');
    expect(CURATED_HEADING_RULE.replace(/^bg-/, '')).toBe(
      cardBorder.replace(/^border-/, ''),
    );
  });

  it('CURATED_HEADING_RULE is NOT a pre-snap drift literal', () => {
    expect(CURATED_HEADING_RULE).not.toBe('bg-gold/20');
    expect(CURATED_HEADING_RULE).not.toBe('bg-gold/40');
    expect(CURATED_HEADING_RULE).not.toBe(alphaClassOf('gold', 'hairline', 'bg'));
  });
});

// ─── 2 · CuratedRow SSR — the snapped surface paints the right rung ───────

describe('CuratedRow — heading rule paints the `muted` rung verbatim', () => {
  const html = renderCuratedRow();

  it('rule uses bg-gold/30 (= `muted`, the canonical literal)', () => {
    expect(html).toContain(CURATED_HEADING_RULE);
    expect(html).toContain(alphaClassOf('gold', 'muted', 'bg'));
  });

  it('rule does NOT carry any pre-snap drift literal', () => {
    expect(html).not.toMatch(/\bbg-gold\/(15|20|40|60|80|90)\b/);
  });

  it('rule sits inside the heading row geometry (h-px, flex-1)', () => {
    // Tanya UIX #3 §2.1 — the rule is geometry, the rung is presence.
    expect(html).toContain('h-px');
    expect(html).toContain('flex-1');
  });

  it('archetype label is rendered as the curated row heading', () => {
    // The `getExtensionLabel('deep-diver')` text appears verbatim in SSR;
    // the rule sits beside it as the duet partner.
    expect(html).toContain('font-display');
    expect(html).toContain('text-gold');
  });
});

// ─── 3 · Drift absence — full SSR carries zero off-ledger color-alpha ────

describe('CuratedRow — full SSR shows zero off-ledger color-alpha drift', () => {
  it('no /N outside {10,30,50,70,100} in any (bg|text|border|shadow) shorthand', () => {
    expect(offLedgerPercents(renderCuratedRow())).toEqual([]);
  });

  it('every alpha resolves to a legal ledger percent (10/30/50/70 + /100)', () => {
    const html = renderCuratedRow();
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const allPcts = Array.from(html.matchAll(RX)).map((m) => Number(m[1]));
    expect(allPcts.length).toBeGreaterThan(0);
    allPcts.forEach((p) => {
      expect([10, 30, 50, 70, 100]).toContain(p);
    });
  });
});
