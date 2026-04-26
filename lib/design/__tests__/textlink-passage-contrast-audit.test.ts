/**
 * TextLink (passage) Contrast Audit — `4.5:1` WCAG 1.4.3 (text) floor for
 * the foreshadow gesture, the **seventh sibling** in the contrast-audit
 * table. Same kernel — `lib/design/contrast.ts` math, `lib/design/color-
 * constants.ts` hex source of truth, `lib/design/voice-ledger.ts`
 * manifest. Same §0/§1/§2/§3 rhythm. Different voice set (three: rest +
 * two destination accents), single floor, *named honestly* — the
 * `passage` link is body-rank text the reader commits to clicking; its
 * legibility is the load-bearing affordance Tanya's foreshadow rides on.
 *
 * The seven-cornered audit table:
 *
 *   chip-contrast-audit                  · 4.5  · hairline rung   · text
 *   archetype-chip-contrast-audit        · 4.5  · muted rung      · border-on-transparent
 *   halo-contrast-audit                  · 1.5  · ambient floor   · ornament
 *   keepsake-gold-contrast-audit         · 3.0  · WCAG 1.4.11     · signal
 *   thread-contrast-audit                · 1.5  · ambient floor   · cue
 *   skiplink-contrast-audit              · 4.5  · WCAG 1.4.3      · static chrome
 *   textlink-passage-contrast-audit      · 4.5  · WCAG 1.4.3      · foreshadow ← THIS
 *
 * Same *floor* shape across all seven (§0 LOCK / §1 FLOOR / §2 LICENSE /
 * §3 RECEIPT). The textLink joins the chip and skiplink as a text-tier
 * sibling — same lock-AT doctrine, distinct rationale (foreshadow gesture
 * over body prose, not chip text or chrome).
 *
 * What this audit asserts (the gate):
 *
 *   §0 LOCK INVARIANT — `TEXTLINK_PASSAGE_FLOOR` sits AT WCAG 1.4.3
 *      (4.5:1) by intent. Number-vs-number, not comment-vs-comment.
 *      Equal to `WCAG_AA_TEXT` today by design — kept as a *named*
 *      constant so a future "soften the foreshadow to non-text" PR has
 *      to delete the name, not just a number, to weaken the fence (Sid
 *      §0 LOCK pattern; Mike napkin #45 §"Points of interest #1").
 *
 *      NO lock-LOW assertion (the thread + halo siblings carry that
 *      doctrine). The textLink is not ambient ornament; it is text the
 *      reader reads. Different rationale, same fence shape.
 *
 *   §1 FLOOR — every (paint × thermal anchor) cell ≥ TEXTLINK_PASSAGE_
 *      FLOOR. Three voices × two anchors = SIX cells today. The fg hex
 *      at each cell:
 *        rest        — voice.accent       = BRAND.accentViolet ('#dc6cff')
 *        hover-gold  — archetype.gold     = BRAND.gold         ('#f0c674')
 *        hover-rose  — worldview.rose     = BRAND.rose         ('#e88fa7')
 *      NO `gesture` axis sweep, NO per-variant timing branch — three
 *      voices, one floor, six numbers (Mike napkin #45 §"What we're
 *      explicitly NOT doing"; Tanya UX #46 §3 — "channels in lockstep").
 *
 *   §2 LICENSE — all three painted voices ∈ `licenseFor('textLink')` AND
 *      the `textLink` row of `CONTRAST_PAIRS` declares the contract
 *      (three pairs, each at the text floor). Mirrors §2 of the sibling
 *      audits — pair lookup is by *fg voice*, not row index, so a future
 *      sibling on the same row stays decoupled.
 *
 *   §3 RECEIPT — one `console.log` line, three numbers (one worst-case
 *      per voice). Same Tanya/Elon "spread legible as numbers" treatment
 *      as the thread audit, scoped to *this* surface only:
 *
 *        [textlink-passage-contrast-audit] rest 5.25:1 · hover-gold 9.06:1
 *        · hover-rose 6.28:1 (worst-case across destination accents) @ warm,
 *        floor 4.5:1
 *
 * Math note — *the link paints `currentColor` directly on the surface;
 * no composite step.* The `--token-accent-opacity` rest-paint
 * transparency is a thermal ambient cue, not a legibility bound — the
 * audit measures the *opaque* hex against the surface (the legibility
 * promise Tanya §9 makes about the foreshadow gesture itself, not the
 * dormant ambient sub-state). Same kernel as the chip + keepsake-gold +
 * skiplink siblings: opaque fg over opaque bg, no compositeOver. (Mike
 * napkin #45 §"Points of interest #4"; Tanya UX #46 §4 — "both endpoints
 * (voice.accent rest, destination accent hover) must clear WCAG 1.4.3
 * over THERMAL.surface and THERMAL_WARM.surface.")
 *
 * What this audit deliberately ignores:
 *
 *   • `inline` and `quiet` variants. They paint `voice.accent` /
 *     `voice.mist` only — already covered by the chip audit's same-voice
 *     rows over the same anchors. Not zero coverage — *minimal new*
 *     coverage. (Mike napkin #45 §"Points of interest #7".)
 *   • `forced-colors` mode. System paints win there; the audit does not
 *     run a hex assertion in a mode where the hex is overridden by the
 *     OS. Skip-not-fail (P1).
 *   • `prefers-reduced-motion`. The crossfade duration changes; the
 *     *colour endpoint* does not. Same audit, same numbers.
 *
 * Atomic fail-path doctrine: if any cell drops below 4.5:1, the *fix*
 * is in `color-constants.ts` (`BRAND.gold` / `BRAND.rose` /
 * `BRAND.accentViolet`) — never a per-cell knob, never a `gesture` axis.
 * One register, never staggered (Tanya UX #62 §2; Mike napkin #45
 * §"Points of interest #5").
 *
 * Failure ergonomics — number first, key second, no narrative:
 *   `archetype.gold (textLink) over warm: 4.32:1 < floor 4.5:1`
 * Audience of one — the engineer fixing the bug. No "the foreshadow
 * lied" prose. (Mike napkin #99 §5 #5; Elon §3.2.)
 *
 * Pure Jest, no DOM, no Canvas, no React mount, no `requestAnimationFrame`.
 * Reuses `lib/design/contrast.ts` so all seven sibling audits share one
 * math kernel (Mike §extract-and-share rule).
 *
 * Credits:
 *   • Krystle C. (#99 — the seed) — `TextLink` as the seventh contrast-
 *     audit sibling. Atomic shape, no new ledgers.
 *   • Mike K. (napkin #45) — the architectural ratification: one new
 *     test file, one Surface row, one CONTRAST_PAIRS row, one AGENTS.md
 *     receipt line; the §0/§1/§2/§3 template inherited from siblings;
 *     the rejection of `gesture` axis / `ContrastSpread` genus / per-
 *     variant timing branch (all rejected at design time, kept rejected
 *     at implementation time).
 *   • Tanya D. (UX #46 §3 / §4 / §9 / §10) — the channels-in-lockstep
 *     contract that defines the three measured voices; the warm-state
 *     `voice.accent ≈ BRAND.gold` collision flag that the audit honours
 *     as a known floor-crossing observation; the receipt shape (one
 *     line, three numbers) lifted to AGENTS.md verbatim.
 *   • Paul K. — focus discipline (one CI gate that protects the one
 *     promise of the killer feature; no family-wide migration).
 *   • Elon M. — the salvaged kernel: physics doesn't care about the
 *     narrative class; the rejection of premature genus extraction; the
 *     "audit is a yes, the genus is a no" verdict.
 *   • Sid (this implementation, 2026-04-26) — the §0 LOCK pattern
 *     (named-floor constant, lock-AT assertion); the worst-case-per-
 *     voice receipt (three numbers, one line) salvaged from the thread
 *     audit's two-cell glyph and adapted for a three-voice surface;
 *     the structured failure messages.
 *   • The six existing audits in `lib/design/__tests__/` — for being
 *     the §0/§1/§2/§3 rhythm this seventh pour copies. Symmetry of
 *     *shape*, not *cardinality*.
 */

