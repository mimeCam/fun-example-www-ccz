/**
 * ExploreArticleCard.alpha — per-file SSR pin for the explore-grid snap.
 *
 * Every drift site in `ExploreArticleCard.tsx` (Mike napkin #50 §3,
 * Tanya UX #58 §4) is now spoken in the role-based 4-rung vocabulary owned
 * by `lib/design/alpha.ts`. This test pins:
 *
 *   1. Each `__testing__` rung handle resolves to the canonical literal
 *      AND matches `alphaClassOf(color, rung, kind)`. A future swap of
 *      the rung vocabulary cannot silently shift the register without
 *      flipping this test (Mike #50 §4, Tanya UX #58 §9).
 *
 *   2. **Pair invariant** — exactly one assertion (Mike #50 §4 + §7 #2;
 *      Tanya UX #58 §4): curated.hover and organic.hover resolve to
 *      byte-identical rung tokens. Different family, same alpha. Hover
 *      communicates *interactivity* (one channel); the family carries
 *      *category* (the other channel). Two channels, two jobs, no overload.
 *
 *   3. Named-rung audit — zero `/N` literals where N ∉ {10, 30, 50, 70}
 *      survive in the SSR output. The grep-fence is the contract; this
 *      test is the receipt that the grandfather entry can come off the
 *      list (Mike #50 §8, Tanya UX #58 §9 #4).
 *
 *   4. Worldview register parity — all four worldview backgrounds share
 *      the `muted` rung, plus the default fallback. One register, four
 *      voices (Tanya UX #58 §6). The text family is the voice; the rung
 *      is the chrome volume. `primary` and `cyan` stay raw at /30 by
 *      architect call (Mike #50 §5/§7 #5) — the grep-fence accepts any
 *      family at a legal rung; the family promotion is a follow-on.
 *
 *   5. Card-edge SSR — the `edgeClass` helper paints the curated and
 *      organic variants verbatim, with the hover pair-invariant rung
 *      visible in the rendered markup. JSX `hover:border-…/N` literals
 *      are JIT-visible (template interpolation cannot reach hover: prefix —
 *      Mike #50 §7 #1).
 *
 * Mirrors the `ReturnLetter.alpha.test.ts` and `QuickMirrorCard.alpha.test.ts`
 * shape: `testEnvironment: 'node'`, `react-dom/server` `renderToStaticMarkup`,
 * `React.createElement`. No jsdom dependency added. Per-file pin only.
 *
 * Credits: Mike K. (architect napkin #50 — drift inventory, pair-invariant
 * receipt-test pattern, the JIT-safe-literal table convention, the
 * grandfather-decrement policy), Tanya D. (UX spec #58 — half-second hue read,
 * one-register-four-voices worldview taxonomy, felt-sentence calibration that
 * makes the snap unambiguous), Krystle C. (VP Product #35 — the original
 * drift-site map and snap targets), Paul K. (the no-orphaned-exempts rule
 * that keeps this PR honest about the deferred cyan/primary promotion).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { alphaClassOf } from '@/lib/design/alpha';
import {
  WORLDVIEW_COLORS as WV_COLORS_MODULE,
  WORLDVIEW_FALLBACK_BG as WV_FALLBACK_MODULE,
} from '@/lib/design/worldview';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ExploreArticleCard = require('../ExploreArticleCard').default;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __testing__ } = require('../ExploreArticleCard');

const {
  edgeClass,
  WORLDVIEW_COLORS,
  CURATED_REST,
  CURATED_HOVER,
  ORGANIC_REST,
  ORGANIC_HOVER,
  WORLDVIEW_FALLBACK_BG,
} = __testing__;

// ─── Tiny pure helpers — ≤ 10 LOC each ─────────────────────────────────────

/** Fixture article with a worldview field — drives the chip-strip render. */
function fixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'a-explore-alpha',
    title: 'On Calm Code',
    content: 'word '.repeat(600).trim(),
    tags: ['practice'],
    worldview: 'practical',
    ...overrides,
  };
}

/** Render the card variant + worldview chip strip to a static markup string. */
function render(props: Record<string, unknown>): string {
  return renderToStaticMarkup(createElement(ExploreArticleCard, props));
}

/** Render every worldview variant + the default fallback in one string. */
function renderAllWorldviews(): string {
  const wvs = ['technical', 'philosophical', 'practical', 'contrarian', 'unknown-wv'];
  return wvs
    .map((w) => render({ article: fixture({ worldview: w }), showWorldview: true }))
    .join('\n');
}

/** Pull the off-ledger `/N` shorthand percentages out of a markup string. */
function offLedgerPercents(html: string): string[] {
  const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
  const hits: string[] = [];
  for (const m of html.matchAll(RX)) {
    if (![10, 30, 50, 70, 100].includes(Number(m[1]))) hits.push(m[0]);
  }
  return hits;
}

// ─── 1 · Module-level rung handles point at the right rungs ────────────────

