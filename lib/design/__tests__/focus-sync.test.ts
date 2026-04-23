/**
 * Focus Sync Test — CSS ↔ TS drift guard for the reader-invariant ring.
 *
 * Reads `app/globals.css`, parses the `:focus-visible` block, asserts that
 * each of the three CSS-canonical numbers (width, alpha, offset) matches
 * `FOCUS.*` exactly. If someone edits a value in either mirror but not the
 * other, this test fails fast and names the axis.
 *
 * Same shape as every other sync test in `lib/design/__tests__/` — the
 * symmetry is load-bearing. A special case here would rot: every other
 * CSS-canonical number in this project has a sync guard, and skipping it
 * for the focus ring creates exactly the kind of drift the rest of the
 * codebase refuses to tolerate (Mike §"Why not Elon's strictest version").
 *
 * The structural invariants enforce the contract the file header states:
 * three axes (not four — speculative consumers do not earn fields), alpha
 * at or above the WCAG floor (0.8), width/offset as small integers.
 *
 * NO adoption test lives here. Adoption is already enforced by
 * `lib/utils/__tests__/field-adoption.test.ts:129` — "no per-component
 * focus rings — the global `:focus-visible` is the one ring." Duplicating
 * that scan here would be re-labeling, not coverage (Mike §"Why not Paul's
 * plan").
 *
 * Credits: Mike K. (napkin #38 — regex-over-CSS pattern lifted from
 * radius-sync.test.ts, sync-guard-as-symmetry call), Tanya D. (UIX #72 —
 * the three sacred numbers this test locks down; the WCAG-floor ≥ 0.8
 * invariant), Elon M. (the cardinality-1 framing that kept the scope
 * tight), Krystle C. (the three magic numbers themselves).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  FOCUS,
  FOCUS_CSS_PREFIX,
  READER_INVARIANT,
  widthPx,
  offsetPx,
  alphaPct,
  alphaPctString,
  focusInvariantHolds,
} from '../focus';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── Parser helpers — pure, each ≤ 10 LOC ─────────────────────────────────

/** Extract the full body of the `:focus-visible { … }` rule. */
function readFocusVisibleBlock(): string | undefined {
  const rx = /:focus-visible\s*\{([\s\S]*?)\}/;
  const match = CSS.match(rx);
  return match ? match[1] : undefined;
}

/** Pull the `outline:` declaration out of the `:focus-visible` block. */
function readOutlineDecl(): string | undefined {
  const block = readFocusVisibleBlock();
  if (!block) return undefined;
  const rx = /outline:\s*([^;]+);/;
  const match = block.match(rx);
  return match ? match[1].trim() : undefined;
}

/** Pull the `outline-offset:` declaration out of the block. */
function readOutlineOffsetDecl(): string | undefined {
  const block = readFocusVisibleBlock();
  if (!block) return undefined;
  const rx = /outline-offset:\s*([^;]+);/;
  const match = block.match(rx);
  return match ? match[1].trim() : undefined;
}

/** Parse the first integer-px literal out of a CSS value (`"2px solid …"`). */
function parseFirstPx(value: string | undefined): number {
  if (!value) return NaN;
  const match = value.match(/(\d+(?:\.\d+)?)px/);
  return match ? parseFloat(match[1]) : NaN;
}

/** Parse the first `N%` literal out of a CSS value. */
function parseFirstPct(value: string | undefined): number {
  if (!value) return NaN;
  const match = value.match(/(\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : NaN;
}

// ─── Tests — CSS ↔ TS sync ─────────────────────────────────────────────────

describe('FOCUS ↔ globals.css :focus-visible sync', () => {
  it('the :focus-visible block exists in globals.css', () => {
    expect(readFocusVisibleBlock()).toBeDefined();
  });

  it('FOCUS.width matches the outline width in CSS', () => {
    expect(parseFirstPx(readOutlineDecl())).toBe(FOCUS.width);
  });

  it('FOCUS.alpha matches the color-mix percentage in CSS', () => {
    const pct = parseFirstPct(readOutlineDecl());
    expect(pct).toBe(alphaPct());
  });

  it('FOCUS.offset matches the outline-offset in CSS', () => {
    expect(parseFirstPx(readOutlineOffsetDecl())).toBe(FOCUS.offset);
  });

  it('CSS uses color-mix() with --token-accent as the lerp source', () => {
    const outline = readOutlineDecl();
    expect(outline).toBeDefined();
    expect(/color-mix\([^)]*--token-accent[^)]*\)/.test(outline!)).toBe(true);
  });
});