import {
  CONTRAST_PAIRS,
  contrastPairsFor,
  licenseFor,
  TEXTLINK_PASSAGE_FLOOR,
  THREAD_AMBIENT_FLOOR,
  WCAG_AA_TEXT,
  WCAG_NONTEXT,
  type Voice,
} from '../voice-ledger';
import { contrast } from '../contrast';
import { BRAND, THERMAL, THERMAL_WARM } from '../color-constants';
import { resolveLinkColor } from '@/lib/utils/link-phase';

// ─── The three painted foreshadow voices — voice → hex mirror ─────────────
//
// Hex values are *literals* here, mirrored from `lib/design/color-
// constants.ts` `BRAND.{accentViolet, gold, rose}`. The
// `color-constants-sync.test.ts` drift fence already pins these
// `BRAND.*` literals to `app/globals.css`; this audit is read-only on
// the values. Same mirror pattern as the thread audit (`ACCENT_COLD`
// block).

/** Rest paint — `voice.accent` resolves to `BRAND.accentViolet` (`#dc6cff`,
 *  post 15°-lift Sid 2026-04-26 / Mike napkin #100 / Tanya UX #12). */
const REST_HEX = '#dc6cff';

/** Hover paint when destination is `/mirror` — `BRAND.gold` (`#f0c674`). */
const GOLD_HEX = '#f0c674';

