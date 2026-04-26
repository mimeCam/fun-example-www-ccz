/**
 * Keepsake Gold Contrast Audit — `3.0:1` WCAG 1.4.11 floor for the
 * `archetype.gold` signal voice on the keepsake surface, the *fourth
 * sibling* in the contrast-audit table. Same kernel — `lib/design/
 * contrast.ts` math, `lib/design/color-constants.ts` hex source of truth,
 * `lib/design/voice-ledger.ts` manifest. Different voice, different floor,
 * *named honestly* — gold is the gem the reader looks *at* (signal,
 * non-text component), the halo is the breath the reader looks *through*
 * (ornament, sub-WCAG by intent — `halo-contrast-audit.test.ts`).
 *
 * The four-cornered audit table:
 *
 *   chip-contrast-audit               · 4.5  · hairline rung   · text
 *   archetype-chip-contrast-audit     · 4.5  · muted rung      · border-on-transparent
 *   halo-contrast-audit               · 1.5  · ambient floor   · ornament
 *   keepsake-gold-contrast-audit      · 3.0  · WCAG 1.4.11     · signal      ← THIS
 *
 * Same `Surface` (`keepsake`), two pairs, two floors. The two-pair row
 * is the *visual grammar* of the Reveal (Tanya UX #62 §4): the gem is
 * the noun (hard contrast); the halo is the breath around the noun
 * (soft contrast). If both voices fought at the same floor, the gem
 * would be lost in its own atmosphere. The two-floor fence is what
 * lets the gem read at thumbnail size in iMessage *and* at full size
 * on the page — same SVG bytes, two distinct duties.
 *
 * What this audit asserts (the gate):
 *
 *   §0 LOCK-FLOOR INVARIANT — the gold floor sits AT WCAG 1.4.11 non-text
 *      (3:1) AND below WCAG 1.4.3 normal text (4.5:1). Number-vs-number,
 *      not comment-vs-comment. A future "harmonize gold to text-floor" PR
 *      fails HERE first — before any human review — by name. The gold gem
 *      is a UI component (an artifact you act on), not body text — its
 *      legibility is correctly governed by the non-text floor.
 *
 *   §1 FLOOR — every (gold × thermal anchor) cell ≥ WCAG_NONTEXT. ONE
 *      voice × two anchors = TWO cells. Gold is a single static hex
 *      (`BRAND.gold = #f0c674`); do NOT iterate `Object.keys(ARCHETYPE)`
 *      — that sweep is load-bearing for halo, dead weight for gold (Mike
 *      napkin #100 §4.2 pinned trap — symmetry of *shape*, not
 *      *cardinality*).
 *
 *   §2 LICENSE — `archetype.gold` is in `licenseFor('keepsake')` AND the
 *      `keepsake` row of `CONTRAST_PAIRS` declares the contract (gold pair,
 *      gold voice ↔ surface, at the WCAG non-text floor). Mirrors §2 of the
 *      sibling audits — pair lookup is by *fg voice*, not row index, so
 *      the halo sibling and the gold sibling are decoupled.
 *
 *   §3 RECEIPT — one `console.log` of the worst-case ratio + cell label
 *      for AGENTS.md §Follow-ons. Same shape all four siblings print.
 *      "Fail quietly, recover loudly" — the receipt is the loudness.
 *
 * Math note — *the gold paints directly on the surface; no composite
 * step.* Same as the halo audit (file-header math note in
 * `halo-contrast-audit.test.ts`): the gem is opaque paint on the surface
 * anchor, not a composited tint. Measure
 * `contrast(BRAND.gold, THERMAL.surface)` and `contrast(BRAND.gold,
 * THERMAL_WARM.surface)` directly. No alpha rung. (Mike napkin #100
 * §4.1 — pinned trap.)
 *
 * The product job — *the off-platform render at thumbnail size.* When
 * iMessage / X / Bluesky thumbnail-renders the keepsake PNG, the gem
 * must clear WCAG 1.4.11 against the live thermal surface at *both*
 * anchors. The halo dissolves into the receiving surface's background
 * (intentional graceful degradation — Tanya UX #62 §7); the gold gem
 * carries the recognition load alone. This audit makes that share-
 * worthy rendering a property of the type system, not a property of
 * the designer's mood (Mike napkin #100 §4.6).
 *
 * Failure ergonomics — number first, key second, no narrative:
 *   `gold over warm: 4.32:1 < floor 3.0:1`
 * Audience of one — the engineer fixing the bug. No "the gem dimmed",
 * no "the room exhaling" prose. Mike napkin #100 §4.5; Elon §3.2.
 *
 * Pure Jest, no DOM, no Canvas. Reuses `lib/design/contrast.ts` so all
 * four sibling audits share one math kernel (Mike §extract-and-share rule).
 *
 * Credits:
 *   • Krystle C. (VP of Product, via Elon) — original PR scope (gold
 *     pair + fourth audit, half-day); the WCAG 1.4.11 floor discipline
 *     for the gem; the rule "the share-worthy rendering must be a
 *     property of the type system."
 *   • Mike K. (napkin #100) — the architectural shape (no new module,
 *     no new abstraction, no new file outside `__tests__/`); the pinned
 *     traps (no compositeOver, single hex not a sweep, decouple by fg
 *     voice); the four-sibling test budget; the rejection of a
 *     `ContrastFamily` genus (rule of three).
 *   • Tanya D. (UX #62 §4 / §7 / §10) — the visual grammar of the Reveal
 *     (gold-as-signal, halo-as-ornament); the off-platform render rule
 *     (the gem survives, the halo dissolves); the spec implication that
 *     this audit makes mechanical.
 *   • Elon M. (salvaged kernel, via Mike #100) — "ship the ruler, not
 *     the manifesto"; the rejection of glossary inflation; the JSDoc
 *     kernel ("two floors, same surface, no genus until a third lands")
 *     that the `voice-ledger.ts` keepsake row now carries verbatim.
 *   • Paul K. — chain link #6 ("the off-platform render"); the
 *     keepsake-share-rate framing that makes this audit the smallest
 *     defensible thing the team could ship to keep the gem polished.
 *   • The three sibling audits already in the tree — for being the
 *     §0/§1/§2/§3 template this fourth pour copies exactly. Symmetry
 *     of shape is the cheapest design-system tool we have.
 */

