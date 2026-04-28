/**
 * ResonanceEntry.alpha — per-file SSR pin for the Book of You's
 * `alive ↔ dimmed` pair-rule.
 *
 * Mirror of `components/reading/__tests__/ThreadKeepsake.alpha.test.ts`
 * (Mike napkin #92 / #110 §4 shape — SSR via `react-dom/server`,
 * `React.createElement`, `testEnvironment: 'node'`, no jsdom). The drift
 * sites in `ResonanceEntry.tsx` are now spoken in the role-based 4-rung
 * vocabulary owned by `lib/design/alpha.ts`. Every chassis literal routes
 * through `alphaClassOf()` — the JIT-safe literal-table factory — instead
 * of the hand-typed `bg-surface/60` / `bg-gold/20` / raw `<div h-px>`
 * dialects that shipped before.
 *
 * What this pin enforces (four sections, line-for-line peer of the
 * Thread/Quote siblings + one new `pair-rule` axis Tanya §10 row A):
 *
 *   §1 · MODULE HANDLES POINT AT CANONICAL RUNGS — every `__testing__`
 *        handle resolves to the canonical `alphaClassOf(...)` literal AND
 *        to the expected wire string (e.g. `'bg-surface/50'`). A future
 *        swap of the rung vocabulary cannot silently shift the register
 *        without flipping this test.
 *
 *   §2 · SSR PAINTS THE SNAPPED CHASSIS VERBATIM — render `<ResonanceEntry>`
 *        in BOTH `faded={false}` and `faded={true}` branches; assert each
 *        branch carries its snapped chassis classes verbatim and does NOT
 *        carry the pre-snap drift values (`bg-surface/60`, `bg-gold/20`).
 *
 *   §3 · DRIFT SWEEP — full SSR contains zero off-ledger
 *        `(bg|text|border|shadow)-<color>/N` outside `{10,30,50,70,100}`.
 *        Drift absence is positive evidence the file no longer needs a
 *        grandfather entry on `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.
 *        The list shrinks 13 → 12 because of this receipt.
 *
 *   §4 · PAIR-RULE PIN (Tanya §10 row A — "two registers, one rung apart")
 *        — assert the alive surface paints at `recede` (`bg-surface/50`)
 *        and the dimmed surface paints at `muted` (`bg-surface/30`); the
 *        two rungs sit exactly one ledger step apart in `ALPHA_ORDER`.
 *        If a future PR drops `dimmed` to `recede` or pumps `alive` up
 *        to `bg-surface/100` we hear about it before merge.
 *
 * Per-file pin only — NO pair-invariant test asserting `Resonance ≡
 * Thread` chassis tokens (Mike #111 §4.2 / Elon §2 — rule of three;
 * N=2 is two callers, not a kernel). Each file owns its own per-file
 * pin; the grandfather-list shrink is the project-level receipt.
 *
 * Credits: Mike K. (architect napkin #111 — per-file SSR pin shape, the
 * `__testing__` handle vocabulary, the rule-of-three discipline that
 * keeps the kernel-lift on the shelf at N=2), Tanya D. (UIX spec #80 —
 * the surface step-DOWN doctrine that placed `alive` at `recede`, the
 * gem family-anchor at `quiet`, the `<Divider.Static />` unification,
 * the §10 acceptance gate this §4 operationalises), Krystle C. (drift-
 * density ranking that picked `ResonanceEntry.tsx` as the next snap),
 * Paul K. (the *"two registers, one rung apart"* sentence the §4 axis
 * encodes), Elon M. (insistence on measurable gates only — every
 * assertion here is a single string check, no metaphor), Sid (this
 * lift; same shape as the Thread/Quote siblings, no new primitive).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { ALPHA_ORDER, alphaClassOf } from '@/lib/design/alpha';
import ResonanceEntry, { __testing__ } from '../ResonanceEntry';
import type { ResonanceWithArticle } from '@/types/resonance-display';

const {
  ALIVE_CHASSIS,
  DIMMED_CHASSIS,
  ALIVE_SURFACE,
  DIMMED_SURFACE,
  DIMMED_BORDER,
  VITALITY_TRACK,
  GEM_ALIVE,
  GEM_DIMMED,
  QUOTED_LINE_TEXT,
  CLOSING_LINE_TEXT,
} = __testing__;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** A minimal, fully-populated resonance row — exercises every sub-block. */
function fixture(): ResonanceWithArticle {
  return {
    id: 'r-test-1',
    userId: 'fp-test',
    articleId: 'a-test-1',
    articleTitle: 'A title to weave the meta-row from',
    quote: 'a quote to fill the quoted line',
    resonanceNote: 'why this stayed with me',
    vitality: 18,
    status: 'active',
    visitCount: 0,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

/** Render the alive (carrying) branch. */
function renderAlive(): string {
  return renderToStaticMarkup(
    createElement(ResonanceEntry, {
      resonance: fixture(), timeAgo: '3 days ago', faded: false,
    }),
  );
}

/** Render the dimmed (shaped) branch with a closing line. */
function renderDimmed(): string {
  return renderToStaticMarkup(
    createElement(ResonanceEntry, {
      resonance: fixture(),
      timeAgo: '14 days ago',
      faded: true,
      closingLine: 'the room exhales',
    }),
  );
}

// ─── §1 · Module-level handles point at the canonical rungs ──────────────

describe('ResonanceEntry · §1 module handles point at the canonical rungs', () => {
  it('ALIVE_SURFACE is bg-surface/50 (= `recede` rung wire format)', () => {
    expect(ALIVE_SURFACE).toBe(alphaClassOf('surface', 'recede', 'bg'));
    expect(ALIVE_SURFACE).toBe('bg-surface/50');
  });

  it('DIMMED_SURFACE is bg-surface/30 (= `muted` rung wire format)', () => {
    expect(DIMMED_SURFACE).toBe(alphaClassOf('surface', 'muted', 'bg'));
    expect(DIMMED_SURFACE).toBe('bg-surface/30');
  });

  it('DIMMED_BORDER is border-rose/30 (= `muted` rung wire format)', () => {
    expect(DIMMED_BORDER).toBe(alphaClassOf('rose', 'muted', 'border'));
    expect(DIMMED_BORDER).toBe('border-rose/30');
  });

  it('VITALITY_TRACK is bg-fog/30 (= `muted` rung; ambient track)', () => {
    expect(VITALITY_TRACK).toBe(alphaClassOf('fog', 'muted'));
    expect(VITALITY_TRACK).toBe('bg-fog/30');
  });

  it('GEM_ALIVE is text-rose/70 and GEM_DIMMED is text-mist/70 (= `quiet` rung; family swap)', () => {
    expect(GEM_ALIVE).toBe(alphaClassOf('rose', 'quiet', 'text'));
    expect(GEM_DIMMED).toBe(alphaClassOf('mist', 'quiet', 'text'));
    expect(GEM_ALIVE).toBe('text-rose/70');
    expect(GEM_DIMMED).toBe('text-mist/70');
  });

  it('QUOTED_LINE_TEXT is text-foreground/70 (= `quiet` — content, not THE content)', () => {
    expect(QUOTED_LINE_TEXT).toBe(alphaClassOf('foreground', 'quiet', 'text'));
    expect(QUOTED_LINE_TEXT).toBe('text-foreground/70');
  });

  it('CLOSING_LINE_TEXT is text-gold/50 (= `recede` — the room\'s small farewell)', () => {
    expect(CLOSING_LINE_TEXT).toBe(alphaClassOf('gold', 'recede', 'text'));
    expect(CLOSING_LINE_TEXT).toBe('text-gold/50');
  });

  it('chassis handles are the ledger composition + structural classes', () => {
    expect(ALIVE_CHASSIS).toContain(ALIVE_SURFACE);
    expect(ALIVE_CHASSIS).toContain('border-l-4');
    expect(ALIVE_CHASSIS).toContain('border-rose');
    expect(ALIVE_CHASSIS).toContain('resonance-card-alive');
    expect(DIMMED_CHASSIS).toContain(DIMMED_SURFACE);
    expect(DIMMED_CHASSIS).toContain('border-l-4');
    expect(DIMMED_CHASSIS).toContain(DIMMED_BORDER);
    expect(DIMMED_CHASSIS).not.toContain('resonance-card-alive');
  });

  it('handles are NOT the pre-snap drift values', () => {
    expect(ALIVE_SURFACE).not.toBe('bg-surface/60');
    expect(ALIVE_CHASSIS).not.toContain('bg-surface/60');
    expect(ALIVE_CHASSIS).not.toContain('bg-gold/20');
  });
});

// ─── §2 · SSR paints the snapped chassis verbatim, both branches ─────────

describe('ResonanceEntry · §2 SSR paints the snapped chassis verbatim', () => {
  it('alive branch carries the recede chassis verbatim (bg-surface/50 + rose ribbon + glow)', () => {
    const html = renderAlive();
    expect(html).toContain(ALIVE_SURFACE);
    expect(html).toContain('border-rose');
    expect(html).toContain('resonance-card-alive');
  });

  it('alive branch does NOT carry the pre-snap /60 drift literal', () => {
    expect(renderAlive()).not.toContain('bg-surface/60');
  });

  it('dimmed branch carries the muted chassis verbatim (bg-surface/30 + border-rose/30, no glow)', () => {
    const html = renderDimmed();
    expect(html).toContain(DIMMED_SURFACE);
    expect(html).toContain(DIMMED_BORDER);
    expect(html).not.toContain('resonance-card-alive');
  });

  it('both branches paint the divider kernel at gold/10 hairline (no /20 drift)', () => {
    const html = renderAlive() + renderDimmed();
    expect(html).toContain(alphaClassOf('gold', 'hairline', 'bg'));
    expect(html).toContain('bg-gold/10');
    expect(html).not.toContain('bg-gold/20');
  });

  it('both branches mark dividers with role="separator" (kernel ARIA)', () => {
    // <Divider.Static /> renders role="separator" on every variant.
    // Two dividers per card × two branches = ≥ 4 occurrences.
    const html = renderAlive() + renderDimmed();
    const matches = html.match(/role="separator"/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(4);
  });

  it('alive gem paints rose/quiet, dimmed gem paints mist/quiet (family swap, rung anchor)', () => {
    expect(renderAlive()).toContain(GEM_ALIVE);
    expect(renderDimmed()).toContain(GEM_DIMMED);
  });

  it('dimmed branch paints the closing line at gold/recede (= text-gold/50)', () => {
    expect(renderDimmed()).toContain(CLOSING_LINE_TEXT);
  });

  it('vitality track paints at fog/muted (= bg-fog/30) on both branches', () => {
    expect(renderAlive()).toContain(VITALITY_TRACK);
    expect(renderDimmed()).toContain(VITALITY_TRACK);
  });

  it('article-meta timestamp wears the caption-chrome register (text-mist/70 + tabular-nums)', () => {
    // Caption-chrome adoption (Tanya UX §"What changes at the call site"):
    // the migrated `<CaptionMetric>` lifts the timestamp's alpha from
    // `recede` (text-mist/50) to the primitive's sealed `quiet` rung
    // (text-mist/70) AND adds the `tabular-nums` digit-column lock so a
    // /resonances list of "Saved N days ago" lines stops dancing between
    // 1-digit and 2-digit advance widths. Pinned both branches.
    const html = renderAlive() + renderDimmed();
    expect(html).toContain('text-mist/70');
    expect(html).toContain('tabular-nums');
    expect(html).toContain('tracking-sys-caption');
  });
});

// ─── §3 · Drift sweep — zero off-ledger color-alpha shorthand ────────────

describe('ResonanceEntry · §3 drift sweep · full SSR shows zero off-ledger color-alpha', () => {
  it('no /N outside {10,30,50,70,100} in any (bg|text|border|shadow) shorthand', () => {
    const html = renderAlive() + renderDimmed();
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const offLedger: string[] = [];
    for (const m of html.matchAll(RX)) {
      if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(m[0]);
    }
    expect(offLedger).toEqual([]);
  });
});

// ─── §4 · Pair-rule pin — "two registers, one rung apart" ────────────────

describe('ResonanceEntry · §4 pair-rule (Tanya §10 row A · one ledger step apart)', () => {
  it('alive surface sits at `recede`; dimmed surface sits at `muted`', () => {
    // Direct named-rung assertion — no magic strings. If a future PR re-rungs
    // either side, the test names which rung moved.
    expect(ALIVE_SURFACE).toBe(alphaClassOf('surface', 'recede', 'bg'));
    expect(DIMMED_SURFACE).toBe(alphaClassOf('surface', 'muted', 'bg'));
  });

  it('the two surface rungs are exactly one step apart in ALPHA_ORDER', () => {
    // Tanya §10 row A — the falsifiable proxy for "two registers, one rung
    // apart." `ALPHA_ORDER` runs lightest → heaviest (hairline · muted ·
    // recede · quiet); muted (i=1) and recede (i=2) are adjacent.
    const recede = ALPHA_ORDER.indexOf('recede');
    const muted  = ALPHA_ORDER.indexOf('muted');
    expect(recede - muted).toBe(1);
  });

  it('alive does NOT carry default-presence (`bg-surface` without /N)', () => {
    // Sanity: Mike #111's "alive at default" alternative was rejected in
    // favour of Tanya's "alive at recede" — pin the chosen direction so a
    // future revisit names which doctrine it's overturning.
    expect(ALIVE_CHASSIS).not.toMatch(/\bbg-surface\b(?!\/)/);
    expect(ALIVE_SURFACE).toMatch(/\/50$/);
  });

  it('alive does NOT pump up to default (`/100`); dimmed does NOT drop to hairline (`/10`)', () => {
    // Two-axis guard — if a future PR sneaks the pair to /100 + /10 (a 90%
    // gap, NOT one rung apart) the felt-sentence test goes wrong even
    // though both percents stay "ON the ledger."
    expect(ALIVE_SURFACE).not.toBe(alphaClassOf('surface', 'quiet', 'bg'));
    expect(ALIVE_SURFACE).not.toMatch(/\/100$/);
    expect(DIMMED_SURFACE).not.toBe(alphaClassOf('surface', 'hairline', 'bg'));
  });
});
