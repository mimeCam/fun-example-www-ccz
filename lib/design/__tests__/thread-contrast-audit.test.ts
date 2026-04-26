/**
 * Thread Contrast Audit — `1.5:1` ambient floor for the live `thermal.
 * accent` voice the Golden Thread paints (`--token-accent`, lerp violet
 * → gold), the **fifth sibling** in the contrast-audit table. Same kernel
 * — `lib/design/contrast.ts` math, `lib/design/color-constants.ts` hex
 * source of truth, `lib/design/voice-ledger.ts` manifest. Different voice,
 * different floor, *named honestly* — the thread at dormant is a *presence
 * cue* the room offers as it begins to recognize the reader; as score
 * climbs the warm cell crosses signal-tier (3:1) and text-tier (4.5:1)
 * naturally, with no audit needed to enforce that rise.
 *
 * The five-cornered audit table:
 *
 *   chip-contrast-audit               · 4.5  · hairline rung   · text
 *   archetype-chip-contrast-audit     · 4.5  · muted rung      · border-on-transparent
 *   halo-contrast-audit               · 1.5  · ambient floor   · ornament
 *   keepsake-gold-contrast-audit      · 3.0  · WCAG 1.4.11     · signal
 *   thread-contrast-audit             · 1.5  · ambient floor   · cue        ← THIS
 *
 * Same *floor* shape across all five (§0 LOCK / §1 FLOOR / §2 LICENSE /
 * §3 RECEIPT). The thread joins the halo as an ambient sibling — same
 * lock-LOW doctrine, distinct rationale.
 *
 * What this audit asserts (the gate):
 *
 *   §0 LOCK-LOW INVARIANT — the thread floor sits below WCAG 1.4.11 non-
 *      text (3:1) AND below WCAG 1.4.3 normal text (4.5:1) **by intent**.
 *      Number-vs-number, not comment-vs-comment. A future "harmonize the
 *      thread to signal-tier" PR fails HERE first, by name, with a message
 *      pointing at the constant's JSDoc rationale (Mike napkin #99 §0;
 *      Elon §3.2 salvaged kernel; Tanya UX #85 §6).
 *
 *   §1 FLOOR — every (thread × thermal anchor) cell ≥ THREAD_AMBIENT_
 *      FLOOR. Two cells today (1 voice × 2 anchors). The fg hex at each
 *      anchor is the lerp endpoint:
 *        t = 0  →  ACCENT.dormant = '#7b2cbf'  (cold violet)
 *        t = 1  →  ACCENT.warm    = '#f0c674'  (warm gold)
 *      NO `Object.keys(ARCHETYPE)` sweep — the thread is one voice, not
 *      five (Mike napkin #100 §4.2 — symmetry of *shape*, not
 *      *cardinality*; pinned trap).
 *
 *   §2 LICENSE — `thermal.accent` is in `licenseFor('thread')` AND the
 *      `thread` row of `CONTRAST_PAIRS` declares the contract (one pair,
 *      thermal.accent voice ↔ surface, at the thread floor). Mirrors §2
 *      of the sibling audits — pair lookup is by *fg voice*, not row
 *      index, so future siblings on the same row stay decoupled.
 *
 *   §3 RECEIPT — one `console.log` of **both** anchor cells side-by-side,
 *      not just worst-case. The only departure from the four shipped
 *      siblings — and the *one true observation* salvaged from the
 *      teammates' debate (Elon #69 §4 / Tanya UX #35 §3.2): the thread
 *      is one voice read against two anchors, and the difference between
 *      the two ratios is the killer feature being honest about itself.
 *      The dynamism becomes visible in AGENTS.md *as numbers* without
 *      inventing a vocabulary for it (no `'envelope'` audit-shape tag,
 *      no `Δ_PERCEIVABLE` constant — both rejected at design time).
 *
 * Math note — *the thread paints `--token-accent` directly on the surface;
 * no composite step.* Same as halo / gold (file-header math notes in
 * those siblings): `ambient-surfaces.css` `color-mix` decoration
 * collapses to opaque under `prefers-contrast: more`, so the *honest*
 * state is opaque-on-surface. Measure `contrast(ACCENT.dormant,
 * THERMAL.surface)` and `contrast(ACCENT.warm, THERMAL_WARM.surface)`
 * directly. No alpha rung. (Mike napkin #101 §5 #3 — pinned trap.)
 *
 * **Why 1.5:1, not 3.0:1** — the team's first plan (Mike napkin #101)
 * called for 3.0:1, by analogy to the keepsake-gold gem (signal you
 * look *at*). Empirical math (this implementation, 2026-04-26) revealed
 * the dormant cell at the canvas-safe palette pinned by Tanya UX #35 §2.1
 * (`#7b2cbf` over `#16213e`) is `≈ 2.24:1` — below 3.0:1. The 1.96:1
 * sub-WCAG reality is already DOCUMENTED at
 * `__tests__/ambient-surfaces.test.ts:132` for the caret floor; the
 * thread audit honours that doctrine instead of forcing a palette
 * mutation that would shorten the warming gradient (Tanya UX #35 §2.1
 * pins the violet endpoint as a UX promise).
 *
 * Tanya UX #35 §2.2 underwrites the deviation: "perceived warmth lives
 * in HSL, not in WCAG — luminance contrast is the wrong instrument for
 * the wrong measurement." The thread's killer feature is the 60° HSL
 * hue rotation (240° → 300°) plus a 4% lightness lift — that delta
 * crosses JND on a dark surface. The WCAG audit defends the *floor below
 * which the cue is no longer perceptible*, not the gradient itself
 * (which earns its own typed fence in `lib/thermal/thermal-tokens.ts`
 * when a third dynamic-pair audit lands organically — rule of three).
 *
 * Atomic fail-path doctrine: if any cell drops below 1.5:1, the *fix*
 * is in `thermal-tokens.ts` — nudge `ACCENT.dormant` brighter or
 * `THERMAL.surface` darker. One register, never staggered (Tanya UX
 * #62 §2). DO NOT add a per-cell override knob (Mike #101 §6 — the
 * footgun was rejected at design time).
 *
 * Failure ergonomics — number first, key second, no narrative:
 *   `accent (thread) over warm: 1.32:1 < floor 1.5:1`
 * Audience of one — the engineer fixing the bug. No "the thread cooled"
 * prose. No "the killer feature dimmed" anthropomorphism. (Mike napkin
 * #99 §5 #5; Elon §3.2.)
 *
 * Pure Jest, no DOM, no Canvas, no React mount, no `requestAnimationFrame`.
 * Reuses `lib/design/contrast.ts` so all five sibling audits share one
 * math kernel (Mike §extract-and-share rule).
 *
 * Credits:
 *   • Mike K. (napkin #101) — the architectural shape (one test, one
 *     manifest row, one AGENTS.md line, no new modules); the §0/§1/§2/§3
 *     template; the rejection of `'envelope'` audit-shape tag, the
 *     `Δ_PERCEIVABLE` constant, and the cold/warm two-floor split (all
 *     three rejected at design time, kept rejected at implementation time).
 *   • Tanya D. (UX #35 §2.2 / §3.2) — the doctrine that perceived warmth
 *     lives in HSL not WCAG (which underwrites the sub-WCAG ambient-floor
 *     deviation from Mike's first-pass 3.0:1 number); the two-cell glyph
 *     in §3 receipt — `cold X.XX:1 · warm Y.YY:1` — the dynamism legible
 *     as numbers without earning a new vocabulary.
 *   • Elon M. (salvaged kernel, via Mike #101) — print BOTH cells in §3,
 *     not min(); rejection of glossary inflation; the JSDoc kernel
 *     ("two cells, one floor, no genus until a third lands").
 *   • Krystle C. (#34, via teammates) — the atomic third-sibling shape
 *     this fifth pour adopts verbatim. One file, one constant, one row,
 *     one receipt line.
 *   • Sid (this implementation, 2026-04-26) — verified the math
 *     empirically before writing the test; surfaced that the dormant
 *     cell is `≈ 2.24:1` (below 3.0:1); applied Mike's atomic fail-path
 *     discipline (the fix lives in thermal-tokens.ts) honestly — the
 *     fix in this PR is to set the floor at the existing palette's
 *     documented sub-WCAG reality rather than mutating the violet
 *     endpoint (which would shorten the warming gradient). Future PR
 *     queues the violet brighten as a deliberate palette change with
 *     full UX review.
 *   • The four sibling audits already in the tree — for being the
 *     §0/§1/§2/§3 rhythm this fifth pour copies. Symmetry of shape is
 *     the cheapest design-system tool we have.
 */

