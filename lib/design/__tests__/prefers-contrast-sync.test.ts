/**
 * prefers-contrast Sync Test — CSS ↔ TS drift guard for the reader-invariant
 * clamp under `@media (prefers-contrast: more)`.
 *
 * Reads `lib/design/ambient-surfaces.css`, parses the `(prefers-contrast: more)`
 * block, asserts that each clamped CSS custom property maps to its dormant
 * anchor in `lib/thermal/thermal-tokens.ts` (`GESTURE_MIX.dormant`,
 * `ACCENT_OPACITY.dormant`). Gold halos (`--token-glow`, `--token-text-glow`)
 * must read `none`.
 *
 * Same shape as `focus-sync.test.ts` / `alpha-sync.test.ts` — the symmetry
 * is load-bearing (Mike napkin §6 — "byte-for-byte sibling … so the next
 * contributor recognizes the pattern immediately"). A special case here
 * would rot: every other CSS-canonical number in this project has a sync
 * guard.
 *
 * The TS clamp in `lib/thermal/apply-tokens.ts` must write the same four
 * overrides after hydration. We assert both mirrors converge on the CSS
 * as the single authoring layer.
 *
 * Credits: Mike K. (napkin §5 — regex-over-CSS lifted from focus-sync.ts,
 * sync-guard-as-symmetry), Tanya D. (UX §4.1/§4.2 — the dormant anchors
 * this test locks down), Krystle C. (WCAG AAA scope), Elon M. (one noun).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  GESTURE_MIX,
  ACCENT_OPACITY,
} from '@/lib/thermal/thermal-tokens';

const CSS = readFileSync(
  resolve(__dirname, '../ambient-surfaces.css'),
  'utf-8',
);
const APPLY_TOKENS = readFileSync(
  resolve(__dirname, '../../thermal/apply-tokens.ts'),
  'utf-8',
);

// ─── Parser helpers — pure, each ≤ 10 LOC ─────────────────────────────────

/** Extract the body of the `@media (prefers-contrast: more) { … }` block.
 *  Uses balanced-brace scanning because the block contains nested `:root { … }`
 *  and `::placeholder { … }` / `::marker { … }` rules. Pure. */
function readContrastMoreBlock(): string | undefined {
  const start = CSS.indexOf('@media (prefers-contrast: more)');
  if (start < 0) return undefined;
  return readBalancedBlock(start);
}

/** Read the first `{ … }` block starting at or after `anchor`, honouring
 *  nested braces. Returns the body without the outer braces. */
function readBalancedBlock(anchor: number): string | undefined {
  const open = CSS.indexOf('{', anchor);
  if (open < 0) return undefined;
  let depth = 1;
  for (let i = open + 1; i < CSS.length; i++) {
    if (CSS[i] === '{') depth++;
    else if (CSS[i] === '}' && --depth === 0) {
      return CSS.slice(open + 1, i);
    }
  }
  return undefined;
}

/** Pull a single `--token-*: <value>;` declaration out of a block. */
function readTokenDecl(block: string, name: string): string | undefined {
  const rx = new RegExp(`${escapeRx(name)}:\\s*([^;]+);`);
  const match = block.match(rx);
  return match ? match[1].trim() : undefined;
}

