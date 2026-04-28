/**
 * NextRead · continuity-contract render-shape + source-pin invariants.
 *
 * Pattern lifted from `KeepsakePlate.test.ts` and `ReadProgressCaption.test.ts`:
 * `.ts` (not `.tsx`) so the existing ts-jest preset doesn't need a per-test
 * override. Uses `React.createElement` + `renderToString` — no jsdom.
 *
 * The four-fix continuity refactor (Mike #67, Tanya UX #93) lifts this
 * surface from the prior `if (!visible) return null` unmount into the
 * AmbientNav-precedent opacity-gate. The tests here are the receipt:
 *
 *   1. SSR render shape — the surface is **always mounted** even when
 *      ceremony hasn't fired. The `data-next-read` hook resolves under
 *      a default `idle` provider. The mount IS the test (Mike #67 §"Test
 *      plan" #1). No more "the room blinks" between breathing and
 *      gifting.
 *   2. Hidden-state lattice — at `idle` the wrapper carries `opacity-0`,
 *      `pointer-events-none`, and `aria-hidden="true"`. A keyboard
 *      reader cannot land focus on the invisible link.
 *   3. Source pins — the four bug fixes survive future refactors:
 *      no `useState`, no `useEffect`, no `if (!visible) return null`,
 *      no `animate-fade-in`. The `crossfade-inline` verb is on the
 *      wrapper (sibling to AmbientNav). The two `// alpha-ledger:exempt`
 *      tokens carry the motion-fade-endpoint license inline.
 *   4. Stagger pin — the `delay-[var(--sys-time-hover)]` class is on
 *      the wrapper so the Plate lands first by one `hover` beat
 *      (Tanya UX #93 §4).
 *
 * Credits: Mike K. (#67 napkin §"Test plan" — the six-test acceptance
 * shape, mount-stability framing, the source-pin pattern lifted from
 * `KeepsakePlate.test.ts`), Tanya D. (UX #93 §8 — the eight designer-
 * readable acceptance criteria; criteria 1, 2, 8 are the load-bearing
 * pins this suite enforces), Krystle C. (#56 — the AmbientNav sibling
 * precedent that names what "the room never blinks" means in DOM),
 * Elon M. (#70 — Bugs A/B/C source pins so a future PR can't re-
 * introduce a `useState`/`useEffect`/`animate-fade-in` triplet without
 * flipping this test red on the first jest run).
 */

import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NextRead } from '../NextRead';
import type { Article } from '@/lib/content/ContentTagger';

// ─── Fixture — minimum-viable Article for the SSR shape probe ────────────

const FIXTURE: Article = {
  id: 'test-article-id',
  title: 'A read worth offering',
  content: 'Body copy is irrelevant for the wrapper-shape gate.',
};

const FIXTURE_PROPS = {
  article: FIXTURE,
  context: 'Because you finished the last one.',
  archetype: 'deep-diver' as const,
};

// ─── 1 · SSR render shape — the surface is always mounted ────────────────

describe('NextRead · SSR render shape (mount stability is the test)', () => {
  it('mounts under the default `idle` ceremony — the room never blinks', () => {
    // No `<CeremonySequencer>` → useCeremony returns phase: 'idle'. The
    // surface MUST still render its wrapper; visibility is paint, not
    // structure. This is the headline diff (Mike #67 fix #3).
    const html = renderToString(createElement(NextRead, FIXTURE_PROPS));
    expect(html).toMatch(/data-next-read/);
  });

  it('renders the article title in the offered slot', () => {
    const html = renderToString(createElement(NextRead, FIXTURE_PROPS));
    expect(html).toContain(FIXTURE.title);
  });

  it('renders the WHY context line', () => {
    const html = renderToString(createElement(NextRead, FIXTURE_PROPS));
    expect(html).toContain(FIXTURE_PROPS.context);
  });

  it('routes the CTA to `/article/${id}`', () => {
    const html = renderToString(createElement(NextRead, FIXTURE_PROPS));
    expect(html).toContain(`/article/${FIXTURE.id}`);
  });
});

// ─── 2 · Hidden-state lattice — opacity-0, pointer-events-none, aria-hidden

describe('NextRead · hidden-state lattice (idle phase is unfocusable)', () => {
  it('wrapper carries `opacity-0` at the default `idle` phase', () => {
    const html = renderToString(createElement(NextRead, FIXTURE_PROPS));
    expect(html).toMatch(/opacity-0/);
  });

  it('wrapper carries `pointer-events-none` at the default `idle` phase', () => {
    const html = renderToString(createElement(NextRead, FIXTURE_PROPS));
    expect(html).toMatch(/pointer-events-none/);
  });

  it('wrapper carries `aria-hidden="true"` at the default `idle` phase', () => {
    const html = renderToString(createElement(NextRead, FIXTURE_PROPS));
    expect(html).toMatch(/aria-hidden="true"/);
  });

  it('wrapper does NOT carry `opacity-100` at the default `idle` phase', () => {
    // The visible-state class only fires under gifting/settled. Under
    // idle the only opacity rung on the wrapper is the hidden endpoint.
    const html = renderToString(createElement(NextRead, FIXTURE_PROPS));
    expect(html).not.toMatch(/opacity-100/);
  });
});

// ─── 3 · Source-pin invariants — the four bugs cannot regress ────────────

/**
 * Strip block (`/* … *\/`) and line (`// …`) comments from the source so
 * a docblock that *mentions* the retired patterns (it must, to credit the
 * fix) cannot trip the source-pin scanner. The kernel walker in
 * `lib/design/__tests__/_fence.ts` does this same dance for every fence
 * test on the site; the lift is overkill for two callers — inline a
 * minimal version here.
 */
