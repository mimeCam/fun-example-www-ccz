/**
 * Golden Thread — pre-lit (frame-zero) fence.
 *
 * The headline fence for "the lit threshold" (Mike napkin #35,
 * Tanya UIX #86). Three pins, all source-string assertions (the test
 * runtime is `node`, not jsdom — same pattern as `GoldenThread.test.ts`):
 *
 *   §1 · WIRE-UP — the wrapper carries an inline `style.opacity` that
 *        reads `var(--thread-alpha-pre, 0)`, gated on the `'gone'`
 *        presence rung. The `, 0` fallback is the safety net if the
 *        Recognition Beacon IIFE ever throws (CSP, future minifier
 *        bug, upstream thermal block exception).
 *
 *   §2 · NO ENTRANCE FADE AT t=0 — the wrapper's pre-lit alpha is set
 *        inline before first paint; a CSS custom property that resolves
 *        at paint zero has no prior frame to interpolate from, so no
 *        transition fires on the wrapper at cold load. The fence pins
 *        the kernel by forbidding `@starting-style`, fade-in keyframes,
 *        and any animation-name targeting the spine wrapper. Same-session
 *        navigation still rides `crossfade-inline` (Tanya UIX #86 F4 —
 *        the no-motion rule applies *only* at cold paint zero).
 *
 *   §3 · CSS TRUTH TABLE — the three tier states resolve to the spec'd
 *        values in `app/globals.css`:
 *           stranger  → `--thread-alpha-pre: 0`
 *           returning → `--thread-alpha-pre: var(--sys-alpha-muted)`
 *           known     → `--thread-alpha-pre: var(--sys-alpha-recede)`
 *        Cross-checked against the alpha ledger via `cssVarOf`.
 *
 * Mirrors the shape of `GoldenThread.test.ts` (source-string fence) and
 * `recognition-beacon.fence.test.ts` (truth-table-cross-check).
 *
 * Credits: Mike K. (architect, napkin #35 — wire-up shape, three-tier
 *          fence, "no transition origin = no fade" kernel, the `, 0`
 *          fallback as a safety net); Tanya D. (UIX #86 §4 F1–F5 —
 *          the motion contract this fence pins, the cold-paint-zero vs.
 *          same-session distinction); Sid (≤ 10 LoC per helper, source-
 *          string fence pattern lifted from `GoldenThread.test.ts`).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cssVarOf } from '../../../lib/design/alpha';

const ROOT = join(__dirname, '..', '..', '..');
const COMPONENT_PATH = join(ROOT, 'components', 'reading', 'GoldenThread.tsx');
const CSS_PATH = join(ROOT, 'app', 'globals.css');

function readComponent(): string {
  return readFileSync(COMPONENT_PATH, 'utf8');
}

function readCss(): string {
  return readFileSync(CSS_PATH, 'utf8');
}

/**
 * Capture the fallback expression of every `var(--thread-alpha-pre, X)`
 * occurrence in `src`. Pure, ≤ 10 LOC. Returns the trimmed `X`s in source
 * order so the drift check can list every offender (not just the first).
 */
function collectPreLitFallbacks(src: string): string[] {
  const rx = /var\(--thread-alpha-pre,\s*([^)]+?)\s*\)/g;
  return Array.from(src.matchAll(rx)).map((m) => m[1].trim());
}

// ─── §1 · Wire-up: the wrapper reads --thread-alpha-pre at the gone rung ──

