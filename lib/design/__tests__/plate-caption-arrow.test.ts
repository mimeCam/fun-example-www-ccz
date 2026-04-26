/**
 * plate-caption-arrow — universality + dual-adoption guard for the
 * site-wide direct-gesture nudge ("the third tense of the gesture grammar":
 * thread → paint → nudge / present → perfect → future).
 *
 * Pre-PR, the rule lived under `.plate-destination .plate-caption-arrow`
 * and only fired on the Coda KeepsakePlate. Mike #43 (architect napkin)
 * + Tanya UX (UIX spec §5) caught the asymmetry: caller #2
 * (`QuoteCardLauncher` in `app/resonances/ResonanceEntry.tsx`) carries the
 * same `→` glyph and earns the same 2px focus-within lean — but it has no
 * `.plate-destination` ancestor, so the markup-only diff would have been
 * a silent no-op (Elon M.'s first-principles audit). The honest fix:
 * detach the kernel from its accidental parent selector and gate the
 * nudge on `:focus-within` alone. Halo / dwell / entrance ceremony stay
 * plate-only above; only the gesture verb is universal.
 *
 * This file pins five things — the test five-block matches the architect's
 * map (#43 §5) and the UX acceptance gates (UIX §8):
 *
 *   1. Universality — the rule is declared at top level (no
 *      `.plate-destination` ancestor) so any focusable surface that
 *      contains a `.plate-caption-arrow` span gets the lean.
 *
 *   2. Adoption — both `KeepsakePlate.tsx` (caller #1, plate) AND
 *      `ResonanceEntry.tsx` (caller #2, launcher) wrap the `→` glyph
 *      in `<span class="plate-caption-arrow" aria-hidden>`.
 *
 *   3. Token discipline — the timing routes through
 *      `--sys-time-crossfade` and `--sys-ease-out` only. No new ease
 *      curve, no new beat. The Motion-ledger surface area does not grow.
 *
 *   4. Reduced motion — the focus-within transform is zeroed by the
 *      site-wide selector inside the universal `prefers-reduced-motion`
 *      block. The focus ring still lands; the ornament does not perform.
 *
 *   5. Source order — the universal `.plate-caption-arrow` rule sits
 *      AFTER the `.plate-destination` family so the cascade stays
 *      defensive (the plate's halo ceremony is unaffected).
 *
 * Pattern-clone of `plate-destination.test.ts` — same `ruleBody()` helper
 * shape; do NOT extract to a shared `_helpers.ts` until a third caller
 * arrives. (Mike's rule of three; Mike #43 §8 — premature shared-code is
 * its own bug.)
 *
 * Credits: Mike K. (#43 napkin §6+§7 — five-block test shape, source-
 * order discipline, no class rename), Tanya D. (UIX spec §3+§5+§8 — the
 * cosmetic contract and the acceptance criteria this file translates),
 * Elon M. (caught the no-op trap that motivated the kernel detach in the
 * first place), Paul K. (DoD: invisible until missing — §4 reduced-motion
 * is the receipt that proves it).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { EASE, MOTION } from '../motion';

const ROOT = join(__dirname, '..', '..', '..');
const CSS_PATH = join(ROOT, 'app/globals.css');
const PLATE_PATH = join(ROOT, 'components/reading/KeepsakePlate.tsx');
const LAUNCHER_PATH = join(ROOT, 'app/resonances/ResonanceEntry.tsx');

// ─── Tiny pure helpers — ≤ 10 LOC each, pattern-cloned from plate-destination

/** Read a file once per call (jest caches at the suite level via require). */
function readFile(path: string): string {
  return readFileSync(path, 'utf8');
}

/**
 * Extract the body of a single CSS rule by selector. Returns the text
 * between `selector {` and the next `}`. Naive but adequate for the flat
 * rules in globals.css. Pure.
 */
function ruleBody(css: string, selector: string): string {
  const head = `${selector} {`;
  const start = css.indexOf(head);
  if (start === -1) return '';
  const open = start + head.length;
  const end = css.indexOf('}', open);
  return end === -1 ? '' : css.slice(open, end);
}

/** Position of `selector {` in `css`, or -1 if absent. Pure. */
function rulePos(css: string, selector: string): number {
  return css.indexOf(`${selector} {`);
}

