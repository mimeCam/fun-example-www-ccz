/**
 * Halo Contrast Audit — `1.5:1` ambient floor for the archetype halo
 * ornament, **intentionally below WCAG 1.4.11** (3:1 non-text), encoded as
 * a typed lock-low invariant so a future "harmonize the halo upward" PR
 * fails on a number-vs-number assertion instead of arguing with prose.
 *
 * Third sibling to `chip-contrast-audit.test.ts` (worldview, hairline rung,
 * 4.5:1) and `archetype-chip-contrast-audit.test.ts` (NextRead, muted-rung
 * border on transparent body, 4.5:1). Same kernel — `lib/design/contrast.
 * ts` math, `lib/design/color-constants.ts` hex source of truth, `lib/
 * design/voice-ledger.ts` manifest. Different question, different floor,
 * *named honestly* — the `archetype.halo` voice paints decoration, not
 * signal, so its floor is the *aesthetic* floor (the room exhaling), not
 * the legibility floor (Tanya UX #22 §3.3 / #85 §1).
 *
 * What this audit asserts (the gate):
 *
 *   §0 LOCK-LOW INVARIANT — the halo floor sits below WCAG 1.4.11
 *      non-text (3:1) AND below WCAG 1.4.3 normal text (4.5:1) **by
 *      intent**. Number-vs-number, not comment-vs-comment. A future
 *      `HALO_AMBIENT_FLOOR = 4.5` PR fails HERE first, by name, with a
 *      message pointing at the constant's JSDoc rationale (Mike napkin
 *      #99 §0; Elon §3.2 salvaged kernel; Tanya UX #85 §6).
 *
 *   §1 FLOOR — every (archetype × thermal anchor) cell ≥ HALO_AMBIENT_
 *      FLOOR. Ten cells (5 archetypes × 2 anchors). Cells iterate
 *      `Object.keys(ARCHETYPE)` directly — `Record<ArchetypeColorKey,
 *      …>` is the centrality fence (Mike napkin #96), so a sixth halo
 *      voice landing in `color-constants.ts` lands in this audit on the
 *      same PR with no hand-edit.
 *
 *   §2 LICENSE — `archetype.halo` is in `licenseFor('keepsake')` AND the
 *      `keepsake` row of `CONTRAST_PAIRS` declares the contract (one
 *      pair, halo voice ↔ surface, at the halo floor). Mirrors §2 of the
 *      sibling audits — no overlap, no drift.
 *
 *   §3 RECEIPT — one `console.log` of the worst-case ratio + cell label
 *      for AGENTS.md §Follow-ons. Same shape both siblings print.
 *      "Fail quietly, recover loudly" — the receipt is the loudness.
 *
 * Math note — *the halo paints directly on the surface; no composite
 * step.* `ambient-surfaces.css` paints the halo via `box-shadow` /
 * `color-mix` with `--token-glow`, both of which collapse to `none` under
 * `prefers-contrast: more` and `prefers-reduced-transparency: reduce`. So
 * the ambient state IS the brand hex of the archetype meeting the
 * thermal surface directly — no `compositeOver(haloHex, surfaceHex,
 * ALPHA.muted)` step. When the OS asks for clarity, the halo is gone; the
 * audit's only job is to keep the *ambient* state honest. (Mike napkin
 * #99 §5 #1 — pinned trap.)
 *
 * Atomic fail-path doctrine: if any cell fails, the whole halo family
 * steps as ONE register (Tanya UX #22 §3.3, #85 §3.1 — "one register per
 * surface, never staggered"). Five voices step together; one cannot fall
 * alone. Manual one-line edit in `color-constants.ts` (`ARCHETYPE`).
 *
 * Failure ergonomics — number first, key second, no narrative:
 *   `${key} (halo) over ${anchor}: ${ratio}:1 < floor ${HALO_AMBIENT_
 *    FLOOR}:1`
 * Audience of one — the engineer fixing the bug. No "the room dimmed"
 * prose. Mike napkin #99 §5 #5; Elon §3.2 anti-anthropomorphism kernel.
 *
 * Pure Jest, no DOM, no Canvas. Reuses `lib/design/contrast.ts` so the
 * three sibling audits share one math kernel (Mike §extract-and-share
 * rule).
 *
 * Credits:
 *   • Krystle C. — original audit shape (one test, one manifest row,
 *     one AGENTS.md line); WCAG floor discipline; rung-as-one-register
 *     doctrine. The atomic fail-path inspired the §0 lock-low *as data
 *     discipline*, not a comment.
 *   • Tanya D. (UX #85 §1, §3.1, §3.4, §6) — the felt-experience spec
 *     ("the halo is the room exhaling"), the per-room vs per-archetype
 *     fence, the "one register, five voices" discipline, and the
 *     make-or-break test ("does our codebase refuse the harmonization
 *     proposal *by name*?") — borrowed verbatim into §0.
 *   • Mike K. (napkin #99) — the architectural call to encode the
 *     lock-low invariant as a typed assertion (not a docblock noun); the
 *     scope discipline (one test, one manifest row, one AGENTS.md line);
 *     the rejection of a `presence-contrast` genus (rule of three);
 *     the receipt-in-AGENTS.md polish.
 *   • Elon M. (salvaged kernel, via Mike #99) — "words in a docblock are
 *     not a fence; an assertion is." The §0 lock-low block, the WCAG
 *     1.4.11 honest citation, and the rejection of taxonomy theatre.
 *   • Paul K. — the product-promise framing this audit makes mechanical:
 *     "the polish stays polished — because the fence held."
 *   • Sid (this implementation) — verified the math kernel reuse (no
 *     compositeOver — halo paints directly on surface) and confirmed the
 *     archetype-chip pattern of iterating `Object.keys(ARCHETYPE)` rather
 *     than expanding the single `CONTRAST_PAIRS.keepsake` row by hand.
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
  ARCHETYPE,
  THERMAL,
  THERMAL_WARM,
  type ArchetypeColorKey,
} from '../color-constants';

// ─── Per-archetype halo hex resolver — the audit's address-mode bridge ────
//
// Mirrors `archetypeFamilyToHex` in the archetype-chip audit but routes
// through `ARCHETYPE` (the canvas-safe `--arch-{key}` family), NOT through
// `BRAND` (the chip border family). Two different surfaces, two different
// hex sources — `voice-ledger.ts:93-94` keeps `archetype.gold` and
// `archetype.halo` separate at the Voice layer, and the resolvers preserve
// that separation at the hex layer (Mike napkin #99 §5 #2 — pinned trap).
//
// `ARCHETYPE.faithful = #9d4edd` is *intentionally* the original violet
// even though `BRAND.secondary` was lifted to `#bc8cf0` (napkin #98) for
// the chip border. Two surfaces, two audits, same key — the centrality
// fence (`Record<ArchetypeColorKey, …>`) keeps them from drifting *as a
// key* but does not force them to share *a hex*. The §0 lock-low test
// prevents a future "consistency" PR from harmonizing them upward (Mike
// napkin #99 §5 #3 — pinned trap).

/**
 * Resolves an `ArchetypeColorKey` to the hex of its painted halo
 * (`--arch-{key}` family). Pure, ≤ 10 LOC. Throws on unknown so a sixth
 * archetype lands as a TS-then-runtime error in *one* place.
 */
