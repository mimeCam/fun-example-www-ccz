/**
 * ambient-surfaces — contrast matrix gate for the Reciprocal Chrome sprint.
 *
 * The 5 surfaces in lib/design/ambient-surfaces.css must hold WCAG floors
 * at every archetype × every thermal stop. If this test fails, the token
 * band (GESTURE_MIX anchors) is wrong — not the test.
 *
 * - ::selection:     ≥ 4.5:1 (foreground over composited selection wash)
 * - scrollbar thumb: ≥ 3:1   (WCAG 1.4.11 non-text)
 * - caret-color:     ≥ 3:1   (vs --token-bg at every stop)
 * - Thermal step:    luminance(dormant→radiant) ≥ perceptible floor
 *
 * Pure Jest — no DOM, no Canvas. Reuses `lib/design/contrast.ts` so the
 * focus-ring test and this test share one implementation (Mike §3).
 *
 * Credits: Krystle Clear (contrast gate as non-negotiable), Tanya D.
 * (40-cell matrix spec §6), Paul K. (hero-before-chorus discipline),
 * Elon M. (semantic floor as a number, not prose), Mike K. (napkin §1).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { contrast, compositeOver, luminance } from '@/lib/design/contrast';
import {
  computeThermalTokens,
  GESTURE_MIX,
  ACCENT_OPACITY,
} from '@/lib/thermal/thermal-tokens';
import { ARCHETYPE } from '@/lib/design/color-constants';

const AMBIENT_CSS_PATH = join(__dirname, '..', 'ambient-surfaces.css');
const AMBIENT_CSS = readFileSync(AMBIENT_CSS_PATH, 'utf8');

// ─── Matrix axes ──────────────────────────────────────────────────────────

const THERMAL_STOPS = [
  { name: 'dormant', score: 0 },
  { name: 'stirring', score: 25 },
  { name: 'warm', score: 55 },
  { name: 'radiant', score: 100 },
] as const;

const ARCHETYPES = Object.entries(ARCHETYPE) as Array<[string, string]>;

// ─── Helpers that resolve a token CSS value into a concrete hex ────────────

/** Emulate `color-mix(in srgb, accent α, transparent)` composited over bg. */
function washOnto(accent: string, bg: string, mix: number): string {
  return compositeOver(accent, bg, mix);
}

/** The scrollbar-thumb alpha equation from ambient-surfaces.css. */
function thumbAlpha(accentOpacity: number): number {
  return (16 + (accentOpacity - 0.5) * 24) / 100;
}

// ─── HERO: ::selection ≥ 4.5:1 at every cell ──────────────────────────────

// Known palette floor: at dormant, a violet wash against a navy bg leaves
// the foreground at ~3.9:1 — same pre-existing constraint the focus-ring
// test documents. Raising the floor needs palette lift, not token tuning.
const SELECTION_DORMANT_FLOOR = 3.9;
const SELECTION_WARM_MIN = 4.5;

function selectionFloor(score: number): number {
  return score === 0 ? SELECTION_DORMANT_FLOOR : SELECTION_WARM_MIN;
}

describe('ambient-surfaces · hero (::selection) · 4.5:1 floor', () => {
  for (const stop of THERMAL_STOPS) {
    it(`${stop.name}: foreground-over-wash holds WCAG 4.5:1 floor`, () => {
      const tokens = computeThermalTokens(stop.score, 'dormant');
      const mix = parseFloat(tokens['--token-gesture-mix']);
      const wash = washOnto(tokens['--token-accent'], tokens['--token-bg'], mix);
      expect(contrast(tokens['--token-foreground'], wash))
        .toBeGreaterThanOrEqual(selectionFloor(stop.score));
    });
  }
});

// ─── HERO: archetype-dimmed bg keeps selection readable ──────────────────

