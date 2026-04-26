/**
 * archetype-hue-distance — per-surface Δh floor audit for archetype voices.
 *
 * The five archetype families (`cyan`, `accent`, `secondary`, `rose`,
 * `amber`) speak through one surface today: the NextRead farewell chip
 * (`components/reading/NextRead.tsx`, via `lib/design/archetype-accents.
 * ts`). They do not speak as one register — each archetype is a *voice*,
 * and two voices that paint the same surface must be telling apart on the
 * wheel: a sighted reader who sees a cyan chip yesterday and a secondary
 * chip today should feel "different person," not "different mood of the
 * same person."
 *
 * The fence: on each surface that paints ≥ 2 archetype families, the
 * minimum circular hue distance between any two of those families must
 * clear `HUE_FLOOR_DEG` (15°). The floor is architectural — sibling
 * violets that share a surface must distinguish on a real screen, not
 * merge into "some violet pill with different copy" (Tanya UX #12 §2).
 * Today's tightest pair sits at ~16.91° (`accent` = `#dc6cff` ↔
 * `secondary` = `#bc8cf0`, both in the violet hue family by intent —
 * the Explorer / Faithful Reader voices on the NextRead farewell chip).
 *
 * **Receipt of the lift (Sid 2026-04-26, Mike napkin #100, Tanya UX #12).**
 * The 15° floor is now load-bearing: it ratifies Tanya's single-nudge
 * shift of `BRAND.accentViolet` `#c77dff → #dc6cff` (the `accent`
 * Explorer chip pushed outward toward warmer magenta; `BRAND.secondary`
 * stays anchored — asymmetric by design, the Faithful chip is the
 * fixed star). Hue separation lifted from `5.35° → 16.91°`; OKLab ΔE
 * (perceptual sanity, Tanya §3.2 / Elon §6) reads ≈ 8.74 — well above
 * the ≥ 5 eyeball gate. All eight contrast audits stay green;
 * worst-case warm chip @ `5.02:1` (floor 4.5:1).
 *
 * **Receipt of the discovery (Sid 2026-04-26 — historical, archived
 * per Mike POI #9).** Before the lift, the audit pinned `HUE_FLOOR_DEG`
 * at 4° because the empirical reality was ~5.35°. The 4° fence was
 * "today's reality minus ~1.35° margin" — honest at commit time, but
 * paid debt the moment the lift landed. The 15° floor now stands as
 * the architectural truth, not the calibrated one. (Elon's "an assertion
 * that goes red on commit zero is a sentence pretending to be code"
 * works in reverse too: a receipt that *was* honest deserves to be
 * archived, not rewritten.)
 *
 * **Per-surface, not global.** Elon §4 (via Mike napkin) — Jason's
 * "every voice on the wheel is safely far from every other voice"
 * invariant is structurally false (`accent` and `secondary` are by
 * design siblings in the same violet family). The honest question is
 * the per-surface one: *on the surfaces that paint these families
 * together, do the families distinguish?* Yes. Receipt below.
 *
 * **Receipt as snapshot.** The full Δh pair table is snapshotted to
 * `__snapshots__/archetype-hue-distance.test.ts.snap` so a hue change
 * to any archetype family shows up in PR review as a number, not as a
 * vibe (Tanya UX #60 §3 / UX #67 §3: numbers, not adjectives).
 *
 * **No new constants, no palette nudge.** Families are read from
 * `lib/design/archetype-accents.ts`; painted hexes resolve through the
 * canvas-safe `BRAND` map in `lib/design/color-constants.ts`. No new
 * ledger, no new Voice atom, no new alpha rung. (Mike napkin #54 / #70
 * §A: no ninth ledger.)
 *
 * **Rule-of-three, scoped to surfaces.** Today exactly ONE surface
 * paints all five archetype families (the NextRead chip). A *second*
 * surface that paints two-or-more archetype families graduates the
 * `ARCHETYPE_SURFACES` table; a *third* graduates the table into a
 * `Surface` row on `lib/design/voice-ledger.ts`. Until then, the local
 * data + audit is the right level of fence (Krystle deferral; Mike
 * napkin POI #7).
 *
 * Pure Jest. No DOM, no Canvas, no thermal lerp. Reuses
 * `lib/design/hue.ts` so the math kernel is one place — drift = red.
 *
 * Credits: Krystle Clear (the engineering pick — per-surface audit at
 * a defensible floor); Elon M. (#54 / §4 — the per-surface vs global
 * teardown that killed the headline invariant before commit zero); Jason
 * F. (the "same wheel" framing — one docblock sentence in `hue.ts` is his
 * salvageable kernel); Mike K. (napkin — rule-of-three on surfaces, the
 * 15° floor as today-minus-margin); Tanya D. (UX #60 §3, UX #67 §3 —
 * "numbers, not adjectives"; the receipt snapshot is the trust signal);
 * Paul K. (the business-side outcome — "two readers, one URL, no voice
 * collision" — the audit makes mechanical).
 */