/** Hover paint when destination is `/resonances` — `BRAND.rose` (`#e88fa7`). */
const ROSE_HEX = '#e88fa7';

// ─── Voice → painted hex (the audit's address-mode resolver) ──────────────
//
// Symbolic Voice → static painted hex. `link-phase.ts` resolves
// destination accent at runtime via `var(--gold)` / `var(--rose)`; this
// audit measures the *actual hex* those vars resolve to. Same pattern
// the keepsake-gold audit uses for `BRAND.gold`.

interface PaintedVoice {
  readonly voice: Voice;
  readonly cell: 'rest' | 'hover-gold' | 'hover-rose';
  readonly hex: string;
}

/** The three (voice, cell, hex) triples this audit measures. Pure constant. */
const PAINTED: readonly PaintedVoice[] = [
  { voice: 'voice.accent',   cell: 'rest',       hex: REST_HEX },
  { voice: 'archetype.gold', cell: 'hover-gold', hex: GOLD_HEX },
  { voice: 'worldview.rose', cell: 'hover-rose', hex: ROSE_HEX },
] as const;

// ─── Thermal anchors — the two surfaces every paint reads against ─────────

/**
 * The two `--bg-surface` anchors that exist in `color-constants.ts`
 * today — `cold` (dormant) and `warm` (engaged). Same two-anchor
 * discipline as the six sibling audits (Mike napkin #95 §1 — sample at
 * the anchors that exist; do not invent a phase enum).
 */
const ANCHORS = [
  { name: 'cold', surface: THERMAL.surface      },
  { name: 'warm', surface: THERMAL_WARM.surface },
] as const;

type Anchor = (typeof ANCHORS)[number];

// ─── Measured ratio — painted hex vs raw thermal surface ──────────────────

/**
 * Measured WCAG ratio for one painted voice over one thermal-surface
 * anchor. The link paints `currentColor` directly (no composite — see
 * file-header math note). Pure, ≤ 10 LOC.
 */
function measuredRatio(paint: PaintedVoice, anchor: Anchor): number {
  return contrast(paint.hex, anchor.surface);
}

// ─── Structured failure (number first, key second, no narrative) ──────────

/**
 * Asserts one (paint × anchor) cell clears the textLink floor with a
 * structured failure message. Pure-ish (throws on fail). ≤ 10 LOC.
 *
 * Failure shape — number first, key second, no narrative:
 *   `archetype.gold (textLink) over warm: 4.32:1 < floor 4.5:1`
 */
function assertReadable(paint: PaintedVoice, anchor: Anchor): void {
  const ratio = measuredRatio(paint, anchor);
  if (ratio < TEXTLINK_PASSAGE_FLOOR) {
    const head = `${paint.voice} (textLink) over ${anchor.name}`;
    throw new Error(`${head}: ${ratio.toFixed(2)}:1 < floor ${TEXTLINK_PASSAGE_FLOOR}:1`);
  }
  expect(ratio).toBeGreaterThanOrEqual(TEXTLINK_PASSAGE_FLOOR);
}

// ─── Worst-case cell per voice, for §3 receipt ────────────────────────────

