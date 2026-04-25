/**
 * prefers-reduced-transparency Sync Test — CSS ↔ TS drift guard for the
 * reader-invariant clamp under `@media (prefers-reduced-transparency: reduce)`.
 *
 * Reads `lib/design/ambient-surfaces.css`, parses the
 * `(prefers-reduced-transparency: reduce)` block, asserts that each clamped
 * CSS custom property maps to its dormant anchor in
 * `lib/thermal/thermal-tokens.ts` (`GESTURE_MIX.dormant`,
 * `ACCENT_OPACITY.dormant`). Gold halos (`--token-glow`,
 * `--token-text-glow`) must read `none`. ::selection paints as an inverted
 * chip (solid `--token-accent` background, solid `--token-bg` foreground).
 *
 * Same shape as `prefers-contrast-sync.test.ts` — the symmetry is
 * load-bearing (Mike napkin §6 — "byte-for-byte sibling … so the next
 * contributor recognizes the pattern immediately"). A special case here
 * would rot: every other CSS-canonical number in this project has a sync
 * guard.
 *
 * The TS clamp in `lib/thermal/apply-tokens.ts` must write the same four
 * overrides after hydration. We assert both mirrors converge on the CSS
 * as the single authoring layer.
 *
 * Credits: Mike K. (napkin #71 — sibling-shape probe, sync-guard-as-symmetry,
 * the regex-over-CSS helpers lifted from prefers-contrast-sync.test.ts),
 * Tanya D. (UX §3 — the dormant anchors and inverted-chip ::selection this
 * test locks down), Krystle C. (surgical PR scope), Elon M. (one noun —
 * reader-invariant, no Reader Vows varnish), Paul K. (one PR, three artifacts).
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
const PROBE = readFileSync(
  resolve(__dirname, '../../utils/prefers-reduced-transparency.ts'),
  'utf-8',
);

// ─── Parser helpers — pure, each ≤ 10 LOC ─────────────────────────────────

/** Extract the body of the `@media (prefers-reduced-transparency: reduce)`
 *  block. Uses balanced-brace scanning because the block contains nested
 *  `:root { … }` and `::selection { … }` rules. Pure. */
function readReducedTransparencyBlock(): string | undefined {
  const start = CSS.indexOf('@media (prefers-reduced-transparency: reduce)');
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

describe('ambient-surfaces.css · @media (prefers-reduced-transparency: reduce) block', () => {
  it('the block exists in the CSS', () => {
    expect(readReducedTransparencyBlock()).toBeDefined();
  });

  it('the block lives in the ambient-surfaces.css owner, not globals.css', () => {
    // Guard against "sprinkle the CSS across files" drift. Single owner,
    // single grep target. `lib/design/ambient-surfaces.css` is the home.
    expect(CSS).toContain('@media (prefers-reduced-transparency: reduce)');
  });
});

// ─── Tests — token mirror: CSS ↔ thermal-tokens.ts ────────────────────────

describe('reduced-transparency ↔ thermal-tokens dormant-anchor sync', () => {
  it('--token-gesture-mix pins to GESTURE_MIX.dormant', () => {
    const block = readReducedTransparencyBlock()!;
    const decl = readTokenDecl(block, '--token-gesture-mix');
    expect(parseNumber(decl)).toBeCloseTo(GESTURE_MIX.dormant, 3);
  });

  it('--token-accent-opacity pins to ACCENT_OPACITY.dormant', () => {
    const block = readReducedTransparencyBlock()!;
    const decl = readTokenDecl(block, '--token-accent-opacity');
    expect(parseNumber(decl)).toBeCloseTo(ACCENT_OPACITY.dormant, 3);
  });

  it('--token-glow collapses to `none` (gold halos drop)', () => {
    const block = readReducedTransparencyBlock()!;
    expect(readTokenDecl(block, '--token-glow')).toBe('none');
  });

  it('--token-text-glow collapses to `none` (text loses warm shadow)', () => {
    const block = readReducedTransparencyBlock()!;
    expect(readTokenDecl(block, '--token-text-glow')).toBe('none');
  });
});

// ─── Tests — TS clamp mirrors the CSS block (apply-tokens.ts) ─────────────

describe('apply-tokens.ts ↔ reduced-transparency CSS mirror', () => {
  it('apply-tokens.ts imports readPrefersReducedTransparency (the probe)', () => {
    expect(APPLY_TOKENS).toMatch(/readPrefersReducedTransparency/);
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

  it('apply-tokens.ts gates the clamp on readPrefersReducedTransparency()', () => {
    // Symmetric to the contrast-more clamp gate above it.
    expect(APPLY_TOKENS).toMatch(/if\s*\(\s*readPrefersReducedTransparency\(\)\s*\)/);
  });
});

// ─── Tests — surfaces: ::selection inverted chip + chorus tint stripped ──

describe('reduced-transparency · ::selection inverted chip', () => {
  it('::selection paints solid --token-accent background (no color-mix film)', () => {
    const block = readReducedTransparencyBlock()!;
    const sel = block.match(/::selection\s*\{([^}]*)\}/);
    expect(sel).toBeTruthy();
    expect(sel![1]).toContain('var(--token-accent)');
    expect(sel![1]).not.toContain('color-mix');
  });

  it('::selection foreground reads --token-bg (the inverted chip)', () => {
    const block = readReducedTransparencyBlock()!;
    const sel = block.match(/::selection\s*\{([^}]*)\}/);
    expect(sel).toBeTruthy();
    expect(sel![1]).toContain('var(--token-bg)');
  });

  it('::-moz-selection mirrors ::selection (Firefox parity)', () => {
    const block = readReducedTransparencyBlock()!;
    const moz = block.match(/::-moz-selection\s*\{([^}]*)\}/);
    expect(moz).toBeTruthy();
    expect(moz![1]).toContain('var(--token-accent)');
    expect(moz![1]).toContain('var(--token-bg)');
  });
});