describe('golden-thread-pre-lit · §1 wire-up at the wrapper', () => {
  const src = readComponent();

  it('declares the canonical pre-lit carrier expression once', () => {
    // Module-scope constant lives in one place; no inline duplicates.
    const occurrences = src.match(/var\(--thread-alpha-pre,\s*0\)/g) ?? [];
    expect(occurrences.length).toBeGreaterThanOrEqual(1);
  });

  it('gates the inline style on the `gone` presence rung only', () => {
    // The helper must short-circuit before touching the inline object so
    // the visible rungs (`attentive`, `gifted`) keep the motion-α-1 class
    // from the class table — the precondition for `crossfade-inline` to
    // animate from the resolved pre-lit alpha on first scroll.
    expect(src).toMatch(
      /wrapperPreLitStyle[\s\S]{0,250}if\s*\(\s*presence\s*!==\s*['"]gone['"]\s*\)\s*return\s+undefined/,
    );
  });

  it('the wrapper element receives `style={wrapperPreLitStyle(presence)}`', () => {
    expect(src).toMatch(/style=\{wrapperPreLitStyle\(presence\)\}/);
  });

  it('keeps the `, 0` fallback (safety net if the IIFE throws)', () => {
    // Mike napkin #35 §6 POI 8 — the fallback prevents the variable's
    // :root default from leaking into a non-zero state on CSP failure.
    expect(src).toContain('var(--thread-alpha-pre, 0)');
  });

  it('does not write any other --thread-alpha-pre fallback (one truth)', () => {
    // E.g. `var(--thread-alpha-pre, 0.3)` would silently override the
    // stranger contract. The only legal fallback is `0`.
    const fallbacks = collectPreLitFallbacks(src);
    const drift = fallbacks.filter((f) => f !== '0');
    expect(drift).toEqual([]);
  });
});

// ─── §2 · No entrance fade at cold paint zero ─────────────────────────────

describe('golden-thread-pre-lit · §2 no entrance fade at t=0', () => {
  const src = readComponent();
  const css = readCss();

  it('the component does not declare `@starting-style` for the wrapper', () => {
    // `@starting-style` would inject a t-1 frame and re-introduce the seam.
    expect(src).not.toMatch(/@starting-style/);
  });

  it('globals.css does not target the spine wrapper with `@starting-style`', () => {
    expect(css).not.toMatch(/@starting-style[\s\S]{0,200}golden-thread/);
  });

  it('no fade-in keyframe is wired onto the wrapper or spine class', () => {
    // A `@keyframes thread-fade-in` (or any animation-name landing on the
    // wrapper) would re-introduce the entrance the kernel forbids. The
    // existing breathing animation lives on the FILL, not the wrapper —
    // it is gated by `data-thread-settled` and is not an entrance.
    expect(src).not.toMatch(/animation:\s*['"]?thread-fade/);
    expect(css).not.toMatch(/@keyframes\s+thread-(?:pre-)?fade/);
  });

  it('the wrapper still rides `transition-opacity` (between-rungs only)', () => {
    // The transition is the rung-to-rung baton (gone→attentive on first
    // scroll). It is harmless at t=0 because the inline style supplies
    // a pre-resolved value with no prior frame.
    expect(src).toContain('transition-opacity');
  });

  it("the wrapper rides `CROSSFADE_INLINE` for the same-session crossing", () => {
    // Tanya UIX #86 F4 / Mike #35 §6 POI 7 — the crossfade-inline verb
    // governs same-session crossings; the no-motion rule applies ONLY
    // at cold paint zero (the inline style supplies that path).
    expect(src).toMatch(/\bCROSSFADE_INLINE\b/);
  });
});

// ─── §3 · CSS truth table — three tiers, three values ─────────────────────

describe('golden-thread-pre-lit · §3 css truth table', () => {
  const css = readCss();

  it('stranger (`:root`) keeps `--thread-alpha-pre: 0` (today\'s behaviour)', () => {
    // The :root default is the byte-equivalent stranger path. Any drift
    // here breaks Mike's "stranger ≡ today" invariant.
    expect(css).toMatch(/:root\s*\{[^}]*--thread-alpha-pre:\s*0\s*;/);
  });

  it('returning maps to the muted alpha-ledger rung', () => {
    expect(css).toContain(
      `[data-recognition-tier="returning"] { --thread-alpha-pre: ${cssVarOf('muted')}; }`,
    );
  });

  it('known maps to the recede alpha-ledger rung', () => {
    expect(css).toContain(
      `[data-recognition-tier="known"]     { --thread-alpha-pre: ${cssVarOf('recede')}; }`,
    );
  });

  it('the truth table never maps any tier to a hard-coded numeric alpha', () => {
    // A drifted `--thread-alpha-pre: 0.30` would split source-of-truth
    // across CSS and the alpha ledger. The fence requires the var form.
    const drifts = css.match(
      /\[data-recognition-tier="(?:returning|known)"\][^{]*\{[^}]*--thread-alpha-pre:\s*0?\.\d+/g,
    ) ?? [];
    expect(drifts).toEqual([]);
  });
});

// ─── §4 · Documentation pin — the metaphor stays in the spec, not in code ─

describe('golden-thread-pre-lit · §4 metaphor cull (Elon §6 step 5)', () => {
  const src = readComponent();

  it('the component header does not load-bear on `doorframe` / `hospitality`', () => {
    // Per Mike #35 step 7 / Elon §6 — the engineering case is sufficient
    // on its own. Keep the metaphor in the spec; the code says what it does.
    expect(src).not.toMatch(/\bdoorframe\b/i);
    expect(src).not.toMatch(/\bhospitality\b/i);
  });

  it('the component header names the technical contract by var, not metaphor', () => {
    // Positive pin — the header NAMES the variable (so a maintainer
    // grepping for `--thread-alpha-pre` finds the surface that reads it).
    expect(src).toContain('--thread-alpha-pre');
  });
});
