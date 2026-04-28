/**
 * Passage-Trinity Disjointness Fence — CSS-side property leakage gate.
 *
 * This fence stops a future PR from accidentally adding `text-wrap` to
 * the `.typo-hyphens-passage` rule body (cross-class property leakage in
 * `app/globals.css`).
 *
 * Body-prose trinity in `app/globals.css`:
 *   .typo-wrap-passage     → only `text-wrap`
 *   .typo-hyphens-passage  → only `hyphens` (+ aux: `hyphenate-limit-
 *                            chars`, `overflow-wrap` — pinned by
 *                            `typography-sync.test.ts`, not the trinity)
 *   .typo-hang-passage     → only `hanging-punctuation`
 *
 * Sister fences pin different invariants — leave them alone:
 *   • `passage-{wrap,hyphens,hang}-converges` — carrier-side routing.
 *   • `hang-progressive-enhancement` — the literal's two legal homes.
 *   • `typography-sync` — per-beat property *values* byte-pinned.
 *
 * Pure-source: reads `app/globals.css`, regex-extracts each body. No
 * React, no jsdom. CI cost ≈ a few ms.
 *
 * Credits: Mike Koch (#84 — rule-body regex shape, trinity predicate,
 * bad-PR docblock discipline), Tanya Donska (UX #73 — failure-message
 * tone), Elon Musk (every fence names the bad PR it stops), Paul Kim
 * ("Seal the Trinity. Zero overlap."), Krystle Clear (DoD ≤ 80 LoC),
 * Sid (≤ 10 LoC helpers, pure-source pattern from sister fences).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

const TRINITY = [
  { rule: '.typo-wrap-passage', owns: 'text-wrap' },
  { rule: '.typo-hyphens-passage', owns: 'hyphens' },
  { rule: '.typo-hang-passage', owns: 'hanging-punctuation' },
] as const;

const PROPS = ['text-wrap', 'hyphens', 'hanging-punctuation'] as const;

const LEAKS = TRINITY.flatMap(({ rule, owns }) =>
  PROPS.filter((p) => p !== owns).map((leak) => ({ rule, leak })),
);

/** Escape a literal for safe inclusion in a regex source. */
function rxEscape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Extract the body of a CSS rule by exact selector. Throws if missing. */
function bodyOf(css: string, selector: string): string {
  const m = css.match(new RegExp(`${rxEscape(selector)}\\s*\\{([^}]*)\\}`));
  if (!m) throw new Error(`rule body not found in app/globals.css: ${selector}`);
  return m[1];
}

/** True iff `body` declares the given CSS property name. */
function declaresProp(body: string, prop: string): boolean {
  return new RegExp(`(?:^|;|\\{|\\s)${rxEscape(prop)}\\s*:`).test(body);
}

const CSS = readFileSync(join(ROOT, 'app/globals.css'), 'utf8');

describe('passage trinity disjoint · §1 each rule declares its own property', () => {
  it.each(TRINITY)('$rule declares `$owns`', ({ rule, owns }) => {
    expect(declaresProp(bodyOf(CSS, rule), owns)).toBe(true);
  });
});

describe('passage trinity disjoint · §2 no cross-class property leakage', () => {
  it.each(LEAKS)('$rule does NOT leak `$leak`', ({ rule, leak }) => {
    // Red here = a sibling trinity property landed in the wrong rule
    // body. Move it back to `.typo-{wrap|hyphens|hang}-passage` in
    // `app/globals.css`; do NOT silence the fence.
    expect(declaresProp(bodyOf(CSS, rule), leak)).toBe(false);
  });
});