function archetypeHaloToHex(k: ArchetypeColorKey): string {
  const hex = ARCHETYPE[k];
  if (!hex) {
    throw new Error(`halo-contrast-audit: unknown archetype halo key ${k as string}`);
  }
  return hex;
}

// ─── Thermal anchors — the two surfaces the halo reads against ────────────

/**
 * The two `--bg-surface` anchors that exist in `color-constants.ts` today
 * — `dormant` (cold start) and `warm` (engaged state). No "luminous"
 * anchor in the canvas-safe ledger today (Mike napkin #95 §1: "you cannot
 * ship an audit keyed on a state that isn't a typed concept yet"). When a
 * third anchor lands, this list extends; the floor is unchanged.
 */
const SURFACE_ANCHORS = [
  { name: 'dormant', hex: THERMAL.surface      },
  { name: 'warm',    hex: THERMAL_WARM.surface },
] as const;

type SurfaceAnchor = (typeof SURFACE_ANCHORS)[number];

// ─── Measured ratio — halo hex vs raw thermal surface ─────────────────────

/**
 * Measured WCAG ratio for an archetype's halo against the thermal surface
 * anchor. The halo paints directly on the surface (no composite — see
 * file-header math note); brand hex meets surface hex unmediated. Pure,
 * ≤ 10 LOC.
 */
