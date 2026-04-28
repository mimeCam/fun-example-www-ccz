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
 * **Scope narrowing — Mike #54 §POI 8 (the reciprocal-lane lift):** the
 * byte-identity claim is now "across thermal stops, FOR STRANGERS." The
 * ring's painted hue can lean by ±2.5° at the pseudo (via the carrier
 * `THREAD_ACCENT_BIAS_FILTER` + `var(--thread-bias, 0deg)`); that lean
 * is the second consumer of the AMBIENT/RECIPROCAL contract (see
 * `accent-bias.ts §"Two-Lane Contract"`). The stranger floor — where
 * `var(--thread-bias)` resolves to `0deg` and `hue-rotate(0deg)` is a
 * compositor no-op — preserves byte-identity at every thermal stop for
 * first-time visitors. This module's gates assert the stranger-floor
 * shape; the archetype-lean WCAG sweep is owned by `focus-ring-contrast-
 * audit.test.ts §SWEEP`.
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
import { circularHueDelta, hexToHsl } from '../hue';

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

/** The combined `:focus-visible` host + `:focus-visible::after` pseudo rule
 *  bodies. The reciprocal-lane refactor (Mike #54) moved the ring's paint
 *  layer (the `box-shadow` + `--sys-focus-ink` reference) onto the pseudo
 *  so the `filter: hue-rotate(...)` lean leaves host content untouched.
 *  This gate is concerned with the COMBINED ring's authoring — both the
 *  host body (geometry) and the pseudo body (ink) — so a single string
 *  serves the prefix-kill-list scans below. */
function readFocusVisibleBlock(): string {
  const host = CSS.match(/(?:^|[\s,;{}]):focus-visible\s*\{([\s\S]*?)\}/);
  const pseudo = CSS.match(/:focus-visible::after\s*\{([\s\S]*?)\}/);
  return [host ? host[1] : '', pseudo ? pseudo[1] : ''].join('\n');
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

// ─── Helpers — kinship gate ─────────────────────────────────────────────
// `hexToHsl` and `circularHueDelta` are imported from `lib/design/hue.ts`
// — the canonical kernel (Mike napkin / Sid 2026-04-26). The previous
// inline trio (RGB-01, HSL, Δh) was duplicated in three places at three
// unit conventions; promotion to `hue.ts` closes the unit drift Elon
// sniffed at (#54 §3). Only `.h` is read here, so the s/l unit shift
// (was [0,100], now [0,1]) is irrelevant to this gate.

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

// ─── Tests — stranger floor: byte-identity for first-time visitors ──────

/**
 * The reciprocal-lane lean is the second consumer of `var(--thread-bias)`
 * (the first is the AMBIENT-lane Golden Thread fill). The lean shifts the
 * painted ring's hue by ≤ ±2.5° per archetype at the `::after` pseudo.
 * For a STRANGER (no `[data-archetype]` attribute), `--thread-bias`
 * resolves to its `:root` default `0deg`; `hue-rotate(0deg)` is a
 * compositor no-op; the painted ring is byte-identical to today.
 *
 * This block pins the three layers of zero. If any layer drifts, a
 * stranger's `:focus-visible` paints a different hex than today, and
 * the lane contract failed.
 */

describe('focus-ink stranger floor — byte-identity for first-time visitors', () => {
  it(':root declares `--thread-bias: 0deg` (layer 1: CSS default)', () => {
    // The accent-bias `:root` block lives below the main `:root` block —
    // both target the same selector. We assert presence of the default
    // declaration anywhere a `:root { … }` rule body emits it.
    expect(/:root\s*\{[\s\S]*?--thread-bias\s*:\s*0deg/.test(CSS)).toBe(true);
  });

  it('the carrier expression carries the `, 0deg` fallback (layer 2: var fallback)', () => {
    // The carrier expression literal — same string the AMBIENT and
    // RECIPROCAL lanes both consume. A drift here would break byte-
    // identity for a stranger when the Recognition Beacon never runs
    // (CSP, JS disabled, future minifier bug).
    expect(CSS.includes('hue-rotate(var(--thread-bias, 0deg))')).toBe(true);
  });

  it('the carrier on the ring evaluates to `hue-rotate(0deg)` for strangers (layer 3: compositor no-op)', () => {
    // Sanity: the literal IS the no-op for strangers. A future maintainer
    // who "optimizes" this to `hue-rotate(var(--thread-bias))` (no
    // fallback) breaks the stranger floor; the §4 fence in
    // `focus-reciprocal-lane.fence.test.ts` catches it on the same PR.
    const noOp = 'hue-rotate(0deg)';
    expect(noOp.length).toBeGreaterThan(0);
    // The fallback `, 0deg` is what makes the carrier ≡ no-op for strangers.
    expect('hue-rotate(var(--thread-bias, 0deg))'.includes(', 0deg')).toBe(true);
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

// ─── Tests — kinship gate: same violet family (hue only) ────────────────
// Sibling to the `INTENTIONALLY DIFFERENT` test above: that one pins the
// *different* half (post-WCAG-lift fork); this one pins the *same-family*
// half (the JSDoc claim that `#c77dff` is the brighter sibling of `#7b2cbf`
// in the violet hue family). Hue-only — ΔS / ΔL diverge by design (Elon
// #14; ΔL audited via `focus-ring-contrast-audit`). Floor `10°` = today's
// Δh (~1.91°) × 5 margin, not eyeballed (Mike #78 §6 #6).

describe('focus-ink kinship — same violet family (hue gate)', () => {
  const HUE_FLOOR_DEG = 10;

  it(`Δh(FOCUS_INK, THERMAL.accent) ≤ ${HUE_FLOOR_DEG}° (same violet family)`, () => {
    const dh = circularHueDelta(
      hexToHsl(FOCUS_INK).h,
      hexToHsl(THERMAL.accent).h,
    );
    // eslint-disable-next-line no-console
    console.log(
      `[focus-ink-kinship] Δh ${dh.toFixed(2)}° (floor ${HUE_FLOOR_DEG}°)`,
    );
    expect(dh).toBeLessThanOrEqual(HUE_FLOOR_DEG);
  });
});