// ─── Tests — structural invariants ────────────────────────────────────────

describe('FOCUS structural invariants', () => {
  it('focusInvariantHolds() is true', () => {
    expect(focusInvariantHolds()).toBe(true);
  });

  it('exactly three axes — a fourth is the first crack', () => {
    expect(Object.keys(FOCUS).length).toBe(3);
  });

  it('width/alpha/offset are the three fields (cardinality guard)', () => {
    expect(Object.keys(FOCUS).sort()).toEqual(['alpha', 'offset', 'width']);
  });

  it('alpha is at or above the 0.8 WCAG 1.4.11 floor', () => {
    expect(FOCUS.alpha).toBeGreaterThanOrEqual(0.8);
    expect(FOCUS.alpha).toBeLessThanOrEqual(1.0);
  });

  it('width and offset are small positive integers (≤ 4px)', () => {
    [FOCUS.width, FOCUS.offset].forEach((n) => {
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThan(0);
      expect(n).toBeLessThanOrEqual(4);
    });
  });
});

// ─── Tests — helpers round-trip the CSS strings the primitive emits ───────

describe('focus helpers emit the CSS strings the ring wants', () => {
  it('widthPx() round-trips FOCUS.width as a px string', () => {
    expect(widthPx()).toBe(`${FOCUS.width}px`);
  });

  it('offsetPx() round-trips FOCUS.offset as a px string', () => {
    expect(offsetPx()).toBe(`${FOCUS.offset}px`);
  });

  it('alphaPct() returns the integer percent (80 for 0.8)', () => {
    expect(alphaPct()).toBe(80);
    expect(Number.isInteger(alphaPct())).toBe(true);
  });

  it('alphaPctString() is the "N%" literal that color-mix() wants', () => {
    expect(alphaPctString()).toBe('80%');
  });
});

// ─── Tests — the convention token the reviewer grep-anchors to ────────────

describe('reader-invariant convention token', () => {
  it('READER_INVARIANT is the stable tag string', () => {
    expect(READER_INVARIANT).toBe('// reader-invariant');
  });

  it('FOCUS_CSS_PREFIX is the CSS custom-property root for future ink tokens', () => {
    expect(FOCUS_CSS_PREFIX).toBe('--sys-focus');
  });

  it('the tag is distinct from the `:exempt` ledger convention', () => {
    // ledger exemptions use `// <name>:exempt`; reader-invariant is the
    // symmetric counterpart. They must not collide — grep must be a DAG.
    expect(READER_INVARIANT.includes(':exempt')).toBe(false);
  });
});

// ─── Tests — the global ring stays single-sited (not per-component) ───────

/**
 * The adoption guard lives in `field-adoption.test.ts:129`. We re-assert
 * here at the CSS level that there is exactly ONE `:focus-visible` rule
 * body in `app/globals.css` — so a future PR can't quietly add a second
 * one (per-theme, per-archetype) and bypass the single-ring contract.
 */
describe('the ring is single-sited — one :focus-visible rule body', () => {
  it('globals.css declares exactly one :focus-visible { … } rule', () => {
    const matches = CSS.match(/:focus-visible\s*\{[\s\S]*?\}/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('globals.css declares exactly one :focus:not(:focus-visible) escape', () => {
    const matches = CSS.match(/:focus:not\(:focus-visible\)\s*\{[\s\S]*?\}/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('the :focus-visible block has a pointer to the TS mirror', () => {
    const block = readFocusVisibleBlock();
    // We assert the cross-reference at the block level — the authoring
    // comment lives directly above the rule and must name focus.ts so
    // a reviewer editing the CSS knows to update the mirror too.
    const surroundings = CSS.split(/:focus-visible\s*\{/)[0].slice(-400);
    expect(/lib\/design\/focus\.ts/.test(surroundings) || /focus\.ts/.test(block!))
      .toBe(true);
  });
});
