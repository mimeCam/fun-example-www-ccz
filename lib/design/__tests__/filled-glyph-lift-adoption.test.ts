/**
 * Filled-Glyph Optical-Lift Adoption Test — the third grep-fence in the
 * caption-metric / numeric-features family.
 *
 * One literal, one canonical home: `relative -top-[0.5px]` (the 0.5px
 * Tailwind nudge that compensates for filled-glyph centroid drift at
 * `text-sys-micro`) lives ONLY in `lib/design/typography.ts`, exported
 * as `FILLED_GLYPH_OPTICAL_LIFT_CLASS`. Two consumers (the worldview
 * and archetype chip manifests) reach for the constant by name.
 * Tailwind JIT scans `lib/**\/*.ts`, so the literal in the export is
 * enough to emit the utility once.
 *
 * **The narrow fence** (Mike #100 §1 — *one literal, three legal homes
 * (one export + two consumers), one grep-fence*): a single regex family,
 * one allow-list. A third spelling fails CI and names the legal exits.
 *
 * Walker / comment-stripper / exempt-token check live in
 * `_fence.ts` (rule-of-three; precedents: `hue.ts`,
 * `hue-distance.ts`).
 *
 * **What this test does NOT try to assert** (Mike §4.5, Tanya §4.3): the
 * sub-pixel paint receipt — `-top-[0.5px]` may quantize to 0 on a 1×
 * display with subpixel-AA off. Source-level token vs. paint-byte audit
 * is a category split; the latter is out of scope.
 *
 * Credits: Mike K. (#100 §1 / §4.2 — adoption-guard spec, the *one
 * literal, three legal homes* shape, JSDoc-says-physics rule; #38 — the
 * path-allow-list pattern lifted from alpha-adoption; #48 — kernel-lift
 * napkin), Tanya D. (#62 §4.1 — the per-glyph optical-baseline nudge
 * that motivates the literal; #60 §3 — *shape decides group*),
 * Krystle C. (referenced — original promotion scope), Elon M.
 * (referenced — *Name the cause, not the social agreement*; the boring
 * fence shape).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runLinePatterns, formatViolations, type FenceDecl } from './_fence';

const ROOT = join(__dirname, '..', '..', '..');

/** Inline token a caller writes when intentionally bypassing the fence. */
export const FILLED_GLYPH_LIFT_EXEMPT_TOKEN = 'filled-glyph-lift:exempt';

/** Files that legitimately spell the raw `relative -top-[0.5px]` literal.
 * One home — the canonical export in the typography ledger. Both
 * consumer manifests reach for `FILLED_GLYPH_OPTICAL_LIFT_CLASS` by
 * name. */
const LIFT_ALLOW: ReadonlySet<string> = new Set(['lib/design/typography.ts']);

/** The 0.5px optical-lift literal. Whitespace between `relative` and the
 * `-top-[0.5px]` token is tolerant (one or more spaces) so a future
 * formatter pass cannot smuggle drift in under a tab/space difference. */
const LIFT_RX = /relative\s+-top-\[0\.5px\]/;

const FENCE: FenceDecl = {
  scanDirs: ['components', 'lib', 'app'],
  patterns: [{ regex: LIFT_RX, allow: LIFT_ALLOW }],
  exemptToken: FILLED_GLYPH_LIFT_EXEMPT_TOKEN,
};

// ─── Tests — the grep-fence ──────────────────────────────────────────────

describe('filled-glyph-lift adoption — every optical-lift literal routes through the canonical home', () => {
  const violations = runLinePatterns(FENCE);

  /** Human-readable fix hint — names the home and the exit token. */
  const fixHint =
    `    → import FILLED_GLYPH_OPTICAL_LIFT_CLASS from lib/design/typography\n` +
    `      and reference it from the per-glyph nudge map at the surface\n` +
    `      manifest (lib/design/worldview.ts or lib/design/archetype-accents.ts)\n` +
    `    → exempt: // ${FILLED_GLYPH_LIFT_EXEMPT_TOKEN} — <honest reason>`;

  it('no module outside the typography ledger spells the relative -top-[0.5px] literal', () => {
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + formatViolations(violations, fixHint));
  });
});

// ─── Positive tests — the typography ledger owns the canonical literal ───

describe('filled-glyph-lift adoption — typography ledger exports the canonical class', () => {
  const src = readFileSync(join(ROOT, 'lib/design/typography.ts'), 'utf8');

  it('exports FILLED_GLYPH_OPTICAL_LIFT_CLASS as the canonical name', () => {
    expect(src).toContain('FILLED_GLYPH_OPTICAL_LIFT_CLASS');
  });

  it('FILLED_GLYPH_OPTICAL_LIFT_CLASS binds to the verbatim Tailwind literal (JIT-scannable)', () => {
    expect(src).toMatch(
      /FILLED_GLYPH_OPTICAL_LIFT_CLASS\s*=\s*['"]relative -top-\[0\.5px\]['"]/,
    );
  });
});

// ─── Positive tests — the two consumer ledgers reach for the constant ────

describe('filled-glyph-lift adoption — worldview ledger imports the constant', () => {
  const src = readFileSync(join(ROOT, 'lib/design/worldview.ts'), 'utf8');

  it('worldview imports FILLED_GLYPH_OPTICAL_LIFT_CLASS from typography ledger', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*FILLED_GLYPH_OPTICAL_LIFT_CLASS[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it('worldview wires the constant into the per-glyph nudge map', () => {
    expect(src).toMatch(/WORLDVIEW_GLYPH_NUDGE[\s\S]*FILLED_GLYPH_OPTICAL_LIFT_CLASS/);
  });
});

describe('filled-glyph-lift adoption — archetype-accents ledger imports the constant', () => {
  const src = readFileSync(join(ROOT, 'lib/design/archetype-accents.ts'), 'utf8');

  it('archetype-accents imports FILLED_GLYPH_OPTICAL_LIFT_CLASS from typography ledger', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*FILLED_GLYPH_OPTICAL_LIFT_CLASS[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it('archetype-accents wires the constant into the per-glyph nudge map', () => {
    expect(src).toMatch(/ARCHETYPE_GLYPH_NUDGE[\s\S]*FILLED_GLYPH_OPTICAL_LIFT_CLASS/);
  });
});

// ─── Positive test — exempt token is a discoverable string constant ──────

describe('filled-glyph-lift adoption — exempt token is exported', () => {
  it('the inline-exempt token is a discoverable string constant', () => {
    expect(FILLED_GLYPH_LIFT_EXEMPT_TOKEN).toBe('filled-glyph-lift:exempt');
  });
});
