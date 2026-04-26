/**
 * Archetype-Chip Contrast Audit — WCAG 4.5:1 floor for the NextRead
 * farewell chip family (five archetype voices × two thermal anchors).
 *
 * Sibling to `chip-contrast-audit.test.ts`. The worldview chip composites
 * its BACKGROUND fill at the `hairline` rung (0.10) — *the chip is the
 * room*. The archetype chip has NO background fill: only a 1px BORDER at
 * the `muted` rung (0.30), with a transparent body — *the chip frames the
 * reader*. Different surfaces, different roles, different rungs — by
 * intent (Tanya UX #22 §3.3). Do NOT harmonize.
 *
 * Math note — *one architectural divergence from the napkin diagram.*
 * Mike napkin #97 sketched the audit as a structural mirror of the
 * worldview audit: composite-bg-as-fill then measure text-vs-fill. That
 * model fits the worldview chip (which HAS a /10 fill); it does not fit
 * the archetype chip (which has NO fill — only a 1px /30 border on a
 * transparent body). For a transparent-body chip, what the reader's eye
 * actually meets is `text-<family>` (1.00 opacity) sitting directly over
 * the thermal surface — the 1px border at /30 is geometry, not the
 * background of the text. The right contrast pair is therefore
 * `(text-<family>, THERMAL.surface)` *uncomposited* — the audit asks
 * whether the brand hex itself reads vs the painted surface, which is
 * the actual question Tanya UX #22 §3.3 names ("every chip border must
 * clear WCAG AA — *the brand hue earns its register*"). The /30 alpha is
 * pinned separately by `archetype-accents.test.ts` §3 (one register, five
 * voices); this audit owns the brand-vs-surface gate. Two tests, one
 * surface, no overlap. The structural fail-path (rung steps as one
 * register) survives intact — when this audit catches a hue that no
 * longer reads against the warm anchor, the family RUNG steps in
 * lockstep, the same way commit f0e4799 stepped worldview's rung from
 * muted → hairline. Five voices step together; one cannot fall alone.
 *
 * What this audit asserts (the gate):
 *   §1 Floor — every (archetype × anchor) cell ≥ 4.5:1, ten cells total.
 *              Cells iterate `ARCHETYPE_ACCENT_BORDER` keys directly so a
 *              sixth archetype landing in `types/content.ts#ArchetypeKey`
 *              flips this audit red on the same PR — the type system is
 *              the centrality fence (Mike napkin #96 / #97).
 *   §2 License — every iterated `ArchetypeKey` resolves through both
 *              `ARCHETYPE_ACCENT_BORDER` and `ARCHETYPE_LABELS` (no
 *              string drift between the painted family and the spoken
 *              label — mirrors the worldview audit's license block).
 *   §3 Receipt — one `console.log` of the worst-case ratio + cell label
 *              + floor; copied by hand into AGENTS.md Follow-ons. "Fail
 *              quietly, recover loudly" — same shape the worldview
 *              audit prints.
 *
 * Atomic fail-path doctrine (Tanya UX #22 §3.3, Krystle §audit-spec):
 * if ANY cell fails at EITHER anchor, the family rung steps as ONE
 * register — manual one-line edit in `archetype-accents.ts`. No per-
 * voice override ever ships. Five voices step together; one cannot fall
 * alone. The test catches; the human steps. (The worldview chip already
 * spent this lever once — muted → hairline — when its own audit caught
 * cyan + rose at /30; archetype starts at muted, with one rung of
 * downstep available before the family lands at hairline.)
 *
 * Failure ergonomics (Elon's salvageable kernel — Mike napkin #97 §"Key
 * architectural calls" #2): the failure message is a single structured
 * line — `${label} (${family}) over ${anchor}: ${ratio}:1 < floor 4.5:1`.
 * Number first when scanning, key after. No `narrate()` helper, no
 * persona prose, no consequence-vocabulary. The line has an audience of
 * one: the engineer fixing the bug.
 *
 * Pure Jest, no DOM, no Canvas. Reuses `lib/design/contrast.ts` so the
 * worldview audit, focus-ring sweep, ambient-surfaces matrix, and this
 * audit share one math kernel (Mike §extract-and-share rule).
 *
 * Credits:
 *   • Krystle C. — the original sprint-sized audit shape this one mirrors
 *     (`chip-contrast-audit.test.ts`), the WCAG 4.5:1 floor, the rule-of-
 *     three discipline, the rung-as-one-register doctrine.
 *   • Tanya D. (UX #22 §3.3) — the muted-rung divergence rationale; the
 *     felt-experience spec for the farewell beat ("a reader who earned
 *     the Resonator voice deserves to read their own farewell at 11pm").
 *   • Mike K. (napkin #96, #97) — the typed `Record<ArchetypeKey, …>`
 *     centrality fence; the architectural call to keep Elon's structured-
 *     message kernel and reject the persona prose; the receipt-in-
 *     AGENTS.md polish; the "polymorphism is a killer" call (no shared
 *     `BRAND_CONTRAST_AUDIT` abstraction — rule of three, we have two).
 *   • Elon M. — the structured Jest failure-message kernel (number first,
 *     key second). The teardown that named "anthropomorphizing tooling
 *     costs more than it pays" — kept the message numeric.
 *   • Paul K. — the framing this audit makes mechanical: "a reader whose
 *     archetype chip dimmed alone would feel demoted." The atomic fail-
 *     path-as-equity-doctrine reading was his.
 *   • Sid (this implementation) — the math-divergence note above:
 *     transparent-body chips do not composite-as-fill. The audit measures
 *     the brand hue directly so the test reflects what the reader's eye
 *     actually meets, not a hypothetical fill the chip never paints.
 */