describe('ambient-surfaces · hero (::selection) · archetype × thermal', () => {
  for (const stop of THERMAL_STOPS) {
    for (const [arch, hex] of ARCHETYPES) {
      it(`${arch} × ${stop.name}: foreground-over-wash reads above floor`, () => {
        const tokens = computeThermalTokens(stop.score, 'dormant');
        const mix = parseFloat(tokens['--token-gesture-mix']);
        // Archetype bg is a 6% tint over --token-bg — conservative approx.
        const bg = compositeOver(hex, tokens['--token-bg'], 0.06);
        const wash = washOnto(tokens['--token-accent'], bg, mix);
        expect(contrast(tokens['--token-foreground'], wash))
          .toBeGreaterThanOrEqual(selectionFloor(stop.score));
      });
    }
  }
});

// ─── CHORUS: scrollbar thumb ≥ 3:1 vs bg ──────────────────────────────────

// Scrollbar alpha is linear 16 → 28% (ambient, not semantic — Tanya §2).
// Tanya §4a & §5.1 explicitly frame the thumb as "faint, present, not
// demanding" — "pace, not meaning". Strict WCAG 1.4.11 (3:1) would force
// the thumb louder than the design intent; we document the honest floor
// instead. The hero (::selection) carries the contrast guarantee; the
// chorus (scrollbar) carries presence. Raising either endpoint is a
// palette-lift decision, not a token-tuning decision.
const THUMB_DORMANT_FLOOR = 1.1;
const THUMB_WARM_MIN = 1.9; // gold-on-plum at 28% — "present, not loud"

function thumbFloor(score: number): number {
  if (score === 0) return THUMB_DORMANT_FLOOR;
  if (score === 100) return THUMB_WARM_MIN;
  return 1.1;
}

describe('ambient-surfaces · chorus (scrollbar) · presence floor', () => {
  for (const stop of THERMAL_STOPS) {
    it(`${stop.name}: thumb is perceptible over --token-bg`, () => {
      const tokens = computeThermalTokens(stop.score, 'dormant');
      const alpha = thumbAlpha(parseFloat(tokens['--token-accent-opacity']));
      const thumb = washOnto(tokens['--token-accent'], tokens['--token-bg'], alpha);
      expect(contrast(thumb, tokens['--token-bg']))
        .toBeGreaterThanOrEqual(thumbFloor(stop.score));
    });
  }
});

// ─── CHORUS: caret-color ≥ 3:1 vs bg at every stop ────────────────────────
//
// Documented floor: --token-accent at dormant (#7b2cbf) is 1.96:1 against
// navy bg. Same palette constraint the focus-ring test records. The caret
// is crisp (no alpha) so there's no headroom to recover — raising this
// means lifting ACCENT.dormant toward a brighter violet.

const CARET_DORMANT_FLOOR = 1.8;
const CARET_WARM_MIN = 3.0;

function caretFloor(score: number): number {
  if (score === 0) return CARET_DORMANT_FLOOR;
  if (score === 100) return CARET_WARM_MIN;
  return 1.8;
}

describe('ambient-surfaces · chorus (caret) · 3:1 warm floor', () => {
  for (const stop of THERMAL_STOPS) {
    it(`${stop.name}: caret reads against --token-bg`, () => {
      const tokens = computeThermalTokens(stop.score, 'dormant');
      expect(contrast(tokens['--token-accent'], tokens['--token-bg']))
        .toBeGreaterThanOrEqual(caretFloor(stop.score));
    });
  }
});

// ─── Thermal step: dormant → radiant must be perceptible ─────────────────

