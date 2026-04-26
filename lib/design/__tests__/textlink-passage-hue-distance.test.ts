/**
 * textlink-passage-hue-distance — per-surface Δh floor audit for the
 * TextLink (passage) foreshadow gesture.
 *
 * The `passage` TextLink (the body-prose link variant; see
 * `components/shared/TextLink.tsx` and the `textlink-passage-contrast-
 * audit.test.ts` sibling) speaks through one surface today: a body-rank
 * paragraph in an article, paired with a one-beat (120 ms) text-color
 * crossfade on hover/focus. Three text-color families paint that surface
 * — `accent` (violet) at rest, `gold` (warm yellow) on hover when the
 * link's destination is `/mirror`, `rose` (warm pink) on hover when the
 * link's destination is `/resonances`. Sibling hues, shared surface,
 * one-beat gesture — exactly the shape `archetype-hue-distance` and
 * `worldview-hue-distance` already audit.
 *
 * The fence: on each surface that paints ≥ 2 distinct text-color
 * families, the minimum circular hue distance between any two of those
 * families must clear `HUE_FLOOR_DEG` (45°). Today's tightest pair sits
 * at ~55.86° (`gold` = `#f0c674` ↔ `rose` = `#e88fa7`, the two warm
 * destinations the foreshadow points at on hover); 45° is the
 * architectural fence so a future "warm the gold a touch" / "cool the
 * rose a touch" theme tweak fails here, before the foreshadow ships
 * destinations that have collapsed onto each other (Mike napkin §6:
 * today's reality minus a real margin, *not* calibrated to the eyebrow).
 * Architectural, not calibrated — *the floor is the architecture*. Same
 * floor and same rationale as the worldview chip's cross-family pairs;
 * gold↔rose crosses the same warm-yellow ↔ warm-pink hue boundary.
 *
 * **The audit measures three pairs; only one binds.** `accent↔gold`
 * sits at ~113.96° (wide-of-the-wheel; violet is across the wheel from
 * the warm pair) and `accent↔rose` sits at ~58.11° (comfortable; same
 * pair the worldview chip already audits at the same number). Only
 * `gold↔rose` (~55.86°) could plausibly trip on a future palette nudge
 * that warms the gold or cools the rose across the warm-pair boundary.
 * The other two pairs are decoy receipts (Elon report #27 §1) — they
 * keep the snapshot honest about *what is being measured*, not
 * load-bearing in the floor sense.
 *
 * **Per-surface, not global.** Same teardown the archetype + worldview
 * audits inherit from Elon §4 / Mike napkin: a global "every voice safely
 * far from every other voice" invariant is structurally false (`accent`
 * is a violet, `gold` and `rose` are warms — they live on different parts
 * of the wheel by intent). The honest question is the per-surface one:
 * *on the surface that paints these families together (the passage
 * TextLink), do the families distinguish?* Yes. Receipt below.
 *
 * **Receipt as snapshot.** The full Δh pair table per surface is
 * snapshotted to `__snapshots__/textlink-passage-hue-distance.test.ts.
 * snap` so a hue change to any of the three families shows up in PR
 * review as a number, not as a vibe (Tanya UX #60 §3 / UX #67 §3:
 * numbers, not adjectives — same convention as the archetype +
 * worldview audits).
 *
 * **No new constants, no palette nudge, no new pixel.** The painted
 * hexes resolve through the canvas-safe `BRAND` map in
 * `lib/design/color-constants.ts` (`accentViolet`, `gold`, `rose` are
 * all already shipped). No new ledger row, no new Voice atom, no new
 * alpha rung, no new motion timing, no new component. Zero pixels move
 * — this is a CI guard against a future palette nudge that crosses the
 * warm-pair boundary, sold honestly as audit-coverage delta, not as
 * AAA polish (Mike napkin #131 POI #8).
 *
 * **Shape decides group, NOT phase.** The hue-distance audit is about
 * *hue distance between sibling families on a surface* — phase
 * (rest/hover/focus) is the contrast audit's job, already covered by
 * `textlink-passage-contrast-audit.test.ts` (the seventh-cornered
 * sibling in the contrast group). Two audits, two shapes, same surface,
 * one source of paint truth (Tanya UX #60 §3).
 *
 * **Rule-of-three on the kernel triggers, but does NOT trigger a new
 * genus.** Three callers means: the kernel pattern is proven, the
 * surface table shape is proven, the floor-per-audit doctrine is proven.
 * It does **not** mean "extract a `SiblingVoiceHueDistance` class."
 * Polymorphism is a killer (`hue-distance.ts` docblock; AGENTS.md
 * §"Always simplify"). The `Record<surface, readonly string[]>` literal
 * pattern is doing the polymorphism job already (Mike napkin #102 §3 /
 * #131 POI #7). Promotion to a `Surface` row on `voice-ledger.ts` is a
 * separate napkin and only buys generality nobody is asking for. Defer.
 *
 * Pure Jest. No DOM, no Canvas, no thermal lerp, no RAF, no timers.
 * Reuses `lib/design/hue-distance.ts` (the audit kernel) and
 * `lib/design/hue.ts` (the math kernel) — drift = `npx jest` red.
 *
 * Credits: Mike K. (napkin #131 — the third-caller shape, the rule-of-
 * three-without-a-new-genus framing, the 45° floor as architectural
 * cross-family fence, the "binding pair" docblock convention); Elon M.
 * (report #27 — the three-numbers physics teardown that names the
 * binding pair `gold↔rose 55.86°` and demotes the metaphor wrapping;
 * the cross-family floor justification mirroring worldview); Paul K.
 * (report #9 / #47 — the strategic framing: polish, not extend; the
 * de-prioritization discipline that keeps this PR's scope to one new
 * file; the "two adjacent passage TextLinks read as different rooms"
 * success metric the perceptual delta defends); Tanya D. (UX #60 §3,
 * #67 §3, #39 — *shape decides group; numbers, not adjectives* — this
 * audit lands in the hue-distance group at the right cardinality, with
 * receipts as numbers; the experience contract — two foreshadow
 * destinations as different rooms, not "two warm hovers" — is the UX
 * the floor defends); Krystle C. (the third-caller scaffolding pattern,
 * file path, and rule-of-three landing); Sid (2026-04-26, repeated
 * authorship — the §0/§1/§2/§3 audit rhythm the snapshot rests on; the
 * function-≤-10-LOC discipline; OKLab ΔE perceptual sibling-physics as
 * REPL helper, kept off the CI gate); the existing `archetype-hue-
 * distance.test.ts` and `worldview-hue-distance.test.ts` (most decisions
 * paid for already — this caller is a clone of the kernel pattern, not
 * an invention).
 */