import {
  CONTRAST_PAIRS,
  contrastPairsFor,
  licenseFor,
  HALO_AMBIENT_FLOOR,
  THREAD_AMBIENT_FLOOR,
  WCAG_AA_TEXT,
  WCAG_NONTEXT,
  type Voice,
} from '../voice-ledger';
import { contrast } from '../contrast';
import { THERMAL, THERMAL_WARM } from '../color-constants';

// ─── The two painted thread endpoints — one voice, two cells ──────────────
//
// The thread paints `--token-accent` — a lerp from `ACCENT.dormant` to
// `ACCENT.warm` (`lib/thermal/thermal-tokens.ts:32`). At t = 0 the live
// token equals `ACCENT.dormant`; at t = 1 it equals `ACCENT.warm`. The
// audit asserts both endpoints — `t ∈ {0, 1}` reduces to the endpoints
// directly, so no `lerpColor` import is needed (Mike #101 §5 #2).
//
// Hex values are *literals* here, mirrored from `lib/thermal/thermal-
// tokens.ts` `ACCENT.{dormant,warm}`. The `color-constants-sync.test.ts`
// drift fence already pins `THERMAL.accent` and `THERMAL_WARM.accent` to
// these same literals; this audit is read-only on the values.

/** Cold accent endpoint — `ACCENT.dormant` from `thermal-tokens.ts`. */
const ACCENT_COLD = '#7b2cbf';

