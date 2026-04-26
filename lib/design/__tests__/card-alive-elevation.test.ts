/**
 * card-alive elevation polish — per-rule pin for the cold-start hover/press.
 *
 * The cold-start surface (`/articles`) hangs the entire reader-felt moment
 * on `.card-alive` in `app/globals.css`. Pre-PR the hover shadow was an
 * inline literal `0 8px 30px rgba(0, 0, 0, 0.5)` — heavy as a Bootstrap
 * modal, off-ledger, and bypassing the elevation ledger's two-channel
 * depth/glow split. (Tanya UX #100 §2.)
 *
 * This pin enforces three things in one file:
 *
 *   1. Every `box-shadow` in the `.card-alive*` family resolves through
 *      `var(--sys-elev-*)` — no `rgba(...)`, no `color-mix(...)` literals.
 *      Elevation ledger owns shadow; the rule stays a one-liner.
 *
 *   2. Hover sequencing — `.card-alive:hover` carries `transition-delay: 80ms`
 *      so the title color (group-hover crossfade, t=0) leads the card lift
 *      (t=80ms). The leave path zeros the delay so settle is one breath.
 *
 *   3. Press confirmation — `.card-alive:active` exists, half-lifts on
 *      `--sys-elev-rise`, runs at `--sys-time-instant`, and is declared
 *      *after* `.card-alive-curated:hover` so source-order resolves the
 *      press depth over the curated glow on touch.
 *
 * The reduced-motion query is global (`* { transition-duration: 0.01ms }`)
 * and is not re-asserted here — `motion-adoption.test.ts` covers it.
 *
 * Credits: Tanya D. (UX #100 §2/§3/§4 — the inline-shadow kill, the 80ms
 * hover offset, the active confirmation pulse), Mike K. (napkin §92 — the
 * adoption-guard-as-receipt pattern lifted from `radius-adoption.test.ts`),
 * Krystle C. (the per-rule pin shape, originally for the alpha sprint),
 * Paul K. (cold-start anchor framing — felt-parity with the killer feature
 * is the bar, not pixel-parity).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');
const CSS_PATH = join(ROOT, 'app/globals.css');

// ─── Tiny pure helpers — ≤ 10 LOC each ─────────────────────────────────────

/** Read globals.css once per suite. */
function readCss(): string {
  return readFileSync(CSS_PATH, 'utf8');
}

/** Escape a string for safe use inside a RegExp character class / atom. Pure. */
function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract the body of a CSS rule whose selector list contains `selector`.
 * Matches both standalone (`sel {`) and co-listed (`sel,\n other {`) forms,
 * so a `:focus-within` peer added next to `:hover` still resolves through
 * the same query. Boundary-anchored: substring matches do not bind. Pure.
 */
function ruleBody(css: string, selector: string): string {
  const re = new RegExp(`(?:^|[\\s,}])${escapeRe(selector)}\\s*[,{]`);
  const m = re.exec(css);
  if (!m) return '';
  const open = css.indexOf('{', m.index);
  const end = open === -1 ? -1 : css.indexOf('}', open + 1);
  return open === -1 || end === -1 ? '' : css.slice(open + 1, end);
}

/** True iff the rule body declares a `box-shadow` via the elevation ledger. */
function shadowResolvesThroughLedger(body: string): boolean {
  const m = body.match(/box-shadow\s*:\s*([^;]+);/);
  if (!m) return false;
  return /var\(--sys-elev-[a-z]+\)/.test(m[1].trim());
}

