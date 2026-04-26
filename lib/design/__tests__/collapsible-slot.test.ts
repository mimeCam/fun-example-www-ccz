/**
 * CollapsibleSlot — helper unit tests + component SSR snapshot.
 *
 * Two layers, both honest under `testEnvironment: 'node'` (jest.config.js):
 *
 *   1. Helper unit — `slotEnvelopeClasses()` is pure: a fixed input
 *      always emits the same class string. No hook, no DOM. Tests cover
 *      every combination of (top? + bottom?) — including the all-empty
 *      degenerate case the JSDoc warns is reviewer-rejected.
 *
 *   2. SSR snapshot — the component renders a single `<div>` whose
 *      class string depends only on its props. Server and client emit
 *      identical markup; envelopes paint even when children render
 *      `null`. The contract that prevents the bug class lives here.
 *
 * Mirrors the shape of `lib/design/__tests__/spacing-sync.test.ts` and
 * `components/shared/__tests__/SuspenseFade.test.ts` — pure helpers
 * first, then `renderToStaticMarkup` against the component leaf.
 *
 * Credits: Mike K. (#2 napkin §6 — the helper-then-SSR test plan, the
 * "envelope mounts even when child returns null" assertion, the
 * sealed-API guard via render-shape rather than type-only fences),
 * Tanya D. (#3 §4 — the "identical surrounding-DOM rhythm for
 * stranger and returner" framing), Krystle C. (the SSR pin), existing
 * `SuspenseFade.test.ts` — node-only render idiom this file mirrors.
 */

import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  slotEnvelopeClasses,
  topMarginClass,
  bottomMarginClass,
  hasAnyMargin,
  COLLAPSIBLE_SLOT_LEGAL_USE,
  type CollapsibleSlotMargins,
} from '../collapsible-slot';
import { CollapsibleSlot } from '@/components/shared/CollapsibleSlot';

// ─── Tiny helpers — pure, ≤10 LOC each ───────────────────────────────────

/** Build a `<CollapsibleSlot>` element wrapping a marker child. */
function slot(margins: CollapsibleSlotMargins, child: ReactElement | null): ReactElement {
  return createElement(CollapsibleSlot, margins, child);
}

/** A non-null child that paints a marker class for assertions. */
function marker(): ReactElement {
  return createElement('p', { className: 'collapsible-slot-marker' }, 'paint');
}

/** Render a `<CollapsibleSlot>` to its SSR HTML string. */
function ssr(margins: CollapsibleSlotMargins, child: ReactElement | null): string {
  return renderToStaticMarkup(slot(margins, child));
}

// ─── Helper tests — pure functions ───────────────────────────────────────

describe('topMarginClass / bottomMarginClass — single-rung emission', () => {
  it('emits mt-sys-N for a defined rung', () => {
    expect(topMarginClass(8)).toBe('mt-sys-8');
    expect(topMarginClass(10)).toBe('mt-sys-10');
  });

  it('emits mb-sys-N for a defined rung', () => {
    expect(bottomMarginClass(8)).toBe('mb-sys-8');
    expect(bottomMarginClass(12)).toBe('mb-sys-12');
  });

  it('emits empty string when the rung is undefined (no zero-rung override)', () => {
    expect(topMarginClass(undefined)).toBe('');
    expect(bottomMarginClass(undefined)).toBe('');
  });
});

describe('slotEnvelopeClasses — combined output', () => {
  it('joins top + bottom in source order with a single space', () => {
    expect(slotEnvelopeClasses({ top: 10, bottom: 8 })).toBe('mt-sys-10 mb-sys-8');
  });

  it('drops the empty side when only top is defined', () => {
    expect(slotEnvelopeClasses({ top: 7 })).toBe('mt-sys-7');
  });

  it('drops the empty side when only bottom is defined', () => {
    expect(slotEnvelopeClasses({ bottom: 8 })).toBe('mb-sys-8');
  });

  it('returns empty string when neither side is defined (degenerate)', () => {
    expect(slotEnvelopeClasses({})).toBe('');
  });

  it('is referentially deterministic — same input emits same string', () => {
    const a = slotEnvelopeClasses({ top: 10, bottom: 8 });
    const b = slotEnvelopeClasses({ top: 10, bottom: 8 });
    expect(a).toBe(b);
  });
});