import { BRAND } from '../color-constants';
import {
  deltaHue,
  deltaTable,
  familyPairs,
  surfaceReceipt,
  worstPair,
} from '../hue-distance';

// ─── Floors — calibrated, not eyeballed ──────────────────────────────────

/**
 * Minimum acceptable circular hue distance between any two distinct
 * text-color families that share the TextLink (passage) surface, in
 * degrees. Today's tightest pair sits at ~55.86° (`gold` = `#f0c674` ↔
 * `rose` = `#e88fa7` — the two warm destinations the foreshadow points
 * at on hover, crossing the warm-yellow ↔ warm-pink hue family
 * boundary). 45° is the architectural fence so a future palette nudge
 * (warm the gold, cool the rose) fails here, before the foreshadow
 * ships destinations that have collapsed onto each other.
 *
 * Same floor as the worldview chip's cross-family pairs (Elon #27 §3 /
 * Mike POI #6). The archetype audit's floor sits at 15° because its
 * tightest pair is *itself* a sibling-violet (`accent` ↔ `secondary`
 * post-lift); this audit's tightest pair crosses a hue family boundary,
 * so the floor sits architecturally higher. Floors per audit, not
 * global — the floor is the architecture.
 */
const HUE_FLOOR_DEG = 45;

// ─── Family → painted hex resolver ───────────────────────────────────────

/**
 * Three text-color Tailwind families painted on the passage TextLink
 * surface, and the static `BRAND` hex each resolves to (`tailwind.
 * config.ts`: `accent → BRAND.accentViolet`, `gold → BRAND.gold`, `rose
 * → BRAND.rose`). Mirrors the resolution shape used by the archetype +
 * worldview audits — same pattern, different lookup table. Pure data.
 *
 * Note `accent` here is the same `BRAND.accentViolet` the archetype +
 * worldview audits read — the static brand violet Tailwind paints under
 * `text-accent`. The three audits operate on the same wheel; their
 * floors differ because their *surface paint sets* differ (Mike napkin
 * §5 / #131 POI #1).
 */
const FAMILY_HEX: Record<string, string> = {
  accent: BRAND.accentViolet,
  gold:   BRAND.gold,
  rose:   BRAND.rose,
};

// ─── Surface → distinct text families painted there ─────────────────────

/**
 * Per-surface paint list for the TextLink (passage) foreshadow gesture.
 * Today exactly one surface paints these voices: a body-rank paragraph
 * holding a `passage` TextLink. The list contains the *distinct*
 * text-color families — three values, three pairs:
 *
 *   • `accent` paints at rest (the room's violet),
 *   • `gold`   paints on hover when the destination is `/mirror`,
 *   • `rose`   paints on hover when the destination is `/resonances`.
 *
 * The three families are pinned distinct by design (no two destinations
 * share the same warm hex; the contrast audit verifies the legibility
 * of each over both thermal anchors). The shape is `Record<string,
 * readonly string[]>` so a future surface (e.g. a fourth foreshadow
 * destination) lands as one row with no audit re-write — though per
 * Tanya UX #39 §6, no fourth destination is in scope this sprint.
 */