function measuredRatio(k: ArchetypeColorKey, anchor: SurfaceAnchor): number {
  return contrast(archetypeHaloToHex(k), anchor.hex);
}

// ─── Structured failure message (Elon's kernel — number first, key second) ─

/**
 * Asserts the cell clears the halo floor with a structured failure
 * message. Pure-ish (throws on fail). ≤ 10 LOC.
 *
 * Failure shape — number first, key second, no narrative:
 *   `faithful (halo) over warm: 1.32:1 < floor 1.5:1`
 */
function assertReadable(k: ArchetypeColorKey, anchor: SurfaceAnchor): void {
  const ratio = measuredRatio(k, anchor);
  if (ratio < HALO_AMBIENT_FLOOR) {
    const head = `${k} (halo) over ${anchor.name}`;
    throw new Error(`${head}: ${ratio.toFixed(2)}:1 < floor ${HALO_AMBIENT_FLOOR}:1`);
  }
  expect(ratio).toBeGreaterThanOrEqual(HALO_AMBIENT_FLOOR);
}

// ─── 0 · LOCK-LOW INVARIANT — the floor sits below WCAG by intent ─────────
//
// Elon's salvaged kernel (Mike napkin #99 §1): the fence is a *type and
// an assertion*, not a docblock noun. A future "harmonize the halo to
// 4.5:1" PR fails HERE first — before any human review — with a message
// pointing at the JSDoc on `HALO_AMBIENT_FLOOR`. That is the architecture.

describe('halo-contrast-audit · §0 LOCK-LOW (the floor is named, not assumed)', () => {
  it('HALO_AMBIENT_FLOOR sits below WCAG 1.4.11 non-text (3:1) — by intent', () => {
    // Tanya UX #85 §1: the halo is presence ornament, not signal. A higher
    // floor would force the halo to perform. See JSDoc on
    // `HALO_AMBIENT_FLOOR` in `lib/design/voice-ledger.ts` for the rationale.
    expect(HALO_AMBIENT_FLOOR).toBeLessThan(WCAG_NONTEXT);
  });

  it('HALO_AMBIENT_FLOOR sits below WCAG 1.4.3 normal text (4.5:1) — by intent', () => {
    // Belt-and-braces: the keepsake's *text* + glyph + caption carry the
    // legibility load (audited at 4.5:1 in `archetype-chip-contrast-audit`).
    // The halo is decoration. If a refactor harmonizes both floors, this
    // assertion + the §1 floor assertion together prevent silent drift in
    // either direction.
    expect(HALO_AMBIENT_FLOOR).toBeLessThan(WCAG_AA_TEXT);
  });

  it('HALO_AMBIENT_FLOOR is pinned at 1.5:1 (snapshot the number itself)', () => {
    // Pin the literal value — a future PR that nudges to `1.6` or `1.4`
    // touches this line and prompts a deliberate review of the JSDoc.
    expect(HALO_AMBIENT_FLOOR).toBe(1.5);
  });

  it('WCAG constants match the spec (4.5 for text, 3.0 for non-text)', () => {
    // Sanity pin — if anyone "rounds" `WCAG_AA_TEXT` to 5, the lock-low
    // assertions above silently weaken. Number-vs-number, not name-vs-name.
    expect(WCAG_AA_TEXT).toBe(4.5);
    expect(WCAG_NONTEXT).toBe(3.0);
  });
});

// ─── 1 · FLOOR — every (archetype × anchor) cell holds ≥ HALO_AMBIENT_FLOOR

describe('halo-contrast-audit · §1 FLOOR (every halo cell clears the ambient floor)', () => {
  // Iterate the manifest's keys directly — `Record<ArchetypeColorKey, …>`
  // IS the centrality fence (Mike napkin #96). A sixth archetype lands
  // here automatically; this audit does not need a hand-edited list.
  const ARCHETYPES = Object.keys(ARCHETYPE) as ArchetypeColorKey[];

  it('ARCHETYPE carries exactly the five painted halo voices today', () => {
    expect(ARCHETYPES).toHaveLength(5);
    expect(new Set(ARCHETYPES)).toEqual(
      new Set(['deep-diver', 'explorer', 'faithful', 'resonator', 'collector']),
    );
  });

  for (const k of ARCHETYPES) {
    for (const anchor of SURFACE_ANCHORS) {
      const label = `${k} (halo) over ${anchor.name}`;
      it(`${label} clears ≥ ${HALO_AMBIENT_FLOOR}:1`, () => {
        assertReadable(k, anchor);
      });
    }
  }
});

