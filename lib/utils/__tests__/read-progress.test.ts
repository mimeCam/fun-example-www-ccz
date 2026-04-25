/**
 * read-progress · pure-helper invariants + import-graph moat.
 *
 * Six tests, each pinning a load-bearing property of the Sundial
 * Caption helper:
 *
 *   1. SSR parity — `formatReadProgress(N, 0, false) === '${N} min read'`
 *      so the server output is byte-identical to today's literal.
 *   2. Promise → presence transition at the 15% floor.
 *   3. Terminal latch — `isComplete === true` always wins, even under
 *      reverse scroll.
 *   4. Floor of 1 minute remaining — never `~0 min left`.
 *   5. Purity / no-clock import-graph guard — the helper file MUST NOT
 *      reference `Date`, `setInterval`, `setTimeout`, or `performance`.
 *      The grep is a structural moat (Mike #43 §"Risks").
 *   6. Length test — `formatReadProgress.length === 3`. The arity is
 *      part of the contract; a fourth argument means a different
 *      component.
 *
 * Plus a small block on the boundary helpers (`normalizeDepth`,
 * `readProgressKey`) because they live in the same module and are the
 * surface the component touches.
 *
 * Credits: Mike K. (#43 — six-test set, the no-clock import-graph
 * grep), Tanya D. (#77 — copy rules, the floor-of-1 invariant), Elon M.
 * (referenced — terminal-latch under reverse scroll, fast-flick framing
 * that hardens the keyed-mount pattern).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  formatReadProgress,
  formatPromise,
  formatPresence,
  normalizeDepth,
  readProgressKey,
  READ_PROGRESS_FLOOR,
  MIN_REMAINING,
  TESTIMONY,
  type ReadProgressInput,
} from '../read-progress';

// ─── 1 · SSR parity at maxDepth=0, isComplete=false ──────────────────────

describe('formatReadProgress · state 0 (publisher promise) · SSR parity', () => {
  it('byte-equal to today’s literal at maxDepth=0, isComplete=false', () => {
    expect(formatReadProgress(5, 0, false)).toBe('5 min read');
    expect(formatReadProgress(10, 0, false)).toBe('10 min read');
    expect(formatReadProgress(1, 0, false)).toBe('1 min read');
  });

  it('holds the promise until the floor is *reached* (not just approached)', () => {
    const justBelow: ReadProgressInput = [10, READ_PROGRESS_FLOOR - 0.001, false];
    expect(formatReadProgress(...justBelow)).toBe('10 min read');
  });

  it('uses `formatPromise` directly when state 0 fires (single source)', () => {
    expect(formatReadProgress(7, 0, false)).toBe(formatPromise(7));
  });
});

// ─── 2 · Promise → presence transition at the 15% floor ──────────────────

describe('formatReadProgress · state 1 (reader presence) · floor crossing', () => {
  it('switches at maxDepth=0.15 with the tilde disclaimer', () => {
    expect(formatReadProgress(10, 0.15, false)).toBe('~9 min left');
  });

  it('scales the publisher’s estimate by remaining depth', () => {
    expect(formatReadProgress(10, 0.5, false)).toBe('~5 min left');
    expect(formatReadProgress(20, 0.5, false)).toBe('~10 min left');
  });

  it('uses `formatPresence` directly when state 1 fires (single source)', () => {
    expect(formatReadProgress(8, 0.4, false)).toBe(formatPresence(8, 0.4));
  });
});

// ─── 3 · Terminal latch — isComplete wins under reverse scroll ───────────

describe('formatReadProgress · state 2 (reader testimony) · terminal latch', () => {
  it('renders the four-letter receipt when isComplete=true', () => {
    expect(formatReadProgress(5, 0.99, true)).toBe(TESTIMONY);
    expect(TESTIMONY).toBe('read');
  });

  it('isComplete wins even when maxDepth has scrolled back to mid-article', () => {
    // The reader earned the testimony; reverse scroll does not undo it.
    expect(formatReadProgress(5, 0.4, true)).toBe('read');
    expect(formatReadProgress(5, 0.0, true)).toBe('read');
  });

  it('isComplete=true overrides the 15% floor every time', () => {
    expect(formatReadProgress(5, READ_PROGRESS_FLOOR - 0.01, true)).toBe('read');
  });
});

// ─── 4 · Floor of 1 minute remaining — never `~0 min left` ───────────────

describe('formatReadProgress · MIN_REMAINING floor', () => {
  it('renders `~1 min left` at maxDepth=0.99 until completion latches', () => {
    expect(formatReadProgress(10, 0.99, false)).toBe('~1 min left');
  });

  it('renders `~1 min left` at maxDepth=0.999 — never falls to zero', () => {
    expect(formatReadProgress(5, 0.999, false)).toBe('~1 min left');
  });

  it('respects MIN_REMAINING constant verbatim (no off-by-one)', () => {
    expect(MIN_REMAINING).toBe(1);
    // Even at sub-minute publisher estimates, the disclaimer floors at 1.
    expect(formatReadProgress(1, 0.5, false)).toBe('~1 min left');
  });
});

// ─── 5 · Purity / no-clock import-graph guard ────────────────────────────

/**
 * Strip block comments (`/* … *\/`) and line comments (`//…`) so the
 * grep only inspects the executable surface — JSDoc may legitimately
 * NAME the forbidden tokens to document the moat. Keeps the moat
 * structural without forcing the documentation to invent euphemisms.
 */