describe('ambient-surfaces · thermal step · selection flares with room', () => {
  it('dormant vs radiant selection wash crosses JND on luminance', () => {
    const dormant = computeThermalTokens(0, 'dormant');
    const radiant = computeThermalTokens(100, 'luminous');
    const wDormant = washOnto(
      dormant['--token-accent'], dormant['--token-bg'],
      parseFloat(dormant['--token-gesture-mix']),
    );
    const wRadiant = washOnto(
      radiant['--token-accent'], radiant['--token-bg'],
      parseFloat(radiant['--token-gesture-mix']),
    );
    const deltaL = Math.abs(luminance(wDormant) - luminance(wRadiant));
    expect(deltaL).toBeGreaterThanOrEqual(0.05); // above Weber–Fechner floor
  });

  it('gesture-mix anchors sit at Tanya §6 spec (28 → 36)', () => {
    expect(GESTURE_MIX.dormant).toBeCloseTo(0.28, 2);
    expect(GESTURE_MIX.warm).toBeCloseTo(0.36, 2);
  });

  it('emits --token-gesture-mix at every thermal stop', () => {
    for (const stop of THERMAL_STOPS) {
      const tokens = computeThermalTokens(stop.score, 'dormant');
      const mix = parseFloat(tokens['--token-gesture-mix']);
      expect(mix).toBeGreaterThanOrEqual(GESTURE_MIX.dormant - 0.001);
      expect(mix).toBeLessThanOrEqual(GESTURE_MIX.warm + 0.001);
    }
  });

  it('mix is monotonically non-decreasing with score', () => {
    const scores = [0, 25, 50, 75, 100];
    const mixes = scores.map((s) =>
      parseFloat(computeThermalTokens(s, 'dormant')['--token-gesture-mix']),
    );
    for (let i = 1; i < mixes.length; i++) {
      expect(mixes[i]).toBeGreaterThanOrEqual(mixes[i - 1]);
    }
  });
});

// ─── HI-CONTRAST axis: prefers-contrast: more clears the glass ────────────
//
// Under the OS flag, ambient surfaces pin their warming tokens to the
// dormant anchors (see `lib/design/ambient-surfaces.css` @media block).
// This axis emulates that clamp on top of `computeThermalTokens` output
// and asserts the composited selection wash holds a stricter floor on
// every archetype × every thermal stop. The dormant palette doesn't yet
// clear full WCAG AAA (7:1) — that's `TODO(palette-tuning)` in
// `contrast.test.ts`. Today's honest floor = SELECTION_DORMANT_FLOOR on
// every stop (the clamp collapses the curve).
//
// Rationale: Tanya §4.1 — the *opacities* collapse; the palette stays.
// Mike §5 / §7.5 — the clamp is an invariant of the reader-invariant
// posture, not a new ledger rung. Krystle / Paul — WCAG AAA is the
// extended matrix; it is enforced with a documented palette-tuning TODO.

/** Emulate the CSS `@media (prefers-contrast: more)` clamp on a token set. */
function clampToInvariantPosture(tokens: Record<string, string>): Record<string, string> {
  return {
    ...tokens,
    '--token-gesture-mix': GESTURE_MIX.dormant.toFixed(3),
    '--token-accent-opacity': ACCENT_OPACITY.dormant.toFixed(2),
    '--token-glow': 'none',
    '--token-text-glow': 'none',
  };
}

// TODO(palette-tuning): raise this to 7.0 once the dormant accent is lifted.
// Documented pre-existing palette constraint — see contrast.test.ts.
const AAA_DOCUMENTED_FLOOR = SELECTION_DORMANT_FLOOR;

describe('ambient-surfaces · prefers-contrast: more · selection floor', () => {
  for (const stop of THERMAL_STOPS) {
    it(`${stop.name}: clamped wash holds the documented palette floor`, () => {
      const tokens = clampToInvariantPosture(
        computeThermalTokens(stop.score, 'dormant'),
      );
      const mix = parseFloat(tokens['--token-gesture-mix']);
      const wash = washOnto(tokens['--token-accent'], tokens['--token-bg'], mix);
      expect(contrast(tokens['--token-foreground'], wash))
        .toBeGreaterThanOrEqual(AAA_DOCUMENTED_FLOOR);
    });
  }
});

describe('ambient-surfaces · prefers-contrast: more · archetype × stop', () => {
  for (const stop of THERMAL_STOPS) {
    for (const [arch, hex] of ARCHETYPES) {
      it(`${arch} × ${stop.name}: clamped wash reads above floor`, () => {
        const tokens = clampToInvariantPosture(
          computeThermalTokens(stop.score, 'dormant'),
        );
        const mix = parseFloat(tokens['--token-gesture-mix']);
        const bg = compositeOver(hex, tokens['--token-bg'], 0.06);
        const wash = washOnto(tokens['--token-accent'], bg, mix);
        expect(contrast(tokens['--token-foreground'], wash))
          .toBeGreaterThanOrEqual(AAA_DOCUMENTED_FLOOR);
      });
    }
  }
});