/** True iff a focus-within rule for the arrow exists at top level (no ancestor). */
function topLevelFocusWithinExists(css: string): boolean {
  const a = rulePos(css, ':focus-within > .plate-caption-arrow,\n:focus-within .plate-caption-arrow');
  const b = rulePos(css, ':focus-within .plate-caption-arrow');
  return a !== -1 || b !== -1;
}

// ─── 1 · Universality — rule fires at any :focus-within boundary ───────────

describe('plate-caption-arrow — declared at top level (no .plate-destination ancestor)', () => {
  const css = readFile(CSS_PATH);

  it('the at-rest rule is declared as `.plate-caption-arrow` (no ancestor)', () => {
    const body = ruleBody(css, '.plate-caption-arrow');
    expect(body).not.toBe('');
    expect(body).toMatch(/display:\s*inline-block/);
    expect(body).toMatch(/transition:\s*transform\s+var\(--sys-time-crossfade\)\s+var\(--sys-ease-out\)/);
  });

  it('the focus-within rule fires on ANY focusable ancestor (no .plate-destination prefix)', () => {
    expect(topLevelFocusWithinExists(css)).toBe(true);
  });

  it('the focus-within rule body translates the glyph 2px right', () => {
    // The dual-selector pair (`> .plate-caption-arrow` + descendant) is one
    // CSS rule with two selectors. ruleBody finds the body via the second
    // (descendant) selector head — same body applies to both.
    const body = ruleBody(css, ':focus-within .plate-caption-arrow');
    expect(body).toMatch(/transform:\s*translateX\(2px\)/);
  });

  it('the legacy parent-scoped rule (`.plate-destination .plate-caption-arrow`) is gone', () => {
    // The kernel detach is load-bearing: if a contributor restores the
    // ancestor coupling, caller #2 silently regresses to a no-op.
    expect(rulePos(css, '.plate-destination .plate-caption-arrow')).toBe(-1);
    expect(rulePos(css, '.plate-destination:focus-within .plate-caption-arrow')).toBe(-1);
  });
});

// ─── 2 · Adoption — both callers consume the <LeanArrow /> kernel ─────────

/**
 * Mike #80 promoted the inline span to a kernel at
 * `components/shared/LeanArrow.tsx`. The class + aria-hidden + leading-
 * space-inside contract now live in ONE place; callers import the kernel
 * and never re-declare the span. The site-wide fence
 * `components/shared/__tests__/lean-arrow-fence.test.ts` (Axis B + C)
 * pins that single-source-of-truth invariant from the kernel side; this
 * block pins it from the caller side so the two callers that use the
 * `:focus-within` lean (KeepsakePlate's Coda surface, ResonanceEntry's
 * QuoteCardLauncher) stay wired to the kernel after the promotion.
 */