/** Tightest (lowest) ratio across both anchors for one voice. Pure, ≤ 10 LOC. */
function worstCellFor(paint: PaintedVoice): number {
  return ANCHORS
    .map((a) => measuredRatio(paint, a))
    .reduce((w, r) => (r < w ? r : w));
}

// ─── 0 · LOCK — the floor sits AT WCAG 1.4.3 (text) by intent ─────────────
//
// Mike napkin #45 §"Points of interest #1" / Sid (§0 LOCK pattern,
// 2026-04-26): the fence is a *type and an assertion*, not a docblock
// noun. A future "soften the foreshadow to ambient" PR fails HERE first
// — before any human review — by name. The textLink is body-rank text
// the reader reads; legibility is the contract.

describe('textlink-passage-contrast-audit · §0 LOCK (the floor is named, not assumed)', () => {
  it('TEXTLINK_PASSAGE_FLOOR equals WCAG_AA_TEXT (4.5:1) — by intent', () => {
    // The textLink is text. WCAG 1.4.3 (4.5:1) is the floor below which
    // body-rank text fails legibility. See JSDoc on
    // `TEXTLINK_PASSAGE_FLOOR` in `lib/design/voice-ledger.ts`.
    expect(TEXTLINK_PASSAGE_FLOOR).toBe(WCAG_AA_TEXT);
  });

  it('TEXTLINK_PASSAGE_FLOOR is pinned at the literal 4.5 (snapshot the number itself)', () => {
    // Pin the literal — a future PR that nudges to 4.4 or 5.0 touches
    // this line and prompts a deliberate review of the JSDoc. Mirror of
    // the chip audit §0 sanity pin.
    expect(TEXTLINK_PASSAGE_FLOOR).toBe(4.5);
  });

  it('TEXTLINK_PASSAGE_FLOOR sits ABOVE WCAG_NONTEXT (3.0:1) — text is louder than signal', () => {
    // The textLink carries a *word* the reader reads, not a *gem* they
    // glance at. Lifting to text-tier is the "what makes the foreshadow
    // honest" promise (Tanya UX #46 §9). A future "harmonize down to
    // non-text" PR trips here.
    expect(TEXTLINK_PASSAGE_FLOOR).toBeGreaterThan(WCAG_NONTEXT);
  });

  it('TEXTLINK_PASSAGE_FLOOR sits ABOVE THREAD_AMBIENT_FLOOR — text is louder than ambient cue', () => {
    // Different rationale, same fence shape: the thread is *ambient*
    // (look-through), the textLink is *text* (read-at). The textLink
    // floor sits comfortably above the thread floor. A future PR that
    // collapses the two onto a shared "ambient" floor trips here.
    expect(TEXTLINK_PASSAGE_FLOOR).toBeGreaterThan(THREAD_AMBIENT_FLOOR);
  });

  it('WCAG constants match the spec (4.5 for text, 3.0 for non-text)', () => {
    // Sanity pin — if anyone "rounds" `WCAG_AA_TEXT` to 4 or 5, the
    // lock-AT assertion above silently shifts. Number-vs-number, not
    // name-vs-name. (Same shape as chip / keepsake-gold §0 sanity pins.)
    expect(WCAG_AA_TEXT).toBe(4.5);
    expect(WCAG_NONTEXT).toBe(3.0);
  });
});

// ─── 1 · FLOOR — every (paint × anchor) cell holds ≥ floor ────────────────
//
// Three voices × two anchors = SIX cells today. NO `gesture` axis —
// rest/hover are different *cells*, not different ledger axes (Mike
// napkin #45 §"Rejected ideas" — gesture axis was the genus-from-N=2
// trap, killed at design time).

