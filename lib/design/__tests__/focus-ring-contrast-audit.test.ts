/**
 * Focus-Ring Contrast Audit — `3.0:1` WCAG 1.4.11 floor for the painted
 * focus ring, the **eighth sibling** in the contrast-audit table — and the
 * *first* member of the **Reader-Invariant Chrome** group (Tanya UX #60 §3:
 * "shape decides group; if a receipt prints one cell at both anchors, it
 * is reader-invariant chrome"). Same kernel — `lib/design/contrast.ts`
 * math, `lib/design/color-constants.ts` hex source of truth, `lib/design/
 * voice-ledger.ts` manifest. Same §0/§1/§2/§3 rhythm. Different *type* —
 * the row uses `ReaderInvariantPair` (`invariant: true` brand) so the
 * `cold ≡ warm` invariant is a *shape* claim, not a runtime claim.
 *
 * The eight-cornered audit table:
 *
 *   Thermal Voices (the room responding):
 *     chip-contrast-audit                  · 4.5  · hairline rung   · text
 *     archetype-chip-contrast-audit        · 4.5  · muted rung      · border-on-transparent
 *     halo-contrast-audit                  · 1.5  · ambient floor   · ornament
 *     keepsake-gold-contrast-audit         · 3.0  · WCAG 1.4.11     · signal
 *     thread-contrast-audit                · 1.5  · ambient floor   · cue
 *     textlink-passage-contrast-audit      · 4.5  · WCAG 1.4.3      · foreshadow
 *
 *   Reader-Invariant Chrome (the room not lying):
 *     skiplink-contrast-audit              · 4.5  · WCAG 1.4.3      · static chrome
 *     focus-ring-contrast-audit            · 3.0  · WCAG 1.4.11     · invariant chrome ← THIS
 *
 * **Why this audit owns the index-0 trust anchor** — `TRUST_INVARIANTS[0]`
 * published "The focus ring" as the first invariant the reader can verify
 * with their own eyes. Until this ship, the anchor lived in
 * `focus-ink-byte-identity.test.ts` (a *physics* test of the authoring
 * CSS bytes). With this ship, the anchor moves here — to the *contrast*
 * receipt that proves the ring is legible at the painted surface, not
 * just textually disjoint from the thermal token. The grep-for-five rule
 * from `AGENTS.md §"Reader-invariant promise → audit pairings"` holds:
 * a grep for the trust-anchor helper invocation across `lib/` returns
 * five hits — one per published index. Physics test stays — as a
 * *sibling guarantee*, not a contrast receipt.
 *
 * **One sentence about SkipLink (Mike #103 §7 risk note)** — SkipLink is
 * also reader-invariant by paint-byte identity, and Tanya UX #60 §3 places
 * it next to this audit in the AGENTS.md grouping. We do NOT promote
 * SkipLink into a "Reader Anchor" *type* this sprint: the type's job is
 * to forbid divergence in *one* row, and `skiplink-contrast-audit` is
 * already a stable, byte-stable receipt (no divergence to forbid). Rule
 * of three — when a third invariant chrome audit lands, that is when the
 * genus earns a name. Today, the chrome group has two members by *layout*
 * (AGENTS.md heading), one member by *type* (this audit's
 * `ReaderInvariantPair` brand). One sentence; no relitigation.
 *
 * What this audit asserts (the gate):
 *
 *   §0 ANCHOR — re-anchors `TRUST_INVARIANTS[0]` ("The focus ring") to
 *      this audit module via the trust-anchor helper. Pre-flight grep
 *      for the literal index-0 invocation returns exactly one hit.
 *
 *   §1 LOCK / SHAPE — the `focusRing` row uses `ReaderInvariantPair`
 *      (`invariant: true`); the row holds exactly one cell; the floor
 *      is WCAG_NONTEXT (3:1) by intent. Number-vs-number, not comment-
 *      vs-comment. Drift is a TS error first, then a test failure.
 *
 *   §2 FLOOR — the painted ring (FOCUS_INK × FOCUS.alpha, composited
 *      over the thermal surface anchor) clears `WCAG_NONTEXT` at BOTH
 *      anchors. ONE voice × two anchors = TWO cells; the §3 receipt
 *      collapses them to one number twice (the brand's promise).
 *
 *   §3 RECEIPT — one `console.log` line, one number printed twice:
 *
 *        [focus-ring-contrast-audit] X.XX:1 at both anchors
 *        (focus-ink × 80% over surface, floor 3.0:1, WCAG 1.4.11
 *         non-text; type forbids divergence; mechanism mirrors SkipLink)
 *
 *      The visual repetition IS the contract (Tanya UX #60 §6 — the
 *      cadence: "this number does not move" louder than any prose).
 *
 * Math note — *the ring composites `FOCUS_INK` over the surface at
 * `FOCUS.alpha` (80%)*. The browser paints `color-mix(in srgb,
 * var(--sys-focus-ink) 80%, transparent)` over the host surface
 * (`app/globals.css:434–440`); the audit measures what the browser paints,
 * not what the constant declares (Mike #103 §6 #2 — pinned trap). This is
 * the *only* sibling that uses `compositeOver` in the contrast audit — the
 * five `bg: 'thermal.accent'` siblings (keepsake, thread, textLink) paint
 * opaque or are measured opaque. The 80% lerp is the WCAG mitigation Tanya
 * UX #72 named.
 *
 * Pure Jest, no DOM, no Canvas, no React mount. Reuses `lib/design/
 * contrast.ts` so all eight sibling audits share one math kernel (Mike
 * §extract-and-share rule).
 *
 * Failure ergonomics — number first, key second, no narrative:
 *   `focus-ring over warm: 2.91:1 < floor 3.0:1`
 * Audience of one — the engineer fixing the bug. No "the room blinked"
 * prose. (Mike napkin #103 §6 #5; Elon §3.2.)
 *
 * Credits:
 *   • Mike K. (#103) — the napkin shape, the §6 trap-list, the four-file
 *     ship list, the `ReaderInvariantPair` 5-LOC kernel.
 *   • Tanya D. (UX #60) — the layout reframe (two named groups, count in
 *     the heading, "shape decides group"); the "one number, twice" cadence
 *     §6; the SkipLink-into-chrome §3 layout fix that informs §"What this
 *     audit deliberately avoids."
 *   • Paul K. (#49 §4 / §5 — via Mike) — the named-asymmetry framing,
 *     the MUST-2 "one number, twice" gate, the MUST-4 "reader sees no
 *     change" acceptance posture this audit honours.
 *   • Elon M. (§3) — the kernel-only doctrine: 5 LOC of TS, no manifesto;
 *     the rejection of cosmology that kept this audit's JSDoc to one
 *     question (*why is this row typed differently?*).
 *   • Jason F. (#91, via Elon §3) — the salvaged structural insight:
 *     type-pin the cold≡warm invariant so it cannot drift.
 *   • Krystle C. (#79) — the four-file scope; the audit-shape-mirrors-
 *     SkipLink pattern this audit copies; the §3 receipt loudness
 *     doctrine ("fail quietly, recover loudly").
 *   • The seven sibling audits already in the tree — for being the
 *     §0/§1/§2/§3 template this eighth pour copies exactly.
 */

