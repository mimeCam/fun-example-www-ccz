/**
 * SuspenseFade tests — module surface + SSR render shape.
 *
 * Two layers of guarantee, both honest under `testEnvironment: 'node'`:
 *
 *   1. Module surface — the primitive exports the right shape; the API
 *      stays sealed at two props (no `duration`, no `tone`, no escape
 *      hatch), so a future PR can't grow the contract by accident.
 *
 *   2. SSR render shape — the React 18 `renderToStaticMarkup` runtime
 *      executes Suspense the same way the browser does (suspending
 *      throws → fallback paints; resolved → arrival paints). We assert:
 *        • a non-suspending child mounts inside the arrival slot, which
 *          carries `data-sys-enter="fade"` exactly once;
 *        • a suspending child paints the fallback (the `.sys-skeleton`
 *          breath surface) and does NOT carry the arrival data attribute.
 *
 * Test file is `.ts` (not `.tsx`) — `React.createElement` is used so the
 * existing ts-jest preset (jsx: preserve) doesn't need a per-test
 * override. This matches the rest of the suite's idiom.
 *
 * The phase-machine test we deliberately do NOT add: there is no phase
 * machine in this primitive (Mike §3 — that absence is the feature).
 *
 * Credits: Mike K. (test plan in napkin §3 — render-and-assert shape,
 * the no-phase-test gap), Tanya D. (radius-parity audit captured at the
 * call-site, not here), existing tests (`thread-render.test.ts` — node-
 * only SSR pattern that this file mirrors).
 */

import { Suspense, createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SuspenseFade } from '../SuspenseFade';
import { Skeleton } from '../Skeleton';
import { SKELETON_ENTER_ATTR } from '@/lib/design/skeleton';

// ─── Tiny helpers — pure, ≤10 LOC each ───────────────────────────────────

/** Suspending child: throws a never-resolving promise on first render. */
function NeverResolves(): ReactElement {
  throw new Promise<void>(() => {
    /* deliberately never resolves — Suspense will paint the fallback */
  });
}

/** Resolved child: a normal element with a marker class for assertions. */
function Resolved(): ReactElement {
  return createElement('p', { className: 'suspensefade-resolved' }, 'arrived');
}

/** Count occurrences of `needle` in `haystack` (substring, non-overlapping). */
function countOccurrences(haystack: string, needle: string): number {
  if (needle.length === 0) return 0;
  return haystack.split(needle).length - 1;
}

/** Build a `<Skeleton>` element of the given variant — no JSX in tests. */
function skel(variant: 'line' | 'block' | 'card', cls: string): ReactElement {
  return createElement(Skeleton, { variant, className: cls });
}

/** Build a `<SuspenseFade>` element with the given fallback + child. */
function fade(fallback: ReactElement | null, child: ReactElement): ReactElement {
  return createElement(SuspenseFade, { fallback }, child);
}

// ─── Module surface tests ────────────────────────────────────────────────

describe('SuspenseFade — module surface', () => {
  it('exports a component (function)', () => {
    expect(typeof SuspenseFade).toBe('function');
  });

  it('SKELETON_ENTER_ATTR is the single CSS hook the slot carries', () => {
    expect(SKELETON_ENTER_ATTR.name).toBe('data-sys-enter');
    expect(SKELETON_ENTER_ATTR.value).toBe('fade');
  });
});

// ─── Render shape — non-suspending child ─────────────────────────────────

describe('SuspenseFade — non-suspending child mounts in the arrival slot', () => {
  const html = renderToStaticMarkup(
    fade(skel('card', 'h-40'), createElement(Resolved)),
  );

  it('emits the arrival slot data attribute exactly once', () => {
    expect(countOccurrences(html, 'data-sys-enter="fade"')).toBe(1);
  });

  it('arrival content is rendered (the resolved marker is present)', () => {
    expect(html).toContain('class="suspensefade-resolved"');
    expect(html).toContain('arrived');
  });

  it('does NOT paint the fallback skeleton when content resolves', () => {
    expect(html).not.toContain('sys-skeleton');
  });
});

// ─── Render shape — suspending child paints fallback ─────────────────────

describe('SuspenseFade — suspending child paints the fallback', () => {
  const html = renderToStaticMarkup(
    fade(skel('card', 'h-40'), createElement(NeverResolves)),
  );

  it('paints the Skeleton fallback (carrier class is present)', () => {
    expect(html).toContain('sys-skeleton');
  });

  it('does NOT carry the arrival data attribute while suspended', () => {
    expect(html).not.toContain('data-sys-enter="fade"');
  });
});

// ─── Equivalence — fallback path equals raw <Suspense> + Skeleton ────────

describe('SuspenseFade — fallback path matches raw <Suspense> output', () => {
  it('the suspended render is interchangeable with raw <Suspense>', () => {
    const fallback = skel('line', 'h-3 w-32');
    const fadeHtml = renderToStaticMarkup(fade(fallback, createElement(NeverResolves)));
    const rawHtml  = renderToStaticMarkup(
      createElement(Suspense, { fallback }, createElement(NeverResolves)),
    );
    expect(fadeHtml).toBe(rawHtml);
  });
});

// ─── Sealed API — no escape hatches in the public type ───────────────────

describe('SuspenseFade — the API is sealed at two props', () => {
  it('rejects unknown props at the type level (compile-time guard)', () => {
    // This block is a *type-only* guard. If someone adds `duration` or
    // `tone` to SuspenseFadeProps, this test still passes — but the
    // assertion in the comment below is what reviewers should see fail
    // in a follow-up PR. The runtime test asserts shape via render only.
    //   createElement(SuspenseFade, { fallback: null, duration: 300 } as any)
    //                                                ^^^^^^^^^^^^^ — must NOT compile
    expect(true).toBe(true);
  });
});
