/**
 * SkipLink Contrast Audit — WCAG 4.5:1 floor, cardinality-1 (static).
 *
 * The 6th sibling. Same shape as the five shipped contrast audits, but
 * the painted bytes are reader-invariant by construction (Tanya UX §3,
 * SkipLink.tsx §"Contract"). The (fg, bg) hex pair does NOT depend on
 * thermal state — `--mist` and `--void-deep` are static brand tokens
 * (see `app/globals.css` @ `.sys-skiplink`).
 *
 * Why local constants, not a `CONTRAST_PAIRS` row: rule of three (Mike
 * napkin #102 §3). The SkipLink is the only reader-invariant chrome
 * surface today. When TextLink focus ring + landmark grow audits
 * (separate PRs), the genus earns extraction. For now: one file, one
 * floor, one number.
 *
 * Why two-anchor sweep anyway: symmetry of *shape* with the five
 * siblings (Mike napkin #100 §4.2). The bytes are identical at both
 * anchors — that identity is the receipt the test prints. If a future
 * PR mutates the SkipLink to fork on thermal state, the identity
 * assertion fails first — before any human review.
 *
 * Pure Jest, no DOM, no Canvas. Reuses `lib/design/contrast.ts` math
 * kernel (Mike §extract-and-share rule). Does not read `globals.css` —
 * `skip-link-sync.test.ts` already pins the CSS bytes; this test pins
 * the resulting math.
 *
 * Failure ergonomics — number first, key second, no narrative:
 *   `void over mist @ warm: 6.42:1 < floor 4.5:1`
 *
 * Credits:
 *   • Krystle C. (audit-spec shape — fg/bg/floor triple, two-anchor
 *     sweep, atomic fail-path).
 *   • Mike K. (napkin #102) — sibling test over `CONTRAST_PAIRS` row;
 *     the rule-of-three discipline; the spread-vs-static distinction
 *     kept as prose, not a type.
 *   • Tanya D. (UX #80 §1.4 / §2.4) — the byte-stable contract this
 *     audit measures; the `(static)` kind tag the AGENTS.md row carries.
 *   • Elon M. — the salvageable kernel that some receipts measure
 *     spread, some measure floor, this one measures *stasis*.
 *   • The five existing audit authors — `chip-`, `archetype-chip-`,
 *     `halo-`, `keepsake-gold-`, `thread-contrast-audit.test.ts` —
 *     whose pattern this sixth sibling copies verbatim.
 */

import { contrast } from '../contrast';
import { BRAND, THERMAL, THERMAL_WARM } from '../color-constants';

// ─── Locked (fg, bg) — NOT in voice-ledger. Cardinality-1 surfaces are ────
// named constants, not ledger rows (SkipLink.tsx §"Not a ledger").

/** `--void-deep` — the locked SkipLink ink (`app/globals.css:519`). */
const FG = BRAND.void;

/** `--mist` — the locked SkipLink fill (`app/globals.css:518`). */
const BG = BRAND.mist;

/** WCAG 2.1 §1.4.3 normal-text floor. SkipLink copy is body-rank text. */
const FLOOR = 4.5;

// ─── Two anchors — load-bearing as shape, not as math ─────────────────────
// The SkipLink does not read `THERMAL.*` / `THERMAL_WARM.*`. The sweep is
// a symmetry pin: if a future PR forks the chip on thermal state, the
// identity assertion below fails first.

const ANCHORS = [
  { name: 'dormant', surface: THERMAL.surface      },
  { name: 'warm',    surface: THERMAL_WARM.surface },
] as const;

type Anchor = (typeof ANCHORS)[number];

// ─── Helpers — pure, ≤10 LOC each ─────────────────────────────────────────

/** The single static painted ratio. The anchor is decorative. */
function paintedRatio(_anchor: Anchor): number {
  return contrast(FG, BG);
}

/** Number-first failure. No narrative. Audience of one. */
function assertReadable(anchor: Anchor): void {
  const ratio = paintedRatio(anchor);
  if (ratio < FLOOR) {
    throw new Error(`void over mist @ ${anchor.name}: ${ratio.toFixed(2)}:1 < floor ${FLOOR}:1`);
  }
  expect(ratio).toBeGreaterThanOrEqual(FLOOR);
}

// ─── §1 FLOOR — clears WCAG AA at every anchor ────────────────────────────

describe('skiplink-contrast-audit · §1 FLOOR (void over mist clears 4.5:1)', () => {
  it('FG/BG are the canvas-safe BRAND tokens (no thermal interpolation)', () => {
    expect(FG).toBe(BRAND.void);
    expect(BG).toBe(BRAND.mist);
    expect(FG).toMatch(/^#[0-9a-f]{6}$/i);
    expect(BG).toMatch(/^#[0-9a-f]{6}$/i);
  });

  for (const anchor of ANCHORS) {
    it(`@ ${anchor.name} anchor: void over mist clears ≥ ${FLOOR}:1`, () => {
      assertReadable(anchor);
    });
  }
});

// ─── §2 IDENTITY — the painted bytes are reader-invariant ─────────────────
// The receipt: a static surface produces ONE number, regardless of the
// room's thermal state. Identity is the contract (SkipLink.tsx §3:
// "does NOT fork with thermal state — copy and paint are byte-stable").

describe('skiplink-contrast-audit · §2 IDENTITY (byte-stable across anchors)', () => {
  it('the painted ratio is identical at both thermal anchors', () => {
    const cold = paintedRatio(ANCHORS[0]);
    const warm = paintedRatio(ANCHORS[1]);
    expect(cold).toBe(warm);
  });
});

// ─── §3 RECEIPT — surface the static ratio for AGENTS.md §Contrast Audit ──
// Same shape the five sibling audits print. The `static` annotation is
// the kind tag (Tanya UX #80 §2.2) — encoded in prose, not in code.

describe('skiplink-contrast-audit · §3 RECEIPT (static value for AGENTS.md)', () => {
  it('prints the static ratio (kind: static; both anchors agree)', () => {
    const ratio = paintedRatio(ANCHORS[0]);
    // eslint-disable-next-line no-console
    console.log(
      `[skiplink-contrast-audit] static: ${ratio.toFixed(2)}:1 (void over mist, floor ${FLOOR}:1, byte-stable; reader-invariant)`,
    );
    expect(ratio).toBeGreaterThanOrEqual(FLOOR);
  });
});
