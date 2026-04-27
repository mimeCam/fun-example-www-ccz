/**
 * EvolutionThread.alpha — per-file SSR pin for the whisper-line carrier.
 *
 * Mirror of `ResonanceEntry.alpha.test.ts` and `MirrorRevealCard.alpha.test.ts`
 * (Mike napkin #113 / #111 §4 shape — SSR via `react-dom/server`,
 * `React.createElement`, `testEnvironment: 'node'`, no jsdom). The single
 * drift site that lived on the whisper line's left-border is now spoken
 * in the role-based 4-rung vocabulary owned by `lib/design/alpha.ts`. The
 * whisper carrier and the section dividers above/below it now arrive on
 * the SAME `hairline` rung — one filament, one voice (Tanya UIX #54 §1).
 *
 * What this pin enforces (three sections, line-for-line peer of the
 * Mirror/ResonanceEntry siblings):
 *
 *   §1 · MODULE HANDLE POINTS AT THE CANONICAL RUNG — `HAIRLINE_BORDER`
 *        resolves to `alphaClassOf('gold','hairline','border')` AND to
 *        the wire string `'border-gold/10'`. A future swap of the rung
 *        cannot silently shift the register without flipping this test.
 *
 *   §2 · SSR PAINTS THE SNAPPED CARRIER VERBATIM — render `<EvolutionThread>`
 *        with a non-null whisper context; assert the rendered markup
 *        carries `border-gold/10` + `border-l-2` and does NOT carry the
 *        pre-snap `/20` drift literal.
 *
 *   §3 · SISTER-SURFACE INVARIANT — the carrier paints at the SAME rung
 *        as `Divider.HAIRLINE_BG` and `MirrorRevealCard.BORDER_HAIRLINE`,
 *        only the property prefix differs. Same alpha, two prefixes; the
 *        whisper line and the divider above/below it share an address.
 *
 * Per-file pin only — NO pair-invariant test asserting `Evolution ≡
 * Mirror ≡ Divider` chassis tokens (Mike #113 §6 PoI #4 / Elon §3 — the
 * resolver IS the kernel; rule of three for kernel-lift, the four-site
 * rhythm carriers are not a kernel). Each file owns its own per-file
 * pin; the divider-fence Axis F is the project-level lock.
 *
 * Credits: Mike K. (architect napkin #113 — the snap, the four-site
 * rhythm, the rule-of-three discipline that keeps the resolver at module
 * scope), Tanya D. (UIX spec #54 — the felt-sentence litmus, "the room
 * exhales a thought it doesn't quite say — present, then dim", the
 * `hairline`-not-`muted` verdict §3, the geometry-not-surface §1.3),
 * Elon M. (the structural insight that surfaced the gap — Axis B
 * forbade `bg-gold/<N>` outside the kernel but did NOT catch
 * `border-gold/<N>`; Axis F is his observation, named directly), Paul K.
 * (the four-truth DoD — pixel · doctrine · fence · felt — this file
 * operationalises the doctrine and pixel rows), Sid (this lift; same
 * shape as the Mirror/ResonanceEntry siblings, no new primitive).
 */

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { alphaClassOf } from '@/lib/design/alpha';
import EvolutionThread, { __testing__ } from '../EvolutionThread';
import { __testing__ as DividerTesting } from '@/components/shared/Divider';
import type { BookNarrationContext } from '@/types/book-narration';
import type { ResonanceWithArticle } from '@/types/resonance-display';

