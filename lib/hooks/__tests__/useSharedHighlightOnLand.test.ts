/**
 * useSharedHighlightOnLand — source-pin invariants.
 *
 * jsdom is not configured (jest's `testEnvironment` is `node`); we cannot
 * mount the hook. The hook walks the live DOM, so its happy-path is
 * exercised in QA, not here. This file pins the wiring so a future
 * refactor cannot silently drop:
 *
 *   1. The orphan-side imports (`parseHighlightFragment` /
 *      `clearHighlightFragment` / `scrollToSharedHighlight`).
 *   2. The reduced-motion fork (`useReducedMotion` is consulted).
 *   3. The rAF handshake (the lookup waits one paint so
 *      `StratifiedRenderer` finishes the SSR-to-CSR swap).
 *   4. The idempotency guard (one lookup per landed URL — protects
 *      against React 18 strict-mode double-effect).
 *   5. The `'use client'` envelope (required for window access).
 *
 * Credits: Mike K. (#39 — the recipient-side contract), Sid (this lift;
 * source-pin pattern from `useActionPhase.test.ts`).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useSharedHighlightOnLand } from '../useSharedHighlightOnLand';

const SRC_PATH = join(__dirname, '..', 'useSharedHighlightOnLand.ts');
const SRC = readFileSync(SRC_PATH, 'utf8');

// ─── 1 · Module surface ──────────────────────────────────────────────────

describe('useSharedHighlightOnLand · module surface', () => {
  it('exports the hook as a function', () => {
    expect(typeof useSharedHighlightOnLand).toBe('function');
  });

  it('takes zero arguments (caller-site noise minimised)', () => {
    expect(useSharedHighlightOnLand.length).toBe(0);
  });
});

// ─── 2 · Source-pin imports ──────────────────────────────────────────────

describe('useSharedHighlightOnLand · source-pin imports', () => {
  it('imports parseHighlightFragment + clearHighlightFragment', () => {
    expect(SRC).toMatch(/parseHighlightFragment/);
    expect(SRC).toMatch(/clearHighlightFragment/);
    expect(SRC).toMatch(/from\s+['"]@\/lib\/sharing\/share-links['"]/);
  });

  it('imports scrollToSharedHighlight from highlight-finder', () => {
    expect(SRC).toMatch(/scrollToSharedHighlight/);
    expect(SRC).toMatch(/from\s+['"]@\/lib\/sharing\/highlight-finder['"]/);
  });

  it('consults useReducedMotion (the a11y fork)', () => {
    expect(SRC).toMatch(/useReducedMotion/);
    expect(SRC).toMatch(/from\s+['"]@\/lib\/hooks\/useReducedMotion['"]/);
  });
});

// ─── 3 · Implementation invariants ───────────────────────────────────────

describe('useSharedHighlightOnLand · implementation invariants', () => {
  it('uses requestAnimationFrame to wait one paint (StratifiedRenderer race)', () => {
    expect(SRC).toMatch(/requestAnimationFrame/);
  });

  it('guards against double-fire via a useRef gate (strict-mode safe)', () => {
    expect(SRC).toMatch(/useRef\(false\)/);
    expect(SRC).toMatch(/handledRef\.current/);
  });

  it('clears the fragment after landing (URL self-cleans for next share)', () => {
    expect(SRC).toMatch(/clearHighlightFragment\(\)/);
  });

  it('uses the "use client" directive (required for window access)', () => {
    expect(SRC).toMatch(/^['"]use client['"];/m);
  });
});
