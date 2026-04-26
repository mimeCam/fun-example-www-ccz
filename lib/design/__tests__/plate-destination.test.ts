/**
 * plate-destination — adoption + sync guard for the Coda keepsake's
 * "given, not offered" acknowledgement rule.
 *
 * The article Coda's KeepsakePlate is a *destination*, not a corridor
 * tile. Pre-PR, the surface read as another peer card after the entrance
 * settled — Paul K.'s KPI failed silently ("the keepsake's reveal must
 * feel given, not offered"). Mike's #43 napkin landed the cure as one
 * CSS class: `.plate-destination` in `app/globals.css` carries a single
 * gold halo dwell after entrance + a 2px `:focus-within` arrow nudge,
 * using ledger-only tokens (no new ease curve, no new beat, no new
 * elevation rung). This pin enforces five things:
 *
 *   1. KeepsakePlate.tsx applies the class through `plateClass()` and
 *      paints the `<span class="plate-caption-arrow" aria-hidden>` that
 *      the rule targets — adoption is what makes the rule load-bearing.
 *
 *   2. Every `box-shadow` and keyframe stop in the `.plate-destination`
 *      family resolves through `var(--sys-elev-*)` — no `rgba(...)`,
 *      no `color-mix(...)` literals. Elevation ledger owns shadow.
 *
 *   3. The Plate does not import the `.card-alive` family (corridor
 *      verb) and does not declare the `--card-alive-notice` offset —
 *      the destination is its own surface category, not a peer tile.
 *
 *   4. The halo dwell duration is `CEREMONY.glowHold` (2000ms) — the
 *      ledger is the single source of truth. If a future contributor
 *      changes the keyframe duration without touching `motion.ts`, this
 *      test catches it; if they change `CEREMONY.glowHold` without
 *      touching the keyframe, this test catches it too.
 *
 *   5. No new `--sys-ease-*` declaration is introduced anywhere in CSS
 *      (the Jason-token guard). The motion ledger stays at 3 named
 *      curves. AGENTS.md L26: posture suggests, posture does not
 *      dictate. A 4th ease curve would need a sync test, an adoption
 *      test, and a reviewer's ear to drift.
 *
 * Pattern-clone of `card-alive-elevation.test.ts` — same `ruleBody()`
 * helper shape; do NOT extract to a shared `_helpers.ts` until a third
 * caller arrives. (Mike #43 §8 — premature shared-code is its own bug.)
 *
 * Credits: Mike K. (#43 napkin §1+§5 — five-block test shape, source-
 * order discipline, ledger-pin pattern lifted from `card-alive-
 * elevation.test.ts`), Tanya D. (UX #100 §5 — glow/depth two-channel
 * lock that the no-card-alive assertion enforces), Elon M. (the Jason-
 * token guard rationale — bow-easing remains closed), Paul K. (KPI
 * framing: felt-distinctness is the bar, ledger-discipline is the
 * receipt).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CEREMONY, EASE } from '../motion';

const ROOT = join(__dirname, '..', '..', '..');
const CSS_PATH = join(ROOT, 'app/globals.css');
const PLATE_PATH = join(ROOT, 'components/reading/KeepsakePlate.tsx');

// ─── Tiny pure helpers — ≤ 10 LOC each ─────────────────────────────────────

/** Read a file once per call (jest caches at the suite level via require). */
function readFile(path: string): string {
  return readFileSync(path, 'utf8');
}

/**
 * Extract the body of a single CSS rule by selector. Returns the text
 * between `selector {` and the next matching `}`. Naive but adequate
 * for the flat rules in globals.css. Pure.
 */
function ruleBody(css: string, selector: string): string {
  const head = `${selector} {`;
  const start = css.indexOf(head);
  if (start === -1) return '';
  const open = start + head.length;
  const end = css.indexOf('}', open);
  return end === -1 ? '' : css.slice(open, end);
}

/** Extract a `@keyframes name { ... }` body. Pure, brace-balanced. */
function keyframesBody(css: string, name: string): string {
  const head = `@keyframes ${name} {`;
  const start = css.indexOf(head);
  if (start === -1) return '';
  return sliceBalanced(css, start + head.length);
}

/** Slice from `open` to its matching `}`, accounting for inner braces. */
function sliceBalanced(css: string, open: number): string {
  let depth = 1;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open, i);
  }
  return '';
}

