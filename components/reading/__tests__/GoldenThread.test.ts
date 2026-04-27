/**
 * GoldenThread Component — structural tests.
 *
 * Verifies GoldenThread exists, imports correctly, and uses the shared
 * useScrollDepth context (no articleId prop). Thermal glow is handled by
 * CSS selectors — no useThermal needed.
 *
 * Ledger-adoption lock (Mike K. napkin #38 §4d + Tanya D. UIX #69):
 * belt-and-braces for the site-wide grep fence. If a regression tries to
 * reintroduce `T_LINGER = 2000` or `opacity: 0.3` into the flagship, this
 * test fails with a file-specific error before the adoption guards do.
 *
 * Credits: Mike K. (4d spec), Tanya D. (UX spec — the "feel we're
 * preserving" items this test locks down as invariants).
 */

const fs = require('fs');
const path = require('path');

const SRC_PATH = path.join(__dirname, '..', 'GoldenThread.tsx');

function readSrc(): string {
  return fs.readFileSync(SRC_PATH, 'utf-8');
}

describe('GoldenThread — shape and adoption', () => {
  const src = readSrc();

  it('is a named export using useScrollDepth, takes no props', () => {
    expect(src).toMatch(/export function GoldenThread\s*\(\s*\)/);
    expect(src).toMatch(/useScrollDepth\(\)/);
    expect(src).not.toMatch(/\{ articleId \}/);
  });

  it('uses CSS-gated glow and thermal color token (not JS branches)', () => {
    expect(src).toMatch(/golden-thread-glow/);
    expect(src).toMatch(/--token-accent/);
    expect(src).not.toMatch(/useThermal/);
  });

  it('imports CEREMONY from the Motion ledger for the settled dwell', () => {
    expect(src).toMatch(/from ['"]@\/lib\/design\/motion['"]/);
    expect(src).toMatch(/CEREMONY\.glowHold/);
  });

  it('recedes via the Alpha ledger muted rung (not raw opacity)', () => {
    // `opacity-muted` is the Tailwind bridge to ALPHA.muted (0.30).
    expect(src).toMatch(/opacity-muted/);
    // No raw numeric opacity literals left on the flagship surface.
    expect(src).not.toMatch(/opacity\s*:\s*0?\.\d+/);
  });

  it('has no bare T_LINGER constant or raw 2000 ms literal', () => {
    expect(src).not.toMatch(/T_LINGER/);
    // `2000` must not appear anywhere — the dwell is quoted through CEREMONY.
    expect(src).not.toMatch(/\b2000\b/);
    // And `0.3` must not appear as a magic number.
    expect(src).not.toMatch(/\b0\.3\b/);
  });

  /**
   * Atlas-baton pin (Mike napkin #62 §1, Tanya UIX #23 §3): the fill's
   * opacity+width fade no longer carries a hand-rolled `var(--sys-time-*)`
   * `var(--sys-ease-*)` `transition:` string. It rides
   * `gestureClassesForMotion('thread-settle', reduce)` — same baton as
   * `MirrorRevealCard`. If a future PR re-inlines the transition, this
   * assertion fails BEFORE the fence test does, with a file-specific
   * message that names the surface and the verb.
   */
  it("rides the Atlas verb 'thread-settle' through gestureClassesForMotion", () => {
    expect(src).toMatch(/gestureClassesForMotion\(\s*['"]thread-settle['"]/);
    expect(src).toMatch(/from ['"]@\/lib\/hooks\/useReducedMotion['"]/);
  });

  it('has no inline var(--sys-time-*) / var(--sys-ease-*) substring on the fill', () => {
    expect(src).not.toMatch(/var\(--sys-time-/);
    expect(src).not.toMatch(/var\(--sys-ease-/);
  });
});
