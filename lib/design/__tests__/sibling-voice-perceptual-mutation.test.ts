/**
 * sibling-voice-perceptual-mutation — the second-witness receipt.
 *
 * Three sibling-voice audits today gate on two parallel axes — Δh on the
 * HSL wheel, ΔE in OKLab perceptual space. The architecture argument is
 * that ΔE catches a failure mode the wheel cannot see: a chroma collapse
 * leaves Δh roughly unchanged but pushes two voices to within a few ΔE
 * units of each other on a real screen. This test proves it on a fixture.
 *
 * **The experiment.** We knock `BRAND.accentViolet` chroma ~30 % in a
 * synthetic palette (HSL: same hue, saturation × 0.7, same lightness —
 * `#dc6cff` → `#d082e9`). Then we run the kernel's `worstPair` and
 * `worstPerceptualPair` over each of the three audits' surface paint
 * sets. The receipt:
 *
 *   • Every Δh worst-case stays ≥ its audit's floor (the wheel says "fine").
 *   • At least one ΔE worst-case drops below its audit's floor (the
 *     eyeball says "those are the same pill twice").
 *
 * Without ΔE in the gate, the chroma knock above ships green. With ΔE
 * in the gate, it ships red. That delta is the entire engineering case
 * for promoting `oklchDeltaE` from a REPL helper to a binding gate
 * (Mike napkin #131 POI #4, Tanya UX #37 §2, Elon §3).
 *
 * **No production code touched.** This is fixture-only — a synthetic
 * palette object and the kernel's pure projections. The real palette,
 * `BRAND` from `lib/design/color-constants.ts`, is unchanged. The four
 * floor numbers (`HUE_FLOOR_DEG_*`, `OKLAB_FLOOR_DE_*`) are mirrored
 * from the audit files because the test asserts the *gate's behavior*,
 * not the audit's number — duplication is the receipt that the floor
 * defended in each audit's docblock is the floor this fixture probes.
 *
 * Pure Jest. No DOM, no Canvas. Numbers, not adjectives.
 *
 * Credits: Mike K. (napkin #131 POI #4 — the mutation test as the
 * "second witness earns its keep" receipt; the chroma-knock fixture
 * shape; the loop-over-three-callers assertion); Elon M. (§3 — the
 * defended-floor doctrine that says the floor must be probed by a
 * fixture, not eyeballed); Tanya D. (UX #37 §2.A — *Customer A, the
 * silent reader* — the reader-language reason the gate exists, the
 * "low-chroma collapse" story); Krystle C. (the rule-of-three trigger
 * reading that landed the third caller and made this test's loop
 * non-empty); Björn Ottosson (OKLab — the only ruler on this list
 * calibrated against actual human perception data).
 */

import { BRAND } from '../color-constants';
import { hexToHsl } from '../hue';
import {
  type FamilyHex,
  worstPair,
  worstPerceptualPair,
} from '../hue-distance';

// ─── Floors mirrored from the three audit files (the gate's contract) ────

const HUE_FLOOR_DEG_ARCHETYPE = 15;
const HUE_FLOOR_DEG_WORLDVIEW = 45;
const HUE_FLOOR_DEG_TEXTLINK  = 45;

const OKLAB_FLOOR_DE_ARCHETYPE = 6;
const OKLAB_FLOOR_DE_WORLDVIEW = 10;
const OKLAB_FLOOR_DE_TEXTLINK  = 10;

// ─── Fixture — chroma-knocked accentViolet, real other voices ────────────

/**
 * `#rrggbb` for an HSL triple (h ∈ [0, 360), s, l ∈ [0, 1]). Pure, ≤ 10 LOC.
 * Inline (not in the kernel) because the project's only HSL-→hex caller is
 * this fixture; promotion to `lib/design/hue.ts` is rule-of-three deferred.
 */
function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60  ? [c, x, 0] : h < 120 ? [x, c, 0] :
    h < 180 ? [0, c, x] : h < 240 ? [0, x, c] :
    h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Hex with saturation scaled by `factor`, hue and lightness preserved. Pure. */
function knockChroma(hex: string, factor: number): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex(h, s * factor, l);
}

/**
 * The chroma-knocked fixture palette — `accentViolet` saturation × 0.7,
 * everything else identical to live `BRAND`. The 30 % knock is the
 * "low-chroma collapse" failure mode Tanya UX #37 §2.A names: a
 * desaturation that leaves the wheel approximately quiet (Δh shifts
 * by < 1°) but flattens perceptual distance.
 */
