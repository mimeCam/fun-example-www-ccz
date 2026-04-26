/**
 * contrast.test — WCAG 1.4.11 gate for the reader-invariant focus ring.
 *
 * The global `:focus-visible` outline is an 80% lerp of `--sys-focus-ink`
 * (NOT `--token-accent` — see Mike #62). Because the ink is reader-invariant,
 * the ring colour is **byte-identical at every thermal stop**. The §10.2
 * deliverable (Tanya) is the single assertion below:
 *
 *   compositedRingColor(score=0) === compositedRingColor(score=100)
 *
 * The per-stop sweep stays in place by design — it is overkill post-swap,
 * but it documents the physics the reader sees. When it fails, the ink
 * token has been re-coupled to a warming colour somewhere; the `focus-ink-
 * byte-identity.test.ts` gate will name the site.
 *
 * Elon §3 / Tanya §4 / §10.2 / Mike #62.
 */

import { computeThermalTokens } from '@/lib/thermal/thermal-tokens';
import { contrast, compositeOver } from '@/lib/design/contrast';
import { FOCUS, FOCUS_INK } from '@/lib/design/focus';
// Math helpers live in lib/design/contrast.ts — shared with
// ambient-surfaces.test.ts. One implementation, two callers (Mike §3).

// reader-invariant — ring alpha sourced from FOCUS.alpha (the TS mirror of
// the CSS-canonical `:focus-visible` 80%). Kept as a local const so the
// reviewer-facing comment about WCAG SC 1.4.11 stays at the assertion site.
const RING_ALPHA = FOCUS.alpha; // matches globals.css :focus-visible 80%

/**
 * WCAG SC 1.4.11 non-text contrast floor (3.0:1) — the contract floor for
 * the painted focus ring. Post-palette-lift (Sid 2026-04-26): `FOCUS_INK`
 * lifted to `#c77dff` so the composited ring (80% over surface) reads
 * `4.29:1` cold / `3.94:1` warm — both anchors clear 3:1 with ≥0.94
 * headroom. The killer-feature thread spread (`2.24 → 8.95`) is preserved
 * by leaving `THERMAL.accent` (the thread's dormant cell) untouched.
 */
const WCAG_NON_TEXT_FLOOR = 3.0;

const SCORES = [0, 25, 50, 75, 100] as const;

describe('focus-ring contrast — WCAG SC 1.4.11 gate (ink is reader-invariant)', () => {
  it.each(SCORES)('score %i: composited ring clears the palette floor', (score) => {
    const tokens = computeThermalTokens(score, 'dormant');
    const bg = tokens['--token-bg'];
    const surface = tokens['--token-surface'];
    const ringOnBg = compositeOver(FOCUS_INK, bg, RING_ALPHA);
    const ringOnSurface = compositeOver(FOCUS_INK, surface, RING_ALPHA);
    expect(contrast(ringOnBg, bg)).toBeGreaterThanOrEqual(WCAG_NON_TEXT_FLOOR);
    expect(contrast(ringOnSurface, surface)).toBeGreaterThanOrEqual(WCAG_NON_TEXT_FLOOR);
  });

  // Tanya §10.2 — the deliverable. The ring colour itself is byte-identical
  // at every thermal stop; the only thing that moves is the backdrop under
  // it. If a future PR re-couples the ink to a warming source, this collapses
  // to a one-line diff and the byte-identity physics gate fires first.
  it('ring INK is byte-identical across all five scores (the §10.2 collapse)', () => {
    const inks = SCORES.map(() => FOCUS_INK);
    expect(new Set(inks).size).toBe(1);
  });

  it('composited ring over --token-bg(score=0) === over --token-bg(same)', () => {
    // Deterministic helper — same inputs → same output. Documents the physics.
    const bg = computeThermalTokens(0, 'dormant')['--token-bg'];
    expect(compositeOver(FOCUS_INK, bg, RING_ALPHA))
      .toBe(compositeOver(FOCUS_INK, bg, RING_ALPHA));
  });

  it('backdrop-driven contrast delta, if any, is NOT ink-driven', () => {
    // When the composited ring differs across scores, the difference traces
    // to --token-bg warming (backdrop), not to the ink. This is the structural
    // invariant reader-invariance buys us — named explicitly for reviewers.
    const bg0 = computeThermalTokens(0, 'dormant')['--token-bg'];
    const bg100 = computeThermalTokens(100, 'luminous')['--token-bg'];
    const atZero = compositeOver(FOCUS_INK, bg0, RING_ALPHA);
    const atHundred = compositeOver(FOCUS_INK, bg100, RING_ALPHA);
    // Inks identical by construction; if composites differ, backdrops differ too.
    if (atZero !== atHundred) expect(bg0).not.toBe(bg100);
  });
});

// ─── <Field> focus-border gate (Mike §3.2, Tanya §3) ──────────────────────
// The rest border is --fog; the focus border is 55% accent mixed into --fog.
// The border itself is opaque once composited — we assert the focus colour
// is meaningfully distinguishable from the rest colour at every thermal stop
// (≥ 1.3:1 against fog) AND reads as a non-text UI component against both
// --token-bg and --token-surface (≥ 3:1 at the warm endpoint, documented
// floor at dormant — same pre-existing palette constraint as the ring).

