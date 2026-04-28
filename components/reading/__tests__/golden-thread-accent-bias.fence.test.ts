/**
 * Golden Thread — accent-bias (returner-only lean) fence.
 *
 * The headline fence for "the lean rung" (Mike napkin #77,
 * Tanya UIX #28). Five pins, all source-string assertions (the test
 * runtime is `node`, not jsdom — same pattern as `golden-thread-pre-
 * lit.fence.test.ts`):
 *
 *   §1 · WIRE-UP — the fill carries an inline `style.filter` that reads
 *        `THREAD_ACCENT_BIAS_FILTER` from `lib/design/accent-bias.ts`.
 *        The carrier expression is `hue-rotate(var(--thread-bias, 0deg))`
 *        — the `, 0deg` fallback is the safety net if the Recognition
 *        Beacon IIFE ever throws (CSP, future minifier bug).
 *
 *   §2 · STRANGER ≡ TODAY — the `:root` default keeps `--thread-bias`
 *        at `0deg`; with no `data-archetype` on `<html>` the var
 *        resolves to `0deg`; `hue-rotate(0deg)` is a no-op (compositor-
 *        thread, byte-equivalent pixels). Three-layer floor: var
 *        fallback × :root default × no-op identity.
 *
 *   §3 · CSS TRUTH TABLE — the five `[data-archetype="…"]` selectors
 *        each set `--thread-bias` to a value that mirrors the
 *        `__testing__.THREAD_BIAS_BY_ARCHETYPE` table in
 *        `lib/design/accent-bias.ts`. Drift between CSS and TS is the
 *        headline failure (Mike §6 POI 8 — same wheel, both sides).
 *
 *   §4 · RANGE CAP — every `--thread-bias` value lands inside
 *        `[-THREAD_BIAS_MAX_ABS_DEG, +THREAD_BIAS_MAX_ABS_DEG]`. The
 *        cap is the "signature, not status" window (Paul §"sub-
 *        conscious"; Elon §2.1 — below JND for most viewing conditions
 *        at low chroma). If a future calibration wants a wider window,
 *        change `THREAD_BIAS_MAX_ABS_DEG` first; the fence then
 *        surfaces every rule that drifts.
 *
 *   §5 · METAPHOR CULL — the component header names the technical
 *        contract by var, not metaphor.
 *
 * Mirrors the shape of `golden-thread-pre-lit.fence.test.ts` (source-
 * string fence) and `recognition-beacon.fence.test.ts` (truth-table
 * cross-check via the typed-helper pattern, not by regexing CSS).
 *
 * Credits: Mike K. (architect, napkin #77 — wire-up shape, four-pin
 *          fence, "single carrier expression" rule); Tanya D. (UIX #28
 *          §3 — applied vs. anchor reconciliation, ±6° window, sign
 *          convention; UIX #28 §4 — fill-only-not-track wire-up;
 *          UIX #28 §6 — felt experience the fence guards); Sid
 *          (≤ 10 LoC per helper, source-string fence pattern lifted
 *          from `golden-thread-pre-lit.fence.test.ts`).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ArchetypeKey } from '@/types/content';
import {
  THREAD_ACCENT_BIAS_FILTER,
  THREAD_BIAS_MAX_ABS_DEG,
  __testing__,
} from '../../../lib/design/accent-bias';

const ROOT = join(__dirname, '..', '..', '..');

/** Read each source file once at module-eval; downstream describes share. */
const COMPONENT_SRC = readFileSync(join(ROOT, 'components', 'reading', 'GoldenThread.tsx'), 'utf8');
const LEDGER_SRC = readFileSync(join(ROOT, 'lib', 'design', 'accent-bias.ts'), 'utf8');
const CSS_SRC = readFileSync(join(ROOT, 'app', 'globals.css'), 'utf8');

const TS_TABLE = __testing__.THREAD_BIAS_BY_ARCHETYPE;

/** Collapse runs of whitespace to a single space — defeats CSS column alignment. */
function normalize(src: string): string {
  return src.replace(/\s+/g, ' ');
}

/** Render the canonical CSS rule for one archetype (whitespace-collapsed form). */
function cssRuleFor(archetype: ArchetypeKey, deg: number): string {
  return `[data-archetype="${archetype}"] { --thread-bias: ${deg}deg; }`;
}

/** Pre-normalize the CSS source once so per-archetype assertions share work. */
const CSS_NORMALIZED = normalize(CSS_SRC);

// ─── §1 · Wire-up: the fill reads --thread-bias via the ledger constant ───