import {
  ARCHETYPE_ACCENT_BORDER,
  ARCHETYPE_LABELS,
} from '../archetype-accents';
import { contrast } from '../contrast';
import { BRAND, THERMAL, THERMAL_WARM } from '../color-constants';
import type { ArchetypeKey } from '@/types/content';

// ─── Per-archetype hex resolver — the audit's address-mode bridge ─────────
//
// Archetype text + border map to BOTH a Tailwind family literal (cyan,
// accent, secondary, rose, amber — see `archetype-accents.ts`) and the
// canvas-safe brand ledger. For the contrast audit we need the *resolved
// hex* — what the user actually sees painted — so `BRAND` is the source
// of truth.
//
// Trap pinned (mirrored from `chip-contrast-audit.test.ts:64-66` —
// `text-accent` is the static brand violet, NOT the live thermal lerp):
// `explorer` routes through `BRAND.accentViolet`, NOT `THERMAL.accent`.
// Keepsake / Golden Thread own the thermal accent — the chip surface does
// not.

/**
 * Resolves an `ArchetypeKey` to the hex of its painted text + border
 * family (both elements share the brand hex; only their alpha differs —
 * text at 1.00, border at 0.30). Pure, ≤ 10 LOC. Throws on unknown so
 * future archetypes trip the type-check at the Record key, not the
 * runtime resolver.
 */
function archetypeFamilyToHex(k: ArchetypeKey): string {
  if (k === 'deep-diver') return BRAND.cyan;         // text-cyan / border-cyan
  if (k === 'explorer')   return BRAND.accentViolet; // text-accent (static violet, NOT thermal)
  if (k === 'faithful')   return BRAND.secondary;    // text-secondary / border-secondary
  if (k === 'resonator')  return BRAND.rose;         // text-rose / border-rose
  if (k === 'collector')  return BRAND.amber;        // text-amber / border-amber
  throw new Error(`archetype-chip-contrast-audit: unknown archetype ${k as string}`);
}

/**
 * The Tailwind family literal painted under each archetype. Pure, ≤ 10
 * LOC. Used in the structured failure message — gives the engineer the
 * exact `border-<family>/30` token to grep when stepping the rung.
 */
function familyOf(k: ArchetypeKey): string {
  if (k === 'deep-diver') return 'cyan';
  if (k === 'explorer')   return 'accent';
  if (k === 'faithful')   return 'secondary';
  if (k === 'resonator')  return 'rose';
  if (k === 'collector')  return 'amber';
  throw new Error(`archetype-chip-contrast-audit: unknown archetype ${k as string}`);
}

// ─── Thermal anchors — the two surfaces the chip's text reads against ─────

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

// ─── Measured ratio — brand hex vs raw thermal surface ────────────────────

/**
 * Measured WCAG ratio for the archetype's painted text/border family
 * against the thermal surface anchor. The chip body is transparent, so
 * the brand hex meets the surface directly — no composite step.
 * Pure, ≤ 10 LOC.
 */
function measuredRatio(k: ArchetypeKey, anchor: SurfaceAnchor): number {
  return contrast(archetypeFamilyToHex(k), anchor.hex);
}

// ─── Structured failure message (Elon's kernel — number first, key second) ─

/**
 * WCAG 1.4.3 AA floor for normal text. Receipt (2026-04-26): after
 * lifting `BRAND.secondary` `#9d4edd → #bc8cf0` (napkin #98), `faithful`
 * @ warm now reads 5.60:1 — no longer the worst cell. The new worst-case
 * is `Explorer (accent) @ warm = 5.24:1` (0.74 of headroom over the
 * floor); every cell clears with margin and the atomic-fail-path lever
 * (one rung-step in `archetype-accents.ts`) remains unspent for the next
 * regression. (Receipt drift reconciled — Mike #103 §6 flag #2; AGENTS.md
 * matches `worstCell()` output, Sid 2026-04-26.)
 */