function stripComments(src: string): string {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
  return noBlock.replace(/^\s*\/\/.*$/gm, ' ');
}

describe('formatReadProgress · structural purity · the moat', () => {
  const RAW = readFileSync(
    join(__dirname, '..', 'read-progress.ts'),
    'utf8',
  );
  const CODE = stripComments(RAW);

  it('does NOT reference `Date` in executable code (no calendar)', () => {
    expect(CODE).not.toMatch(/\bDate\b/);
  });

  it('does NOT reference `setInterval` in executable code', () => {
    expect(CODE).not.toMatch(/\bsetInterval\b/);
  });

  it('does NOT reference `setTimeout` in executable code', () => {
    expect(CODE).not.toMatch(/\bsetTimeout\b/);
  });

  it('does NOT reference `performance` in executable code', () => {
    expect(CODE).not.toMatch(/\bperformance\b/);
  });

  it('does NOT call any global `.now()` clock in executable code', () => {
    // `Date.now()`, `performance.now()`, etc. — the receiver is gone
    // already by the prior assertions, but the call shape itself is
    // also forbidden.
    expect(CODE).not.toMatch(/\.now\s*\(/);
  });
});

// ─── 6 · Length / arity — the signature is part of the contract ──────────

describe('formatReadProgress · arity', () => {
  it('takes exactly three positional arguments', () => {
    expect(formatReadProgress.length).toBe(3);
  });
});

// ─── Boundary helpers — the seam the component touches ───────────────────

describe('normalizeDepth · 0..100 → 0..1 boundary adapter', () => {
  it('clamps negative to 0', () => {
    expect(normalizeDepth(-10)).toBe(0);
  });

  it('clamps >=100 to 1', () => {
    expect(normalizeDepth(100)).toBe(1);
    expect(normalizeDepth(150)).toBe(1);
  });

  it('passes through mid-range values verbatim', () => {
    expect(normalizeDepth(50)).toBe(0.5);
    expect(normalizeDepth(15)).toBe(0.15);
  });

  it('returns 0 for non-finite inputs (defensive — never advance into a state)', () => {
    expect(normalizeDepth(NaN)).toBe(0);
    // `Infinity` is NOT clamped to 1 — the caption refuses to honor a
    // garbage depth by promoting state. Returns 0 (state-0 promise).
    expect(normalizeDepth(Infinity)).toBe(0);
    expect(normalizeDepth(-Infinity)).toBe(0);
  });
});

describe('readProgressKey · stable React key per state', () => {
  it('returns `promise` below the floor', () => {
    expect(readProgressKey(0, false)).toBe('promise');
    expect(readProgressKey(0.1, false)).toBe('promise');
  });

  it('returns `presence` at and above the floor', () => {
    expect(readProgressKey(READ_PROGRESS_FLOOR, false)).toBe('presence');
    expect(readProgressKey(0.5, false)).toBe('presence');
  });

  it('returns `testimony` whenever isComplete=true (latched)', () => {
    expect(readProgressKey(0.0, true)).toBe('testimony');
    expect(readProgressKey(0.5, true)).toBe('testimony');
    expect(readProgressKey(0.99, true)).toBe('testimony');
  });
});
