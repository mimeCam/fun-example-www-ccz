/**
 * useCeremonyQuiet — module-surface invariants we can prove without jsdom.
 *
 * The React hook itself is a thin `useSyncExternalStore` wrapper around the
 * `quiet-store` singleton — the unit semantics live in
 * `lib/ceremony/__tests__/quiet-store.test.ts`. This file's job is to
 * keep the hook's *contract* honest:
 *
 *   1. The export exists and is a function (so call sites compile).
 *   2. The hook subscribes via `useSyncExternalStore` (no ad-hoc state),
 *      which is what makes it readable from `<ToastHost>` mounted *above*
 *      `<CeremonySequencer>` in the React tree (the architecture problem
 *      §3 of the napkin called out implicitly).
 *   3. The hook reads from `lib/ceremony/quiet-store.ts` — NOT from
 *      `useCeremony().phase` directly. If a future contributor "simplifies"
 *      back to context, this fence catches them.
 *
 * Test idiom mirrors `useThreshold.test.ts` — module surface + source-file
 * structural assertions, no jsdom.
 *
 * Credits: Mike K. (napkin §3 — useSyncExternalStore reuse), Tanya D. (UX
 * §7 — naming honest to the engineer's grep path), Elon M. (suppression
 * by construction — the hook is the construction).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { useCeremonyQuiet } from '../useCeremonyQuiet';

/** Erase comment bodies so prose mentions don't false-positive structural regexes. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
}

const RAW  = readFileSync(join(__dirname, '..', 'useCeremonyQuiet.ts'), 'utf8');
const SRC  = stripComments(RAW);
// Use RAW for the "use client" assertion (it is the first non-blank line and
// trivially survives comment-stripping; using RAW keeps the regex unsurprising).
const HEAD = RAW;

// ─── Module surface ─────────────────────────────────────────────────────────

describe('useCeremonyQuiet — module surface', () => {
  it('exports the hook as a function', () => {
    expect(typeof useCeremonyQuiet).toBe('function');
  });

  it('takes zero arguments — one predicate, no parameters', () => {
    expect(useCeremonyQuiet.length).toBe(0);
  });
});

// ─── Wiring (source-file structural fences) ─────────────────────────────────

describe('useCeremonyQuiet — wired through useSyncExternalStore + quiet-store', () => {
  it('imports useSyncExternalStore from react (not a custom subscribe loop)', () => {
    expect(SRC).toMatch(/import\s*\{[^}]*\buseSyncExternalStore\b[^}]*\}\s*from\s*['"]react['"]/);
  });

  it('reads from @/lib/ceremony/quiet-store (the canonical pub/sub)', () => {
    expect(SRC).toMatch(/from\s+['"]@\/lib\/ceremony\/quiet-store['"]/);
    expect(SRC).toMatch(/\bsubscribeCeremonyQuiet\b/);
    expect(SRC).toMatch(/\bgetCeremonyQuiet\b/);
    expect(SRC).toMatch(/\bgetCeremonyQuietServerSnapshot\b/);
  });

  it('does NOT depend on useCeremony() context (would always read idle from ToastHost)', () => {
    expect(SRC).not.toMatch(/useCeremony\s*\(/);
    expect(SRC).not.toMatch(/from\s+['"]@\/components\/reading\/CeremonySequencer['"]/);
  });

  it('uses the "use client" directive — required for React hooks in App Router', () => {
    expect(HEAD).toMatch(/^['"]use client['"];/m);
  });
});

// ─── Naming discipline (Tanya §7 / Mike §6.7) ───────────────────────────────

describe('useCeremonyQuiet — sealed naming surface', () => {
  it('the file does not export aliases (no useGiftingActive, no <Quiet> wrapper)', () => {
    const exports = SRC.match(/^\s*export\s+(?:function|const|class)\s+(\w+)/gm) ?? [];
    const names = exports.map((e) => e.replace(/^\s*export\s+(?:function|const|class)\s+/, ''));
    expect(names).toEqual(['useCeremonyQuiet']);
  });
});