describe('textlink-passage-contrast-audit · §1 FLOOR (each cell clears the text floor)', () => {
  it('REST_HEX mirrors color-constants.ts BRAND.accentViolet (#dc6cff)', () => {
    // The rest hex is `voice.accent` — `BRAND.accentViolet` from the
    // color-constants ledger. If a future PR mutes the brand violet for
    // taste, this pin trips first and forces a deliberate review of the
    // audit's hex mirror. (`color-constants-sync.test.ts` already pins
    // BRAND.accentViolet to `app/globals.css` — this is the audit's
    // local mirror, same shape as the thread audit's `ACCENT_COLD` pin.)
    // Lifted `#c77dff` → `#dc6cff` on the 15° sibling-violet spread
    // (Sid 2026-04-26, Mike napkin #100, Tanya UX #12).
    expect(REST_HEX).toBe('#dc6cff');
    expect(REST_HEX).toBe(BRAND.accentViolet);
  });

  it('GOLD_HEX mirrors color-constants.ts BRAND.gold (#f0c674)', () => {
    // The gold hex is `archetype.gold` — `BRAND.gold` from the color-
    // constants ledger. Also equals `THERMAL_WARM.accent` (warm thermal
    // endpoint) — same hex, different voices (Mike #54 — voice ≠ hex).
    expect(GOLD_HEX).toBe('#f0c674');
    expect(GOLD_HEX).toBe(BRAND.gold);
  });

  it('ROSE_HEX mirrors color-constants.ts BRAND.rose (#e88fa7)', () => {
    // The rose hex is `worldview.rose` — `BRAND.rose` from the color-
    // constants ledger. Painted via `var(--rose)` when `resolveRoomFor
    // Path` returns `'rose'` (link-phase.ts resolveDestinationAccent).
    expect(ROSE_HEX).toBe('#e88fa7');
    expect(ROSE_HEX).toBe(BRAND.rose);
  });

  // Six (paint × anchor) cells — declared inline so each cell becomes a
  // named `it` in jest output (atomic fail-path: a single failing cell
  // is one red line, not a swallowed forEach).
  for (const paint of PAINTED) {
    for (const anchor of ANCHORS) {
      const label = `${paint.voice} (textLink, ${paint.cell}) over ${anchor.name}`;
      it(`${label} clears ≥ ${TEXTLINK_PASSAGE_FLOOR}:1`, () => {
        assertReadable(paint, anchor);
      });
    }
  }
});

// ─── 2 · LICENSE — every painted voice belongs to the textLink surface ────

describe('textlink-passage-contrast-audit · §2 LICENSE (each painted voice belongs to textLink)', () => {
  it.each(PAINTED.map((p) => p.voice))(
    'voice `%s` ∈ licenseFor("textLink")',
    (v) => {
      const licensed = new Set<Voice>(licenseFor('textLink'));
      expect(licensed.has(v)).toBe(true);
    },
  );

  it('textLink licenses EXACTLY the four foreshadow voices (no drift)', () => {
    // The textLink row is the smallest defensible vocabulary that paints
    // the `passage` variant: the runtime rest paint (thermal.accent —
    // `var(--token-accent)`), its canvas-safe brand floor (voice.accent —
    // BRAND.accentViolet, the audit's rest-paint subject), and the two
    // destination accents (archetype.gold, worldview.rose). A fifth
    // voice landing on this row is a contract change deserving a
    // deliberate review (e.g., a third destination room). Until then,
    // four voices sit honestly side-by-side.
    expect(licenseFor('textLink')).toEqual([
      'thermal.accent', 'voice.accent', 'archetype.gold', 'worldview.rose',
    ]);
  });

  it('CONTRAST_PAIRS.textLink declares three pairs at the text floor', () => {
    // Pair lookup is by *fg voice*, not row index — future PRs may add a
    // fourth pair on the `textLink` row (e.g., a third destination
    // accent). The pair-by-name discipline keeps each cell decoupled
    // (Mike napkin #45 §"Points of interest #3").
    const pairs = contrastPairsFor('textLink');
    expect(pairs).toHaveLength(3);
    pairs.forEach((p) => expect(p.floor).toBe(TEXTLINK_PASSAGE_FLOOR));
  });

  it('every textLink pair names voices the textLink surface licenses (no drift)', () => {
    const licensed = new Set<Voice>(licenseFor('textLink'));
    for (const pair of contrastPairsFor('textLink')) {
      expect(licensed.has(pair.fg)).toBe(true);
      expect(licensed.has(pair.bg)).toBe(true);
    }
  });

  it('CONTRAST_PAIRS holds four rows today (chip + keepsake + thread + textLink); genus deferred', () => {
    // Mike napkin #45 / Sid (2026-04-26) — `textLink` joined the manifest
    // as the seventh contrast-audit sibling (fourth row in CONTRAST_PAIRS,
    // since some siblings carry no paired-row — e.g. skiplink). Four rows
    // now — but the `ContrastFamily` genus is STILL deferred because they
    // share *shape* (one fg over one bg at one floor) and not *role*:
    // chip is text-legibility, keepsake is ornament + signal, thread is
    // ambient cue, textLink is foreshadow. Polymorphism is a killer
    // (Mike #54).
    expect(Object.keys(CONTRAST_PAIRS).sort())
      .toEqual(['chip', 'keepsake', 'textLink', 'thread'].sort());
  });
});

