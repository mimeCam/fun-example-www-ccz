/**
 * visited-launcher contrast audit · WCAG 1.4.3 (4.5:1, AA text) over the
 * alive resonance card surface, both thermal anchors.
 *
 * The audit is the load-bearing reason the resolver paints `quiet`
 * (gold/70) instead of `recede` (gold/50). Tanya UX #98 §2 named the
 * recede rung as the design's first pick (semantic match: "the frame
 * around the subject"). Both Tanya §2 and Mike #31 §7 PoI #5 stipulated
 * the contingency: **the audit must pass, not just the snapshot. If
 * `gold/50` fails, step UP to `quiet` (0.70), not down. Defend the
 * alpha ledger; never paint louder than the contrast budget allows.**
 *
 * Empirical reading on this surface (with the `bg-surface/60` card
 * composition, see `cardClass()` in `app/resonances/ResonanceEntry.tsx`):
 *
 *   gold/50 over alive card surface (cold) ≈ 3.53:1   ← fails 4.5:1
 *   gold/50 over alive card surface (warm) ≈ 3.39:1   ← fails 4.5:1
 *   gold/70 over alive card surface (cold) ≈ 5.65:1   ← passes
 *   gold/70 over alive card surface (warm) ≈ 5.18:1   ← passes
 *
 * This file pins the *gold/70* numbers. Two cells (visited × {cold,
 * warm}). One floor (4.5:1 — WCAG_AA_TEXT). If either cell drops below
 * the floor, the *fix* is in `color-constants.ts` (`BRAND.gold`) — never
 * a per-cell knob.
 *
 * Math note: the launcher text is alpha-composited gold OVER the card's
 * own composited surface (`bg-surface/60` over the page bg). Two
 * composite steps:
 *
 *   1. card_surface = compositeOver(THERMAL.surface, THERMAL.bg, 0.6)
 *   2. visible_text = compositeOver(BRAND.gold, card_surface, ALPHA.quiet)
 *
 * Then `contrast(visible_text, card_surface)` is the AA test cell.
 *
 * What this audit deliberately ignores:
 *
 *   • The rest paint (mist/quiet). It is the launcher's *current*
 *     baseline (today's `text-mist/70`); not a design delta this sprint
 *     introduces. A future ambient-tightening sprint can audit it.
 *   • `forced-colors` mode. System paints win; the hex is overridden.
 *   • `prefers-reduced-motion`. The crossfade duration changes; the
 *     colour endpoint does not. Same audit, same numbers.
 *
 * Pure Jest, no DOM, no Canvas. Reuses `lib/design/contrast.ts` so this
 * audit shares one math kernel with the seven existing contrast-audit
 * siblings (Mike §extract-and-share rule; doctrine: the audit table in
 * `textlink-passage-contrast-audit.test.ts` §0).
 *
 * Credits:
 *   • Tanya D. (#98 §2 — the audit obligation, the "step UP, not down"
 *     verdict, the "both warm anchors" requirement, §11.5 — green at
 *     4.5:1 is the design-done gate).
 *   • Mike K. (#31 §7 PoI #5 — the contrast-audit obligation as PoI #1
 *     for reviewers, the explicit step-up rule, the "if it fails, the
 *     fix is in the palette, never the per-cell knob" rule).
 *   • Elon M. (the corrections preserved in #31 — must-pass, not just-
 *     snapshot; ledger-defended, not paint-louder).
 *   • Sid (this audit, 2026-04-26 — the recede→quiet step driven by the
 *     numbers, the two-step composite math note, the explicit honest
 *     framing of what this audit doesn't measure).
 */

import { compositeOver, contrast } from '@/lib/design/contrast';
import { ALPHA } from '@/lib/design/alpha';
import { BRAND, THERMAL, THERMAL_WARM } from '@/lib/design/color-constants';
import { WCAG_AA_TEXT } from '@/lib/design/voice-ledger';
import { VISITED_RUNG } from '../visited-launcher';

// ─── Card surface composition ────────────────────────────────────────────
//
// The alive resonance card paints `bg-surface/60` over the page bg.
// Reproduce that composite here so the test sees what the eye sees.
// Source: `cardClass()` in `app/resonances/ResonanceEntry.tsx` —
// `bg-surface/60 border-l-4 border-rose resonance-card-alive`.

const CARD_SURFACE_ALPHA = 0.6;

