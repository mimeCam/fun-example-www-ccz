/**
 * focus-ink-byte-identity — the one-assertion physics gate for the ring.
 *
 * One module, one question: **does the `:focus-visible` outline string
 * textually depend on any value that varies with thermal score or archetype?**
 *
 * If the answer is "no," the ring is reader-invariant by physics, not by
 * design review. If the answer is "yes" (someone re-coupled the ink to
 * `--token-accent` or an `--arch-*` token), this test fails fast and names
 * the offending prefix.
 *
 * Elon's discipline, pulled into its own named module so future sync-adoption
 * audits find it at the same grep-depth as every other ledger's adoption
 * test. See Mike #62 §1 and §"Points of interest" #1.
 *
 * The rule — enforced by grep, not by semantic analysis:
 *   1. `:root` declares `--sys-focus-ink` as a hex literal (no `var()` chain,
 *      no `color-mix()`, no delegation). It is the bedrock.
 *   2. The `:focus-visible` outline references `--sys-focus-ink` and NOTHING
 *      from `--token-*` / `--thermal-*` / `--arch-*`.
 *   3. The TS mirror `FOCUS_INK` is a literal string, not a re-export of
 *      `THERMAL.accent`. Moving the thermal anchor must NOT silently drag
 *      the reader-invariant ring's colour with it.
 *
 * Byte equality is the assertion, not semantic equality. If the CSS is
 * reformatted (whitespace, case, shorthand), the regex still holds because
 * it anchors on the property name and the thermal/accent/arch prefix set.
 *
 * Credits: Elon M. (the "one assertion covers the physics" call, via
 * Mike #62 §1), Mike K. (napkin #62 — the named gate + the reader-invariant
 * tag symmetry), Tanya D. (#76 §5 — the "forbidden on /trust" palette
 * table that motivated the prefix kill-list), Paul K. (the business
 * premise that an invariant surface must BE invariant, not merely claim to).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { FOCUS_INK, FOCUS_INK_CSS } from '../focus';
import { THERMAL } from '../color-constants';

// Note (Mike #103 §5 file #5 — Sid 2026-04-26): the index-0 trust-anchor
// helper invocation USED to live here. With the focus-ring contrast audit
// ship, the `TRUST_INVARIANTS[0]` anchor moved to `focus-ring-contrast-audit.test.ts`
// — a *contrast* receipt of the painted ring, not a *physics* receipt of
// the authoring CSS bytes. This module remains as a sibling guarantee
// (the byte-identity gate the physics depends on); the anchor lives next
// to the receipt the reader can verify with their own eyes. Grep-for-five
// rule from AGENTS.md §"Reader-invariant promise" still holds.

const CSS = readFileSync(
  resolve(__dirname, '../../../app/globals.css'),
  'utf-8',
);

// ─── Helpers — pure, each ≤ 10 LOC ────────────────────────────────────────

/** The :focus-visible rule body, stripped of comments/whitespace for scans. */
function readFocusVisibleBlock(): string {
  const match = CSS.match(/:focus-visible\s*\{([\s\S]*?)\}/);
  return match ? match[1] : '';
}

/** The first `:root { … }` block body. Balanced-brace scan — the block's
 *  comments contain literal `{…}` glyphs that defeat a lazy regex. */
function readRootBlock(): string {
  const start = CSS.indexOf(':root');
  if (start < 0) return '';
  const open = CSS.indexOf('{', start);
  if (open < 0) return '';
  let depth = 1;
  for (let i = open + 1; i < CSS.length; i++) {
    if (CSS[i] === '{') depth++;
    else if (CSS[i] === '}' && --depth === 0) return CSS.slice(open + 1, i);
  }
  return '';
}

/** The value of a named custom property inside a CSS block body. */
function readVar(block: string, name: string): string | undefined {
  const rx = new RegExp(`${name}:\\s*([^;]+);`);
  const match = block.match(rx);
  return match ? match[1].trim() : undefined;
}

/** All matches of a prefix family (e.g. `--thermal-`) inside a block body. */
function matchesOf(block: string, prefix: string): string[] {
  const rx = new RegExp(`${prefix}[a-zA-Z0-9_-]+`, 'g');
  return block.match(rx) ?? [];
}