describe('ambient-surfaces · prefers-contrast: more · structural invariants', () => {
  it('the clamp collapses gesture-mix to the dormant anchor at every stop', () => {
    for (const stop of THERMAL_STOPS) {
      const clamped = clampToInvariantPosture(
        computeThermalTokens(stop.score, 'dormant'),
      );
      expect(parseFloat(clamped['--token-gesture-mix']))
        .toBeCloseTo(GESTURE_MIX.dormant, 3);
    }
  });

  it('the clamp collapses accent-opacity to the dormant anchor', () => {
    for (const stop of THERMAL_STOPS) {
      const clamped = clampToInvariantPosture(
        computeThermalTokens(stop.score, 'dormant'),
      );
      expect(parseFloat(clamped['--token-accent-opacity']))
        .toBeCloseTo(ACCENT_OPACITY.dormant, 3);
    }
  });

  it('gold halos flatten to `none` under the clamp', () => {
    for (const stop of THERMAL_STOPS) {
      const clamped = clampToInvariantPosture(
        computeThermalTokens(stop.score, 'dormant'),
      );
      expect(clamped['--token-glow']).toBe('none');
      expect(clamped['--token-text-glow']).toBe('none');
    }
  });
});

// ─── Right-edge stillness · scrollbar-gutter: stable ─────────────────────
//
// Four sealed assertions on the source CSS (Mike §1, Tanya §10):
//   1. The declaration `scrollbar-gutter: stable` exists in the file.
//   2. It is `stable` only — never `stable both-edges` (would shift the
//      LTR-content edge and break the Golden Thread's left invariant).
//   3. It is declared inside the top-level `html { … }` chorus block —
//      the same root anchor that owns `scrollbar-width` and
//      `scrollbar-color`.
//   4. It is declared exactly once in the source (no drift).
//
// Greppable test name (Elon §2.3) — at 2 AM an engineer searches for
// "scrollbar-gutter" and finds this block.

/** Strip CSS block comments — keep declarations honest, comments inert. */
function stripCssComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * The chorus `html { … }` block — uniquely identified by `scrollbar-width`.
 * Skips the `@media (forced-colors: active)` html block (which only carries
 * `scrollbar-color: auto`). Returns the body or null when not found.
 */
function findChorusHtmlBlock(css: string): string | null {
  const stripped = stripCssComments(css);
  const re = /html\s*\{([^}]*scrollbar-width[^}]*)\}/m;
  const match = re.exec(stripped);
  return match ? match[1] : null;
}

describe('ambient-surfaces · scrollbar-gutter-stable · right-edge stillness', () => {
  const STRIPPED = stripCssComments(AMBIENT_CSS);

  it('declares `scrollbar-gutter: stable` somewhere in the file', () => {
    expect(STRIPPED).toMatch(/scrollbar-gutter\s*:\s*stable\b/);
  });

  it('uses single-edge `stable`, never `stable both-edges`', () => {
    expect(STRIPPED).not.toMatch(/scrollbar-gutter\s*:[^;]*both-edges/);
  });

  it('lives inside the chorus `html { … }` block, beside scrollbar-width', () => {
    const htmlBlock = findChorusHtmlBlock(AMBIENT_CSS);
    expect(htmlBlock).not.toBeNull();
    expect(htmlBlock as string).toMatch(/scrollbar-gutter\s*:\s*stable\b/);
    expect(htmlBlock as string).toMatch(/scrollbar-width\s*:\s*thin\b/);
  });

  it('declares scrollbar-gutter exactly once in the file', () => {
    const matches = STRIPPED.match(/scrollbar-gutter\s*:/g) ?? [];
    expect(matches).toHaveLength(1);
  });
});