import {
  CONTRAST_PAIRS,
  contrastPairsFor,
  licenseFor,
  HALO_AMBIENT_FLOOR,
  WCAG_AA_TEXT,
  WCAG_NONTEXT,
  type Voice,
} from '../voice-ledger';
import { contrast } from '../contrast';
import {
  BRAND,
  THERMAL,
  THERMAL_WARM,
} from '../color-constants';

// ─── The single painted gold hex — one voice, one hex ─────────────────────
//
// Unlike the halo voice (which iterates `Object.keys(ARCHETYPE)` for five
// per-archetype halo families), the gold voice is a SINGLE static brand
// hex regardless of archetype. `BRAND.gold = #f0c674` is the only painted
// gold in the system; canvas-safe consumers and this audit speak the
// same hex (Mike napkin #100 §4.2 — pinned trap).

/** The single painted gold hex — `BRAND.gold`. Pure constant. */
const GOLD_HEX = BRAND.gold;

// ─── Thermal anchors — the two surfaces the gold reads against ────────────

/**
 * The two `--bg-surface` anchors that exist in `color-constants.ts` today
 * — `dormant` (cold start) and `warm` (engaged state). Same two-anchor
 * discipline as the three sibling audits (Mike napkin #95 §1: sample at
 * the anchors that exist; do not invent a phase enum). When a third
 * anchor lands, this list extends; the floor is unchanged.
 */
const SURFACE_ANCHORS = [
  { name: 'dormant', hex: THERMAL.surface      },
  { name: 'warm',    hex: THERMAL_WARM.surface },
] as const;

type SurfaceAnchor = (typeof SURFACE_ANCHORS)[number];

// ─── Measured ratio — gold hex vs raw thermal surface ─────────────────────

/**
 * Measured WCAG ratio for the painted gold against a thermal surface
 * anchor. The gold paints directly on the surface (no composite — see
 * file-header math note); brand hex meets surface hex unmediated. Pure,
 * ≤ 10 LOC.
 */
function measuredRatio(anchor: SurfaceAnchor): number {
  return contrast(GOLD_HEX, anchor.hex);
}

// ─── Structured failure message (number first, key second, no narrative) ──

/**
 * Asserts the cell clears the gold floor with a structured failure
 * message. Pure-ish (throws on fail). ≤ 10 LOC.
 *
 * Failure shape — number first, key second, no narrative:
 *   `gold over warm: 2.91:1 < floor 3:1`
 */