const TEXTLINK_PASSAGE_SURFACES: Record<string, readonly string[]> = {
  // Passage TextLink in body prose (the only surface that paints this
  // foreshadow set in this sprint; Tanya UX #39 §1 / Mike napkin #131
  // §2.1). Three families, three pairs — gold↔rose is the binding pair
  // at the 45° floor; the other two pairs are decoy receipts that keep
  // the snapshot honest about what is being measured (Elon #27 §1).
  passage: ['accent', 'gold', 'rose'],
};

// ─── Helpers — imported from `lib/design/hue-distance.ts` ───────────────
//
// Five pure helpers (`deltaHue`, `familyPairs`, `deltaTable`, `worstPair`,
// `surfaceReceipt`) live in the shared kernel. This audit is the third
// caller (rule-of-three on the kernel — proven; not a trigger for a new
// genus per Mike napkin #131 POI #7). Floors stay per-audit (the floor
// is the architecture, not a paint value — Mike POI #6).

// ─── 1 · Floor — every (surface, pair) holds ≥ HUE_FLOOR_DEG ─────────────

describe(`textlink-passage-hue-distance · per-surface ≥ ${HUE_FLOOR_DEG}° floor`, () => {
  for (const [surface, families] of Object.entries(TEXTLINK_PASSAGE_SURFACES)) {
    for (const [a, b] of familyPairs(families)) {
      it(`${surface} · Δh(${a}, ${b}) ≥ ${HUE_FLOOR_DEG}°`, () => {
        expect(deltaHue(a, b, FAMILY_HEX)).toBeGreaterThanOrEqual(HUE_FLOOR_DEG);
      });
    }
  }
});

// ─── 2 · Worst-case sweep — per-surface receipt + global stdout line ─────

describe('textlink-passage-hue-distance · worst-case receipt (per surface)', () => {
  for (const [surface, families] of Object.entries(TEXTLINK_PASSAGE_SURFACES)) {
    it(`${surface} · worst Δh clears the floor (mirrors §1 by design)`, () => {
      const { pair, dh } = worstPair(families, FAMILY_HEX);
      // eslint-disable-next-line no-console
      console.log(
        `[textlink-passage-hue-distance] ${surface} · worst Δh ${dh.toFixed(2)}° at ${pair} (floor ${HUE_FLOOR_DEG}°)`,
      );
      expect(dh).toBeGreaterThanOrEqual(HUE_FLOOR_DEG);
    });
  }
});

// ─── 3 · Resolver invariants ─────────────────────────────────────────────

describe('textlink-passage-hue-distance · resolver invariants', () => {
  it('every text family resolves to a hex in BRAND', () => {
    for (const family of Object.keys(FAMILY_HEX)) {
      expect(typeof FAMILY_HEX[family]).toBe('string');
      expect(/^#[0-9a-fA-F]{6}$/.test(FAMILY_HEX[family])).toBe(true);
    }
  });

  it('every surface paints ≥ 2 distinct families (audit needs ≥ 1 pair)', () => {
    for (const families of Object.values(TEXTLINK_PASSAGE_SURFACES)) {
      expect(families.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every family on every surface is in FAMILY_HEX (no orphans)', () => {
    for (const families of Object.values(TEXTLINK_PASSAGE_SURFACES)) {
      for (const family of families) {
        expect(FAMILY_HEX[family]).toBeDefined();
      }
    }
  });

  it('passage surface lists distinct families only (no duplicate hex)', () => {
    // Guard the design intent: the three foreshadow families must paint
    // three distinct hexes. A future palette PR that accidentally aliases
    // `gold` to the same hex as `accent` (or `rose` to `gold`) would
    // collapse the foreshadow at commit zero — set-size-equals-length
    // catches that before the floor assertion does (mirror of the
    // worldview audit's distinct-hex resolver guard).
    const families = TEXTLINK_PASSAGE_SURFACES.passage;
    const hexes = families.map((f) => FAMILY_HEX[f]);
    expect(new Set(hexes).size).toBe(hexes.length);
  });
});

// ─── 4 · Snapshot — the full Δh table per surface (the receipt) ──────────

describe('textlink-passage-hue-distance · snapshot pin (Δh receipt)', () => {
  it('per-surface Δh table is byte-pinned (numbers, not adjectives)', () => {
    expect(surfaceReceipt(TEXTLINK_PASSAGE_SURFACES, FAMILY_HEX)).toMatchSnapshot();
  });

  // Direct-table sanity — pins the kernel import surface so a future
  // rename of `deltaTable` / `surfaceReceipt` is loud (compile-time + test).
  it('deltaTable matches the snapshot row for the passage surface', () => {
    const direct = deltaTable(TEXTLINK_PASSAGE_SURFACES.passage, FAMILY_HEX);
    expect(direct).toEqual(surfaceReceipt(TEXTLINK_PASSAGE_SURFACES, FAMILY_HEX).passage);
  });
});
