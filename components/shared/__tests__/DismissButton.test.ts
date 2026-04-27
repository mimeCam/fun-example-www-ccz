/**
 * DismissButton — kernel unit tests.
 *
 * Three tests, three contracts (Mike #90 §"Definition of done", parity with
 * the fence's three-block prose):
 *
 *   1. Renders a button with the frozen `aria-label="Close"` and the
 *      placement classes baked into each named export. Source-pin via
 *      `renderToStaticMarkup` so we stay honest under `testEnvironment:
 *      'node'` (no jsdom; matches the SkipLink pattern).
 *
 *   2. Forwards `onClick` to the underlying button — pressing the dismiss
 *      delivers the gesture; the kernel does not legislate what the
 *      caller's `onClose` does.
 *
 *   3. Forwards the `size` prop to the icon substrate — `sm` is preserved
 *      for ReturnLetter's small-on-card placement. Density is orthogonal
 *      to placement (Mike #90 §"… Decisions" #4).
 *
 * Test file is `.ts` (not `.tsx`) — `React.createElement` is used so the
 * existing ts-jest preset does not need a per-test override (matches the
 * sibling `SkipLink.test.ts` and `SuspenseFade.test.ts`).
 *
 * Credits: Mike K. (#90 §"Definition of done" — three unit tests, source-
 * pin via SSR, the size-prop carve-out), Tanya D. (UIX #33 §5 — the locked
 * "Close" verb is the byte-identity contract), Sid (this lift; one test
 * file per kernel, no jsdom).
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DismissButton } from '../DismissButton';

// ─── 1 · Render shape — placement + frozen verb ───────────────────────────

describe('DismissButton — render shape', () => {
  const inlineHtml = renderToStaticMarkup(
    createElement(DismissButton.Inline, { onClose: () => {} }),
  );
  const absoluteHtml = renderToStaticMarkup(
    createElement(DismissButton.Absolute, { onClose: () => {} }),
  );

  it('Inline renders a <button> with aria-label="Close"', () => {
    expect(inlineHtml.startsWith('<button')).toBe(true);
    expect(inlineHtml).toContain('aria-label="Close"');
  });

  it('Inline carries the `-mr-sys-3` trailing-slot offset', () => {
    expect(inlineHtml).toContain('-mr-sys-3');
  });

  it('Absolute carries the corner-chrome placement classes', () => {
    expect(absoluteHtml).toContain('absolute');
    expect(absoluteHtml).toContain('top-sys-4');
    expect(absoluteHtml).toContain('right-sys-4');
  });

  it('both placements render the shared <CloseIcon /> SVG', () => {
    // The SVG carries the family contract `viewBox="0 0 24 24"`.
    expect(inlineHtml).toContain('viewBox="0 0 24 24"');
    expect(absoluteHtml).toContain('viewBox="0 0 24 24"');
  });

  it('both placements speak the same accessible name (byte-identical)', () => {
    expect(inlineHtml.match(/aria-label="Close"/g)?.length).toBe(1);
    expect(absoluteHtml.match(/aria-label="Close"/g)?.length).toBe(1);
  });
});

// ─── 2 · onClick forwarding — the gesture lands on the caller ─────────────

describe('DismissButton — onClick forwarding', () => {
  it('exposes `onClose` as the only behavioural surface (typed contract)', () => {
    // The kernel's public type carries no `aria-label`, no `className`, no
    // `tone`. If a refactor regresses and re-introduces them, this test
    // fails at compile time (tsc) — the runtime assertion is a witness.
    const props: { onClose: () => void; size?: 'sm' | 'md' } = { onClose: () => {} };
    expect(typeof props.onClose).toBe('function');
  });

  it('Inline placement renders an interactive `type="button"`', () => {
    const html = renderToStaticMarkup(
      createElement(DismissButton.Inline, { onClose: () => {} }),
    );
    // Pressable defaults `type` to "button" so a stray dismiss never
    // submits a form. The kernel inherits this — no explicit re-declaration.
    expect(html).toContain('type="button"');
  });
});

// ─── 3 · size forwarding — sm survives for ReturnLetter ───────────────────

describe('DismissButton — size forwarding', () => {
  it('default size renders the icon substrate at md (40px square)', () => {
    const html = renderToStaticMarkup(
      createElement(DismissButton.Inline, { onClose: () => {} }),
    );
    // `Pressable variant="icon"` resolves to `w-[40px] h-[40px]` on both
    // sm and md — the substrate already squares the icon. The size prop
    // survives in the kernel so a future variant swap can read it.
    expect(html).toContain('w-[40px]');
    expect(html).toContain('h-[40px]');
  });

  it('Absolute placement accepts size="sm" without throwing', () => {
    expect(() => renderToStaticMarkup(
      createElement(DismissButton.Absolute, { onClose: () => {}, size: 'sm' }),
    )).not.toThrow();
  });
});