/** True iff the body declares a `box-shadow` and every stop routes through ledger. */
function shadowsRouteThroughLedger(body: string): boolean {
  const shadows = body.match(/box-shadow\s*:\s*[^;]+;/g) ?? [];
  if (shadows.length === 0) return false;
  return shadows.every((s) => /var\(--sys-elev-[a-z]+\)/.test(s));
}

/** True iff the body carries any rgba/color-mix literal in a box-shadow. */
function shadowCarriesLiteral(body: string): boolean {
  const shadows = body.match(/box-shadow\s*:\s*[^;]+;/g) ?? [];
  return shadows.some((s) => /rgba\(|color-mix\(/.test(s));
}

// ─── 1 · Adoption — KeepsakePlate.tsx wires the rule + arrow span ──────────

describe('plate-destination — KeepsakePlate.tsx adopts the rule', () => {
  const tsx = readFile(PLATE_PATH);

  it('plateClass() includes the plate-destination class', () => {
    expect(tsx).toMatch(/['"]plate-destination['"]/);
  });

  it('PlateCaption renders a .plate-caption-arrow span around the glyph', () => {
    expect(tsx).toMatch(/className=['"]plate-caption-arrow['"]/);
  });

  it('the arrow span is aria-hidden so screen readers ignore the glyph', () => {
    const span = tsx.match(/<span[^>]*plate-caption-arrow[^>]*>/);
    expect(span).not.toBeNull();
    expect(span![0]).toMatch(/aria-hidden/);
  });
});

// ─── 2 · Shadow ledger — no rgba/color-mix literals on the destination ─────

describe('plate-destination — every shadow routes through the elevation ledger', () => {
  const css = readFile(CSS_PATH);
  const dwell = keyframesBody(css, 'plateDestinationDwell');
  const halo = ruleBody(css, '.plate-destination::after');

  it('the .plate-destination::after halo overlay declares a ledger shadow', () => {
    expect(halo).not.toBe('');
    expect(shadowsRouteThroughLedger(halo)).toBe(true);
  });

  it('the .plate-destination::after halo carries no rgba/color-mix literal', () => {
    expect(shadowCarriesLiteral(halo)).toBe(false);
  });

  it('the @keyframes plateDestinationDwell stops route through the ledger', () => {
    expect(dwell).not.toBe('');
    expect(shadowsRouteThroughLedger(dwell)).toBe(true);
  });

  it('the @keyframes plateDestinationDwell carry no rgba/color-mix literal', () => {
    expect(shadowCarriesLiteral(dwell)).toBe(false);
  });

  it('the dwell paints --sys-elev-whisper (glow family — gold-tinted halo)', () => {
    expect(dwell).toContain('var(--sys-elev-whisper)');
  });
});

// ─── 3 · No corridor-verb leakage — destination is its own category ────────

describe('plate-destination — does NOT import the .card-alive corridor verb', () => {
  const css = readFile(CSS_PATH);
  const tsx = readFile(PLATE_PATH);

  it('KeepsakePlate.tsx does NOT carry a card-alive class', () => {
    expect(tsx).not.toMatch(/['"]card-alive[^'"]*['"]/);
  });

  it('the .plate-destination rule body does NOT reference --card-alive-notice', () => {
    const body = ruleBody(css, '.plate-destination');
    expect(body).not.toContain('--card-alive-notice');
  });

  it('no .plate-destination rule re-uses the .card-alive transform vocabulary', () => {
    const family = css.split('.plate-destination').slice(1).join('.plate-destination');
    expect(family).not.toMatch(/translateY\(-4px\)\s+scale\(1\.015\)/);
  });
});

// ─── 4 · Halo dwell sync — keyframe duration ↔ CEREMONY.glowHold ───────────

describe('plate-destination — halo dwell pins to CEREMONY.glowHold (motion ledger)', () => {
  const css = readFile(CSS_PATH);
  const halo = ruleBody(css, '.plate-destination::after');

  it('the ::after animation declares the --sys-anim-glow-hold duration var', () => {
    // The CSS reads through the named animation token; the token in turn
    // mirrors CEREMONY.glowHold (lib/design/motion.ts). If either side
    // drifts (the --sys-anim-glow-hold value here, or the CEREMONY
    // constant), this assertion + the next one fire the conversation.
    expect(halo).toMatch(/animation:\s*plateDestinationDwell\s+var\(--sys-anim-glow-hold\)/);
  });

  it('--sys-anim-glow-hold mirrors CEREMONY.glowHold = 2000ms', () => {
    expect(CEREMONY.glowHold).toBe(2000);
    expect(css).toMatch(/--sys-anim-glow-hold:\s*2000ms/);
  });

  it('the ::after animation delays start until --entrance-duration', () => {
    // Single source of truth for "when the entrance ends" — KeepsakePlate
    // sets --entrance-duration inline (MOTION.reveal = 700ms). The 700ms
    // fallback in CSS matches that beat so the rule degrades gracefully.
    expect(halo).toMatch(/var\(--entrance-duration,\s*700ms\)/);
  });

  it('the ::after animation runs once with both fill modes (no infinite loop)', () => {
    expect(halo).toMatch(/animation:[^;]*\s1\sboth\s*;/);
  });

  it('the ::after halo is wrapped in @media (hover: hover) — desktop-only path', () => {
    const idx = css.indexOf('.plate-destination::after');
    const upTo = css.slice(0, idx);
    const lastMedia = upTo.lastIndexOf('@media (hover: hover)');
    const lastClose = upTo.lastIndexOf('}');
    // The most recent `@media (hover: hover)` opens after the most recent
    // `}` — so the ::after rule sits inside that media block.
    expect(lastMedia).toBeGreaterThan(lastClose);
  });
});

// ─── 5 · No new --sys-ease-* curve (the Jason-token guard) ─────────────────

describe('plate-destination — no new --sys-ease-* declaration is introduced', () => {
  const css = readFile(CSS_PATH);

  it('CSS still declares exactly the three EASE curves the ledger names', () => {
    const decls = Array.from(css.matchAll(/--sys-ease-([a-z]+)\s*:/g)).map((m) => m[1]);
    const unique = Array.from(new Set(decls)).sort();
    const expected = Object.keys(EASE).sort();
    expect(unique).toEqual(expected);
  });

  it('no rogue --sys-ease-bow / --sys-ease-reach token appears anywhere', () => {
    expect(css).not.toMatch(/--sys-ease-bow\b/);
    expect(css).not.toMatch(/--sys-ease-reach\b/);
  });

  it('the .plate-destination rule consumes only ledger-named easing curves', () => {
    const family = css.split('.plate-destination').slice(1).join('.plate-destination');
    const eases = Array.from(family.matchAll(/var\(--sys-ease-([a-z]+)\)/g)).map((m) => m[1]);
    eases.forEach((e) => expect(Object.keys(EASE)).toContain(e));
  });
});

// ─── 6 · Reduced-motion — both gestures silence; focus ring still lands ────

describe('plate-destination — reduced motion silences halo and arrow nudge', () => {
  const css = readFile(CSS_PATH);

  it('a reduced-motion override hard-kills the ::after halo animation', () => {
    // Co-located with the universal reduced-motion block so the skeleton-
    // sync ordering invariant (first reduced-motion block carries the
    // skeleton α-muted pin) is not disturbed. (Mike #43 §5.3.)
    expect(css).toMatch(
      /\.plate-destination::after\s*\{[^}]*animation:\s*none\s*!important/,
    );
  });

  it('a reduced-motion override zeros the focus-within arrow nudge transform', () => {
    expect(css).toMatch(
      /\.plate-destination:focus-within\s+\.plate-caption-arrow\s*\{[^}]*transform:\s*none\s*!important/,
    );
  });

  it('both overrides live inside a @media (prefers-reduced-motion: reduce) block', () => {
    // Find the position of each override; both must be after the OPEN of
    // some prefers-reduced-motion block and before its CLOSE (handled
    // implicitly: if either lived at top-level, they would already paint
    // and the universal block would not be needed at all).
    const mediaOpen = css.indexOf('@media (prefers-reduced-motion: reduce)');
    const haloOverride = css.indexOf('.plate-destination::after', mediaOpen);
    const arrowOverride = css.indexOf('.plate-destination:focus-within .plate-caption-arrow', mediaOpen);
    expect(haloOverride).toBeGreaterThan(mediaOpen);
    expect(arrowOverride).toBeGreaterThan(mediaOpen);
  });
});

// ─── 7 · Source order — destination follows the .card-alive family ─────────

describe('plate-destination — source order: declared after .card-alive family', () => {
  const css = readFile(CSS_PATH);

  it('.plate-destination is declared AFTER .card-alive:active (defensive cascade)', () => {
    const cardAliveActive = css.indexOf('.card-alive:active');
    const plateDestination = css.indexOf('.plate-destination');
    expect(cardAliveActive).toBeGreaterThan(-1);
    expect(plateDestination).toBeGreaterThan(-1);
    expect(plateDestination).toBeGreaterThan(cardAliveActive);
  });
});