describe('plate-caption-arrow — both callers consume the LeanArrow kernel', () => {
  const plateTsx = readFile(PLATE_PATH);
  const launcherTsx = readFile(LAUNCHER_PATH);

  it('caller #1 (KeepsakePlate.tsx) imports LeanArrow from the kernel module', () => {
    expect(plateTsx).toMatch(
      /import\s*\{\s*LeanArrow\s*\}\s*from\s*['"]@\/components\/shared\/LeanArrow['"]/,
    );
  });

  it('caller #1 (KeepsakePlate.tsx) renders <LeanArrow /> in JSX', () => {
    expect(plateTsx).toMatch(/<LeanArrow\s*\/>/);
  });

  it('caller #2 (ResonanceEntry.tsx) imports LeanArrow from the kernel module', () => {
    expect(launcherTsx).toMatch(
      /import\s*\{\s*LeanArrow\s*\}\s*from\s*['"]@\/components\/shared\/LeanArrow['"]/,
    );
  });

  it('caller #2 (ResonanceEntry.tsx) renders <LeanArrow /> in JSX', () => {
    expect(launcherTsx).toMatch(/<LeanArrow\s*\/>/);
  });

  it('neither caller hand-rolls a `.plate-caption-arrow` span (kernel is the only site)', () => {
    // The site-wide invariant: the literal class lives in exactly one
    // .tsx (LeanArrow.tsx). Caller-side regression — re-inlining the
    // span — is caught here AND by lean-arrow-fence Axis C.
    expect(plateTsx).not.toMatch(/className=['"]plate-caption-arrow['"]/);
    expect(launcherTsx).not.toMatch(/className=['"]plate-caption-arrow['"]/);
  });

  it('caller #2 does NOT carry the .plate-destination class (no ceremony import)', () => {
    // Tanya UX §2: the launcher is a courier, not a plate. Importing
    // .plate-destination would drag in the halo dwell + entrance ceremony,
    // creating a second focal point per resonance card.
    expect(launcherTsx).not.toMatch(/['"]plate-destination['"]/);
  });
});

// ─── 3 · Token discipline — only ledger ease/timing on the rule ────────────

describe('plate-caption-arrow — only ledger Motion atoms on the rule', () => {
  const css = readFile(CSS_PATH);
  const body = ruleBody(css, '.plate-caption-arrow');

  it('the transition routes through --sys-time-crossfade (Motion ledger)', () => {
    expect(body).toContain('var(--sys-time-crossfade)');
  });

  it('the transition routes through --sys-ease-out (Motion ledger)', () => {
    expect(body).toContain('var(--sys-ease-out)');
  });

  it('the transition declares no inline ms / inline cubic-bezier (no token bypass)', () => {
    expect(body).not.toMatch(/\b\d+ms\b/);
    expect(body).not.toMatch(/cubic-bezier\(/);
  });

  it('CSS still declares exactly the three EASE curves the ledger names (no new curve)', () => {
    const decls = Array.from(css.matchAll(/--sys-ease-([a-z]+)\s*:/g)).map((m) => m[1]);
    const unique = Array.from(new Set(decls)).sort();
    expect(unique).toEqual(Object.keys(EASE).sort());
  });

  it('--sys-time-crossfade still mirrors MOTION.crossfade = 120ms', () => {
    expect(MOTION.crossfade).toBe(120);
    expect(css).toMatch(/--sys-time-crossfade:\s*120ms/);
  });
});

// ─── 4 · Reduced motion — site-wide nudge is silenced ──────────────────────

describe('plate-caption-arrow — reduced motion zeros the focus-within transform', () => {
  const css = readFile(CSS_PATH);

  it('a reduced-motion override zeros transform on the site-wide selector', () => {
    // The override matches the new scope (any focusable ancestor), so
    // both KeepsakePlate AND QuoteCardLauncher silence on the same beat.
    expect(css).toMatch(
      /:focus-within\s+\.plate-caption-arrow\s*\{[^}]*transform:\s*none\s*!important/,
    );
  });

  it('the override lives inside a @media (prefers-reduced-motion: reduce) block', () => {
    const mediaOpen = css.indexOf('@media (prefers-reduced-motion: reduce)');
    const overrideAt = css.indexOf(':focus-within .plate-caption-arrow', mediaOpen);
    expect(mediaOpen).toBeGreaterThan(-1);
    expect(overrideAt).toBeGreaterThan(mediaOpen);
  });

  it('the override is NOT scoped to .plate-destination (would miss caller #2)', () => {
    // Defensive: an old-shape override (`.plate-destination:focus-within ...`)
    // would silence the plate but leave the launcher arrow translating
    // under reduced-motion. Both must silence on the same selector.
    const mediaOpen = css.indexOf('@media (prefers-reduced-motion: reduce)');
    const block = css.slice(mediaOpen);
    expect(block).not.toMatch(/\.plate-destination:focus-within\s+\.plate-caption-arrow/);
  });
});

// ─── 5 · Source order — universal rule sits AFTER .plate-destination family

describe('plate-caption-arrow — declared after the .plate-destination family', () => {
  const css = readFile(CSS_PATH);

  it('the at-rest .plate-caption-arrow rule appears AFTER `.plate-destination {`', () => {
    // Defensive cascade: the universal rule is declared after the plate's
    // family so any future plate-only override on the arrow (should one
    // ever land) wins via specificity OR source order without surprise.
    const plateAt = rulePos(css, '.plate-destination');
    const arrowAt = rulePos(css, '.plate-caption-arrow');
    expect(plateAt).toBeGreaterThan(-1);
    expect(arrowAt).toBeGreaterThan(-1);
    expect(arrowAt).toBeGreaterThan(plateAt);
  });

  it('the @keyframes plateDestinationDwell is declared before the arrow rule', () => {
    // Halo ceremony (plate-only) precedes the gesture verb (site-wide).
    // If a future contributor reorders these, the test catches the slip.
    const dwellAt = css.indexOf('@keyframes plateDestinationDwell');
    const arrowAt = rulePos(css, '.plate-caption-arrow');
    expect(dwellAt).toBeGreaterThan(-1);
    expect(arrowAt).toBeGreaterThan(dwellAt);
  });
});