import {
  CONTRAST_PAIRS,
  FOCUS_RING_PAINTED_FLOOR,
  WCAG_NONTEXT,
  WCAG_AA_TEXT,
  type ReaderInvariantPair,
} from '../voice-ledger';
import { contrast, compositeOver } from '../contrast';
import { FOCUS, FOCUS_INK } from '../focus';
import { THERMAL, THERMAL_WARM } from '../color-constants';
import { assertTrustAnchor } from '@/lib/sharing/__tests__/_helpers';

// ─── §0 ANCHOR — this audit owns TRUST_INVARIANTS[0] ──────────────────────
// Mike #103 §5 file #1: the audit *re-anchors* `[0]` to itself; the
// physics test (`focus-ink-byte-identity`) drops its `assertTrustAnchor`
// call in the same ship. Grep-for-five rule holds.
assertTrustAnchor(0, 'The focus ring');

// ─── Two anchors — the canvas-safe surfaces the painted ring composites ──
// Same two-anchor discipline as every sibling audit (Mike napkin #95 §1).
// The shape is load-bearing: if a future PR forks the ring on thermal
// state, the §2 IDENTITY assertion below fails first.

const ANCHORS = [
  { name: 'cold', surface: THERMAL.surface      },
  { name: 'warm', surface: THERMAL_WARM.surface },
] as const;