import { BRAND } from '../color-constants';
import {
  deltaEPair,
  deltaHue,
  deltaTable,
  dualReceipt,
  familyPairs,
  surfaceReceipt,
  worstPair,
  worstPerceptualPair,
} from '../hue-distance';

// ─── Floors — calibrated, not eyeballed ──────────────────────────────────

/**
 * Minimum acceptable circular hue distance between any two archetype
 * families that share a surface, in degrees. Today's tightest pair sits
 * at ~16.91° (`accent` = `#dc6cff` ↔ `secondary` = `#bc8cf0`, both
 * violet by brand intent post-lift); 15° is the architectural fence so
 * a future palette nudge that shaves any meaningful slice off the
 * sibling-violet spread fails here, before the chip ships voices that
 * have collapsed onto each other (see docblock §"Receipt of the lift").
 * Architectural, not calibrated — *the floor is the architecture*.
 */
const HUE_FLOOR_DEG = 15;

/**
 * Minimum acceptable OKLab ΔE between any two archetype families that
 * share a surface (Mike napkin #131 POI #1, Sid 2026-04-26). Today's
 * tightest pair on the ΔE axis is the same sibling-violet that pins
 * Δh — `accent` ↔ `secondary` reads ≈ 8.74. The 6 floor is the
 * architectural fence: Ottosson's published "moderately different on
 * a real screen" threshold is 5; +1 margin carries today's reality
 * minus a real headroom margin (~30 % chroma knock on `accentViolet`
 * collapses this pair to ≈ 3.77, well below 6 — see the
 * `sibling-voice-perceptual-mutation.test.ts` mutation receipt).
 *
 * Cross-family pairs on this surface read in the 13–32 range; 6 leaves
 * normal palette breathing room while catching low-chroma collapse the
 * wheel cannot see (HSL Δh stays ≥ 16° under the same knock — the
 * second witness earns its keep). Defended on first principles, not
 * eyeballed (Elon §3 / Mike POI #1). Floors per audit, not global —
 * the floor is the architecture, not a paint value.
 */
const OKLAB_FLOOR_DE = 6;

// ─── Family → painted hex resolver ───────────────────────────────────────

/**
 * Five archetype Tailwind families and the static `BRAND` hex each
 * resolves to (`tailwind.config.ts`: `accent → BRAND.accentViolet`,
 * `secondary → BRAND.secondary`, etc.). Mirrors the resolution shape
 * `chip-contrast-audit.test.ts` uses for `voice.*` voices — same pattern,
 * different lookup table. Pure data.
 */
const FAMILY_HEX: Record<string, string> = {
  cyan:      BRAND.cyan,
  accent:    BRAND.accentViolet,
  secondary: BRAND.secondary,
  rose:      BRAND.rose,
  amber:     BRAND.amber,
};

// ─── Surface → archetype families painted there ─────────────────────────

/**
 * Per-surface archetype-family paint list. Today exactly one surface
 * paints all five families: the NextRead farewell chip. The shape is
 * `Record<string, readonly string[]>` so a future surface (Mirror result
 * chip, Resonances header tint, ReturnLetter accent — all currently
 * deferred per Tanya UX #22 §3.3, Mike napkin #96 §3) lands as one row
 * with no audit re-write.
 */
const ARCHETYPE_SURFACES: Record<string, readonly string[]> = {
  // NextRead farewell chip (the only surface that paints archetype voices
  // in this sprint; Tanya UX #22 §3.3 / Mike napkin #96 §3).
  chip: ['cyan', 'accent', 'secondary', 'rose', 'amber'],
};

// ─── Helpers — imported from `lib/design/hue-distance.ts` ────────────────
//
// Five pure helpers (`deltaHue`, `familyPairs`, `deltaTable`, `worstPair`,
// `surfaceReceipt`) used to live inline here; they were lifted to the
// shared kernel when the worldview audit landed (Mike napkin §"Sibling
// Voice Hue Distance (2)" — *one stateless kernel, two callers, no class
// hierarchy*). Drift between two cloned audits would silently matter;
// the kernel is the fence. Floors stay per-audit (the floor is the
// architecture, not a paint value — Mike POI #6).