const { HAIRLINE_BORDER } = __testing__;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** A minimal, fully-populated resonance row — needed for `BookNarrationContext.curr`. */
function fixtureResonance(): ResonanceWithArticle {
  return {
    id: 'r-test-1',
    userId: 'fp-test',
    articleId: 'a-test-1',
    articleTitle: 'A title to weave the meta-row from',
    quote: 'a quote',
    resonanceNote: 'why this stayed with me',
    vitality: 18,
    status: 'active',
    visitCount: 0,
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

/** Build a context that triggers the `position === 0` first-resonance whisper. */
function fixtureContext(): BookNarrationContext {
  return {
    position: 0, total: 1,
    gapDays: null,
    prev: null, curr: fixtureResonance(),
    season: { key: 'winter', label: 'Winter', mood: ['quiet', 'still'] },
    archetype: 'collector',
  };
}

/** Render EvolutionThread to static markup with a triggering context. */
function renderThread(): string {
  return renderToStaticMarkup(
    createElement(EvolutionThread, { context: fixtureContext(), index: 0 }),
  );
}

// ─── §1 · Module-level handle points at the canonical rung ────────────────

describe('EvolutionThread · §1 module handle points at the canonical rung', () => {
  it('HAIRLINE_BORDER is border-gold/10 (= `hairline` rung wire format)', () => {
    expect(HAIRLINE_BORDER).toBe(alphaClassOf('gold', 'hairline', 'border'));
    expect(HAIRLINE_BORDER).toBe('border-gold/10');
  });

  it('HAIRLINE_BORDER is NOT the pre-snap /20 drift literal', () => {
    expect(HAIRLINE_BORDER).not.toBe('border-gold/20');
    expect(HAIRLINE_BORDER).not.toMatch(/\/20$/);
  });

  it('HAIRLINE_BORDER snaps to the lightest rung (geometry, not surface)', () => {
    // Tanya UIX #54 §3 verdict — `hairline`, not `muted`. The `hairline`
    // rung's felt sentence is "It's geometry. The eye registers it as
    // space, not surface." If a future PR pumps it up to `/30` the test
    // names the rung that moved.
    expect(HAIRLINE_BORDER).toMatch(/\/10$/);
  });
});

// ─── §2 · SSR paints the snapped carrier verbatim ──────────────────────────

describe('EvolutionThread · §2 SSR paints the snapped carrier verbatim', () => {
  it('the rendered markup carries border-gold/10 (the hairline rung)', () => {
    expect(renderThread()).toContain(HAIRLINE_BORDER);
    expect(renderThread()).toContain('border-gold/10');
  });

  it('the rendered markup carries the structural left-border', () => {
    expect(renderThread()).toContain('border-l-2');
  });

  it('the rendered markup does NOT carry the pre-snap /20 drift literal', () => {
    expect(renderThread()).not.toContain('border-gold/20');
  });

  it('the rendered markup carries the italic gold/70 whisper text', () => {
    // Tanya UIX #54 §4.1 — text-gold/70 (`quiet` rung); the words carry
    // warmth, the line carries structure. Pinned alongside the carrier
    // so a future "soften the voice" PR cannot silently retire either.
    const html = renderThread();
    expect(html).toContain('text-gold/70');
    expect(html).toContain('italic');
  });
});

// ─── §3 · Sister-surface invariant — same rung, two prefixes ───────────────

describe('EvolutionThread · §3 sister-surface invariant (one filament, one rung)', () => {
  it('Divider.HAIRLINE_BG is bg-gold/10 (sibling at the `hairline` rung, bg prefix)', () => {
    expect(DividerTesting.HAIRLINE_BG).toBe(alphaClassOf('gold', 'hairline', 'bg'));
    expect(DividerTesting.HAIRLINE_BG).toBe('bg-gold/10');
  });

  it('the whisper carrier and the divider hairline share their alpha rung', () => {
    // Same alpha (10), two property prefixes — `border-` carries the
    // whisper's left-rail, `bg-` carries the divider's hairline. Felt
    // sentence (Tanya UIX #54 §1): "the thread that carries the whisper
    // is the same thread that carries the silence."
    const carrierPct = HAIRLINE_BORDER.match(/\/(\d+)$/)?.[1];
    const dividerPct = DividerTesting.HAIRLINE_BG.match(/\/(\d+)$/)?.[1];
    expect(carrierPct).toBe(dividerPct);
    expect(carrierPct).toBe('10');
  });

  it('JSDoc and pixel agree (doctrine truth, Paul §7.2)', () => {
    // Paul Kim DoD row 2 — the JSDoc on EvolutionThread.tsx and the
    // rendered className speak the same rung. The doc says
    // `border-gold/10`; the pixel says `border-gold/10`.
    const fs = require('node:fs') as typeof import('node:fs');
    const path = require('node:path') as typeof import('node:path');
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'EvolutionThread.tsx'), 'utf8',
    );
    expect(src).toContain('border-l-2 border-gold/10');
    expect(src).not.toContain('border-l-2 border-gold/20');
  });
});
