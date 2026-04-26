/**
 * Chip Contrast Audit — WCAG 4.5:1 floor for the worldview chip family.
 *
 * Promotes the AGENTS.md §"Follow-ons" #2 contrast follow-on (Tanya UX
 * #10 §2.8: `text-accent` over `bg-primary/30` over `--bg-surface` at
 * thermal extremes was unverified) from prose to a typed gate. The
 * pairing data lives in `lib/design/voice-ledger.ts` (`CONTRAST_PAIRS.
 * chip`); this test resolves each (fg, bg) voice to its actual painted
 * hex, composites the bg using `ALPHA.muted` (the rung the chip family
 * sits on, see `lib/design/worldview.ts`), and asserts the WCAG 2.1
 * §1.4.3 floor at *both* thermal anchors that exist today
 * (`THERMAL.surface`, `THERMAL_WARM.surface`) — Mike napkin #95 §1
 * "the pivotal enum doesn't exist; sample at the two anchors that do."
 *
 * Atomic fail-path (Tanya UX #62 §2 / Krystle §audit-spec): if ANY
 * pair fails at EITHER anchor, the *family* alpha rung steps as one
 * register — `muted` (0.30) → `hairline` (0.10), all four chips +
 * fallback together — manual one-line edit in `worldview.ts`. No
 * per-chip override. The test catches; the human steps.
 *
 * Receipt convention (Mike napkin #95 §6): when this audit passes,
 * leave a one-line dated entry under AGENTS.md Follow-ons §2 with the
 * worst-case ratio + which surface produced it. "Fail quietly, recover
 * loudly" — the receipt is the loudness.
 *
 * Pure Jest, no DOM, no Canvas. Reuses `lib/design/contrast.ts` so the
 * focus-ring + ambient-surfaces tests share one math kernel (Mike §3
 * extract-and-share rule). Reuses `BRAND` / `THERMAL` from
 * `lib/design/color-constants.ts` so canvas-safe consumers and this
 * audit speak the same hex vocabulary.
 *
 * Credits: Krystle Clear (the original sprint-sized audit, the WCAG
 * 4.5:1 floor, the alpha-rung-step fail-path); Tanya D. (UX #10 §2.8
 * — original observation; UX #62 §1, §4.5 — felt-experience spec, the
 * fallback-pair inclusion); Elon M. (first-principles teardown that
 * named the salvageable kernel: store the (fg, bg, floor) triples next
 * to the voices); Mike K. (napkin #95 — this PR's scope, the
 * "composite under TWO surfaces, not one" + voice.accent ≠
 * thermal.accent traps, the receipt-in-AGENTS.md polish); Paul K.
 * (the product-promise framing — "warmth that never blinds, words
 * that never blur" — that this audit makes mechanical).
 */

import {
  CONTRAST_PAIRS,
  contrastPairsFor,
  licenseFor,
  type ContrastPair,
  type Voice,
} from '../voice-ledger';
import { compositeOver, contrast } from '../contrast';
import { ALPHA } from '../alpha';
import { BRAND, THERMAL, THERMAL_WARM } from '../color-constants';

// ─── Per-voice hex resolver — the audit's address-mode bridge ─────────────
//
// Voices map to BOTH a Tailwind family literal and a CSS custom-property
// (see `voice-ledger.ts` cssVarOf / tailwindFamilyOf). For the contrast
// audit we need a *resolved hex* — what the user actually sees painted —
// so the canvas-safe ledger (`color-constants.ts`) is the source of truth.
//
// Trap pinned (Mike napkin #95 §"Points of interest" #3): `text-accent`
// is `voice.accent`, NOT `thermal.accent`. The chip routes through the
// static brand violet (`--accent-violet` → `BRAND.accentViolet`), not the
// live thermal lerp. The `thermal.accent` voice is intentionally absent
// from the chip-row pair table — keepsake / Golden Thread own that one.

/**
 * Resolves a (chip-row) Voice to its painted hex. Pure, ≤ 10 LOC.
 * Throws on a voice not painted by the chip surface — narrows the audit
 * to today's known surface; future surfaces add their own resolver.
 */
function chipVoiceToHex(v: Voice): string {
  if (v === 'voice.accent')       return BRAND.accentViolet; // text-accent
  if (v === 'voice.cyan')         return BRAND.cyan;
  if (v === 'voice.rose')         return BRAND.rose;
  if (v === 'voice.mist')         return BRAND.mist;
  if (v === 'worldview.primary')  return BRAND.primary;      // bg-primary
  if (v === 'worldview.cyan')     return BRAND.cyan;
  if (v === 'worldview.rose')     return BRAND.rose;
  if (v === 'worldview.fog')      return BRAND.fog;
  throw new Error(`chip-contrast-audit: voice ${v} not painted by chip`);
}