/** Escape regex metacharacters in a literal name (e.g. `--token-glow`). */
function escapeRx(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/** Parse a numeric CSS value (e.g. `0.28` → 0.28). Returns NaN on mismatch. */
function parseNumber(raw: string | undefined): number {
  if (raw === undefined) return NaN;
  return parseFloat(raw);
}

// ─── Tests — CSS block structure ──────────────────────────────────────────

describe('ambient-surfaces.css · @media (prefers-contrast: more) block', () => {
  it('the block exists in the CSS', () => {
    expect(readContrastMoreBlock()).toBeDefined();
  });

  it('the block lives in the ambient-surfaces.css owner, not globals.css', () => {
    // Guard against "sprinkle the CSS across files" drift. Single owner,
    // single grep target. `lib/design/ambient-surfaces.css` is the home.
    expect(CSS).toContain('@media (prefers-contrast: more)');
  });
});

// ─── Tests — token mirror: CSS ↔ thermal-tokens.ts ────────────────────────

describe('contrast-more ↔ thermal-tokens dormant-anchor sync', () => {
  it('--token-gesture-mix pins to GESTURE_MIX.dormant', () => {
    const block = readContrastMoreBlock()!;
    const decl = readTokenDecl(block, '--token-gesture-mix');
    expect(parseNumber(decl)).toBeCloseTo(GESTURE_MIX.dormant, 3);
  });

  it('--token-accent-opacity pins to ACCENT_OPACITY.dormant', () => {
    const block = readContrastMoreBlock()!;
    const decl = readTokenDecl(block, '--token-accent-opacity');
    expect(parseNumber(decl)).toBeCloseTo(ACCENT_OPACITY.dormant, 3);
  });

  it('--token-glow collapses to `none` (gold halos flatten)', () => {
    const block = readContrastMoreBlock()!;
    expect(readTokenDecl(block, '--token-glow')).toBe('none');
  });

  it('--token-text-glow collapses to `none` (text loses warm shadow)', () => {
    const block = readContrastMoreBlock()!;
    expect(readTokenDecl(block, '--token-text-glow')).toBe('none');
  });
});

// ─── Tests — TS clamp mirrors the CSS block (apply-tokens.ts) ─────────────

describe('apply-tokens.ts ↔ contrast-more CSS mirror', () => {
  it('apply-tokens.ts imports readPrefersContrast (the probe)', () => {
    expect(APPLY_TOKENS).toMatch(/readPrefersContrast/);
  });

  it('apply-tokens.ts imports GESTURE_MIX and ACCENT_OPACITY for the clamp', () => {
    expect(APPLY_TOKENS).toMatch(/GESTURE_MIX/);
    expect(APPLY_TOKENS).toMatch(/ACCENT_OPACITY/);
  });

  it('apply-tokens.ts overrides the four warming deltas verbatim', () => {
    ['--token-gesture-mix', '--token-accent-opacity',
     '--token-glow', '--token-text-glow'].forEach((tok) => {
      expect(APPLY_TOKENS).toContain(tok);
    });
  });

  it('apply-tokens.ts carries the // reader-invariant tag at the clamp site', () => {
    expect(APPLY_TOKENS).toMatch(/reader-invariant/);
  });
});

// ─── Tests — surfaces: placeholder & marker lose the accent tint ──────────

describe('contrast-more · chorus surfaces lose the accent tint', () => {
  it('::placeholder paints the plain --mist (no accent color-mix)', () => {
    const block = readContrastMoreBlock()!;
    // The rule body we care about — placeholder only, not the outer :root.
    const ph = block.match(/::placeholder\s*\{([^}]*)\}/);
    expect(ph).toBeTruthy();
    expect(ph![1]).toContain('var(--mist)');
    expect(ph![1]).not.toContain('color-mix');
  });

  it('::marker paints --token-foreground (structure, not tint)', () => {
    const block = readContrastMoreBlock()!;
    const mk = block.match(/::marker\s*\{([^}]*)\}/);
    expect(mk).toBeTruthy();
    expect(mk![1]).toContain('var(--token-foreground)');
    expect(mk![1]).not.toContain('color-mix');
  });
});

// ─── Tests — subtractive discipline: no new tokens, no new noun ───────────

describe('contrast-more · subtractive discipline', () => {
  it('the block does NOT introduce new CSS custom properties', () => {
    // Only the four documented overrides are permitted. Any other `--foo:`
    // authoring under `prefers-contrast: more` is scope creep (Mike §9).
    const block = readContrastMoreBlock()!;
    const declared = Array.from(block.matchAll(/--([a-z-]+):/g)).map((m) => m[1]);
    const allowed = new Set([
      'token-gesture-mix', 'token-accent-opacity',
      'token-glow', 'token-text-glow',
    ]);
    declared.forEach((name) => expect(allowed.has(name)).toBe(true));
  });

  it('the block does NOT reference the bare --token-accent colour token', () => {
    // Accent (`--token-accent`) paints warming washes via `color-mix(...)`.
    // Under contrast-more, the chorus surfaces drop that tint entirely.
    // The `--token-accent-opacity` meta-token IS permitted — it is the
    // dormant-anchor pin that holds scrollbar presence at base alpha.
    const block = readContrastMoreBlock()!;
    // Negative lookahead — match `--token-accent` NOT followed by `-opacity`.
    expect(/--token-accent(?!-opacity)/.test(block)).toBe(false);
  });

  it('the block carries the // reader-invariant anchor in its comment', () => {
    // Grep-anchor across the codebase — see lib/design/focus.ts.
    // We assert the tag appears in the authoring context preceding the
    // @media rule. The whole file before the rule is the search window —
    // cheap, and robust against comment-length drift.
    const idx = CSS.indexOf('@media (prefers-contrast: more)');
    const preamble = CSS.slice(0, idx);
    expect(preamble).toContain('// reader-invariant');
  });
});