// ─── 1a · Δh floor — every (surface, pair) holds ≥ HUE_FLOOR_DEG ─────────

describe(`archetype-hue-distance · per-surface ≥ ${HUE_FLOOR_DEG}° floor`, () => {
  for (const [surface, families] of Object.entries(ARCHETYPE_SURFACES)) {
    for (const [a, b] of familyPairs(families)) {
      it(`${surface} · Δh(${a}, ${b}) ≥ ${HUE_FLOOR_DEG}°`, () => {
        expect(deltaHue(a, b, FAMILY_HEX)).toBeGreaterThanOrEqual(HUE_FLOOR_DEG);
      });
    }
  }
});

// ─── 1b · ΔE floor — every (surface, pair) holds ≥ OKLAB_FLOOR_DE ────────

describe(`archetype-hue-distance · per-surface ≥ ${OKLAB_FLOOR_DE} ΔE floor`, () => {
  for (const [surface, families] of Object.entries(ARCHETYPE_SURFACES)) {
    for (const [a, b] of familyPairs(families)) {
      it(`${surface} · ΔE(${a}, ${b}) ≥ ${OKLAB_FLOOR_DE}`, () => {
        expect(deltaEPair(a, b, FAMILY_HEX)).toBeGreaterThanOrEqual(OKLAB_FLOOR_DE);
      });
    }
  }
});

// ─── 2 · Worst-case sweep — dual-axis per-surface receipt ────────────────

describe('archetype-hue-distance · worst-case receipt (per surface)', () => {
  for (const [surface, families] of Object.entries(ARCHETYPE_SURFACES)) {
    it(`${surface} · worst Δh and ΔE both clear their floors (mirrors §1 by design)`, () => {
      const { pair: dhPair, dh } = worstPair(families, FAMILY_HEX);
      const { pair: dePair, dE } = worstPerceptualPair(families, FAMILY_HEX);
      // eslint-disable-next-line no-console
      console.log(
        `[archetype-hue-distance] ${surface} · worst Δh ${dh.toFixed(2)}° at ${dhPair} (floor ${HUE_FLOOR_DEG}°)`
          + ` · worst ΔE ${dE.toFixed(2)} at ${dePair} (floor ${OKLAB_FLOOR_DE})`,
      );
      expect(dh).toBeGreaterThanOrEqual(HUE_FLOOR_DEG);
      expect(dE).toBeGreaterThanOrEqual(OKLAB_FLOOR_DE);
    });
  }
});

// ─── 3 · Resolver invariants ─────────────────────────────────────────────

describe('archetype-hue-distance · resolver invariants', () => {
  it('every archetype family resolves to a hex in BRAND', () => {
    for (const family of Object.keys(FAMILY_HEX)) {
      expect(typeof FAMILY_HEX[family]).toBe('string');
      expect(/^#[0-9a-fA-F]{6}$/.test(FAMILY_HEX[family])).toBe(true);
    }
  });

  it('every surface paints ≥ 2 archetype families (audit needs ≥ 1 pair)', () => {
    for (const families of Object.values(ARCHETYPE_SURFACES)) {
      expect(families.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('every family on every surface is in FAMILY_HEX (no orphans)', () => {
    for (const families of Object.values(ARCHETYPE_SURFACES)) {
      for (const family of families) {
        expect(FAMILY_HEX[family]).toBeDefined();
      }
    }
  });
});

// ─── 4 · Snapshot — the full Δh table per surface (the receipt) ──────────

describe('archetype-hue-distance · snapshot pin (dual-axis receipt)', () => {
  it('per-surface Δh · ΔE table is byte-pinned (numbers, not adjectives)', () => {
    expect(dualReceipt(ARCHETYPE_SURFACES, FAMILY_HEX)).toMatchSnapshot();
  });

  // Direct-table sanity — a deltaTable call shaped like the kernel's per-row
  // projection; pins the import surface so a future kernel rename is loud.
  it('deltaTable matches the (Δh-only) row for the chip surface', () => {
    const direct = deltaTable(ARCHETYPE_SURFACES.chip, FAMILY_HEX);
    expect(direct).toEqual(surfaceReceipt(ARCHETYPE_SURFACES, FAMILY_HEX).chip);
  });
});