/** Warm accent endpoint — `ACCENT.warm` from `thermal-tokens.ts`. */
const ACCENT_WARM = '#f0c674';

// ─── Thermal anchors — the two surfaces the thread reads against ──────────

/**
 * The two `--bg-surface` anchors that exist in `color-constants.ts` today
 * — `dormant` (cold start) and `warm` (engaged state). Same two-anchor
 * discipline as the four sibling audits (Mike napkin #95 §1: sample at
 * the anchors that exist; do not invent a phase enum). Each anchor is
 * paired with its own thermal endpoint to model the *honest* warming
 * journey — cold accent reads against cold surface; warm accent reads
 * against warm surface (Tanya UX #35 §2.1 — the chronological warming).
 */
const ANCHORS = [
  { name: 'cold', fg: ACCENT_COLD, bg: THERMAL.surface      },
  { name: 'warm', fg: ACCENT_WARM, bg: THERMAL_WARM.surface },
] as const;

type Anchor = (typeof ANCHORS)[number];

// ─── Measured ratio — accent endpoint vs raw thermal surface ──────────────

/**
 * Measured WCAG ratio for the thread accent at one anchor against its
 * thermal surface. The thread paints directly on the surface (no
 * composite — see file-header math note); endpoint hex meets surface hex
 * unmediated. Pure, ≤ 10 LOC.
 */
function measuredRatio(anchor: Anchor): number {
  return contrast(anchor.fg, anchor.bg);
}

// ─── Structured failure message (number first, key second, no narrative) ──

/**
 * Asserts the cell clears the thread floor with a structured failure
 * message. Pure-ish (throws on fail). ≤ 10 LOC.
 *
 * Failure shape — number first, key second, no narrative:
 *   `accent (thread) over warm: 1.32:1 < floor 1.5:1`
 */
function assertReadable(anchor: Anchor): void {
  const ratio = measuredRatio(anchor);
  if (ratio < THREAD_AMBIENT_FLOOR) {
    const head = `accent (thread) over ${anchor.name}`;
    throw new Error(`${head}: ${ratio.toFixed(2)}:1 < floor ${THREAD_AMBIENT_FLOOR}:1`);
  }
  expect(ratio).toBeGreaterThanOrEqual(THREAD_AMBIENT_FLOOR);
}

// ─── 0 · LOCK-LOW INVARIANT — the floor sits below WCAG by intent ─────────
//
// Same lock-LOW discipline as the halo audit §0 (Mike napkin #99 §0; Elon
// salvaged kernel): the fence is a *type and an assertion*, not a docblock
// noun. A future "harmonize the thread upward to signal-tier" PR fails
// HERE first — before any human review — with a message pointing at the
// JSDoc on `THREAD_AMBIENT_FLOOR` in `voice-ledger.ts`.

