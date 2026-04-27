/**
 * Divider — kernel unit tests.
 *
 * Five tests, five contracts (Mike #37 napkin §"Definition of done", parity
 * with the dismiss-verb-fence's three-block prose):
 *
 *   1. Render shape — every variant emits `role="separator"`,
 *      `aria-orientation="horizontal"`, and the gold-hairline geometry
 *      (`h-px`, `bg-gold/10`, `max-w-divider`, `rounded-full`). Source-pin
 *      via `renderToStaticMarkup` so we stay honest under
 *      `testEnvironment: 'node'` (no jsdom; matches the SkipLink /
 *      DismissButton patterns).
 *
 *   2. Spacing allowlist — the breath token resolves to a JIT-visible
 *      `my-sys-N` literal. The default per variant matches Tanya §3.4
 *      (`Static`=`sys-4`, `Reveal`=`sys-7`, `Centered`=`sys-9`).
 *
 *   3. Reveal motion — `visible: false` lands at `scale-x-0`; `visible:
 *      true` at `scale-x-100`. Reduced-motion compresses the gesture's
 *      duration class to the `crossfade` floor (the `fade-neutral` row
 *      shortens, never skips — Tanya §4.2 cadence).
 *
 *   4. Centered label — when `label` is supplied, the caption renders
 *      below the line in italic micro text (Tanya §5 freeze: caption
 *      under, never bisecting).
 *
 *   5. Frozen contract — no variant renders a bare `<hr>`, no variant
 *      emits a box-shadow, and the gold/10 rung is the only color
 *      literal (no `gold/20`, no archetype-tint).
 *
 * Test file is `.ts` (not `.tsx`) — `React.createElement` is used so the
 * existing ts-jest preset does not need a per-test override (matches the
 * sibling `DismissButton.test.ts`).
 *
 * Credits: Mike K. (#37 §"Definition of done" — five unit tests, source-
 * pin via SSR, the spacing-allowlist + reduced-motion floor coverage),
 * Tanya D. (UIX #28 §3.4 / §4.2 / §5 — the spacing per variant, the
 * reduced-motion cadence test, the label-below-line freeze), Sid (this
 * lift; one test file per kernel, no jsdom).
 */

import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Divider, __testing__ } from '../Divider';

// ─── 1 · Render shape — ARIA + geometry on every variant ───────────────────

describe('Divider — render shape (ARIA + geometry)', () => {
  const staticHtml = renderToStaticMarkup(
    createElement(Divider.Static, {}),
  );
  const revealHtml = renderToStaticMarkup(
    createElement(Divider.Reveal, { visible: true, reduce: false }),
  );
  const centeredHtml = renderToStaticMarkup(
    createElement(Divider.Centered, {}),
  );

  it('every variant carries role="separator"', () => {
    expect(staticHtml).toContain('role="separator"');
    expect(revealHtml).toContain('role="separator"');
    expect(centeredHtml).toContain('role="separator"');
  });

  it('every variant declares aria-orientation="horizontal"', () => {
    expect(staticHtml).toContain('aria-orientation="horizontal"');
    expect(revealHtml).toContain('aria-orientation="horizontal"');
    expect(centeredHtml).toContain('aria-orientation="horizontal"');
  });

  it('every variant paints the gold/10 hairline geometry', () => {
    for (const html of [staticHtml, revealHtml, centeredHtml]) {
      expect(html).toContain('h-px');
      expect(html).toContain('bg-gold/10');
      expect(html).toContain('max-w-divider');
      expect(html).toContain('rounded-full');
    }
  });

  it('no variant renders a raw <hr> tag (the kernel uses <div>)', () => {
    for (const html of [staticHtml, revealHtml, centeredHtml]) {
      expect(html).not.toMatch(/<hr\b/);
    }
  });
});

// ─── 2 · Spacing allowlist — typed token → my-sys-N literal ────────────────

describe('Divider — spacing allowlist', () => {
  it('resolver maps every admitted token to its `my-sys-N` literal', () => {
    expect(__testing__.spacingClass('sys-4')).toBe('my-sys-4');
    expect(__testing__.spacingClass('sys-6')).toBe('my-sys-6');
    expect(__testing__.spacingClass('sys-7')).toBe('my-sys-7');
    expect(__testing__.spacingClass('sys-9')).toBe('my-sys-9');
  });

  it('Static defaults to `my-sys-4` (inside-card rhythm — Tanya §3.4)', () => {
    const html = renderToStaticMarkup(createElement(Divider.Static, {}));
    expect(html).toContain('my-sys-4');
  });

  it('Reveal defaults to `my-sys-7` (between-letter-section rhythm)', () => {
    const html = renderToStaticMarkup(
      createElement(Divider.Reveal, { visible: true, reduce: false }),
    );
    expect(html).toContain('my-sys-7');
  });

  it('Centered defaults to `my-sys-9` (chapter-break rhythm)', () => {
    const html = renderToStaticMarkup(createElement(Divider.Centered, {}));
    expect(html).toContain('my-sys-9');
  });

  it('Static accepts an explicit `sys-6` override', () => {
    const html = renderToStaticMarkup(
      createElement(Divider.Static, { spacing: 'sys-6' }),
    );
    expect(html).toContain('my-sys-6');
    expect(html).not.toContain('my-sys-4');
  });
});