function assertReadable(anchor: SurfaceAnchor): void {
  const ratio = measuredRatio(anchor);
  if (ratio < WCAG_NONTEXT) {
    const head = `gold over ${anchor.name}`;
    throw new Error(`${head}: ${ratio.toFixed(2)}:1 < floor ${WCAG_NONTEXT}:1`);
  }
  expect(ratio).toBeGreaterThanOrEqual(WCAG_NONTEXT);
}

// ─── 0 · LOCK-FLOOR — the floor sits AT WCAG 1.4.11 non-text by intent ───
//
// Mike napkin #100 §3 / Elon's salvaged kernel: the fence is a *type and
// an assertion*, not a docblock noun. A future "harmonize gold to text-
// floor" PR fails HERE first — before any human review — with a message
// pointing at WCAG_NONTEXT and the JSDoc on `CONTRAST_PAIRS.keepsake`.
// That is the architecture.

describe('keepsake-gold-contrast-audit · §0 LOCK-FLOOR (gold sits AT WCAG 1.4.11)', () => {
  it('the gold pair on the keepsake row uses WCAG_NONTEXT (3.0:1) as its floor', () => {
    // Gold is a UI component (an artifact the reader acts on), not body
    // text. Its legibility is correctly governed by §1.4.11 (non-text), not
    // §1.4.3 (text). See JSDoc on `CONTRAST_PAIRS.keepsake` in
    // `lib/design/voice-ledger.ts` for the rationale.
    const goldPair = contrastPairsFor('keepsake').find(
      (p) => p.fg === 'archetype.gold',
    );
    expect(goldPair).toBeDefined();
    expect(goldPair?.floor).toBe(WCAG_NONTEXT);
  });

  it('WCAG_NONTEXT (3:1) sits below WCAG_AA_TEXT (4.5:1) — the floor below text', () => {
    // Belt-and-braces: if a refactor harmonizes both floors, this assertion
    // + the §1 floor assertion together prevent silent drift in either
    // direction. The gold is signal (look *at*), not text (read *through*).
    expect(WCAG_NONTEXT).toBeLessThan(WCAG_AA_TEXT);
  });

  it('WCAG_NONTEXT sits ABOVE HALO_AMBIENT_FLOOR — signal is louder than ornament', () => {
    // The two-floor fence on one surface (Tanya UX #62 §4): gold is the
    // noun the reader looks *at* (signal); the halo is the breath the
    // reader looks *through* (ornament). Signal > ornament, by number.
    // A future harmonization PR that flattens the fence trips here.
    expect(WCAG_NONTEXT).toBeGreaterThan(HALO_AMBIENT_FLOOR);
  });

  it('WCAG constants match the spec (4.5 for text, 3.0 for non-text)', () => {
    // Sanity pin — if anyone "rounds" `WCAG_NONTEXT` to 2.5 or 4, the
    // lock-floor assertions above silently weaken. Number-vs-number, not
    // name-vs-name. (Same shape as halo §0 sanity pin.)
    expect(WCAG_AA_TEXT).toBe(4.5);
    expect(WCAG_NONTEXT).toBe(3.0);
  });
});

// ─── 1 · FLOOR — every (gold × anchor) cell holds ≥ WCAG_NONTEXT ──────────
//
// Two cells today (1 voice × 2 anchors). NO `Object.keys(ARCHETYPE)` sweep
// — that pattern is load-bearing for halo (5 per-archetype hexes), dead
// weight for gold (1 static hex). Symmetry of shape, not cardinality.

