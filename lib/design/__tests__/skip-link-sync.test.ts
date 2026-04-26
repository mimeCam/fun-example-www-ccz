/**
 * Skip-link sync test — physics gate for the cold-start handshake.
 *
 * Reads `app/globals.css`, walks the `.sys-skiplink` rule body, and
 * asserts the surface is byte-stable, reuses existing tokens, and
 * carries the reduced-motion / forced-colors fallbacks the contract
 * promises. The tests are the contract (Elon §2 / Mike §6).
 *
 * What this guards (the load-bearing invariants):
 *   1. The rule exists.
 *   2. It is positioned `fixed` and uses `--sys-z-overlay` (no new rung).
 *   3. The hidden state translates the link off-canvas; the focused
 *      state translates it to `0` (slide-in).
 *   4. The rule does NOT carry an `outline:` declaration — focus paint
 *      is delegated to the global `:focus-visible` ring (single source).
 *   5. Under `prefers-reduced-motion: reduce`, the transition collapses
 *      to `none` and the focused transform still resolves to `0`
 *      (handshake survives; choreography attenuates).
 *   6. The rule does NOT reference `--token-*` (warm) tokens — reader-
 *      invariant by construction. Same forbidden-token shape as the
 *      `/trust` page audit (Tanya UX #76 §5).
 *
 * Test pattern lifted from `focus-sync.test.ts` and `forced-colors-sync.test.ts`
 * — same `readFileSync` + balanced-block scanner. Symmetry is load-bearing.
 *
 * Credits: Mike K. (the regex-over-CSS pattern; the `.sys-skiplink` rule
 * shape; the kill-list on a new ledger row), Tanya D. (UX §3 / §4 — the
 * visual posture and the reduced-motion contract this test asserts on),
 * Elon M. (§4.2 — "test the computed values, don't hand-wave"; §2 — the
 * test IS the contract), Krystle C. (the focus-ink token this rule reuses).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const CSS_PATH = resolve(__dirname, '../../../app/globals.css');
const CSS = readFileSync(CSS_PATH, 'utf-8');

// ─── Parser helpers — pure, ≤10 LOC each ─────────────────────────────────

/** Read the balanced `{ … }` block starting at the first `{` after `anchor`. */
function readBalancedBlock(css: string, anchor: number): string | undefined {
  const open = css.indexOf('{', anchor);
  if (open < 0) return undefined;
  let depth = 1;
  for (let i = open + 1; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return undefined;
}

/** Extract the body of the top-level `.sys-skiplink { … }` rule. */
function readSkipLinkBlock(): string | undefined {
  const rx = /\.sys-skiplink\s*\{/;
  const match = rx.exec(CSS);
  if (!match) return undefined;
  return readBalancedBlock(CSS, match.index);
}

/** Extract the body of the `.sys-skiplink:focus-visible { … }` rule. */
function readSkipLinkFocusBlock(): string | undefined {
  const rx = /\.sys-skiplink:focus-visible\s*\{/;
  const match = rx.exec(CSS);
  if (!match) return undefined;
  return readBalancedBlock(CSS, match.index);
}

/** Read the body of `@media (prefers-reduced-motion: reduce) { … }`. */
function readReducedMotionBlock(): string | undefined {
  const start = CSS.indexOf('@media (prefers-reduced-motion: reduce)');
  if (start < 0) return undefined;
  return readBalancedBlock(CSS, start);
}

/** Pull a single declaration value out of a block by property name. */
function readDecl(block: string, prop: string): string | undefined {
  const rx = new RegExp(`(?:^|;|\\{)\\s*${prop}\\s*:\\s*([^;]+);`);
  const match = block.match(rx);
  return match ? match[1].trim() : undefined;
}

// ─── 1. Existence + structural anchors ────────────────────────────────────

describe('SkipLink CSS rule — existence and structural anchors', () => {
  it('the .sys-skiplink rule exists in globals.css', () => {
    expect(readSkipLinkBlock()).toBeDefined();
  });

  it('the .sys-skiplink:focus-visible rule exists', () => {
    expect(readSkipLinkFocusBlock()).toBeDefined();
  });

  it('the rule is fixed-positioned (lifts the surface above page flow)', () => {
    const block = readSkipLinkBlock()!;
    expect(readDecl(block, 'position')).toBe('fixed');
  });

  it('the rule uses var(--sys-z-overlay) for z-index — no new rung', () => {
    const block = readSkipLinkBlock()!;
    const z = readDecl(block, 'z-index');
    expect(z).toBe('var(--sys-z-overlay)');
  });

  it('the rule has a transform that hides the surface off-canvas', () => {
    const block = readSkipLinkBlock()!;
    const t = readDecl(block, 'transform') ?? '';
    expect(t.includes('translateY')).toBe(true);
    // Hidden state must NOT be `translateY(0)` — that would paint always.
    expect(t).not.toBe('translateY(0)');
  });

  it('the focus-visible rule restores the surface to translateY(0)', () => {
    const block = readSkipLinkFocusBlock()!;
    const t = readDecl(block, 'transform') ?? '';
    expect(t.replace(/\s+/g, '')).toBe('translateY(0)');
  });
});

// ─── 2. No per-component focus paint — single-ring contract ───────────────

describe('SkipLink delegates focus paint to the global ring', () => {
  it('the rule body does NOT declare an `outline:` (single-ring contract)', () => {
    const block = readSkipLinkBlock()!;
    expect(/(^|\s|;|\{)\s*outline\s*:/.test(block)).toBe(false);
  });

  it('the focus-visible body does NOT declare an `outline:` either', () => {
    const block = readSkipLinkFocusBlock()!;
    expect(/(^|\s|;|\{)\s*outline\s*:/.test(block)).toBe(false);
  });

  it('the rule does NOT declare its own box-shadow (focus ring is global)', () => {
    const block = readSkipLinkBlock()!;
    expect(/(^|\s|;|\{)\s*box-shadow\s*:/.test(block)).toBe(false);
  });
});

// ─── 3. Reader-invariant palette — no warm/thermal tokens ─────────────────

describe('SkipLink palette is reader-invariant (no thermal tokens)', () => {
  const FORBIDDEN = [
    '--token-accent',
    '--token-foreground',
    '--token-fg-warm',
    '--token-bg',
    '--token-bg-warm',
  ];

  it.each(FORBIDDEN)('the .sys-skiplink rule does NOT reference %s', (v) => {
    const block = readSkipLinkBlock()!;
    expect(block.includes(v)).toBe(false);
  });

  it('the focus-visible rule does NOT reference --token-* tokens', () => {
    const block = readSkipLinkFocusBlock()!;
    expect(/--token-/.test(block)).toBe(false);
  });
});

// ─── 4. Reduced-motion fallback — handshake survives, choreography stops ──

describe('SkipLink reduced-motion fallback', () => {
  it('a prefers-reduced-motion: reduce block exists in globals.css', () => {
    expect(readReducedMotionBlock()).toBeDefined();
  });

  it('under reduced-motion, .sys-skiplink transition collapses to none', () => {
    const block = readReducedMotionBlock()!;
    // Looser match — the reduced-motion media query carries multiple rules.
    // The .sys-skiplink override must declare `transition: none` somewhere.
    expect(/\.sys-skiplink\s*\{[^}]*transition\s*:\s*none/.test(block)).toBe(true);
  });

  it('under reduced-motion, focused state still resolves to translateY(0)', () => {
    const block = readReducedMotionBlock()!;
    expect(
      /\.sys-skiplink:focus-visible\s*\{[^}]*transform\s*:\s*translateY\(0\)/.test(block),
    ).toBe(true);
  });
});

// ─── 5. Single-sited — exactly one .sys-skiplink top-level rule ───────────

describe('SkipLink rule is single-sited', () => {
  it('exactly one top-level `.sys-skiplink { … }` rule body exists', () => {
    // Top-level only — exclude the `:focus-visible` variant and the
    // reduced-motion override (both legal duplicates).
    const matches = CSS.match(/(^|\n)\.sys-skiplink\s*\{/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('the focus-visible variant is also single-sited at top level', () => {
    const matches = CSS.match(/(^|\n)\.sys-skiplink:focus-visible\s*\{/g) ?? [];
    expect(matches.length).toBe(1);
  });
});