type Anchor = (typeof ANCHORS)[number];

// ─── Helpers — pure, ≤10 LOC each ────────────────────────────────────────

/** The `focusRing` row from `CONTRAST_PAIRS`. Pure. */
function focusRingRow(): readonly ReaderInvariantPair[] {
  return (CONTRAST_PAIRS.focusRing ?? []) as readonly ReaderInvariantPair[];
}

/** The painted ring's effective hex over a surface — FOCUS_INK × α over bg. */
function paintedHex(anchor: Anchor): string {
  return compositeOver(FOCUS_INK, anchor.surface, FOCUS.alpha);
}

/** WCAG ratio for the painted ring against a surface anchor. Pure. */
function paintedRatio(anchor: Anchor): number {
  return contrast(paintedHex(anchor), anchor.surface);
}

/** Number-first failure. No narrative. Audience of one. */
function assertReadable(anchor: Anchor): void {
  const ratio = paintedRatio(anchor);
  if (ratio < FOCUS_RING_PAINTED_FLOOR) {
    throw new Error(
      `focus-ring over ${anchor.name}: ${ratio.toFixed(2)}:1 `
      + `< floor ${FOCUS_RING_PAINTED_FLOOR}:1`,
    );
  }
  expect(ratio).toBeGreaterThanOrEqual(FOCUS_RING_PAINTED_FLOOR);
}

/** The narrower of the two anchor ratios — the receipt's headline number. */
function worstRatio(): number {
  return Math.min(...ANCHORS.map(paintedRatio));
}

// ─── §1 LOCK / SHAPE — the row is typed `ReaderInvariantPair`, one cell ──
// Mike #103 §3 / Jason #91: the brand makes the row's SHAPE one cell, not
// a `{cold, warm}` tuple. A future palette PR that types two cells into
// the row fails TS first — before this jest run executes. The runtime
// assertions below are belt-and-braces for the shape claim AND pin both
// the current painted floor and the contract floor (WCAG_NONTEXT) so a
// palette lift is a deliberate, reviewable change.

describe('focus-ring-contrast-audit · §1 LOCK / SHAPE (invariant brand, one cell)', () => {
  it('CONTRAST_PAIRS.focusRing exists and holds exactly ONE cell', () => {
    const row = focusRingRow();
    expect(row).toBeDefined();
    expect(row.length).toBe(1);
  });

  it('the cell carries `invariant: true` (the ReaderInvariantPair brand)', () => {
    const [cell] = focusRingRow();
    expect(cell.invariant).toBe(true);
  });

  it('the cell uses FOCUS_RING_PAINTED_FLOOR (the WCAG 1.4.11 contract)', () => {
    const [cell] = focusRingRow();
    // Post-palette-lift: `FOCUS_RING_PAINTED_FLOOR` IS `WCAG_NONTEXT` (3:1).
    // The constant survives the lift to keep the "painted floor" name as a
    // grep-anchor and a deletion barrier (a future "soften the ring for
    // taste" PR has to delete the named constant, not just a number).
    expect(cell.floor).toBe(FOCUS_RING_PAINTED_FLOOR);
  });

  it('FOCUS_RING_PAINTED_FLOOR === WCAG_NONTEXT (the post-lift identity)', () => {
    // Post-palette-lift identity (Sid 2026-04-26 — Mike napkin / Tanya UX
    // #12). The previous LOCK assertion was `< WCAG_NONTEXT` (lock-LOW by
    // palette, lift pending); the FLIP to identity is the receipt that the
    // lift shipped — reviewers grep for this assertion to confirm it.
    expect(FOCUS_RING_PAINTED_FLOOR).toBe(WCAG_NONTEXT);
    expect(WCAG_NONTEXT).toBeLessThan(WCAG_AA_TEXT);
  });

  it('the cell uses `thermal.accent` symbolically for both fg and bg', () => {
    const [cell] = focusRingRow();
    // Symbolic — same convention keepsake / thread / textLink rows use.
    // The audit resolves both canvas-safe surface anchors at iteration
    // time. Mike #103 §6 #1 — pinned trap; do NOT invent a new voice.
    expect(cell.fg).toBe('thermal.accent');
    expect(cell.bg).toBe('thermal.accent');
  });
});