const FIXTURE_BRAND: FamilyHex = {
  cyan:      BRAND.cyan,
  rose:      BRAND.rose,
  amber:     BRAND.amber,
  gold:      BRAND.gold,
  secondary: BRAND.secondary,
  // The mutation: paler violet, same hue, ~30 % chroma drop.
  accent:    knockChroma(BRAND.accentViolet, 0.7),
};

// ─── Caller-floor pairs — the three audits the gate covers ───────────────

interface AuditCase {
  readonly name: string;
  readonly families: readonly string[];
  readonly hueFloor: number;
  readonly deFloor: number;
}

const AUDITS: readonly AuditCase[] = [
  {
    name: 'archetype-chip',
    families: ['cyan', 'accent', 'secondary', 'rose', 'amber'],
    hueFloor: HUE_FLOOR_DEG_ARCHETYPE,
    deFloor:  OKLAB_FLOOR_DE_ARCHETYPE,
  },
  {
    name: 'worldview-chip',
    families: ['accent', 'cyan', 'rose'],
    hueFloor: HUE_FLOOR_DEG_WORLDVIEW,
    deFloor:  OKLAB_FLOOR_DE_WORLDVIEW,
  },
  {
    name: 'textlink-passage',
    families: ['accent', 'gold', 'rose'],
    hueFloor: HUE_FLOOR_DEG_TEXTLINK,
    deFloor:  OKLAB_FLOOR_DE_TEXTLINK,
  },
];

// ─── 1 · The chroma knock leaves Δh quiet (the wheel cannot see it) ──────

describe('sibling-voice-perceptual-mutation · Δh stays green under the knock', () => {
  for (const audit of AUDITS) {
    it(`${audit.name}: worst Δh ≥ ${audit.hueFloor}° (the wheel says fine)`, () => {
      const { dh } = worstPair(audit.families, FIXTURE_BRAND);
      expect(dh).toBeGreaterThanOrEqual(audit.hueFloor);
    });
  }
});

// ─── 2 · ΔE catches the knock somewhere — the second witness earns its keep ─

describe('sibling-voice-perceptual-mutation · ≥ 1 ΔE goes red under the knock', () => {
  it('at least one of the three audits fails its ΔE floor', () => {
    const reds = AUDITS.filter(
      (a) => worstPerceptualPair(a.families, FIXTURE_BRAND).dE < a.deFloor,
    );
    expect(reds.length).toBeGreaterThanOrEqual(1);
  });

  it('archetype-chip is the audit that goes red (sibling-violet pair collapses)', () => {
    // The fixture is calibrated against Mike POI #4: `accent ↔ secondary` is
    // the sibling-violet pair, and a chroma knock to `accentViolet` collapses
    // its ΔE first. Cross-family pairs on the other two audits stay green.
    const { dE } = worstPerceptualPair(AUDITS[0].families, FIXTURE_BRAND);
    expect(dE).toBeLessThan(OKLAB_FLOOR_DE_ARCHETYPE);
  });
});

// ─── 3 · Receipt — the dual-axis worst-case for every audit, in stdout ───

describe('sibling-voice-perceptual-mutation · receipt (numbers, not adjectives)', () => {
  it('logs the chroma-knocked accentViolet hex (fixture provenance)', () => {
    // eslint-disable-next-line no-console
    console.log(
      `[mutation-fixture] accentViolet ${BRAND.accentViolet} → ${FIXTURE_BRAND.accent}`
        + ' (saturation × 0.7, hue + lightness preserved)',
    );
    expect(/^#[0-9a-f]{6}$/i.test(FIXTURE_BRAND.accent)).toBe(true);
  });

  it.each(AUDITS.map((a) => [a.name, a]))(
    '%s · worst Δh and ΔE under the knock',
    (_name: string, audit: AuditCase) => {
      const dh = worstPair(audit.families, FIXTURE_BRAND);
      const de = worstPerceptualPair(audit.families, FIXTURE_BRAND);
      // eslint-disable-next-line no-console
      console.log(
        `[mutation] ${audit.name} · Δh ${dh.dh.toFixed(2)}° at ${dh.pair}`
          + ` (floor ${audit.hueFloor}°) · ΔE ${de.dE.toFixed(2)} at ${de.pair}`
          + ` (floor ${audit.deFloor})`,
      );
      // No assertion — this row exists for the receipt log only. The §1 + §2
      // assertions above are the binding gates; this section is documentation.
      expect(typeof dh.dh).toBe('number');
      expect(typeof de.dE).toBe('number');
    },
  );
});
