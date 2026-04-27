/**
 * ResonanceSectionHeader.alpha — per-file SSR pin for the chapter-header snap.
 *
 * Mirror of `app/resonances/__tests__/ResonanceEntry.alpha.test.ts` and
 * `app/resonances/__tests__/EvolutionThread.alpha.test.ts` (Mike napkin
 * #115 / #111 §4 shape — SSR via `react-dom/server`, `React.createElement`,
 * `testEnvironment: 'node'`, no jsdom). The two off-ledger tone literals
 * (`text-gold/40`, `text-mist/60`) are now spoken in the role-based 4-rung
 * vocabulary owned by `lib/design/alpha.ts`. Both tones land on the SAME
 * `recede` rung — two warmths, one volume (Tanya UIX #80 §2 / #90 §3.1).
 *
 * What this pin enforces (four sections, line-for-line peer of the
 * Resonance/Thread/Drawer siblings + a §4 same-rung fence):
 *
 *   §1 · MODULE HANDLES POINT AT CANONICAL RUNGS — every `__testing__`
 *        handle resolves to the canonical `alphaClassOf(...)` literal AND
 *        to the expected wire string (`'text-gold/50'`, `'text-mist/50'`).
 *        A future swap of the rung vocabulary cannot silently shift the
 *        register without flipping this test.
 *
 *   §2 · SSR PAINTS BOTH TONES VERBATIM — render `<ResonanceSectionHeader>`
 *        in BOTH `tone="gold"` and `tone="mist"` branches; assert each
 *        carries its snapped tone class verbatim and does NOT carry the
 *        pre-snap drift literals (`text-gold/40`, `text-mist/60`).
 *
 *   §3 · DRIFT SWEEP — full SSR contains zero off-ledger
 *        `(bg|text|border|shadow)-<color>/N` outside `{10,30,50,70,100}`.
 *        Drift absence is positive evidence the file no longer needs a
 *        grandfather entry on `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.
 *        The list shrinks 4 → 3 because of this receipt.
 *
 *   §4 · SAME-RUNG FENCE (Elon §4 counter-proposal · the rung-mate pair
 *        without the `AGENTS.md` ceremony) — assert that BOTH tones snap to
 *        the SAME rung (`recede`) and that the integer percent on the wire
 *        is identical between the two tones. The "two warmths, one volume"
 *        rule is expressed in code, not in prose. If a future contributor
 *        splits the rungs, the test fails before merge. A `pair-rule`
 *        rename ceremony in `AGENTS.md` is deferred until a third
 *        independent call-site demands the same shape (rule of three;
 *        Mike §1 / Elon §3).
 *
 * Per-file pin only — NO pair-invariant test asserting `SectionHeader ≡
 * ResonanceEntry` chassis tokens (Mike #115 §1 / Elon §2 — rule of three;
 * N=2 is two callers, not a kernel; no `sectionHeaderToneClass()` kernel-
 * lift, the resolver IS the kernel). Each file owns its own per-file
 * pin; the grandfather-list shrink is the project-level receipt.
 *
 * Credits: Mike K. (architect napkin #115 — the snap, the per-file SSR
 * pin shape, the rule-of-three discipline that keeps the kernel-lift on
 * the shelf at N=2; #111 — the four-section pin shape this mirrors),
 * Tanya D. (UIX spec #80 — role-based 4-rung vocabulary, `recede`
 * felt-sentence calibration; UIX #90 — the layout-fix that gave `mist`
 * a real call-site so §4 has teeth), Elon M. (the §4 same-rung fence —
 * "alphaOf(GOLD) === alphaOf(MIST)" expressed as a single string check;
 * the rule-of-three gate that keeps the rename ceremony off `AGENTS.md`),
 * Paul K. (the *"section reads as temperature signature, not a label
 * slapped above"* sentence the §4 axis encodes), Krystle C. (drift-
 * density ranking that picked `ResonanceSectionHeader.tsx` as the next
 * snap; risk-register `/70` fallback if the felt-sentence reads false),
 * Sid (this lift; same shape as the Resonance/Thread/Drawer siblings,
 * no new primitive).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import {
  ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS,
  ALPHA_ORDER,
  alphaClassOf,
  alphaPctOf,
} from '@/lib/design/alpha';
import {
  ResonanceSectionHeader,
  __testing__,
} from '../ResonanceSectionHeader';

const { GOLD_RUNG, MIST_RUNG, GOLD_TEXT, MIST_TEXT, TONE_CLASS } = __testing__;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Render the gold (shaped-section) branch. */
function renderGold(): string {
  return renderToStaticMarkup(
    createElement(ResonanceSectionHeader, {
      label: 'what shaped you', tone: 'gold',
    }),
  );
}

