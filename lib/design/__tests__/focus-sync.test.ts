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
  FOCUS_INK,
  FOCUS_INK_CSS,
  READER_INVARIANT,
  widthPx,
  offsetPx,
  alphaPct,
  alphaPctString,
  focusInkCss,
  focusInkVar,
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

/** Pull the `box-shadow:` declaration out of the `:focus-visible` block.
 *  The shadow spans multiple lines by design (two-stop composition) — the
 *  regex stops at the terminating `;` which the CSS always emits. */
function readBoxShadowDecl(): string | undefined {
  const block = readFocusVisibleBlock();
  if (!block) return undefined;
  const rx = /box-shadow:\s*([^;]+);/;
  const match = block.match(rx);
  return match ? normaliseWhitespace(match[1].trim()) : undefined;
}

/** Detect any `border-radius:` declaration inside the `:focus-visible` block.
 *  This is the inverted physics gate — if ANY commit re-introduces a
 *  radius into the ring rule body, the ring starts rewriting pill hosts
 *  into 8px squares again and this predicate flips to `true`. */
function focusVisibleDeclaresBorderRadius(): boolean {
  const block = readFocusVisibleBlock();
  if (!block) return false;
  return /(^|\s|;|\{)\s*border-radius\s*:/.test(block);
}

/** Collapse runs of whitespace/newlines to single spaces. Pure. */
function normaliseWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Split a multi-stop box-shadow declaration into its comma-separated stops.
 *  Honours parenthesis nesting — `color-mix(in srgb, …, transparent)` has
 *  internal commas that MUST NOT split the stop. Pure scanner. */
function splitShadowStops(decl: string | undefined): string[] {
  if (!decl) return [];
  const stops: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < decl.length; i++) {
    const c = decl[i];
    if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === ',' && depth === 0) {
      stops.push(decl.slice(start, i).trim());
      start = i + 1;
    }
  }
  const tail = decl.slice(start).trim();
  if (tail) stops.push(tail);
  return stops;
}

/** Parse the first integer-px literal out of a CSS value. */
function parseFirstPx(value: string | undefined): number {
  if (!value) return NaN;
  const match = value.match(/(\d+(?:\.\d+)?)px/);
  return match ? parseFloat(match[1]) : NaN;
}

/** Parse the Nth integer-px literal out of a CSS value (zero-indexed). */
function parseNthPx(value: string | undefined, n: number): number {
  if (!value) return NaN;
  const matches = value.match(/(\d+(?:\.\d+)?)px/g);
  if (!matches || matches.length <= n) return NaN;
  const raw = matches[n].match(/(\d+(?:\.\d+)?)/);
  return raw ? parseFloat(raw[1]) : NaN;
}

/** Parse the first `N%` literal out of a CSS value. */
function parseFirstPct(value: string | undefined): number {
  if (!value) return NaN;
  const match = value.match(/(\d+(?:\.\d+)?)%/);
  return match ? parseFloat(match[1]) : NaN;
}

/** Extract the full body of the `:root { … }` rule (the first one).
 *  Uses balanced-brace scanning because the block's comments contain `{…}`
 *  glyphs (e.g. "sys-{6,9,11,12}") that defeat a lazy regex. */
function readRootBlock(): string | undefined {
  const start = CSS.indexOf(':root');
  if (start < 0) return undefined;
  const open = CSS.indexOf('{', start);
  if (open < 0) return undefined;
  let depth = 1;
  for (let i = open + 1; i < CSS.length; i++) {
    if (CSS[i] === '{') depth++;
    else if (CSS[i] === '}' && --depth === 0) return CSS.slice(open + 1, i);
  }
  return undefined;
}

/** Pull the `--sys-focus-ink:` declaration value out of `:root`. */
function readFocusInkDecl(): string | undefined {
  const block = readRootBlock();
  if (!block) return undefined;
  const rx = /--sys-focus-ink:\s*([^;]+);/;
  const match = block.match(rx);
  return match ? match[1].trim() : undefined;
}

/** Parse a `#rrggbb` or `#rgb` literal into its lowercase 7-char form.
 *  The 6-char alternative is ordered first — regex alternation is greedy
 *  left-to-right, and `#7b2cbf` must not collapse into the 3-char branch. */
function parseHexLiteral(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
  if (!match) return undefined;
  const raw = match[1].toLowerCase();
  if (raw.length === 3) return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  return `#${raw}`;
}

// ─── Tests — CSS ↔ TS sync ─────────────────────────────────────────────────

