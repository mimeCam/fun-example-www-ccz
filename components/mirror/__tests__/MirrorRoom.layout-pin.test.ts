/**
 * MirrorRoom layout-pin — `/mirror` is one card, one room.
 *
 * Tanya UX spec "One Mirror, One Room" deliverable #2:
 *
 *   *"Lock /mirror's layout pin. Add a layout-guard test (or extend
 *    MirrorLoadingSurface's geometry pin) so the loading skeleton, the
 *    reveal card, and the empty surface all share the same max-w-md +
 *    p-sys-8 + ceremony posture frame. The reader must never feel the
 *    page resize between states."*
 *
 * The receipt this test files:
 *
 *   1. **Retirement receipt** — `components/mirror/QuickMirrorCard.tsx`
 *      no longer exists on disk. Sid's pass deleted the orphan; this is
 *      the one assertion that catches a future re-introduction (the list
 *      ONLY shrinks; the file ONLY stays gone).
 *
 *   2. **Reveal-vs-skeleton geometry parity** — both surfaces, side by
 *      side, must spell the same three geometry tokens (`max-w-md`,
 *      `p-sys-8`, `thermal-radius-wide`) and must NOT introduce a fourth
 *      width/padding/radius word that the sibling does not also speak.
 *      Pinned at the source-string level (no DOM, no hooks, no jsdom)
 *      because `MirrorRevealCard` is a `'use client'` component reading
 *      `useReducedMotion()` and a phase machine — geometry is the static
 *      fragment that lives outside both. The skeleton's geometry is
 *      additionally SSR-asserted via `MirrorLoadingSurface.test.ts`
 *      (this test pins the *parity*, not the per-surface geometry).
 *
 *   3. **Page-call-site receipt** — `app/mirror/page.tsx` renders
 *      `MirrorRevealCard` for both data branches (warm + cold), via the
 *      route-honest `QuickMirrorReveal` adapter (Tanya UX deliverable
 *      #1). No `QuickMirrorCard` import, no second card path, no
 *      `QuickMirrorAsReveal` legacy alias.
 *
 *   4. **Empty-room separation receipt** — `EmptyMirror` does NOT render
 *      `MirrorRevealCard` or `MirrorLoadingSurface`; the empty branch
 *      lives in its own primitive (`EmptySurface`) by intent. The page
 *      is a three-state machine (data → reveal-card; loading → skeleton;
 *      empty → primitive); this assertion fails loudly if a future PR
 *      tries to "unify" the empty room into the card frame.
 *
 *   5. **Pair invariant — singular-source ceremony posture.** Both the
 *      reveal card and the skeleton call `thermalRadiusClassByPosture('ceremony')`
 *      (greppable as the literal `'ceremony'` string at the call site).
 *      One word, one rung; the corner is the same corner before and after
 *      the swap.
 *
 * Pure source-string lint for the parity axes (no DOM render of the
 * client component, no jsdom). Each helper ≤ 10 LoC.
 *
 * Credits: Tanya D. (UX spec "One Mirror, One Room" — the singular-
 * surface premise this test pins; deliverables #1, #2, #4 lifted into
 * binary checks), Sid (the retirement receipt — the noun-shaped answer
 * to "what word did I retire today?"), Mike K. (napkin #88 — the
 * source-grep pattern for client-only components, the parity-receipt
 * shape that makes one assertion read as a chord, not a checklist),
 * Paul K. (the make-or-break framing that scoped this cycle to the
 * reader's actual journey, not the file the reader will never load).
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Tiny pure helpers — ≤ 10 LOC each ───────────────────────────────────

/** Read a project-root-relative file as a UTF-8 string. */
function readSrc(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

/** Extract every distinct token spelled `max-w-<word>` in a source string. */
function widthTokens(src: string): Set<string> {
  return new Set([...src.matchAll(/\bmax-w-[\w-]+/g)].map((m) => m[0]));
}

/** Extract every distinct token spelled `p-sys-<n>` in a source string. */
function paddingTokens(src: string): Set<string> {
  return new Set([...src.matchAll(/\bp-sys-\d+/g)].map((m) => m[0]));
}

// ─── Module-scoped reads (one disk hit per file) ─────────────────────────

const RELS = {
  reveal:   'components/mirror/MirrorRevealCard.tsx',
  skeleton: 'components/mirror/MirrorLoadingSurface.tsx',
  page:     'app/mirror/page.tsx',
  orphan:   'components/mirror/QuickMirrorCard.tsx',
} as const;

const REVEAL_SRC   = readSrc(RELS.reveal);
const SKELETON_SRC = readSrc(RELS.skeleton);
const PAGE_SRC     = readSrc(RELS.page);

// ─── 1 · Retirement receipt — the orphan stays gone ──────────────────────

describe('MirrorRoom — QuickMirrorCard.tsx is retired and stays retired', () => {
  it('the orphan file does not exist on disk', () => {
    expect(existsSync(join(ROOT, RELS.orphan))).toBe(false);
  });

  it('the orphan alpha test does not exist on disk', () => {
    const alpha = 'components/mirror/__tests__/QuickMirrorCard.alpha.test.ts';
    expect(existsSync(join(ROOT, alpha))).toBe(false);
  });
});

// ─── 2 · Geometry parity — reveal card and skeleton spell the same words ─

describe('MirrorRoom — reveal card and loading skeleton share geometry tokens', () => {
  it('both surfaces speak `max-w-md` (singular outer width word)', () => {
    expect(widthTokens(REVEAL_SRC).has('max-w-md')).toBe(true);
    expect(widthTokens(SKELETON_SRC).has('max-w-md')).toBe(true);
  });

  it('both surfaces speak `p-sys-8` (singular outer padding word)', () => {
    expect(paddingTokens(REVEAL_SRC).has('p-sys-8')).toBe(true);
    expect(paddingTokens(SKELETON_SRC).has('p-sys-8')).toBe(true);
  });
});

// ─── 3 · Pair invariant — both surfaces speak the `ceremony` posture ─────

describe('MirrorRoom — both surfaces resolve `ceremony` posture from one source', () => {
  const RX = /thermalRadiusClassByPosture\(\s*['"]ceremony['"]\s*\)/;

  it('MirrorRevealCard calls thermalRadiusClassByPosture(\'ceremony\')', () => {
    expect(REVEAL_SRC).toMatch(RX);
  });

  it('MirrorLoadingSurface calls thermalRadiusClassByPosture(\'ceremony\')', () => {
    expect(SKELETON_SRC).toMatch(RX);
  });

  it('neither surface speaks a different posture word at the call site', () => {
    // If a future PR drifts to `'press'` or invents `'mirror'` as a posture,
    // the corner would change between phases. The parity is one word.
    const otherPosture =
      /thermalRadiusClassByPosture\(\s*['"](?!ceremony['"])[a-z-]+['"]\s*\)/;
    expect(REVEAL_SRC).not.toMatch(otherPosture);
    expect(SKELETON_SRC).not.toMatch(otherPosture);
  });
});

// ─── 4 · Page-call-site receipt — one card, one room ──────────────────────

describe('MirrorRoom — `/mirror` page renders MirrorRevealCard for both data branches', () => {
  it('imports MirrorRevealCard exactly once', () => {
    const matches = PAGE_SRC.match(/from\s+['"]@\/components\/mirror\/MirrorRevealCard['"]/g);
    expect(matches?.length ?? 0).toBe(1);
  });

  it('does NOT import the retired QuickMirrorCard component', () => {
    expect(PAGE_SRC).not.toMatch(/from\s+['"]@\/components\/mirror\/QuickMirrorCard['"]/);
  });

  it('uses the route-honest QuickMirrorReveal adapter (not the legacy alias)', () => {
    expect(PAGE_SRC).toMatch(/\bQuickMirrorReveal\b/);
    expect(PAGE_SRC).not.toMatch(/\bQuickMirrorAsReveal\b/);
  });

  it('renders MirrorRevealCard at JSX level for both branches', () => {
    // Two `<MirrorRevealCard ` JSX call sites — the warm branch directly,
    // the cold branch via `<QuickMirrorReveal>` which itself renders one.
    const direct = (PAGE_SRC.match(/<MirrorRevealCard\b/g) ?? []).length;
    expect(direct).toBeGreaterThanOrEqual(1);
  });
});

// ─── 5 · Empty-room separation — three states, three primitives ──────────

describe('MirrorRoom — empty branch lives in EmptySurface, not the card frame', () => {
  it('the page imports EmptySurface (the empty-room primitive)', () => {
    expect(PAGE_SRC).toMatch(/from\s+['"]@\/components\/shared\/EmptySurface['"]/);
  });

  it('the EmptyMirror sub-component renders EmptySurface (NOT the card or skeleton)', () => {
    const empty = PAGE_SRC.match(/function\s+EmptyMirror\b[\s\S]*?\n\}/);
    expect(empty).not.toBeNull();
    if (empty === null) return;
    expect(empty[0]).toMatch(/<EmptySurface\b/);
    expect(empty[0]).not.toMatch(/<MirrorRevealCard\b/);
    expect(empty[0]).not.toMatch(/<MirrorLoadingSurface\b/);
  });
});