/** Render the mist (carrying-section) branch. The label text is plain
 *  ASCII (no apostrophe) so the SSR substring assertion is byte-clean —
 *  `react-dom/server` HTML-encodes `'` as `&#x27;`. The shipping call-site
 *  uses `what's carrying you` (the typographic apostrophe is by design); the
 *  pin only cares the *label flows through* — the pixel render is verified
 *  by the gold/mist class assertions above. */
function renderMist(): string {
  return renderToStaticMarkup(
    createElement(ResonanceSectionHeader, {
      label: 'what is carrying you', tone: 'mist',
    }),
  );
}

/** Default-prop render — `tone` defaults to `'gold'` (no regression). */
function renderDefault(): string {
  return renderToStaticMarkup(
    createElement(ResonanceSectionHeader, { label: 'what shaped you' }),
  );
}

// ─── §1 · Module-level handles point at the canonical rungs ──────────────

describe('ResonanceSectionHeader · §1 module handles point at the canonical rungs', () => {
  it('GOLD_TEXT is text-gold/50 (= `recede` rung wire format)', () => {
    expect(GOLD_TEXT).toBe(alphaClassOf('gold', 'recede', 'text'));
    expect(GOLD_TEXT).toBe('text-gold/50');
  });

  it('MIST_TEXT is text-mist/50 (= `recede` rung wire format)', () => {
    expect(MIST_TEXT).toBe(alphaClassOf('mist', 'recede', 'text'));
    expect(MIST_TEXT).toBe('text-mist/50');
  });

  it('GOLD_RUNG and MIST_RUNG both name the `recede` rung', () => {
    // Felt-sentence calibration (Tanya UX §3.1): `recede` = "the frame
    // around the subject; bylines, captions, attribution." If a future PR
    // re-rungs either tone the test names which rung moved.
    expect(GOLD_RUNG).toBe('recede');
    expect(MIST_RUNG).toBe('recede');
    expect(ALPHA_ORDER).toContain(GOLD_RUNG);
    expect(ALPHA_ORDER).toContain(MIST_RUNG);
  });

  it('TONE_CLASS maps gold/mist to their canonical handles', () => {
    expect(TONE_CLASS.gold).toBe(GOLD_TEXT);
    expect(TONE_CLASS.mist).toBe(MIST_TEXT);
  });

  it('handles are NOT the pre-snap drift values', () => {
    expect(GOLD_TEXT).not.toBe('text-gold/40');
    expect(MIST_TEXT).not.toBe('text-mist/60');
    expect(TONE_CLASS.gold).not.toContain('/40');
    expect(TONE_CLASS.mist).not.toContain('/60');
  });
});

// ─── §2 · SSR paints both tones verbatim ──────────────────────────────────

describe('ResonanceSectionHeader · §2 SSR paints the snapped tones verbatim', () => {
  it('gold branch carries text-gold/50 verbatim and the structural register', () => {
    const html = renderGold();
    expect(html).toContain(GOLD_TEXT);
    expect(html).toContain('text-gold/50');
    expect(html).toContain('text-sys-micro');
    expect(html).toContain('uppercase');
    expect(html).toContain('tracking-sys-caption');
  });

  it('mist branch carries text-mist/50 verbatim and the structural register', () => {
    const html = renderMist();
    expect(html).toContain(MIST_TEXT);
    expect(html).toContain('text-mist/50');
    expect(html).toContain('text-sys-micro');
    expect(html).toContain('uppercase');
  });

  it('default-prop render falls back to gold (no regression on existing call-sites)', () => {
    const html = renderDefault();
    expect(html).toContain(GOLD_TEXT);
    expect(html).toContain('text-gold/50');
    expect(html).toContain('what shaped you');
  });

  it('neither branch carries the pre-snap drift literals', () => {
    const html = renderGold() + renderMist() + renderDefault();
    expect(html).not.toContain('text-gold/40');
    expect(html).not.toContain('text-mist/60');
  });

  it('the supplied label text reaches the rendered markup verbatim', () => {
    expect(renderGold()).toContain('what shaped you');
    expect(renderMist()).toContain('what is carrying you');
  });
});

