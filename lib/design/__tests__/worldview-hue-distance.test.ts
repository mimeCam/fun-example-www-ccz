/**
 * worldview-hue-distance — per-surface Δh floor audit for worldview voices.
 *
 * The four worldview voices (`technical`, `philosophical`, `practical`,
 * `contrarian`) speak through one surface today: the Explore-card chip
 * (`components/explore/ExploreArticleCard.tsx`, via
 * `lib/design/worldview.ts:WORLDVIEW_COLORS`). Three *distinct* text-color
 * families paint that chip — `accent` (violet), `cyan`, `rose`. Sibling
 * hues, shared surface — exactly the shape `archetype-hue-distance` audits.
 *
 * The fence: on each surface that paints ≥ 2 distinct worldview text
 * families, the minimum circular hue distance between any two of those
 * families must clear `HUE_FLOOR_DEG` (45°). Today's tightest pair sits
 * at ~58.11° (`accent` ↔ `rose`); 45° is the architectural fence so a
 * future "warm the violet a touch" / "cool the rose a touch" theme tweak
 * fails here, before the chip ships voices that have collapsed onto each
 * other (Mike napkin §6: today's reality minus a real margin, *not*
 * calibrated to the eyebrow). Architectural, not calibrated — *the
 * floor is the architecture*.
 *
 * **Honest gotcha — `technical` and `philosophical` share `text-accent`
 * by design** (`worldview.ts:86–88`; Tanya UX #10 §2.3 / Mike napkin §5).
 * The four-vs-three-voices contradiction is resolved by `WORLDVIEW_GLYPHS`
 * (`▣` vs `◇`) — the *non-color* discriminator that survives color
 * vision deficiency, chip size, and screenshots. Hue does not — and is
 * not asked to — distinguish technical from philosophical.
 *
 * The audit therefore operates on the **distinct text-color families**
 * the chip surface actually paints: `{accent, cyan, rose}` → 3 unordered
 * pairs. Listing the technical/philosophical pair would assert Δh = 0°
 * against a 45° floor on commit zero — Elon §6 / Mike napkin §5: *"a
 * receipt that goes red on commit zero is a sentence pretending to be
 * code."* The `WORLDVIEW_SURFACES` table below is the typed acknowledgement.
 *
 * **Per-surface, not global.** Same teardown the archetype audit inherits
 * from Elon §4 / Mike napkin: a global "every worldview voice safely far
 * from every other voice" invariant is structurally false here too —
 * technical and philosophical share `text-accent` by intent. The honest
 * question is the per-surface one: *on the surfaces that paint these
 * families together, do the distinct color families distinguish?* Yes.
 * Receipt below.
 *
 * **Receipt as snapshot.** The full Δh pair table per surface is
 * snapshotted to `__snapshots__/worldview-hue-distance.test.ts.snap` so
 * a hue change to any worldview family shows up in PR review as a
 * number, not as a vibe (Tanya UX #60 §3 / UX #67 §3: numbers, not
 * adjectives — same convention as the archetype audit).
 *
 * **No new constants, no palette nudge.** Painted hexes resolve through
 * the canvas-safe `BRAND` map in `lib/design/color-constants.ts`. No new
 * ledger, no new Voice atom, no new alpha rung. (Mike napkin #54 / #70
 * §A: *no ninth ledger* — the most-cited line in the team's reports.)
 *
 * **Rule-of-three, scoped to surfaces.** Today exactly ONE surface
 * paints worldview voices (the Explore chip). When a *second* surface
 * paints two-or-more worldview families, add a row to
 * `WORLDVIEW_SURFACES`. When a *third* lands, graduate the table into a
 * `Surface` row on `lib/design/voice-ledger.ts`. Until then, local data
 * + audit is the right level of fence (Krystle deferral; Mike napkin
 * POI #7 — same shape as the archetype audit).
 *
 * Pure Jest. No DOM, no Canvas, no thermal lerp. Reuses
 * `lib/design/hue-distance.ts` (the audit kernel) and `lib/design/hue.ts`
 * (the math kernel) — drift = red.
 *
 * Credits: Mike K. (napkin §"Sibling Voice Hue Distance (2)" — the
 * conditional-yes from physics, the `WORLDVIEW_SURFACES` shape, the 45°
 * floor as today-minus-margin, the "no ninth ledger" non-negotiable);
 * Elon M. (§4 / §6 — the per-surface vs global teardown, the
 * "physics-first, metaphor-never" framing, the off-axis flag); Paul K.
 * (the North Star reframe — *reader-visible voice families with a
 * numeric receipt / total* — moves one tick closer to 1.0 with this
 * audit); Tanya D. (UX §6 — the single-sentence yes; UX #10 §2.3 — the
 * glyph layer that owns the technical/philosophical voice split, not
 * hue); Krystle C. (the engineering shape — per-surface audit at a
 * defensible floor); the existing `archetype-hue-distance.test.ts`
 * (most decisions paid for already — this is a clone, not an invention).
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
 * worldview text-color families that share a surface, in degrees. Today's
 * tightest pair sits at ~58.11° (`accent` = `#dc6cff` ↔ `rose` =
 * `#e88fa7`); 45° is the architectural fence so a future palette nudge
 * (warm the violet, cool the rose) fails here, before the chip ships
 * voices that have collapsed onto each other. The archetype audit's
 * floor sits at 15° because its tightest pair is *itself* a sibling-
 * violet (`accent` ↔ `secondary` post-lift); worldview's tightest pair
 * crosses a hue family boundary, so the floor sits architecturally
 * higher. Floors per audit, not global — the floor is the architecture.
 */
const HUE_FLOOR_DEG = 45;

// ─── Family → painted hex resolver ───────────────────────────────────────