// ─── 0 · Centrality — test seam mirrors lib/design/worldview.ts ───────────
//
// The card's `__testing__` re-exports must be byte-identical to the
// `lib/design/worldview` module (the new system-of-record). If a future
// PR redefines `WORLDVIEW_COLORS` locally on the card, this assertion goes
// red and the lift's centrality guarantee surfaces in CI.

describe('ExploreArticleCard — centrality: re-exports the design-module manifest', () => {
  it('WORLDVIEW_COLORS comes from lib/design/worldview (object identity)', () => {
    expect(WORLDVIEW_COLORS).toBe(WV_COLORS_MODULE);
  });

  it('WORLDVIEW_FALLBACK_BG comes from lib/design/worldview (string identity)', () => {
    expect(WORLDVIEW_FALLBACK_BG).toBe(WV_FALLBACK_MODULE);
  });
});

describe('ExploreArticleCard — alpha-ledger handles point at the canonical rungs', () => {
  it('CURATED_REST is border-gold/30 (= `muted`, ambient warmth)', () => {
    expect(CURATED_REST).toBe(alphaClassOf('gold', 'muted', 'border'));
    expect(CURATED_REST).toBe('border-gold/30');
  });

  it('CURATED_HOVER is border-gold/50 (= `recede`, frame around the subject)', () => {
    expect(CURATED_HOVER).toBe(alphaClassOf('gold', 'recede', 'border'));
    expect(CURATED_HOVER).toBe('border-gold/50');
  });

  it('ORGANIC_REST is border-fog/10 (= `hairline`, geometry not surface)', () => {
    expect(ORGANIC_REST).toBe(alphaClassOf('fog', 'hairline', 'border'));
    expect(ORGANIC_REST).toBe('border-fog/10');
  });

  it('ORGANIC_HOVER is border-fog/50 (= `recede`, same rung as CURATED_HOVER)', () => {
    expect(ORGANIC_HOVER).toBe(alphaClassOf('fog', 'recede', 'border'));
    expect(ORGANIC_HOVER).toBe('border-fog/50');
  });

  it('WORLDVIEW_FALLBACK_BG is bg-fog/30 (= `muted`, default chip chrome)', () => {
    expect(WORLDVIEW_FALLBACK_BG).toBe(alphaClassOf('fog', 'muted', 'bg'));
    expect(WORLDVIEW_FALLBACK_BG).toBe('bg-fog/30');
  });
});

// ─── 2 · Pair invariant — curated.hover ≡ organic.hover (THE assertion) ───
//
// One assertion (Mike napkin #50 §4, Tanya UX #58 §4). The hover edge is a
// pair, not two independent values. Curated hover and organic hover MUST
// resolve to the same rung token (`recede`/`/50`). The family encodes
// *category* (gold = curated, fog = organic); the rung encodes
// *interactivity* (recede = lean in). Two channels, two jobs.
//
// If a future PR drifts one and not the other, this assertion fails loudly
// in CI rather than silently in production. Static comparison; no thermal
// axis (the rung tokens are static CSS constants).

describe('Card edge pair — curated.hover rung ≡ organic.hover rung', () => {
  it('the curated hover edge and organic hover edge use the SAME rung name', () => {
    // Both surfaces resolve to the `recede` rung — the pair invariant.
    const curatedRungName = 'recede';
    const organicRungName = 'recede';
    expect(curatedRungName).toBe(organicRungName);
    expect(CURATED_HOVER).toBe(alphaClassOf('gold', curatedRungName, 'border'));
    expect(ORGANIC_HOVER).toBe(alphaClassOf('fog',  organicRungName, 'border'));
  });

  it('only the family differs between curated and organic at hover', () => {
    // Strip the family slot; the kind+rung suffix is byte-identical.
    const curatedSuffix = CURATED_HOVER.replace(/-gold\b/, '');
    const organicSuffix = ORGANIC_HOVER.replace(/-fog\b/,  '');
    expect(curatedSuffix).toBe(organicSuffix);
    expect(curatedSuffix).toBe('border/50');
  });

  it('edgeClass(true) carries hover:border-gold/50 verbatim (JIT-visible literal)', () => {
    // Mike #50 §7 #1: hover: prefix cannot pass through template
    // interpolation; the literal must appear in source for Tailwind JIT.
    expect(edgeClass(true)).toContain('hover:border-gold/50');
    expect(edgeClass(true)).toContain(CURATED_REST);
  });

  it('edgeClass(false) carries hover:border-fog/50 verbatim (JIT-visible literal)', () => {
    expect(edgeClass(false)).toContain('hover:border-fog/50');
    expect(edgeClass(false)).toContain(ORGANIC_REST);
  });
});

// ─── 3 · Named-rung audit — zero `/N` literals outside {10,30,50,70} ──────
//
// The grep-fence is the contract; this test is the receipt that the
// grandfather entry can come off the list (Mike #50 §8). Concatenate every
// render the component produces (curated, organic, every worldview, the
// fallback) and assert no off-ledger color-alpha shorthand survives.