function stripComments(src: string): string {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '');
  return noBlock.replace(/\/\/.*$/gm, '');
}

describe('NextRead · continuity-contract source pins (Mike #67 four fixes)', () => {
  const RAW = readFileSync(
    join(__dirname, '..', 'NextRead.tsx'),
    'utf8',
  );
  const SRC = stripComments(RAW);

  // Bug A — hooks-order violation retired.
  it('does NOT carry an `if (!article) return null` early return', () => {
    expect(SRC).not.toMatch(/if\s*\(\s*!article\s*\)\s*return\s+null/);
  });

  // Bug B — derived `visible`, no useState/useEffect mirror.
  it('does NOT import `useState` (visible is derived, not stored)', () => {
    expect(SRC).not.toMatch(/\buseState\b/);
  });

  it('does NOT import `useEffect` (no phase mirror, no one-frame delay)', () => {
    expect(SRC).not.toMatch(/\buseEffect\b/);
  });

  it('derives `visible` directly from `phase` (the polymorphism fix)', () => {
    // The shape Mike's napkin §"micro-fixes" #2 names verbatim.
    expect(SRC).toMatch(
      /const\s+visible\s*=\s*phase\s*===\s*['"]gifting['"]\s*\|\|\s*phase\s*===\s*['"]settled['"]/,
    );
  });

  // Bug C — opacity-gate, not unmount.
  it('does NOT carry an `if (!visible) return null` unmount path', () => {
    expect(SRC).not.toMatch(/if\s*\(\s*!visible\s*\)\s*return\s+null/);
  });

  it('the wrapper composes `transition-opacity` (the gate property)', () => {
    expect(SRC).toContain('transition-opacity');
  });

  it('rides the `crossfade-inline` gesture verb (sibling to AmbientNav)', () => {
    // The verb is now imported as the named carrier `CROSSFADE_INLINE` from
    // `lib/design/gestures.ts` (Mike napkin #22 / Krystle rule-of-three lift);
    // the runtime value is byte-equal to `gestureClassesOf('crossfade-inline')`,
    // pinned by `lib/design/__tests__/crossfade-inline-adoption.test.ts`.
    expect(SRC).toMatch(/\bCROSSFADE_INLINE\b/);
  });

  it('imports `CROSSFADE_INLINE` from the canonical seam', () => {
    expect(SRC).toMatch(
      /import\s*\{[^}]*\bCROSSFADE_INLINE\b[^}]*\}\s*from\s*['"]@\/lib\/design\/gestures['"]/,
    );
  });

  // The motion-fade-endpoint license is now carried by the helper file
  // (`lib/design/presence.ts`, path-allow-listed in
  // `ALPHA_MOTION_ENDPOINT_PATHS`) — Mike napkin #18 §2.2 lifted the two
  // inline `// alpha-ledger:exempt` tokens onto the helper. The call site
  // proves continuity-contract adoption by routing through `presenceClassOf`
  // / `presenceAriaHidden` instead.
  it('routes through `presenceClassOf` from `@/lib/design/presence`', () => {
    expect(SRC).toContain("from '@/lib/design/presence'");
    expect(SRC).toContain('presenceClassOf');
    expect(SRC).toContain('presenceAriaHidden');
  });

  it('does NOT carry the raw `opacity-0 pointer-events-none` literal', () => {
    // The endpoint pair lives in the helper, not the call site. One home,
    // three thin call sites (AmbientNav, NextRead, GoldenThread).
    expect(SRC).not.toContain('opacity-0 pointer-events-none');
  });

  // Bug D — single motion channel.
  it('does NOT carry `animate-fade-in` (one motion system per surface)', () => {
    expect(SRC).not.toContain('animate-fade-in');
  });

  // Tanya §4 — staggered arrival rides one `hover` beat after the Plate.
  it('carries `delay-[var(--sys-time-hover)]` for the 200ms Plate stagger', () => {
    expect(SRC).toContain('delay-[var(--sys-time-hover)]');
  });
});

// ─── 4 · Visibility-state branch — pure function over phase ──────────────
//
// The full opacity-100 / aria-hidden=undefined pair fires when phase is
// `gifting` or `settled`. We can't render a Provider here cleanly without
// pulling jsdom; the SSR shape under `idle` is the load-bearing assertion
// for the hidden-state lattice. The visible-state branch is locked by the
// derived-`visible` source pin in the suite above (the one-line equality
// is the entire mechanical proof — Mike #67 §"micro-fixes" #2).

describe('NextRead · phase coverage (the source pin IS the proof)', () => {
  const SRC = stripComments(
    readFileSync(join(__dirname, '..', 'NextRead.tsx'), 'utf8'),
  );

  it('names both visible phases — `gifting` and `settled` — in source', () => {
    // The two-phase OR is the entire visibility predicate. If a future
    // PR drops `settled`, the `gifting → settled` transition would yank
    // the surface — re-introducing the very blink this refactor retires.
    expect(SRC).toContain("'gifting'");
    expect(SRC).toContain("'settled'");
  });

  it('does NOT name `idle`, `breathing`, or `warming` (hidden phases)', () => {
    // Those phases are HIDDEN by construction (the OR omits them). The
    // file shouldn't reference them at all — if it does, someone added a
    // branch that competes with the derived `visible`.
    expect(SRC).not.toMatch(/['"]idle['"]/);
    expect(SRC).not.toMatch(/['"]breathing['"]/);
    expect(SRC).not.toMatch(/['"]warming['"]/);
  });
});