describe('golden-thread-accent-bias · §1 wire-up at the fill', () => {
  it('imports THREAD_ACCENT_BIAS_FILTER from the ledger', () => {
    expect(COMPONENT_SRC).toMatch(
      /import\s*\{[^}]*THREAD_ACCENT_BIAS_FILTER[^}]*\}\s*from\s*['"]@\/lib\/design\/accent-bias['"]/,
    );
  });

  it('the fill style sets `filter: THREAD_ACCENT_BIAS_FILTER`', () => {
    expect(COMPONENT_SRC).toMatch(/filter:\s*THREAD_ACCENT_BIAS_FILTER/);
  });

  it('does not author the literal carrier expression at the call site', () => {
    expect(COMPONENT_SRC).not.toMatch(/filter:\s*['"`]hue-rotate/);
  });

  it('the ledger constant is a `hue-rotate(var(--thread-bias, 0deg))` literal', () => {
    // Pinned shape so a future `hue-rotate(calc(var(--accent-bias) * 0.02))`
    // lift requires editing the ledger header AND this fence (paired edit).
    expect(THREAD_ACCENT_BIAS_FILTER).toBe('hue-rotate(var(--thread-bias, 0deg))');
  });
});

// ─── §2 · Stranger ≡ today (three-layer floor) ─────────────────────────────

describe('golden-thread-accent-bias · §2 stranger ≡ today', () => {
  it(':root keeps `--thread-bias: 0deg` (today\'s pixels for first-time visitors)', () => {
    expect(CSS_SRC).toMatch(/:root\s*\{[^}]*--thread-bias:\s*0deg\s*;/);
  });

  it('the carrier expression carries a `, 0deg` fallback (CSP / IIFE-throw safety)', () => {
    expect(THREAD_ACCENT_BIAS_FILTER).toContain(', 0deg');
  });

  it('hue-rotate(0deg) is the no-op identity (sanity pin)', () => {
    expect(THREAD_ACCENT_BIAS_FILTER.replace('var(--thread-bias, 0deg)', '0deg'))
      .toBe('hue-rotate(0deg)');
  });
});

// ─── §3 · CSS truth table mirrors the TS __testing__ block ────────────────

describe('golden-thread-accent-bias · §3 css truth table', () => {
  it.each(Object.entries(TS_TABLE) as ReadonlyArray<[ArchetypeKey, number]>)(
    'CSS carries the canonical rule for %s (%s deg)',
    (archetype, deg) => {
      // Match the whole rule (including the closing `}`) so a future
      // maintainer adding a second declaration to the same selector
      // breaks the assertion — single-declaration-per-rule is the
      // contract. Whitespace is collapsed first to tolerate CSS column
      // alignment.
      expect(CSS_NORMALIZED).toContain(cssRuleFor(archetype, deg));
    },
  );

  it('the TS mirror is named `__testing__` (signals "not SSOT")', () => {
    // The CSS file is canonical (Mike #77 §4 — CSS truth table is the
    // first row of the diagram). The TS export is a test-only mirror.
    expect(LEDGER_SRC).toMatch(/export\s+const\s+__testing__/);
  });
});

// ─── §4 · Range cap — every applied lean lands inside ±MAX_ABS_DEG ────────

describe('golden-thread-accent-bias · §4 range cap (±3° geometry guard)', () => {
  it('THREAD_BIAS_MAX_ABS_DEG is exactly 3 (whisper-budget enforceable)', () => {
    // The cap is the geometry guard that makes ΔE2000 ∈ [0.8, 1.8]
    // mechanically enforceable at the warm spine fill stop (ΔE/° ≈ 0.66
    // ⇒ 3° × 0.66 ≈ 1.98 ΔE, just under ceiling). Tanya UIX #92 §5;
    // Mike #92 §2 calibration receipt. Change this number FIRST when
    // re-calibrating; the fence then surfaces every CSS rule that drifts.
    expect(THREAD_BIAS_MAX_ABS_DEG).toBe(3);
  });

  it.each(Object.entries(TS_TABLE) as ReadonlyArray<[ArchetypeKey, number]>)(
    '%s lean (%s deg) lands in [-MAX, +MAX]',
    (_archetype, deg) => {
      expect(Math.abs(deg)).toBeLessThanOrEqual(THREAD_BIAS_MAX_ABS_DEG);
    },
  );

  it('the cap leaves a hair of headroom (~0.5°) above the loudest lean', () => {
    // Largest shipped magnitude is 2.5°; cap is 3°. The headroom absorbs
    // ΔE/° drift at the cool baseline without re-opening this PR (Tanya
    // UIX #92 §5 — sub-JND budget, sign carries identity not loudness).
    // Inverts the prior "the window is used" pin: the window is now a
    // *guard*, not a target — calibration sits inside it with margin.
    const maxAbs = Math.max(...Object.values(TS_TABLE).map(Math.abs));
    expect(maxAbs).toBeLessThan(THREAD_BIAS_MAX_ABS_DEG);
  });
});

// ─── §5 · Documentation pin — the metaphor stays in the spec ──────────────

describe('golden-thread-accent-bias · §5 metaphor cull', () => {
  it('the component header names the technical contract by var, not metaphor', () => {
    // Positive pin — header NAMES the variable so a maintainer grepping
    // for `--thread-bias` finds the surface that reads it.
    expect(COMPONENT_SRC).toContain('--thread-bias');
  });
});