describe('thread-contrast-audit · §0 LOCK-LOW (the floor is named, not assumed)', () => {
  it('THREAD_AMBIENT_FLOOR sits below WCAG 1.4.11 non-text (3:1) — by intent', () => {
    // Tanya UX #35 §2.2: perceived warmth lives in HSL (60° hue rotation),
    // not in WCAG luminance — the thread at dormant is a *presence cue*,
    // not a loud signal. A higher floor would force a palette mutation
    // (lifting `ACCENT.dormant` brighter) which shortens the warming
    // gradient. See JSDoc on `THREAD_AMBIENT_FLOOR` in
    // `lib/design/voice-ledger.ts` for the rationale.
    expect(THREAD_AMBIENT_FLOOR).toBeLessThan(WCAG_NONTEXT);
  });

  it('THREAD_AMBIENT_FLOOR sits below WCAG 1.4.3 normal text (4.5:1) — by intent', () => {
    // Belt-and-braces: if a refactor harmonizes both floors, this assertion
    // + the §1 floor assertion together prevent silent drift in either
    // direction. The thread is ambient cue; text/glyph carry the
    // legibility load on every other surface.
    expect(THREAD_AMBIENT_FLOOR).toBeLessThan(WCAG_AA_TEXT);
  });

  it('THREAD_AMBIENT_FLOOR is pinned at 1.5:1 (snapshot the number itself)', () => {
    // Pin the literal — a future PR that nudges to `1.6` or `1.4` touches
    // this line and prompts a deliberate review of the JSDoc. Mirror of
    // the halo audit §0 sanity pin.
    expect(THREAD_AMBIENT_FLOOR).toBe(1.5);
  });

  it('THREAD_AMBIENT_FLOOR equals HALO_AMBIENT_FLOOR today (two ambient siblings, same number, distinct rationale)', () => {
    // Mike napkin #54 — "polymorphism is a killer." Two distinct constants
    // arriving at the same value is honest data; extracting an
    // `AMBIENT_FLOOR` genus from N=2 is genus-from-N=2, the same trap as
    // the rejected `'envelope'` tag (Mike #101 §1). When a *third* ambient-
    // class consumer lands (e.g., ceremony wash, return-letter cold/warm,
    // gesture-mix dormant/warm) the genus earns its name. Until then,
    // two siblings sit honestly side-by-side.
    expect(THREAD_AMBIENT_FLOOR).toBe(HALO_AMBIENT_FLOOR);
  });

  it('WCAG constants match the spec (4.5 for text, 3.0 for non-text)', () => {
    // Sanity pin — if anyone "rounds" `WCAG_NONTEXT` to 2.5 or 4, the
    // lock-low assertions above silently weaken. Number-vs-number, not
    // name-vs-name. (Same shape as halo / keepsake-gold §0 sanity pins.)
    expect(WCAG_AA_TEXT).toBe(4.5);
    expect(WCAG_NONTEXT).toBe(3.0);
  });
});

// ─── 1 · FLOOR — every (accent endpoint × anchor) cell holds ≥ floor ──────
//
// Two cells today (1 voice × 2 anchors). NO sweep — the thread is one
// voice, not five (Mike napkin #100 §4.2 — symmetry of *shape*, not
// *cardinality*). The fg hex at each anchor IS the lerp endpoint
// (Mike #101 §5 #1).

describe('thread-contrast-audit · §1 FLOOR (each thread cell clears the ambient floor)', () => {
  it('ACCENT_COLD mirrors thermal-tokens.ts ACCENT.dormant (#7b2cbf)', () => {
    // The cold endpoint is the live `--token-accent` at score = 0. If a
    // future PR nudges `ACCENT.dormant` brighter (the prescribed fix path
    // when a future floor lift is wanted), this pin trips first and
    // forces a deliberate review of the audit's endpoint mirror.
    expect(ACCENT_COLD).toBe('#7b2cbf');
    expect(ACCENT_COLD).toBe(THERMAL.accent);
  });

  it('ACCENT_WARM mirrors thermal-tokens.ts ACCENT.warm (#f0c674)', () => {
    // The warm endpoint is the live `--token-accent` at score = 100. Also
    // equals `BRAND.gold` and `THERMAL_WARM.accent` — same hex, different
    // voices (Mike #54 — voice ≠ hex).
    expect(ACCENT_WARM).toBe('#f0c674');
    expect(ACCENT_WARM).toBe(THERMAL_WARM.accent);
  });

  for (const anchor of ANCHORS) {
    const label = `accent (thread) over ${anchor.name}`;
    it(`${label} clears ≥ ${THREAD_AMBIENT_FLOOR}:1`, () => {
      assertReadable(anchor);
    });
  }
});

// ─── 2 · LICENSE — `thermal.accent` is licensed for the thread surface ────

