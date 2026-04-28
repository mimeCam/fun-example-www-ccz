/**
 * External-Glyph Baseline-Nudge Adoption Test — the fourth grep-fence in
 * the inline-typography family (sibling of `filled-glyph-lift-adoption`).
 *
 * One literal, one canonical home: `verticalAlign: '0.08em'` (the inline
 * style that lifts the 10×10 SVG external-link arrow's centroid onto the
 * surrounding x-height) lives ONLY in `lib/design/typography.ts`, exported
 * as `EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE`. One consumer
 * (`components/shared/TextLink.tsx`'s `<ExternalGlyph>`) reaches for the
 * constant by name.
 *
 * **The narrow fence** (Mike's napkin — *one literal, one home, one
 * fence*): a single regex family, one allow-list. A second spelling fails
 * CI and names the legal exit. N=1 is not a category — the fence does NOT
 * pre-emptively allow a `*_NUDGE_MAP` shape; that promotion happens only
 * if and when a second physically-different glyph nudge enters the tree.
 *
 * Walker / comment-stripper / exempt-token check live in `_fence.ts`
 * (rule-of-three already fired on the prior fences;
 * `filled-glyph-lift-adoption.test.ts` is the line-for-line precedent).
 *
 * Whitespace tolerance — the regex uses `\s*:\s*` so a Prettier pass
 * cannot smuggle drift in under a tab/space-around-colon difference.
 *
 * Credits: Mike K. (the napkin — adoption-guard spec, the *one literal,
 * one home, one fence* shape, JSDoc-says-physics rule, the explicit
 * rejection of a speculative `_NUDGE_MAP`), Tanya D. (UX spec §2.1 —
 * pixel-diff zero, §4.6 — the broader *next-nudge* watch list), Krystle C.
 * (the original tactical PR pitch — one literal, one named token, fence-
 * test extension, rule-of-zero on speculative siblings), Elon M.
 * (referenced — N=1 is not a category; mechanism > metaphor).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runLinePatterns, formatViolations, type FenceDecl } from './_fence';

const ROOT = join(__dirname, '..', '..', '..');

/** Inline token a caller writes when intentionally bypassing the fence. */
export const EXTERNAL_GLYPH_BASELINE_NUDGE_EXEMPT_TOKEN =
  'external-glyph-baseline-nudge:exempt';

/** Files that legitimately spell the raw `verticalAlign: '0.08em'` literal.
 *  One home — the canonical export in the typography ledger. The single
 *  consumer (`components/shared/TextLink.tsx`) reaches for
 *  `EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE` by name. */
const NUDGE_ALLOW: ReadonlySet<string> = new Set(['lib/design/typography.ts']);

/** The `verticalAlign: '0.08em'` literal, whitespace-tolerant around the
 *  colon and quote-style-tolerant (single or double quotes) so a future
 *  formatter pass cannot smuggle drift in. */
const NUDGE_RX = /verticalAlign\s*:\s*['"]0\.08em['"]/;

/**
 * Carve out the JSDoc block that immediately precedes `name` in `src`.
 * Returns the substring between the last `/**` and the matching `*​/` that
 * sits directly above the export. Pure, ≤ 10 LOC.
 */
function extractDocBlockBefore(src: string, name: string): string {
  const idx = src.indexOf(`export const ${name}`);
  if (idx < 0) return '';
  const before = src.slice(0, idx);
  const open = before.lastIndexOf('/**');
  const close = before.lastIndexOf('*/');
  if (open < 0 || close < 0 || close < open) return '';
  return before.slice(open, close + 2);
}

const FENCE: FenceDecl = {
  scanDirs: ['components', 'lib', 'app'],
  patterns: [{ regex: NUDGE_RX, allow: NUDGE_ALLOW }],
  exemptToken: EXTERNAL_GLYPH_BASELINE_NUDGE_EXEMPT_TOKEN,
};

// ─── Tests — the grep-fence ──────────────────────────────────────────────

describe('external-glyph baseline-nudge adoption — every verticalAlign:0.08em routes through the canonical home', () => {
  const violations = runLinePatterns(FENCE);

  /** Human-readable fix hint — names the home and the exit token. */
  const fixHint =
    `    → import EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE from lib/design/typography\n` +
    `      and pass it as the SVG glyph's style prop\n` +
    `      (precedent: components/shared/TextLink.tsx → ExternalGlyph)\n` +
    `    → exempt: // ${EXTERNAL_GLYPH_BASELINE_NUDGE_EXEMPT_TOKEN} — <honest reason>`;

  it('no module outside the typography ledger spells the verticalAlign 0.08em literal', () => {
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + formatViolations(violations, fixHint));
  });
});

// ─── Positive tests — the typography ledger owns the canonical literal ───

describe('external-glyph baseline-nudge adoption — typography ledger exports the canonical style', () => {
  const src = readFileSync(join(ROOT, 'lib/design/typography.ts'), 'utf8');

  it('exports EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE as the canonical name', () => {
    expect(src).toContain('EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE');
  });

  it('binds to a frozen `as const` CSSProperties literal carrying verticalAlign 0.08em', () => {
    expect(src).toMatch(
      /EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE\s*=\s*\{\s*verticalAlign\s*:\s*['"]0\.08em['"]\s*,?\s*\}\s*as const satisfies\s+Readonly<CSSProperties>/,
    );
  });

  it('JSDoc above the constant names the optical reason in plain English', () => {
    // The JSDoc rule: the prose must mention 0.08em, the SVG glyph, and
    // the centroid drift — without these anchors a future contributor can
    // "simplify" the const back to zero. We scope the proximity check to
    // the doc-block immediately preceding the export.
    const block = extractDocBlockBefore(src, 'EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE');
    expect(block).toMatch(/centroid/);
    expect(block).toMatch(/0\.08em/);
    expect(block).toMatch(/SVG/);
  });
});

// ─── Positive test — the single consumer reaches for the constant ────────

describe('external-glyph baseline-nudge adoption — TextLink imports the constant', () => {
  const src = readFileSync(join(ROOT, 'components/shared/TextLink.tsx'), 'utf8');

  it('TextLink imports EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE from the typography ledger', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it('TextLink wires the constant onto the ExternalGlyph SVG style prop', () => {
    expect(src).toMatch(/style=\{EXTERNAL_GLYPH_BASELINE_NUDGE_STYLE\}/);
  });

  it('TextLink no longer carries the inline verticalAlign 0.08em literal', () => {
    expect(src).not.toMatch(NUDGE_RX);
  });
});

// ─── Positive test — exempt token is a discoverable string constant ──────

describe('external-glyph baseline-nudge adoption — exempt token is exported', () => {
  it('the inline-exempt token is a discoverable string constant', () => {
    expect(EXTERNAL_GLYPH_BASELINE_NUDGE_EXEMPT_TOKEN).toBe(
      'external-glyph-baseline-nudge:exempt',
    );
  });
});