describe('ExploreArticleCard — full SSR shows zero off-ledger color-alpha drift', () => {
  it('no /15, /20, /40, /60, /80, /90 in any (bg|text|border|shadow) shorthand', () => {
    const html =
      render({ article: fixture(), variant: 'curated' }) +
      render({ article: fixture(), variant: 'default' }) +
      renderAllWorldviews();
    expect(offLedgerPercents(html)).toEqual([]);
  });

  it('curated SSR carries border-gold/30 + hover:border-gold/50 (snapped)', () => {
    const html = render({ article: fixture(), variant: 'curated' });
    expect(html).toContain(CURATED_REST);
    expect(html).toContain('hover:border-gold/50');
    expect(html).not.toMatch(/border-gold\/20\b/);
  });

  it('organic SSR carries border-fog/10 + hover:border-fog/50 (snapped)', () => {
    const html = render({ article: fixture(), variant: 'default' });
    expect(html).toContain(ORGANIC_REST);
    expect(html).toContain('hover:border-fog/50');
    expect(html).not.toMatch(/border-fog\/(15|40)\b/);
  });

  it('every alpha resolves to a legal ledger percent (10/30/50/70 + /100)', () => {
    const html =
      render({ article: fixture(), variant: 'curated' }) +
      render({ article: fixture(), variant: 'default' }) +
      renderAllWorldviews();
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const allPcts = Array.from(html.matchAll(RX)).map((m) => Number(m[1]));
    expect(allPcts.length).toBeGreaterThan(0);
    allPcts.forEach((p) => {
      expect([10, 30, 50, 70, 100]).toContain(p);
    });
  });
});

// ─── 4 · Worldview register parity — one register, four voices ─────────────
//
// Tanya UX #58 §6: all four worldview backgrounds share the `muted` rung.
// The text family is the voice; the rung is the chrome volume. The doc-claim
// "one register, four voices" is now byte-true at the rung axis. The known
// gap (technical + philosophical share the `primary` family) is the four-vs-
// three-voices contradiction; resolution is a follow-on (architect call,
// Mike #50 §5).

describe('Worldview chip strip — all four siblings sit at the `muted` rung', () => {
  const wvs = ['technical', 'philosophical', 'practical', 'contrarian'] as const;

  it.each(wvs)('worldview `%s` background carries the /30 (= muted) rung', (w) => {
    expect(WORLDVIEW_COLORS[w]).toMatch(/\bbg-[a-z]+\/30\b/);
  });

  it('the default fallback chip shares the same rung as the four named voices', () => {
    expect(WORLDVIEW_FALLBACK_BG).toMatch(/\bbg-[a-z]+\/30\b/);
    expect(WORLDVIEW_FALLBACK_BG).toBe(alphaClassOf('fog', 'muted', 'bg'));
  });

  it('all four worldview voices use the SAME rung percent (one register)', () => {
    const pcts = wvs.map((w) => {
      const m = WORLDVIEW_COLORS[w].match(/\bbg-[a-z]+\/(\d+)\b/);
      return m ? Number(m[1]) : -1;
    });
    expect(new Set(pcts).size).toBe(1);
    expect(pcts[0]).toBe(30);
  });

  it('no worldview voice carries the legacy /20 drift', () => {
    wvs.forEach((w) => {
      expect(WORLDVIEW_COLORS[w]).not.toMatch(/\bbg-[a-z]+\/20\b/);
    });
  });

  it('snapshot pin: the full WORLDVIEW_COLORS map (any change is a deliberate review)', () => {
    expect(WORLDVIEW_COLORS).toMatchSnapshot();
  });
});

// ─── 5 · Chip text — capitalized labels, no raw lowercase identifiers ─────
//
// Tanya UX #58 §3.3: the chip used to render `{article.worldview}` directly,
// which surfaced the raw lowercase key (`technical`, `philosophical`, …) as
// chip text — the AAA-polish defect Tanya called out. After the lift the
// chip text routes through `worldviewChipLabel`, capitalized once, owned by
// the design module. This is the ONE intentional pixel-mover in the lift PR.

describe('Worldview chip strip — capitalized labels, no raw lowercase tag', () => {
  const labels = [
    ['technical',     'Technical'],
    ['philosophical', 'Philosophical'],
    ['practical',     'Practical'],
    ['contrarian',    'Contrarian'],
  ] as const;

  it.each(labels)('worldview `%s` renders chip label `%s` (capitalized)', (w, label) => {
    const html = render({
      article: { id: 'a', title: 'T', content: 'word '.repeat(600).trim(), worldview: w },
      showWorldview: true,
    });
    // The capitalized label appears in the rendered chip span.
    expect(html).toContain(`>${label}<`);
  });

  it('rendered chip never carries the raw lowercase identifier', () => {
    const html = renderAllWorldviews();
    // Each raw key would only appear in the SSR if we forgot to capitalize.
    ['>technical<', '>philosophical<', '>practical<', '>contrarian<'].forEach((s) => {
      expect(html).not.toContain(s);
    });
  });
});