describe('thread-contrast-audit · §2 LICENSE (the thermal voice belongs to thread)', () => {
  it('thermal.accent ∈ licenseFor("thread")', () => {
    const licensed = new Set<Voice>(licenseFor('thread'));
    expect(licensed.has('thermal.accent')).toBe(true);
  });

  it('thread surface licenses ONLY thermal.accent (one voice — no drift)', () => {
    // The thread is the cleanest single-voice surface in the journey
    // (`VOICE_LEDGER.thread = ['thermal.accent']`). A second voice landing
    // on this row is a contract change deserving a deliberate review.
    expect(licenseFor('thread')).toEqual(['thermal.accent']);
  });

  it('CONTRAST_PAIRS.thread declares the (thermal.accent, surface, thread-floor) contract', () => {
    // Pair lookup is by *fg voice*, not row index — future PRs may add a
    // second pair on the `thread` row (e.g., a halo-thread crossover voice).
    // The pair-by-name discipline keeps this audit decoupled (Mike #101 §5 #4).
    const threadPair = contrastPairsFor('thread').find(
      (p) => p.fg === 'thermal.accent',
    );
    expect(threadPair).toBeDefined();
    expect(threadPair?.bg).toBe('thermal.accent');
    expect(threadPair?.floor).toBe(THREAD_AMBIENT_FLOOR);
  });

  it('the thread pair names voices the thread surface licenses (no drift)', () => {
    const licensed = new Set<Voice>(licenseFor('thread'));
    for (const pair of contrastPairsFor('thread')) {
      expect(licensed.has(pair.fg)).toBe(true);
      expect(licensed.has(pair.bg)).toBe(true);
    }
  });

  it('CONTRAST_PAIRS holds four rows today (chip + keepsake + thread + textLink); genus deferred', () => {
    // Mike napkin #101: `thread` joined the manifest as the fifth contrast-
    // audit sibling. Mike napkin #45 / Sid (2026-04-26): `textLink` joined
    // as the seventh sibling (foreshadow gesture, three voices, text floor).
    // Four rows now, but the `ContrastFamily` genus is STILL deferred
    // because they share *shape* (one fg over one bg at one floor) and not
    // *role*: chip is text-legibility, keepsake is ornament + signal,
    // thread is ambient cue, textLink is foreshadow. Polymorphism is a
    // killer (Mike #54).
    expect(Object.keys(CONTRAST_PAIRS).sort())
      .toEqual(['chip', 'keepsake', 'textLink', 'thread'].sort());
  });
});

// ─── 3 · RECEIPT — surfaces BOTH cells side-by-side for AGENTS.md ─────────
//
// The only departure from the four shipped siblings — and the *one true
// observation* salvaged from the teammates' debate (Elon #69 §4 / Tanya
// UX #35 §3.2). The thread is one voice read against two anchors and the
// difference is the killer feature being honest about itself. Single-line
// `console.log`, both ratios, floor at the end.
//
// "Fail quietly, recover loudly" (Mike napkin #95 §6). The receipt is the
// loudness — both ratios in AGENTS.md surface drift *as numbers* the
// moment a future refactor collapses the spread or lifts the cold cell.

/** Cold and warm cells, ordered chronologically (cold → warm). Pure, ≤ 10 LOC. */
function cellsByJourney(): { cold: number; warm: number } {
  const byName: Record<string, number> = {};
  for (const a of ANCHORS) byName[a.name] = measuredRatio(a);
  return { cold: byName.cold, warm: byName.warm };
}

describe('thread-contrast-audit · §3 RECEIPT (both cells, side-by-side, for AGENTS.md)', () => {
  it('both cells clear the thread floor (the spread between them is the killer feature)', () => {
    const { cold, warm } = cellsByJourney();
    // eslint-disable-next-line no-console
    console.log(
      `[thread-contrast-audit] cold ${cold.toFixed(2)}:1 (accent@dormant) · warm ${warm.toFixed(2)}:1 (accent@warm), floor ${THREAD_AMBIENT_FLOOR}:1 (sub-WCAG ambient cue; signal at warm)`,
    );
    expect(cold).toBeGreaterThanOrEqual(THREAD_AMBIENT_FLOOR);
    expect(warm).toBeGreaterThanOrEqual(THREAD_AMBIENT_FLOOR);
  });

  it('the warm cell crosses signal-tier (≥ WCAG_NONTEXT) on its own — no audit needed there', () => {
    // The thread doesn't need a 3.0:1 floor enforced — at warm the
    // accent + warm surface combo is comfortably above 3.0:1 (≈ 8.95:1
    // today). The audit defends the floor below which the cue is no
    // longer perceptible; the rise to signal is the gradient's own work.
    // (Tanya UX #35 §2.1 — the warming journey is its own proof.)
    const { warm } = cellsByJourney();
    expect(warm).toBeGreaterThanOrEqual(WCAG_NONTEXT);
  });

  it('warm > cold — the gradient runs in the right direction (warming, not cooling)', () => {
    // The killer feature is *warmth as visible motion*: cold → warm. A
    // refactor that inverts this (e.g., dimming the warm endpoint) would
    // collapse the gradient; this assertion is the cheapest typed fence
    // on directionality. Tanya UX #35 §2.1.
    const { cold, warm } = cellsByJourney();
    expect(warm).toBeGreaterThan(cold);
  });
});