// ─── 2 · LICENSE — `archetype.halo` is licensed for the keepsake surface ──

describe('halo-contrast-audit · §2 LICENSE (the halo voice belongs to keepsake)', () => {
  it('archetype.halo ∈ licenseFor("keepsake")', () => {
    const licensed = new Set<Voice>(licenseFor('keepsake'));
    expect(licensed.has('archetype.halo')).toBe(true);
  });

  it('CONTRAST_PAIRS.keepsake declares the (halo, surface, halo-floor) contract', () => {
    // The keepsake row may carry sibling pairs at other floors (Mike napkin
    // #100 — gold @ 3.0 lands as a second pair on the same surface). The
    // halo contract is decoupled by *fg voice*, not by row index — pick the
    // halo pair by name so a sibling landing does not break this audit.
    const haloPair = contrastPairsFor('keepsake').find(
      (p) => p.fg === 'archetype.halo',
    );
    expect(haloPair).toBeDefined();
    expect(haloPair?.floor).toBe(HALO_AMBIENT_FLOOR);
  });

  it('the keepsake pair names voices the keepsake surface licenses (no drift)', () => {
    const licensed = new Set<Voice>(licenseFor('keepsake'));
    for (const pair of contrastPairsFor('keepsake')) {
      expect(licensed.has(pair.fg)).toBe(true);
      expect(licensed.has(pair.bg)).toBe(true);
    }
  });

  it('CONTRAST_PAIRS holds four rows today (chip + keepsake + thread + textLink); genus deferred', () => {
    // Mike napkin #101: `thread` joined the manifest as the fifth contrast-
    // audit sibling (one fg, two anchors, ambient floor — same lock-LOW
    // doctrine as halo). Mike napkin #45 / Sid (2026-04-26): `textLink`
    // joined as the seventh sibling (three fgs, two anchors, text floor —
    // foreshadow gesture). Four siblings now, but the `ContrastFamily`
    // genus is STILL deferred because they share *shape* (one fg over one
    // bg at one floor) and not *role* (text-legibility / signal-gem /
    // ambient-cue / foreshadow-gesture). Polymorphism is a killer (Mike
    // #54).
    expect(Object.keys(CONTRAST_PAIRS).sort())
      .toEqual(['chip', 'keepsake', 'textLink', 'thread'].sort());
  });
});

// ─── 3 · RECEIPT — surfaces the worst-case cell for AGENTS.md §Follow-ons ─
//
// When this audit passes, leave a dated one-line receipt under AGENTS.md
// Follow-ons of the worst-case ratio + which (archetype, anchor) produced
// it — same shape the two sibling audits print. The receipt is the
// loudness ("fail quietly, recover loudly" — Mike napkin #95 §6).

/** Every (archetype × anchor) cell, flat. Pure, ≤ 10 LOC. */
function allCells(): { ratio: number; label: string }[] {
  const ARCHETYPES = Object.keys(ARCHETYPE) as ArchetypeColorKey[];
  return ARCHETYPES.flatMap((k) =>
    SURFACE_ANCHORS.map((a) => ({
      ratio: measuredRatio(k, a),
      label: `${k}@${a.name}`,
    })),
  );
}

/** Tightest cell across all (archetype × anchor) pairs. Pure, ≤ 10 LOC. */
function worstCell(): { ratio: number; label: string } {
  return allCells().reduce((w, c) => (c.ratio < w.ratio ? c : w));
}

describe('halo-contrast-audit · §3 RECEIPT (worst-case for AGENTS.md §Follow-ons)', () => {
  it('worst-case cell still clears the halo floor (sweep mirrors §1 by design)', () => {
    const w = worstCell();
    // eslint-disable-next-line no-console
    console.log(
      `[halo-contrast-audit] worst-case: ${w.ratio.toFixed(2)}:1 (${w.label}, floor ${HALO_AMBIENT_FLOOR}:1, < WCAG 1.4.11 by intent)`,
    );
    expect(w.ratio).toBeGreaterThanOrEqual(HALO_AMBIENT_FLOOR);
  });
});