describe('keepsake-gold-contrast-audit · §1 FLOOR (gold clears WCAG 1.4.11 at both anchors)', () => {
  it('GOLD_HEX is the canvas-safe BRAND.gold (single static hex, no per-archetype variance)', () => {
    // The gold is BRAND, not ARCHETYPE — same hex regardless of which
    // archetype the reader carries (Mike napkin #100 §4.2). If a refactor
    // promotes gold to a per-archetype family, this pin trips first and
    // forces a deliberate review of the audit's cardinality.
    expect(GOLD_HEX).toBe(BRAND.gold);
    expect(GOLD_HEX).toMatch(/^#[0-9a-f]{6}$/i);
  });

  for (const anchor of SURFACE_ANCHORS) {
    const label = `gold over ${anchor.name}`;
    it(`${label} clears ≥ ${WCAG_NONTEXT}:1`, () => {
      assertReadable(anchor);
    });
  }
});

// ─── 2 · LICENSE — `archetype.gold` is licensed for the keepsake surface ──

describe('keepsake-gold-contrast-audit · §2 LICENSE (the gold voice belongs to keepsake)', () => {
  it('archetype.gold ∈ licenseFor("keepsake")', () => {
    const licensed = new Set<Voice>(licenseFor('keepsake'));
    expect(licensed.has('archetype.gold')).toBe(true);
  });

  it('CONTRAST_PAIRS.keepsake declares the (gold, surface, WCAG-non-text) contract', () => {
    // Pair lookup is by *fg voice*, not row index — the keepsake row may
    // carry sibling pairs at other floors (halo @ 1.5). The gold pair is
    // identified by name so the halo and gold siblings stay decoupled.
    const goldPair = contrastPairsFor('keepsake').find(
      (p) => p.fg === 'archetype.gold',
    );
    expect(goldPair).toBeDefined();
    expect(goldPair?.bg).toBe('thermal.accent');
    expect(goldPair?.floor).toBe(WCAG_NONTEXT);
  });

  it('the keepsake gold pair names voices the keepsake surface licenses (no drift)', () => {
    const licensed = new Set<Voice>(licenseFor('keepsake'));
    const goldPair = contrastPairsFor('keepsake').find(
      (p) => p.fg === 'archetype.gold',
    )!;
    expect(licensed.has(goldPair.fg)).toBe(true);
    expect(licensed.has(goldPair.bg)).toBe(true);
  });

  it('keepsake row carries two pairs today (halo + gold); genus deferred to rule-of-three', () => {
    // Two pairs in one row is two pairs in one row, not a template. Three
    // floors on one surface (or three surfaces with paired audits) earn a
    // `ContrastFamily` extraction. Until then, two siblings sit honestly
    // side-by-side. (Mike napkin #100 §6.)
    const fgs = contrastPairsFor('keepsake').map((p) => p.fg).sort();
    expect(fgs).toEqual(['archetype.gold', 'archetype.halo']);
  });

  it('CONTRAST_PAIRS holds four ROWS today (chip + keepsake + thread + textLink); genus deferred', () => {
    // Pair count grew (1 → 2 in the keepsake row); row count grew when
    // the thread audit landed (Mike napkin #101) and again when the
    // `textLink` audit landed (Mike napkin #45 / Sid 2026-04-26). The
    // seven-sibling audit table is row-level + in-row discipline:
    //   chip       (4 worldview pairs + fallback)  →  text-legibility
    //   keepsake   (halo + gold pairs)             →  ornament + signal
    //   thread     (one thermal.accent pair)       →  ambient cue
    //   textLink   (rest + hover-gold + hover-rose)→  foreshadow gesture
    // Distinct roles, shared shape — genus deferred until shared *role*.
    expect(Object.keys(CONTRAST_PAIRS).sort())
      .toEqual(['chip', 'keepsake', 'textLink', 'thread'].sort());
  });
});

// ─── 3 · RECEIPT — surfaces the worst-case cell for AGENTS.md §Follow-ons ─
//
// When this audit passes, leave a dated one-line receipt under AGENTS.md
// Follow-ons of the worst-case ratio + which anchor produced it — same
// shape the three sibling audits print. The receipt is the loudness
// ("fail quietly, recover loudly" — Mike napkin #95 §6).

/** Every (gold × anchor) cell, flat. Pure, ≤ 10 LOC. */
function allCells(): { ratio: number; label: string }[] {
  return SURFACE_ANCHORS.map((a) => ({
    ratio: measuredRatio(a),
    label: `gold@${a.name}`,
  }));
}

/** Tightest cell across all (gold × anchor) pairs. Pure, ≤ 10 LOC. */
function worstCell(): { ratio: number; label: string } {
  return allCells().reduce((w, c) => (c.ratio < w.ratio ? c : w));
}

describe('keepsake-gold-contrast-audit · §3 RECEIPT (worst-case for AGENTS.md §Follow-ons)', () => {
  it('worst-case cell still clears the gold floor (sweep mirrors §1 by design)', () => {
    const w = worstCell();
    // eslint-disable-next-line no-console
    console.log(
      `[keepsake-gold-contrast-audit] worst-case: ${w.ratio.toFixed(2)}:1 (${w.label}, floor ${WCAG_NONTEXT}:1, WCAG 1.4.11 non-text)`,
    );
    expect(w.ratio).toBeGreaterThanOrEqual(WCAG_NONTEXT);
  });
});