interface Anchor { readonly name: 'cold' | 'warm'; readonly surface: string }

/**
 * The two anchored card surfaces — cold (dormant thermal) and warm
 * (engaged thermal). Same two-anchor discipline as the seven sibling
 * audits.
 */
const ANCHORS: readonly Anchor[] = [
  {
    name: 'cold',
    surface: compositeOver(THERMAL.surface,      THERMAL.bg,      CARD_SURFACE_ALPHA),
  },
  {
    name: 'warm',
    surface: compositeOver(THERMAL_WARM.surface, THERMAL_WARM.bg, CARD_SURFACE_ALPHA),
  },
] as const;

// ─── Measured ratio — visible (composited) gold vs card surface ──────────

/**
 * For one anchor, composite the gold paint at VISITED_RUNG alpha onto
 * the card surface and measure the WCAG ratio against that same
 * surface. Pure, ≤ 10 LOC.
 */
function visitedRatio(anchor: Anchor): number {
  const visible = compositeOver(BRAND.gold, anchor.surface, ALPHA[VISITED_RUNG]);
  return contrast(visible, anchor.surface);
}

// ─── §0 LOCK — the floor sits AT WCAG 1.4.3 (text) by intent ─────────────

describe('visited-launcher contrast · §0 LOCK (floor named, not assumed)', () => {
  it('the audit measures against WCAG_AA_TEXT (4.5:1) — text-tier floor', () => {
    // The launcher word is text the reader reads (verb: "Save as card").
    // WCAG 1.4.3 at 4.5:1 is the floor below which body-rank text fails
    // legibility. Pinned via the named constant from `voice-ledger.ts` so
    // a future "soften the launcher to ambient" PR has to delete the
    // *name*, not just a number, to weaken the fence.
    expect(WCAG_AA_TEXT).toBe(4.5);
  });
});

// ─── §1 FLOOR — every (visited × anchor) cell holds ≥ floor ──────────────

describe('visited-launcher contrast · §1 FLOOR (each anchor clears AA text)', () => {
  for (const anchor of ANCHORS) {
    it(`gold/${ALPHA[VISITED_RUNG] * 100} over alive card (${anchor.name}) clears ≥ ${WCAG_AA_TEXT}:1`, () => {
      const ratio = visitedRatio(anchor);
      if (ratio < WCAG_AA_TEXT) {
        const head = `gold/${ALPHA[VISITED_RUNG] * 100} (visited launcher) over ${anchor.name}`;
        throw new Error(
          `${head}: ${ratio.toFixed(2)}:1 < floor ${WCAG_AA_TEXT}:1`,
        );
      }
      expect(ratio).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
    });
  }
});

// ─── §2 RECEIPT — worst-case across anchors, for AGENTS.md ───────────────

describe('visited-launcher contrast · §2 RECEIPT (worst-case for AGENTS.md)', () => {
  it('worst-case visited ratio clears the text floor (the warmth is honest)', () => {
    const ratios = ANCHORS.map(visitedRatio);
    const worst  = ratios.reduce((w, r) => (r < w ? r : w));
    // eslint-disable-next-line no-console
    console.log(
      `[visited-launcher-contrast-audit] gold/${ALPHA[VISITED_RUNG] * 100} ` +
      `cold ${ratios[0].toFixed(2)}:1 · warm ${ratios[1].toFixed(2)}:1 ` +
      `(worst ${worst.toFixed(2)}:1, floor ${WCAG_AA_TEXT}:1)`,
    );
    expect(worst).toBeGreaterThanOrEqual(WCAG_AA_TEXT);
  });

  it('the recede rung (0.50) was rejected — empirical floor crash', () => {
    // The audit's reason for the resolver living at `quiet` rather than
    // `recede`: gold/50 fails 4.5:1 over both anchors. Pin the receipt so
    // a future "step it down to recede for taste" PR sees the number it
    // has to defy. Mirrors the doctrine in `visited-launcher.ts`.
    const recedeRatios = ANCHORS.map((a) =>
      contrast(
        compositeOver(BRAND.gold, a.surface, ALPHA.recede),
        a.surface,
      ),
    );
    expect(recedeRatios[0]).toBeLessThan(WCAG_AA_TEXT);
    expect(recedeRatios[1]).toBeLessThan(WCAG_AA_TEXT);
  });
});