const FLOOR = 4.5;

/**
 * Asserts the cell clears the floor with a structured failure message.
 * Pure-ish (throws on fail). ≤ 10 LOC.
 *
 * Failure shape — number first, key second, no narrative:
 *   `Resonator (rose) over warm: 4.32:1 < floor 4.5:1`
 * Mike napkin #97 §"Points of interest" #5 — the entire ergonomic gain.
 */
function assertReadable(k: ArchetypeKey, anchor: SurfaceAnchor): void {
  const ratio = measuredRatio(k, anchor);
  if (ratio < FLOOR) {
    const head = `${ARCHETYPE_LABELS[k]} (${familyOf(k)}) over ${anchor.name}`;
    throw new Error(`${head}: ${ratio.toFixed(2)}:1 < floor ${FLOOR}:1`);
  }
  expect(ratio).toBeGreaterThanOrEqual(FLOOR);
}

// ─── 1 · Floor — every (archetype × anchor) cell holds ≥ 4.5:1 ────────────

describe('archetype-chip-contrast-audit · WCAG 4.5:1 floor (Krystle §audit-spec)', () => {
  // Iterate the manifest's keys directly — `Record<ArchetypeKey, …>` IS
  // the centrality fence (Mike napkin #96). A sixth archetype lands here
  // automatically; this audit does not need a hand-edited list.
  const ARCHETYPES = Object.keys(ARCHETYPE_ACCENT_BORDER) as ArchetypeKey[];

  it('ARCHETYPE_ACCENT_BORDER carries exactly the five painted voices today', () => {
    expect(ARCHETYPES).toHaveLength(5);
    expect(new Set(ARCHETYPES)).toEqual(
      new Set(['deep-diver', 'explorer', 'faithful', 'resonator', 'collector']),
    );
  });

  for (const k of ARCHETYPES) {
    for (const anchor of SURFACE_ANCHORS) {
      const label = `${ARCHETYPE_LABELS[k]} (${familyOf(k)}) over ${anchor.name}`;
      it(`${label} clears ≥ ${FLOOR}:1`, () => {
        assertReadable(k, anchor);
      });
    }
  }
});

// ─── 2 · License consistency — every key resolves through both manifests ──

describe('archetype-chip-contrast-audit · every key is reachable through both manifests', () => {
  const ARCHETYPES = Object.keys(ARCHETYPE_ACCENT_BORDER) as ArchetypeKey[];

  it.each(ARCHETYPES)(
    'archetype `%s` resolves through ARCHETYPE_ACCENT_BORDER and ARCHETYPE_LABELS (no string drift)',
    (k) => {
      expect(ARCHETYPE_ACCENT_BORDER[k]).toBeDefined();
      expect(ARCHETYPE_ACCENT_BORDER[k]).toMatch(/\bborder-[a-z]+\/30\b/);
      expect(ARCHETYPE_LABELS[k]).toBeDefined();
      expect(ARCHETYPE_LABELS[k].length).toBeGreaterThan(0);
    },
  );

  it('ARCHETYPE_ACCENT_BORDER and ARCHETYPE_LABELS share the same key-set', () => {
    expect(new Set(Object.keys(ARCHETYPE_ACCENT_BORDER)))
      .toEqual(new Set(Object.keys(ARCHETYPE_LABELS)));
  });
});

// ─── 3 · Worst-case sweep — surfaces the tightest cell for the receipt ────
//
// When this audit passes, leave a dated one-line receipt under AGENTS.md
// Follow-ons of the worst-case ratio + which (archetype, anchor) produced
// it. Mirrors the worldview audit's §3 — same shape, same discipline.

function worstCell(): { ratio: number; label: string } {
  const ARCHETYPES = Object.keys(ARCHETYPE_ACCENT_BORDER) as ArchetypeKey[];
  let worst = { ratio: Infinity, label: '' };
  for (const k of ARCHETYPES) {
    for (const anchor of SURFACE_ANCHORS) {
      const r = measuredRatio(k, anchor);
      if (r < worst.ratio) {
        worst = { ratio: r, label: `${k}@${anchor.name}` };
      }
    }
  }
  return worst;
}

describe('archetype-chip-contrast-audit · worst-case receipt (AGENTS.md §Follow-ons)', () => {
  it('worst-case cell still clears the 4.5:1 floor (sweep mirrors §1 by design)', () => {
    const w = worstCell();
    // eslint-disable-next-line no-console
    console.log(
      `[archetype-chip-contrast-audit] worst-case: ${w.ratio.toFixed(2)}:1 (${w.label}, floor ${FLOOR}:1)`,
    );
    expect(w.ratio).toBeGreaterThanOrEqual(FLOOR);
  });
});