/**
 * Three worldview text-color Tailwind families painted on the chip
 * surface, and the static `BRAND` hex each resolves to (`tailwind.config.
 * ts`: `accent → BRAND.accentViolet`, `cyan → BRAND.cyan`, `rose →
 * BRAND.rose`). Mirrors the archetype audit's resolution shape — same
 * pattern, different lookup table. Pure data.
 *
 * Note `accent` here is the same `BRAND.accentViolet` the archetype
 * audit reads — the static brand violet Tailwind paints under
 * `text-accent`. The two audits operate on the same wheel; their floors
 * differ because their *surface paint sets* differ (Mike napkin §5).
 */
const FAMILY_HEX: Record<string, string> = {
  accent: BRAND.accentViolet,
  cyan:   BRAND.cyan,
  rose:   BRAND.rose,
};

// ─── Surface → distinct worldview text families painted there ───────────

/**
 * Per-surface worldview text-family paint list. Today exactly one surface
 * paints worldview voices: the Explore-card chip. The list contains the
 * *distinct* text-color families — three values, not four — because
 * `technical` and `philosophical` share `text-accent` by design (the
 * glyph layer `WORLDVIEW_GLYPHS` in `lib/design/worldview.ts:116` owns
 * the voice split between those two, not hue; Tanya UX #10 §2.3).
 *
 * Including the technical/philosophical pair would assert Δh = 0° at
 * commit zero — a receipt pretending to be code (Elon §6). The shape is
 * `Record<string, readonly string[]>` so a future surface lands as one
 * row with no audit re-write (rule of three; Mike napkin POI #7).
 */
const WORLDVIEW_SURFACES: Record<string, readonly string[]> = {
  // ExploreArticleCard worldview chip (the only surface that paints
  // worldview voices in this sprint). technical/philosophical share
  // `text-accent` by design (glyph discriminator owns the voice split,
  // not hue; worldview.ts §80 / Tanya UX #10 §2.3). The audit operates
  // on distinct text-color families only — `{accent, cyan, rose}`.
  chip: ['accent', 'cyan', 'rose'],
};

// ─── 1 · Floor — every (surface, pair) holds ≥ HUE_FLOOR_DEG ─────────────

describe(`worldview-hue-distance · per-surface ≥ ${HUE_FLOOR_DEG}° floor`, () => {
  for (const [surface, families] of Object.entries(WORLDVIEW_SURFACES)) {
    for (const [a, b] of familyPairs(families)) {
      it(`${surface} · Δh(${a}, ${b}) ≥ ${HUE_FLOOR_DEG}°`, () => {
        expect(deltaHue(a, b, FAMILY_HEX)).toBeGreaterThanOrEqual(HUE_FLOOR_DEG);
      });
    }
  }
});

// ─── 2 · Worst-case sweep — per-surface receipt + global stdout line ─────

describe('worldview-hue-distance · worst-case receipt (per surface)', () => {
  for (const [surface, families] of Object.entries(WORLDVIEW_SURFACES)) {
    it(`${surface} · worst Δh clears the floor (mirrors §1 by design)`, () => {
      const { pair, dh } = worstPair(families, FAMILY_HEX);
      // eslint-disable-next-line no-console
      console.log(
        `[worldview-hue-distance] ${surface} · worst Δh ${dh.toFixed(2)}° at ${pair} (floor ${HUE_FLOOR_DEG}°)`,
      );
      expect(dh).toBeGreaterThanOrEqual(HUE_FLOOR_DEG);
    });
  }
});

// ─── 3 · Resolver invariants ─────────────────────────────────────────────

describe('worldview-hue-distance · resolver invariants', () => {
  it('every worldview text family resolves to a hex in BRAND', () => {
    for (const family of Object.keys(FAMILY_HEX)) {
      expect(typeof FAMILY_HEX[family]).toBe('string');
      expect(/^#[0-9a-fA-F]{6}$/.test(FAMILY_HEX[family])).toBe(true);
    }
  });

  it('every surface paints ≥ 2 distinct families (audit needs ≥ 1 pair)', () => {
    for (const families of Object.values(WORLDVIEW_SURFACES)) {
      expect(families.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every family on every surface is in FAMILY_HEX (no orphans)', () => {
    for (const families of Object.values(WORLDVIEW_SURFACES)) {
      for (const family of families) {
        expect(FAMILY_HEX[family]).toBeDefined();
      }
    }
  });

  it('chip surface lists distinct families only (no duplicate hex)', () => {
    // Guard the design intent: technical/philosophical share `text-accent`
    // by design and must not both appear on a per-surface family list (a
    // 0° pair vs a 45° floor would fail at commit zero — Elon §6).
    const families = WORLDVIEW_SURFACES.chip;
    const hexes = families.map((f) => FAMILY_HEX[f]);
    expect(new Set(hexes).size).toBe(hexes.length);
  });
});

// ─── 4 · Snapshot — the full Δh table per surface (the receipt) ──────────

describe('worldview-hue-distance · snapshot pin (Δh receipt)', () => {
  it('per-surface Δh table is byte-pinned (numbers, not adjectives)', () => {
    expect(surfaceReceipt(WORLDVIEW_SURFACES, FAMILY_HEX)).toMatchSnapshot();
  });

  // Direct-table sanity — pins the kernel import surface so a future
  // rename of `deltaTable` / `surfaceReceipt` is loud (compile-time + test).
  it('deltaTable matches the snapshot row for the chip surface', () => {
    const direct = deltaTable(WORLDVIEW_SURFACES.chip, FAMILY_HEX);
    expect(direct).toEqual(surfaceReceipt(WORLDVIEW_SURFACES, FAMILY_HEX).chip);
  });
});