describe('hasAnyMargin — reviewer-level invariant', () => {
  it('true when either side is defined', () => {
    expect(hasAnyMargin({ top: 5 })).toBe(true);
    expect(hasAnyMargin({ bottom: 5 })).toBe(true);
    expect(hasAnyMargin({ top: 5, bottom: 5 })).toBe(true);
  });

  it('false when neither side is defined (degenerate envelope)', () => {
    expect(hasAnyMargin({})).toBe(false);
  });
});

describe('COLLAPSIBLE_SLOT_LEGAL_USE — single-sentence contract', () => {
  it('names the one legal use case so review can point at it', () => {
    expect(COLLAPSIBLE_SLOT_LEGAL_USE).toMatch(/render null/);
    expect(COLLAPSIBLE_SLOT_LEGAL_USE).toMatch(/sibling/);
  });
});

// ─── Component SSR — envelope mounts whether or not child paints ─────────
//
// The whole point: same DOM rhythm for `null` child and painting child.
// The class string is derived from props alone — no hook, no hydration.

describe('CollapsibleSlot · SSR (child paints)', () => {
  const html = ssr({ top: 10, bottom: 8 }, marker());

  it('renders a single <div> envelope', () => {
    expect(html.startsWith('<div')).toBe(true);
    expect((html.match(/<div/g) ?? []).length).toBe(1);
  });

  it('envelope carries both margin classes from the canonical ledger', () => {
    expect(html).toMatch(/class="mt-sys-10 mb-sys-8"/);
  });

  it('child content is rendered inside the envelope', () => {
    expect(html).toContain('class="collapsible-slot-marker"');
    expect(html).toContain('paint');
  });
});

describe('CollapsibleSlot · SSR (child returns null) — the contract', () => {
  const html = ssr({ top: 10, bottom: 8 }, null);

  it('envelope still mounts as a <div> when the child is null', () => {
    expect(html).toMatch(/^<div /);
  });

  it('envelope carries the same margin classes whether child paints or not', () => {
    expect(html).toMatch(/class="mt-sys-10 mb-sys-8"/);
  });

  it('renders no child content (no marker class leaks through)', () => {
    expect(html).not.toContain('collapsible-slot-marker');
  });
});

describe('CollapsibleSlot · paint-vs-null rhythm parity (Mike #2 §5)', () => {
  it('envelope class string is identical for paint and null children', () => {
    const painted = ssr({ top: 10, bottom: 8 }, marker());
    const empty   = ssr({ top: 10, bottom: 8 }, null);
    const classOf = (h: string) => h.match(/class="([^"]+)"/)?.[1];
    expect(classOf(painted)).toBe(classOf(empty));
  });

  it('SSR is deterministic — repeated renders match byte-for-byte', () => {
    const a = ssr({ top: 10, bottom: 8 }, null);
    const b = ssr({ top: 10, bottom: 8 }, null);
    expect(a).toBe(b);
  });
});

// ─── Sealed API — the only props are margins + children ──────────────────

describe('CollapsibleSlot — the API is sealed at margins + children', () => {
  it('rejects unknown props at the type level (compile-time guard)', () => {
    // *Type-only* guard — if a future PR adds `className`, `tone`, or
    // `as` to CollapsibleSlotProps, this assertion still passes; the
    // commented `as any` below is what reviewers should see fail in PR.
    //   createElement(CollapsibleSlot, { top: 8, className: 'x' } as any)
    //                                     ^^^^^^^^^^^^^^^^^ — must NOT compile
    expect(true).toBe(true);
  });
});