/** True iff the rule body declares a literal rgba/color-mix shadow. */
function shadowCarriesLiteral(body: string): boolean {
  const m = body.match(/box-shadow\s*:\s*([^;]+);/);
  if (!m) return false;
  return /rgba\(|color-mix\(/.test(m[1]);
}

/** Index of the first occurrence of `needle` in `hay`; -1 if absent. */
function indexOf(hay: string, needle: string): number {
  return hay.indexOf(needle);
}

// ─── 1 · No inline shadow literals on the cold-start card ──────────────────

describe('card-alive — every shadow routes through the elevation ledger', () => {
  const css = readCss();

  it('.card-alive:hover declares a var(--sys-elev-*) shadow', () => {
    const body = ruleBody(css, '.card-alive:hover');
    expect(body).not.toBe('');
    expect(shadowResolvesThroughLedger(body)).toBe(true);
  });

  it('.card-alive:hover does NOT carry an rgba(...) or color-mix(...) literal', () => {
    const body = ruleBody(css, '.card-alive:hover');
    expect(shadowCarriesLiteral(body)).toBe(false);
  });

  it('.card-alive-curated:hover declares a var(--sys-elev-*) shadow (glow family)', () => {
    const body = ruleBody(css, '.card-alive-curated:hover');
    expect(body).not.toBe('');
    expect(shadowResolvesThroughLedger(body)).toBe(true);
  });

  it('.card-alive-curated:hover does NOT carry a color-mix(...) literal', () => {
    const body = ruleBody(css, '.card-alive-curated:hover');
    expect(shadowCarriesLiteral(body)).toBe(false);
  });

  it('the legacy `0 8px 30px rgba(0, 0, 0, 0.5)` literal is gone', () => {
    expect(css).not.toContain('0 8px 30px rgba(0, 0, 0, 0.5)');
  });

  it('the legacy `0 8px 40px color-mix(...)` curated literal is gone', () => {
    expect(css).not.toMatch(/0\s+8px\s+40px\s+color-mix/);
  });
});

// ─── 2 · Hover sequencing — title leads, surface follows ───────────────────

describe('card-alive — hover sequencing offsets the surface behind the title', () => {
  const css = readCss();

  it('.card-alive declares the local --card-alive-notice offset (80ms)', () => {
    const body = ruleBody(css, '.card-alive');
    // The 80ms value is the choreography rationale (above simultaneity
    // ~30ms, below conscious perception ~100ms). If a future reader edits
    // it, this assertion is the conversation surface.
    expect(body).toMatch(/--card-alive-notice\s*:\s*80ms\s*;/);
  });

  it('.card-alive:hover routes the delay through var(--card-alive-notice)', () => {
    const body = ruleBody(css, '.card-alive:hover');
    expect(body).toMatch(/transition-delay\s*:\s*var\(--card-alive-notice\)\s*;/);
  });

  it('.card-alive:not(:hover):not(:focus-within) zeros the delay so settle is one breath', () => {
    const body = ruleBody(css, '.card-alive:not(:hover):not(:focus-within)');
    expect(body).toMatch(/transition-delay\s*:\s*0ms\s*;/);
  });

  it('.card-alive:not(:hover):not(:focus-within) keeps the settle ease (sys-ease-settle)', () => {
    const body = ruleBody(css, '.card-alive:not(:hover):not(:focus-within)');
    expect(body).toContain('var(--sys-ease-settle)');
  });
});

// ─── 3 · Press confirmation — :active exists and outranks curated glow ────

describe('card-alive — :active pulse confirms touch before navigation', () => {
  const css = readCss();
  const body = ruleBody(css, '.card-alive:active');

  it('.card-alive:active rule exists', () => {
    expect(body).not.toBe('');
  });

  it('.card-alive:active half-lifts on transform translateY(-2px) scale(1.005)', () => {
    expect(body).toMatch(/transform\s*:\s*translateY\(-2px\)\s+scale\(1\.005\)/);
  });

  it('.card-alive:active uses --sys-elev-rise (depth, one rung below float)', () => {
    expect(body).toMatch(/box-shadow\s*:\s*var\(--sys-elev-rise\)/);
  });

  it('.card-alive:active runs at --sys-time-instant (150ms — receipt of touch)', () => {
    expect(body).toContain('var(--sys-time-instant)');
  });

  it('.card-alive:active zeros the transition-delay (press is immediate)', () => {
    expect(body).toMatch(/transition-delay\s*:\s*0ms\s*;/);
  });

  it('.card-alive:active is declared AFTER .card-alive-curated:hover (cascade order)', () => {
    const curatedHover = indexOf(css, '.card-alive-curated:hover');
    const active = indexOf(css, '.card-alive:active');
    expect(curatedHover).toBeGreaterThan(-1);
    expect(active).toBeGreaterThan(-1);
    expect(active).toBeGreaterThan(curatedHover);
  });
});

// ─── 4 · Two-channel split — depth for organic, glow for curated ───────────

describe('card-alive — depth/glow split mirrors the organic/curated identity', () => {
  const css = readCss();

  it('organic hover paints --sys-elev-float (depth family)', () => {
    const body = ruleBody(css, '.card-alive:hover');
    expect(body).toContain('var(--sys-elev-float)');
  });

  it('curated hover paints --sys-elev-whisper (glow family — gold-tinted halo)', () => {
    const body = ruleBody(css, '.card-alive-curated:hover');
    expect(body).toContain('var(--sys-elev-whisper)');
  });
});

// ─── 5 · Channel-symmetry: :focus-within crosses every reader ──────────────
//
// The keyboard / screen-reader / voice reader earns the same felt
// acknowledgement the cursor reader gets — via ONE selector chain. The
// outer <Link> takes :focus-visible (the global ring); :focus-within
// then fires on the inner <article>. Same body, same vocabulary, same
// volume. (Mike #92 napkin, extending the KeepsakePlate :focus-within
// precedent at globals.css L886.)
//
// These pins are the conversation surface: a future "tidy" that moves
// `.card-alive` onto the <Link> would break the parent/child :focus-within
// relationship — and the co-list assertions below would catch that as
// the source-of-truth in CSS.

describe('card-alive — :focus-within mirrors :hover (channel-symmetry of intent)', () => {
  const css = readCss();

  it('.card-alive:focus-within paints the same lift as :hover (translateY -4px, scale 1.015)', () => {
    const body = ruleBody(css, '.card-alive:focus-within');
    expect(body).toMatch(/transform\s*:\s*translateY\(-4px\)\s+scale\(1\.015\)/);
  });

  it('.card-alive:focus-within paints --sys-elev-float (same depth as :hover)', () => {
    const body = ruleBody(css, '.card-alive:focus-within');
    expect(body).toContain('var(--sys-elev-float)');
  });

  it('.card-alive:focus-within inherits the --card-alive-notice delay (title-warmth-leads)', () => {
    const body = ruleBody(css, '.card-alive:focus-within');
    expect(body).toMatch(/transition-delay\s*:\s*var\(--card-alive-notice\)\s*;/);
  });

  it('.card-alive-curated:focus-within paints --sys-elev-whisper (curated glow survives across readers)', () => {
    const body = ruleBody(css, '.card-alive-curated:focus-within');
    expect(body).toContain('var(--sys-elev-whisper)');
  });

  it(':hover and :focus-within share ONE rule body (single source of truth)', () => {
    // Co-list assertion: the regex pins the comma-list shape so a future
    // refactor that splits the rule into two duplicate bodies would catch
    // here — the truth is one selector chain, not two.
    expect(css).toMatch(/\.card-alive:hover\s*,\s*\n?\s*\.card-alive:focus-within\s*\{/);
    expect(css).toMatch(/\.card-alive-curated:hover\s*,\s*\n?\s*\.card-alive-curated:focus-within\s*\{/);
  });
});

// ─── 6 · Cascade order — :active still wins over :focus-within ─────────────
//
// `:focus-within` is sticky (persists across Tab stops); `:active` is
// momentary (≤200ms tap confirmation). When a sticky-focused card is
// then tapped, the press depth must out-paint the focus glow — same
// rule that already protects the curated glow from being mistaken for
// a press. Source-order is the lever; this pin is the receipt.
// (Mike #92 napkin §2: `:hover` → `:focus-within` peers → `:active`
// is the load-bearing top-to-bottom order.)

describe('card-alive — :active is declared AFTER :focus-within (cascade order)', () => {
  const css = readCss();

  it('.card-alive:active source-order beats .card-alive:focus-within', () => {
    const focusWithin = indexOf(css, '.card-alive:focus-within');
    const active      = indexOf(css, '.card-alive:active');
    expect(focusWithin).toBeGreaterThan(-1);
    expect(active).toBeGreaterThan(-1);
    expect(active).toBeGreaterThan(focusWithin);
  });

  it('.card-alive:active source-order beats .card-alive-curated:focus-within', () => {
    const curatedFocus = indexOf(css, '.card-alive-curated:focus-within');
    const active       = indexOf(css, '.card-alive:active');
    expect(curatedFocus).toBeGreaterThan(-1);
    expect(active).toBeGreaterThan(curatedFocus);
  });
});