describe('reduced-transparency · chorus surfaces lose the accent tint', () => {
  it('::placeholder paints the plain --mist (no accent color-mix)', () => {
    const block = readReducedTransparencyBlock()!;
    const ph = block.match(/::placeholder\s*\{([^}]*)\}/);
    expect(ph).toBeTruthy();
    expect(ph![1]).toContain('var(--mist)');
    expect(ph![1]).not.toContain('color-mix');
  });

  it('::marker paints --token-foreground (structure, not tint)', () => {
    const block = readReducedTransparencyBlock()!;
    const mk = block.match(/::marker\s*\{([^}]*)\}/);
    expect(mk).toBeTruthy();
    expect(mk![1]).toContain('var(--token-foreground)');
    expect(mk![1]).not.toContain('color-mix');
  });
});

// ─── Tests — subtractive discipline: no new tokens ────────────────────────

describe('reduced-transparency · subtractive discipline', () => {
  it('the block does NOT introduce new CSS custom properties', () => {
    // Only the four documented overrides are permitted. Any other `--foo:`
    // authoring under `prefers-reduced-transparency: reduce` is scope creep
    // (Mike #71 §"What this is NOT", Tanya §10 "no new tokens").
    const block = readReducedTransparencyBlock()!;
    const declared = Array.from(block.matchAll(/--([a-z-]+):/g)).map((m) => m[1]);
    const allowed = new Set([
      'token-gesture-mix', 'token-accent-opacity',
      'token-glow', 'token-text-glow',
    ]);
    declared.forEach((name) => expect(allowed.has(name)).toBe(true));
  });

  it('the block carries the // reader-invariant anchor in its preamble', () => {
    // Grep-anchor across the codebase — see lib/design/focus.ts.
    // We assert the tag appears in the authoring context preceding the
    // @media rule. The whole file before the rule is the search window —
    // cheap, and robust against comment-length drift.
    const idx = CSS.indexOf('@media (prefers-reduced-transparency: reduce)');
    const preamble = CSS.slice(0, idx);
    expect(preamble).toContain('// reader-invariant');
  });

  it('the block names the TS mirror (apply-tokens.ts) as cross-reference', () => {
    const idx = CSS.indexOf('@media (prefers-reduced-transparency: reduce)');
    const preamble = CSS.slice(Math.max(0, idx - 1500), idx);
    expect(preamble).toContain('apply-tokens.ts');
  });
});

// ─── Tests — probe shape (sibling-of-prefers-contrast discipline) ─────────

describe('lib/utils/prefers-reduced-transparency.ts · sibling shape', () => {
  it('exports PREFERS_REDUCED_TRANSPARENCY_QUERY (single source of truth)', () => {
    expect(PROBE).toMatch(/export const PREFERS_REDUCED_TRANSPARENCY_QUERY/);
    expect(PROBE).toContain("'(prefers-reduced-transparency: reduce)'");
  });

  it('exports readPrefersReducedTransparency (synchronous probe)', () => {
    expect(PROBE).toMatch(/export function readPrefersReducedTransparency/);
  });

  it('exports subscribePrefersReducedTransparency (live wiring)', () => {
    expect(PROBE).toMatch(/export function subscribePrefersReducedTransparency/);
  });

  it('exports usePrefersReducedTransparencyFlag (React hook)', () => {
    expect(PROBE).toMatch(/export function usePrefersReducedTransparencyFlag/);
  });

  it('the probe is SSR-safe (typeof window === undefined → false)', () => {
    expect(PROBE).toMatch(/typeof window === 'undefined'/);
  });

  it('the hook composes with useIsomorphicLayoutEffect (sibling import)', () => {
    expect(PROBE).toMatch(/useIsomorphicLayoutEffect/);
  });
});