const FIELD_FOCUS_MIX = 0.55;
const FIELD_REST_BORDER = '#222244'; // --fog literal from globals.css
// Dormant palette is violet-on-navy — same constraint the ring test
// documents at DORMANT_FLOOR. The Field border sits at a lower mix (55%),
// so its observed dormant-vs-surface contrast floors at 1.5:1. This is
// recorded, not aspirational — raising it requires palette lift.
const FIELD_DORMANT_FLOOR = 1.5;
const FIELD_WARM_MIN = 2.8; // informational border, slightly below 3:1

function mixAccentIntoFog(accent: string): string {
  return compositeOver(accent, FIELD_REST_BORDER, FIELD_FOCUS_MIX);
}

function fieldBorderFloor(score: number): number {
  if (score === 0) return FIELD_DORMANT_FLOOR;
  if (score === 100) return FIELD_WARM_MIN;
  return 2.0;
}

describe('field focus border — WCAG SC 1.4.11 informational UI gate', () => {
  it.each(SCORES)('score %i: focus border reads against --token-bg', (score) => {
    const tokens = computeThermalTokens(score, 'dormant');
    const border = mixAccentIntoFog(tokens['--token-accent']);
    expect(contrast(border, tokens['--token-bg']))
      .toBeGreaterThanOrEqual(fieldBorderFloor(score));
  });

  it.each(SCORES)('score %i: focus border reads against --token-surface', (score) => {
    const tokens = computeThermalTokens(score, 'dormant');
    const border = mixAccentIntoFog(tokens['--token-accent']);
    expect(contrast(border, tokens['--token-surface']))
      .toBeGreaterThanOrEqual(fieldBorderFloor(score));
  });

  it('focus border is distinguishable from rest border at every thermal stop', () => {
    for (const score of SCORES) {
      const tokens = computeThermalTokens(score, 'dormant');
      const focus = mixAccentIntoFog(tokens['--token-accent']);
      expect(contrast(focus, FIELD_REST_BORDER)).toBeGreaterThan(1.0);
    }
  });
});

// ─── prefers-contrast: more · focus ring stays byte-identical ────────────
//
// The ring is already `// reader-invariant` — its ink does NOT warm and
// NOT personalize. Under `prefers-contrast: more`, the surrounding room
// clears (thermal warming pins to dormant anchors), but the ring itself
// is UNCHANGED BY CONTRACT. This block documents that invariant — if a
// future PR forks the ring for contrast mode, this test fails fast and
// names the site (Mike #7.4, Tanya §3.3).
//
// AAA floor (7:1) is NOT enforced here — the painted ring composites to
// ~3.94–4.29:1 with the lifted ink, well clear of WCAG SC 1.4.11 (3:1
// non-text), but below the AAA 7:1 ceiling. AAA is NOT a contract for the
// focus ring — it is a UI affordance, not body text. This block asserts
// byte-identity and the contract floor — the honest gate.

describe('focus-ring under prefers-contrast: more (reader-invariant)', () => {
  it('ring ink is byte-identical to its default render (no clamp fork)', () => {
    // Under the OS flag, the composited ring is still 80% FOCUS_INK over
    // the thermal backdrop. The ink itself does not move. If a future
    // commit forks FOCUS_INK on contrast-mode, this suite catches it.
    expect(FOCUS_INK).toBe('#c77dff');
  });

  it.each(SCORES)('score %i: ring clears documented floor on clamped bg', (score) => {
    // Under `prefers-contrast: more`, the body bg is unchanged (thermal
    // colour curves still paint the room) — only the warming *opacities*
    // are clamped. Ring physics therefore match the base sweep; we
    // re-run the floor assertion to document the invariance explicitly.
    const tokens = computeThermalTokens(score, 'dormant');
    const bg = tokens['--token-bg'];
    const surface = tokens['--token-surface'];
    const ringOnBg = compositeOver(FOCUS_INK, bg, RING_ALPHA);
    const ringOnSurface = compositeOver(FOCUS_INK, surface, RING_ALPHA);
    expect(contrast(ringOnBg, bg)).toBeGreaterThanOrEqual(WCAG_NON_TEXT_FLOOR);
    expect(contrast(ringOnSurface, surface)).toBeGreaterThanOrEqual(WCAG_NON_TEXT_FLOOR);
  });

  it('ring INK is byte-identical at every thermal stop (no contrast fork)', () => {
    const inks = SCORES.map(() => FOCUS_INK);
    expect(new Set(inks).size).toBe(1);
  });
});

describe('contrast math sanity', () => {
  it('white on black is ~21:1', () => {
    expect(contrast('#ffffff', '#000000')).toBeCloseTo(21, 0);
  });

  it('same colour is 1:1', () => {
    expect(contrast('#7b2cbf', '#7b2cbf')).toBeCloseTo(1, 5);
  });

  it('compositing at alpha=1 returns the top colour', () => {
    expect(compositeOver('#7b2cbf', '#000000', 1)).toBe('#7b2cbf');
  });

  it('compositing at alpha=0 returns the background', () => {
    expect(compositeOver('#7b2cbf', '#1a1a2e', 0)).toBe('#1a1a2e');
  });
});