// ─── 3 · Reveal motion — scale endpoints + reduced-motion floor ───────────

describe('Divider.Reveal — motion endpoints', () => {
  it('hidden state lands at scale-x-0 (the line has not drawn yet)', () => {
    const html = renderToStaticMarkup(
      createElement(Divider.Reveal, { visible: false, reduce: false }),
    );
    expect(html).toContain('scale-x-0');
    expect(html).not.toContain('scale-x-100');
  });

  it('visible state lands at scale-x-100 (the line has drawn fully)', () => {
    const html = renderToStaticMarkup(
      createElement(Divider.Reveal, { visible: true, reduce: false }),
    );
    expect(html).toContain('scale-x-100');
    expect(html).not.toContain('scale-x-0');
  });

  it('reduced-motion compresses the gesture to the crossfade floor', () => {
    // `fade-neutral` reduced policy = 'shorten' → duration-crossfade ease-out
    // (the universal 120ms floor) — same row dismissed by the reader who
    // turned motion off (Tanya §4.2 cadence test).
    const html = renderToStaticMarkup(
      createElement(Divider.Reveal, { visible: true, reduce: true }),
    );
    expect(html).toContain('duration-crossfade');
    expect(html).toContain('ease-out');
    expect(html).not.toContain('duration-fade');
  });

  it('full-motion lands on the (fade, sustain) row of `fade-neutral`', () => {
    const html = renderToStaticMarkup(
      createElement(Divider.Reveal, { visible: true, reduce: false }),
    );
    expect(html).toContain('duration-fade');
    expect(html).toContain('ease-sustain');
  });

  it('the verb-resolved class fragment is exposed for fence pinning', () => {
    expect(__testing__.FADE_GESTURE(false)).toBe('duration-fade ease-sustain');
    expect(__testing__.FADE_GESTURE(true)).toBe('duration-crossfade ease-out');
  });
});

// ─── 4 · Centered — caption sits below, never bisecting (Tanya §5) ────────

describe('Divider.Centered — caption placement', () => {
  it('without a label, no caption renders', () => {
    const html = renderToStaticMarkup(createElement(Divider.Centered, {}));
    expect(html).not.toMatch(/<p\b/);
  });

  it('with a label, an italic micro caption renders', () => {
    const html = renderToStaticMarkup(
      createElement(Divider.Centered, { label: 'A new chapter' }),
    );
    expect(html).toContain('A new chapter');
    expect(html).toContain('italic');
    expect(html).toContain('text-sys-micro');
  });

  it('the caption is a sibling below the hairline (not a parent of it)', () => {
    const html = renderToStaticMarkup(
      createElement(Divider.Centered, { label: 'caption' }),
    );
    // The hairline `<div role="separator">` should appear before the
    // caption `<p>` in source order — Tanya §5 freeze: label below, not on.
    const sepIdx = html.indexOf('role="separator"');
    const captionIdx = html.indexOf('caption');
    expect(sepIdx).toBeGreaterThan(-1);
    expect(captionIdx).toBeGreaterThan(sepIdx);
  });

  it('Centered hairline is mx-auto (chapter-break is centered geometry)', () => {
    const html = renderToStaticMarkup(createElement(Divider.Centered, {}));
    expect(html).toContain('mx-auto');
  });
});

// ─── 5 · Frozen contract — no shadow, no gold/20, no archetype tint ───────

describe('Divider — frozen contract (no drift escape)', () => {
  const allHtml = [
    renderToStaticMarkup(createElement(Divider.Static, {})),
    renderToStaticMarkup(createElement(Divider.Reveal, { visible: true, reduce: false })),
    renderToStaticMarkup(createElement(Divider.Reveal, { visible: false, reduce: true })),
    renderToStaticMarkup(createElement(Divider.Centered, { label: 'x' })),
  ].join('\n');

  it('no variant emits a box-shadow class (the hairline does not float)', () => {
    expect(allHtml).not.toMatch(/\bshadow-/);
  });

  it('no variant emits a `gold/20` literal (one rung, always)', () => {
    expect(allHtml).not.toContain('gold/20');
    expect(allHtml).not.toContain('gold/30');
    expect(allHtml).not.toContain('gold/50');
  });

  it('no variant emits an inline style attribute (no archetype-tint hatch)', () => {
    expect(allHtml).not.toMatch(/\sstyle=/);
  });

  it('the geometry handle is exactly the four classes the contract names', () => {
    // The handle composition is byte-load-bearing — the alpha-call-site
    // fence reads `bg-gold/10` from this string; the JIT scans `h-px`,
    // `max-w-divider`, and `rounded-full` from this string.
    expect(__testing__.HAIRLINE_GEOMETRY).toBe(
      'h-px bg-gold/10 max-w-divider rounded-full',
    );
  });

  it('the ARIA props are byte-identical across variants', () => {
    expect(__testing__.ARIA_PROPS.role).toBe('separator');
    expect(__testing__.ARIA_PROPS['aria-orientation']).toBe('horizontal');
  });
});