describe('FOCUS ↔ globals.css :focus-visible sync (two-stop box-shadow)', () => {
  it('the :focus-visible block exists in globals.css', () => {
    expect(readFocusVisibleBlock()).toBeDefined();
  });

  it('CSS declares NO `outline:` inside `:focus-visible` (shadow composition)', () => {
    const block = readFocusVisibleBlock();
    expect(block).toBeDefined();
    // Allow `box-shadow`, reject `outline:` (the old mechanism).
    expect(/(^|\s|;)\s*outline\s*:/.test(block!)).toBe(false);
  });

  it('CSS declares a `box-shadow:` inside `:focus-visible`', () => {
    expect(readBoxShadowDecl()).toBeDefined();
  });

  it('the shadow is a two-stop composition — spacer then ring', () => {
    expect(splitShadowStops(readBoxShadowDecl()).length).toBe(2);
  });

  it('stop #1 is the transparent spacer at FOCUS.offset width', () => {
    const [spacer] = splitShadowStops(readBoxShadowDecl());
    expect(parseFirstPx(spacer)).toBe(FOCUS.offset);
    expect(spacer.includes('transparent')).toBe(true);
  });

  it('stop #2 is the ring ink at offset+width with color-mix on --sys-focus-ink', () => {
    const [, ring] = splitShadowStops(readBoxShadowDecl());
    expect(parseFirstPx(ring)).toBe(FOCUS.offset + FOCUS.width);
    expect(/color-mix\([^)]*--sys-focus-ink[^)]*\)/.test(ring)).toBe(true);
  });

  it('FOCUS.alpha matches the color-mix percentage in the ring stop', () => {
    const [, ring] = splitShadowStops(readBoxShadowDecl());
    expect(parseFirstPct(ring)).toBe(alphaPct());
  });

  it('CSS shadow does NOT reference --token-accent (reader-invariant)', () => {
    const decl = readBoxShadowDecl();
    expect(decl).toBeDefined();
    expect(decl!.includes('--token-accent')).toBe(false);
  });

  it('the two shadow stops are in the order (spacer, ring) — byte-identity', () => {
    const [spacer, ring] = splitShadowStops(readBoxShadowDecl());
    // Spacer has ONLY transparent; ring has color-mix. Order matters.
    expect(spacer.includes('transparent')).toBe(true);
    expect(spacer.includes('color-mix')).toBe(false);
    expect(ring.includes('color-mix')).toBe(true);
  });
});

// ─── Tests — --sys-focus-ink mirror (Mike #62) ────────────────────────────

describe('FOCUS_INK ↔ globals.css --sys-focus-ink sync', () => {
  it(':root declares the --sys-focus-ink custom property', () => {
    expect(readFocusInkDecl()).toBeDefined();
  });

  it('parsed :root hex literal equals FOCUS_INK (byte-identical)', () => {
    expect(parseHexLiteral(readFocusInkDecl())).toBe(FOCUS_INK);
  });

  it('FOCUS_INK_CSS is the stable custom-property name', () => {
    expect(FOCUS_INK_CSS).toBe('--sys-focus-ink');
  });

  it('focusInkCss() round-trips the hex literal', () => {
    expect(focusInkCss()).toBe(FOCUS_INK);
  });

  it('focusInkVar() returns the var() reference the ring composes with', () => {
    expect(focusInkVar()).toBe(`var(${FOCUS_INK_CSS})`);
  });

  it('FOCUS_INK is a 7-char lowercase hex literal', () => {
    expect(/^#[0-9a-f]{6}$/.test(FOCUS_INK)).toBe(true);
  });
});

// ─── Tests — corner posture belongs to the host (Mike napkin / Tanya #93) ─
//
// The ring no longer carries a `border-radius`. Shape is inherited from
// whatever the host element already declares (pill hosts paint pill rings,
// cards paint 8px rings, text links paint 6px rings). This block is the
// inverted physics gate — it fails if any future commit re-introduces a
// `border-radius` into the `:focus-visible` rule.

describe('corner posture belongs to the host (no radius on :focus-visible)', () => {
  it('the :focus-visible block declares NO border-radius (subtractive fix)', () => {
    expect(focusVisibleDeclaresBorderRadius()).toBe(false);
  });

  it('the block still declares box-shadow (the ring mechanism survives)', () => {
    expect(readBoxShadowDecl()).toBeDefined();
  });

  it('FOCUS_RADIUS_* exports are gone (no sibling to mirror an absent rule)', () => {
    // The imports at the top of this file already enforce this at TS
    // compile-time; an assertion here documents the absence for readers.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../focus') as Record<string, unknown>;
    expect(mod.FOCUS_RADIUS_CSS).toBeUndefined();
    expect(mod.FOCUS_RADIUS_RUNG).toBeUndefined();
    expect(mod.focusRadiusVar).toBeUndefined();
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