// ─── 3 · RECEIPT — worst-case cell per voice, for AGENTS.md ───────────────
//
// Three numbers, one line. Same Tanya/Elon "spread legible as numbers"
// treatment as the thread audit (two cells, side-by-side), adapted for
// a three-voice surface (worst-case per voice, side-by-side). The
// receipt is the loudness ("fail quietly, recover loudly" — Mike #95 §6):
// AGENTS.md surfaces drift *as numbers* the moment a future palette
// nudge sinks any voice's worst case below 4.5:1.

describe('textlink-passage-contrast-audit · §3 RECEIPT (worst-case per voice, for AGENTS.md)', () => {
  it('all three worst-case cells clear the text floor (the spread is the foreshadow honest)', () => {
    const rest      = worstCellFor(PAINTED[0]);
    const hoverGold = worstCellFor(PAINTED[1]);
    const hoverRose = worstCellFor(PAINTED[2]);
    // eslint-disable-next-line no-console
    console.log(
      `[textlink-passage-contrast-audit] rest ${rest.toFixed(2)}:1 · hover-gold ${hoverGold.toFixed(2)}:1 · hover-rose ${hoverRose.toFixed(2)}:1 (worst-case across destination accents) @ warm, floor ${TEXTLINK_PASSAGE_FLOOR}:1`,
    );
    expect(rest).toBeGreaterThanOrEqual(TEXTLINK_PASSAGE_FLOOR);
    expect(hoverGold).toBeGreaterThanOrEqual(TEXTLINK_PASSAGE_FLOOR);
    expect(hoverRose).toBeGreaterThanOrEqual(TEXTLINK_PASSAGE_FLOOR);
  });

  it('hover paints clear non-text signal-tier (≥ WCAG_NONTEXT) on their own', () => {
    // The destination accents (gold, rose) carry the foreshadow signal;
    // they sit comfortably above WCAG_NONTEXT at both anchors. The audit
    // defends the *text* floor; the signal-tier rise is the palette's
    // own work. (Tanya UX #46 §4 — gold and rose are calibrated bright.)
    const hoverGold = worstCellFor(PAINTED[1]);
    const hoverRose = worstCellFor(PAINTED[2]);
    expect(hoverGold).toBeGreaterThanOrEqual(WCAG_NONTEXT);
    expect(hoverRose).toBeGreaterThanOrEqual(WCAG_NONTEXT);
  });
});

// ─── 2.5 · IDENTITY — focus paints byte-identical to hover, per accent ────
// Mirror of `skiplink-contrast-audit · §2 IDENTITY` shape (Krystle C. #1,
// via Mike napkin #128). `link-phase.ts:119` collapses both phases onto
// the same `destAccent` today by coincidence; this pins the coincidence
// as a contract. N=2 of the IDENTITY shape — genus extraction deferred
// per rule-of-three (Mike #102 §3 / #128).

describe('textlink-passage-contrast-audit · §2.5 IDENTITY (focus===hover per accent)', () => {
  it('focus-gold paints byte-identical to hover-gold', () => {
    const hover = resolveLinkColor('hover', 'passage', 'var(--gold)');
    const focus = resolveLinkColor('focus', 'passage', 'var(--gold)');
    expect(focus).toBe(hover);
  });

  it('focus-rose paints byte-identical to hover-rose', () => {
    const hover = resolveLinkColor('hover', 'passage', 'var(--rose)');
    const focus = resolveLinkColor('focus', 'passage', 'var(--rose)');
    expect(focus).toBe(hover);
  });
});