// ─── §3 · Drift sweep — zero off-ledger color-alpha shorthand ────────────

describe('ResonanceSectionHeader · §3 drift sweep · full SSR shows zero off-ledger color-alpha', () => {
  it('no /N outside {10,30,50,70,100} in any (bg|text|border|shadow) shorthand', () => {
    const html = renderGold() + renderMist() + renderDefault();
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const offLedger: string[] = [];
    for (const m of html.matchAll(RX)) {
      if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(m[0]);
    }
    expect(offLedger).toEqual([]);
  });

  it('the file is NOT on the alpha grandfather list (drift retired)', () => {
    expect(ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS).not.toContain(
      'components/resonances/ResonanceSectionHeader.tsx',
    );
  });
});

// ─── §4 · Same-rung fence — "two warmths, one volume" ────────────────────

describe('ResonanceSectionHeader · §4 same-rung fence (Elon §4 · the rung-mate pair, fenced)', () => {
  it('GOLD_RUNG and MIST_RUNG resolve to the SAME rung', () => {
    // The "two warmths, one volume" rule expressed in code, not in prose
    // (Tanya UIX #90 §3.1; Elon §4 counter-proposal). If a future PR splits
    // the rungs, this assertion fails before merge.
    expect(GOLD_RUNG).toBe(MIST_RUNG);
    expect(GOLD_RUNG).toBe('recede');
  });

  it('the integer percent on the wire is identical for both tones', () => {
    // The pixel-level twin of the rung assertion — a contributor cannot
    // sneak `text-gold/50` past `text-mist/70` (both still on the ledger,
    // but the symmetry breaks). Captures the wire form; if either side
    // moves, the test names the percent that drifted.
    const goldPct = GOLD_TEXT.match(/\/(\d+)$/)?.[1];
    const mistPct = MIST_TEXT.match(/\/(\d+)$/)?.[1];
    expect(goldPct).toBe(mistPct);
    expect(goldPct).toBe('50');
    expect(Number(goldPct)).toBe(alphaPctOf(GOLD_RUNG));
  });

  it('the SSR markup carries the same /N percent for both tones', () => {
    // Belt-and-braces — Mike §6 PoI #1 says JIT-safety is non-negotiable.
    // If the literal table ever drifts away from the module-scope handles
    // (e.g. a refactor template-interpolates the class), the rendered
    // markup is the falsifier the test trusts.
    const goldPct = renderGold().match(/text-gold\/(\d+)/)?.[1];
    const mistPct = renderMist().match(/text-mist\/(\d+)/)?.[1];
    expect(goldPct).toBe(mistPct);
    expect(goldPct).toBe('50');
  });

  it('neither tone pumps to default (`/100`) nor drops to hairline (`/10`)', () => {
    // Sanity guard — same shape as `ResonanceEntry.alpha.test.ts` §4. A
    // future "harmonize headers to default" PR fails here. The pair stays
    // anchored at the felt-sentence rung; the entire pair moves together
    // or it does not move at all (Tanya UIX #90 §3.1 — drift on one and
    // the asymmetry returns).
    expect(GOLD_TEXT).not.toBe(alphaClassOf('gold', 'hairline', 'text'));
    expect(GOLD_TEXT).not.toMatch(/\/100$/);
    expect(MIST_TEXT).not.toBe(alphaClassOf('mist', 'hairline', 'text'));
    expect(MIST_TEXT).not.toMatch(/\/100$/);
  });
});
