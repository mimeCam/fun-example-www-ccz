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
 * Continuity-contract lock (Mike K. napkin #18 + Tanya UIX #44 §4):
 * the spine must be **always mounted** — no `if (phase === 'hidden')
 * return null` path. Visibility is opacity-gated via `presenceClassOf`
 * from `lib/design/presence.ts`; the dormant spine carries
 * `aria-hidden` (via `presenceAriaHidden`) instead of unmounting, so
 * the dried-ink metaphor stays legible across α=0.
 *
 * Credits: Mike K. (4d spec; #18 — three-member presence helper, the
 * always-mounted source pin), Tanya D. (UX spec — the "feel we're
 * preserving" items this test locks down as invariants; UIX #44 — the
 * chrome-rhythm continuity contract).
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

  /**
   * Continuity-contract pins (Mike #18 + Tanya UIX #44 §4):
   *
   * The spine is **always mounted**; the previous `if (phase === 'hidden')
   * return null` path violated the chrome-rhythm continuity contract (the
   * dried ink would vanish mid-glance — the very metaphor it carries). The
   * new path: opacity-gate via `presenceClassOf`, ride `crossfade-inline`
   * (120 ms ease-out — the same verb AmbientNav and NextRead share), and
   * carry `aria-hidden` (via `presenceAriaHidden`) so the dormant spine
   * is off the accessibility tree without unmounting the role/valuenow
   * pair. If a future PR re-introduces the unmount path, these source
   * pins go red BEFORE the presence-adoption fence does.
   */
  it('does NOT carry an `if (phase === \'hidden\') return null` unmount path', () => {
    // Bug retired: the killer feature now honors its own metaphor.
    expect(src).not.toMatch(/if\s*\(\s*phase\s*===\s*['"]hidden['"]\s*\)\s*return\s+null/);
  });

  it('imports `presenceClassOf` and `presenceAriaHidden` from the helper', () => {
    expect(src).toContain("from '@/lib/design/presence'");
    expect(src).toContain('presenceClassOf');
    expect(src).toContain('presenceAriaHidden');
  });

  it("rides the `crossfade-inline` gesture verb on the wrapper presence fade", () => {
    // Sibling to AmbientNav and NextRead — same baton, three call sites.
    // The verb is now imported as the named carrier `CROSSFADE_INLINE` from
    // `lib/design/gestures.ts` (Mike napkin #22 / Krystle rule-of-three lift);
    // the structural invariant is byte-equal to `gestureClassesOf('crossfade-inline')`,
    // pinned by `lib/design/__tests__/crossfade-inline-adoption.test.ts`.
    expect(src).toMatch(
      /import\s*\{[^}]*\bCROSSFADE_INLINE\b[^}]*\}\s*from\s*['"]@\/lib\/design\/gestures['"]/,
    );
    expect(src).toMatch(/\bCROSSFADE_INLINE\b/);
  });

  it('the wrapper composes `transition-opacity` (the gate property)', () => {
    expect(src).toContain('transition-opacity');
  });

  it('does NOT carry the raw `opacity-0 pointer-events-none` literal', () => {
    // The endpoint pair lives in the helper. The component composes via
    // `presenceClassOf('gone')` — not the literal substring.
    expect(src).not.toContain('opacity-0 pointer-events-none');
  });
});