// ─── Thermal anchors — the two surfaces the chip composites against ───────

/**
 * The two `--bg-surface` anchors that exist in `color-constants.ts`
 * today. `dormant` = `THERMAL.surface` (deep navy, the cold start);
 * `warm` = `THERMAL_WARM.surface` (warm navy, the engaged state).
 * No "luminous" surface anchor in the canvas-safe ledger today — Mike
 * napkin #95 §1: "you cannot ship an audit keyed on a state that isn't
 * a typed concept yet." When a third anchor lands, this list extends.
 */
const SURFACE_ANCHORS = [
  { name: 'dormant', hex: THERMAL.surface      },
  { name: 'warm',    hex: THERMAL_WARM.surface },
] as const;

// ─── Pair → composited bg + measured ratio ────────────────────────────────

/**
 * Composite the pair's bg hex over the surface anchor at `ALPHA.muted`
 * (the rung the chip paints today; `lib/design/worldview.ts`). Pure.
 */
function compositedBgHex(pair: ContrastPair, surfaceHex: string): string {
  const fgHex = chipVoiceToHex(pair.bg);
  return compositeOver(fgHex, surfaceHex, ALPHA.muted);
}

/**
 * Measured WCAG ratio for a pair against a named surface anchor. Pure.
 * Surfaced separately so the worst-case sweep can re-use it without
 * re-running the assertion machinery.
 */
function measuredRatio(pair: ContrastPair, anchor: { hex: string }): number {
  const fg = chipVoiceToHex(pair.fg);
  const bg = compositedBgHex(pair, anchor.hex);
  return contrast(fg, bg);
}

// ─── 1 · Floor — every (pair × anchor) cell holds ≥ pair.floor ────────────

describe('chip-contrast-audit · WCAG 4.5:1 floor (Krystle §audit-spec)', () => {
  const PAIRS = contrastPairsFor('chip');

  it('CONTRAST_PAIRS.chip is the only populated row today (rule of three)', () => {
    expect(Object.keys(CONTRAST_PAIRS)).toEqual(['chip']);
    expect(PAIRS.length).toBeGreaterThanOrEqual(4);
  });

  for (const pair of PAIRS) {
    for (const anchor of SURFACE_ANCHORS) {
      const label = `${pair.fg} / ${pair.bg} @ ${anchor.name}`;
      it(`${label} holds ≥ ${pair.floor}:1`, () => {
        expect(measuredRatio(pair, anchor)).toBeGreaterThanOrEqual(pair.floor);
      });
    }
  }
});

// ─── 2 · License consistency — every paired voice is licensed for chip ────

describe('chip-contrast-audit · pairs reference licensed voices only', () => {
  const LICENSED = new Set<Voice>(licenseFor('chip'));

  it.each(contrastPairsFor('chip'))(
    'pair (%s, %s) names voices the chip surface licenses',
    (pair) => {
      expect(LICENSED.has(pair.fg)).toBe(true);
      expect(LICENSED.has(pair.bg)).toBe(true);
    },
  );
});

// ─── 3 · Worst-case sweep — surfaces the tightest cell for the receipt ────
//
// Per Mike napkin #95 §6: when the audit passes, leave a dated one-line
// receipt under AGENTS.md Follow-ons §2 of the worst-case ratio + which
// (pair, anchor) produced it. This block computes that receipt at run
// time — copy from the test runner's stdout into AGENTS.md. The block
// itself just asserts the floor on the worst cell (already covered by §1
// but cheap and self-documenting; locks the receipt against drift).

function worstCell(): { ratio: number; label: string; floor: number } {
  let worst = { ratio: Infinity, label: '', floor: 4.5 };
  for (const pair of contrastPairsFor('chip')) {
    for (const anchor of SURFACE_ANCHORS) {
      const r = measuredRatio(pair, anchor);
      if (r < worst.ratio) {
        worst = { ratio: r, label: `${pair.fg}/${pair.bg}@${anchor.name}`, floor: pair.floor };
      }
    }
  }
  return worst;
}

describe('chip-contrast-audit · worst-case receipt (AGENTS.md §Follow-ons #2)', () => {
  it('worst-case cell still clears its floor (sweep mirrors §1 by design)', () => {
    const w = worstCell();
    // eslint-disable-next-line no-console
    console.log(`[chip-contrast-audit] worst-case: ${w.ratio.toFixed(2)}:1 (${w.label}, floor ${w.floor}:1)`);
    expect(w.ratio).toBeGreaterThanOrEqual(w.floor);
  });
});