// ─── Tests — the three physics assertions ─────────────────────────────────

describe('focus-ink byte-identity — the physics gate', () => {
  // 1. The authoring site declares a hex literal, not a delegation.

  it(':root { --sys-focus-ink: … } is a hex literal (no var/color-mix chain)', () => {
    const decl = readVar(readRootBlock(), FOCUS_INK_CSS);
    expect(decl).toBeDefined();
    expect(/^#[0-9a-fA-F]{3,6}$/.test(decl!)).toBe(true);
    expect(decl!.includes('var(')).toBe(false);
    expect(decl!.includes('color-mix')).toBe(false);
  });

  // 2. The ring cannot reach any warming / archetype token.

  it(':focus-visible outline references --sys-focus-ink, not --token-accent', () => {
    const block = readFocusVisibleBlock();
    expect(block.includes(FOCUS_INK_CSS)).toBe(true);
    expect(block.includes('--token-accent')).toBe(false);
  });

  it(':focus-visible outline contains no --thermal-* / --token-* / --arch-* refs', () => {
    const block = readFocusVisibleBlock();
    const forbidden = ['--thermal-', '--token-', '--arch-'];
    for (const prefix of forbidden) {
      const hits = matchesOf(block, prefix);
      expect(hits).toEqual([]);
    }
  });

  // 3. The TS mirror is textually independent from the thermal anchor.

  it('FOCUS_INK is a literal string, not a re-export of THERMAL.accent', () => {
    const focusModule = readFileSync(resolve(__dirname, '../focus.ts'), 'utf-8');
    // The module MUST NOT IMPORT from color-constants — the ink's equality
    // to THERMAL.accent is a design-review coincidence, not a code dependency.
    // The docblock may reference THERMAL by name for context; imports cannot.
    expect(focusModule.includes("from './color-constants'")).toBe(false);
    expect(focusModule.includes('from "./color-constants"')).toBe(false);
    expect(focusModule.includes('@/lib/design/color-constants')).toBe(false);
    // FOCUS_INK must be assigned a hex literal directly.
    expect(/FOCUS_INK\s*=\s*'#[0-9a-fA-F]{6}'/.test(focusModule)).toBe(true);
  });

  it('FOCUS_INK is INTENTIONALLY DIFFERENT from THERMAL.accent (WCAG-lift fork)', () => {
    // Post-WCAG-lift fork (Sid 2026-04-26 — Mike napkin / Tanya UX #12).
    // The two literals were textually independent (Mike #62 doctrine)
    // exactly so this divergence could happen without silent drag.
    // FOCUS_INK = '#c77dff' clears WCAG SC 1.4.11 (3.0:1 non-text) at both
    // thermal anchors; THERMAL.accent = '#7b2cbf' stays put so the thread
    // killer-feature spread (`2.24 → 8.95`) is preserved. See focus.ts
    // JSDoc §"WCAG 1.4.11 ship".
    expect(FOCUS_INK).not.toBe(THERMAL.accent);
  });
});

// ─── Tests — the reader-invariant tag is grep-visible at both sites ──────

describe('reader-invariant tag — the convention is grep-visible', () => {
  it('globals.css carries the // reader-invariant tag near :focus-visible', () => {
    // Reader-invariant surfaces declare themselves. The CSS authoring comment
    // above the rule must mention the tag so reviewers find it.
    const head = CSS.split(/:focus-visible\s*\{/)[0].slice(-400);
    expect(head.includes('reader-invariant')).toBe(true);
  });

  it('focus.ts carries the // reader-invariant tag near FOCUS_INK', () => {
    const src = readFileSync(resolve(__dirname, '../focus.ts'), 'utf-8');
    // The constant's docblock mentions the tag; the grep is the contract.
    const focusInkBlock = src.slice(
      src.indexOf('FOCUS_INK') - 800,
      src.indexOf('FOCUS_INK') + 400,
    );
    expect(focusInkBlock.includes('reader-invariant')).toBe(true);
  });
});