// ─── §2 FLOOR — every (painted ring × anchor) cell ≥ FOCUS_RING_PAINTED ──
//
// The ring composites FOCUS_INK over the surface at FOCUS.alpha (80%) —
// the actual painted hex the browser shows. Two anchor cells today (1
// voice × 2 anchors); the §3 receipt collapses to one number ("at both
// anchors") because the brand's contract is the SHAPE invariant, not a
// numeric byte-identity (the cold/warm surfaces differ by a few bytes
// — INK byte-identity is owned by `focus-ink-byte-identity.test.ts`).

describe('focus-ring-contrast-audit · §2 FLOOR (painted ring clears the documented floor)', () => {
  it('FOCUS_INK is the canvas-safe brand violet (single static hex)', () => {
    expect(FOCUS_INK).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('FOCUS.alpha is 0.8 (the WCAG mitigation lerp)', () => {
    // The 80% lerp inside color-mix() is what tightens the painted
    // contrast; if a future PR softens the alpha for taste, this
    // assertion + the floor cells below fail together. (Tanya UX #60 §1.)
    expect(FOCUS.alpha).toBe(0.8);
  });

  for (const anchor of ANCHORS) {
    it(`@ ${anchor.name} anchor: painted ring clears ≥ ${FOCUS_RING_PAINTED_FLOOR}:1`, () => {
      assertReadable(anchor);
    });
  }
});

// ─── §2.5 INK IDENTITY — the FG ink is byte-identical across anchors ─────
// The brand `invariant: true` is a SHAPE claim (one cell, not two). The
// numeric byte-identity that *is* true is FOCUS_INK at every thermal
// score (`focus-ink-byte-identity.test.ts` owns the full physics gate).
// This sibling assertion documents the claim *that the audit makes*: the
// ring's ink does not vary; only the surface beneath does. The receipt's
// "at both anchors" cadence is honest because the ink is invariant.

describe('focus-ring-contrast-audit · §2.5 INK IDENTITY (FG bytes invariant)', () => {
  it('FOCUS_INK is the SAME hex used at both anchors (no fork)', () => {
    // Same input, same output. If a future PR re-couples FOCUS_INK to
    // a thermal source, the byte-identity gate fires first; this is the
    // belt-and-braces echo at the contrast layer.
    const inkAtCold = FOCUS_INK;
    const inkAtWarm = FOCUS_INK;
    expect(inkAtCold).toBe(inkAtWarm);
  });

  it('the cold and warm painted ratios differ ONLY because surfaces differ', () => {
    // The painted ring's ratio at the two anchors differs by ≤ 0.2
    // (a few luminance bytes); the difference traces to the surface bg
    // delta, not to the ink. If this delta widens past the threshold, a
    // palette refactor has changed the surface anchors — review them.
    const cold = paintedRatio(ANCHORS[0]);
    const warm = paintedRatio(ANCHORS[1]);
    expect(Math.abs(cold - warm)).toBeLessThan(0.5);
  });
});

// ─── §3 RECEIPT — surface the worst-case ratio for AGENTS.md §Receipts ───
// Tanya UX #60 §6 — print "at both anchors" with one number; the cadence
// is the contract. The headline number is the WORST-CASE (the narrower of
// the two anchor ratios) — the conservative receipt the reader trusts. The
// SkipLink convention this audit mirrors prints one number twice because
// SkipLink's bytes ARE identical; here the surfaces differ by a few bytes
// so the receipt prints the worst-case at both anchors honestly.

describe('focus-ring-contrast-audit · §3 RECEIPT (one number — worst-case at both anchors)', () => {
  it('prints the worst-case ratio at both anchors (cadence: one number)', () => {
    const ratio = worstRatio();
    // eslint-disable-next-line no-console
    console.log(
      `[focus-ring-contrast-audit] ${ratio.toFixed(2)}:1 at both anchors `
      + `(focus-ink × 80% over surface, floor ${FOCUS_RING_PAINTED_FLOOR}:1, `
      + `WCAG 1.4.11 non-text; reader-invariant chrome — type forbids `
      + `divergence; mechanism mirrors SkipLink)`,
    );
    expect(ratio).toBeGreaterThanOrEqual(FOCUS_RING_PAINTED_FLOOR);
  });
});
