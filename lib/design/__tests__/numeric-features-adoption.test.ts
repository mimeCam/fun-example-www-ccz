/**
 * Numeric-Features Adoption Test — the second grep-fence in the
 * caption-metric family.
 *
 * Two related literals carry tabular + lining figures across the
 * codebase, with two — and only two — legitimate homes:
 *
 *   1. SVG / canvas register
 *      `font-feature-settings: 'tnum' 1, 'lnum' 1`
 *      Owned by `lib/design/typography.ts` via
 *      `NUMERIC_FEATURE_SETTINGS` + `numericFeatureStyle()`. Server-built
 *      SVG strings (`lib/sharing/thread-render.ts`) cannot honor a
 *      Tailwind class — the unfurl is bytes, not a DOM. This is the only
 *      register where the raw `font-feature-settings` literal is legal.
 *
 *   2. DOM register
 *      `<CaptionMetric>` carries `tabular-nums` as a Tailwind class.
 *      Every screen surface reaches for the primitive — no hand-rolled
 *      `fontVariantNumeric: 'tabular-nums'` style literals.
 *
 * **The narrow fence** (Mike #77 §3 — *one literal, two homes, one
 * adoption guard*): two patterns, one allow-list per pattern. A third
 * home for either literal fails CI and names the legal exits.
 *
 * Walker / comment-stripper / exempt-token check live in
 * `_fence.ts` (rule-of-three; precedents: `hue.ts`,
 * `hue-distance.ts`).
 *
 * Credits: Mike K. (#77 §3, §5 — adoption-guard spec, the *one literal,
 * two homes* shape, JSDoc-says-SVG-only rule; #38 — the path-allow-list
 * pattern lifted from alpha-adoption; #48 — kernel-lift napkin),
 * Tanya D. (#90 §3.7 — single-quoted feature tags so SVG attributes
 * embed without escaping; #90 §3.6 — slot-pin-the-digit discipline),
 * Krystle C. (referenced — original promotion scope), Elon M.
 * (referenced — *Name the CSS, not the cosmology*; the boring fence
 * shape), Paul K. (referenced — *centrality, not coverage*).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runLinePatterns, formatViolations, type FenceDecl } from './_fence';

const ROOT = join(__dirname, '..', '..', '..');

/** Inline token a caller writes when intentionally bypassing the fence. */
export const NUMERIC_FEATURES_EXEMPT_TOKEN = 'numeric-features:exempt';

/** Files that legitimately spell the raw SVG/canvas
 * `font-feature-settings` literal. Two homes — the export and the one
 * SVG consumer. */
const FEATURE_SETTINGS_ALLOW: ReadonlySet<string> = new Set([
  'lib/design/typography.ts',
  'lib/sharing/thread-render.ts',
]);

/** Files that legitimately spell `fontVariantNumeric` — only the
 * typography ledger (documentation + future-proofing) and the
 * `<CaptionMetric>` primitive. */
const FONT_VARIANT_ALLOW: ReadonlySet<string> = new Set([
  'lib/design/typography.ts',
  'components/shared/CaptionMetric.tsx',
]);

/** SVG/canvas literal — `font-feature-settings: ... 'tnum' ...` (or `lnum`).
 * Combined into one regex so a line carrying both `tnum` and `lnum` (the
 * canonical pairing) yields exactly one violation, matching the prior
 * `||` shape byte-for-byte. */
const FEATURE_RX =
  /font-feature-settings\s*:[^;]*?(?<![\w-])(?:tnum|lnum)(?![\w-])/;

/** React style key — `fontVariantNumeric:` (with optional whitespace). */
const FONT_VARIANT_RX = /(?<![\w-])fontVariantNumeric\s*:/;

const FENCE: FenceDecl = {
  scanDirs: ['components', 'lib', 'app'],
  patterns: [
    { regex: FEATURE_RX, allow: FEATURE_SETTINGS_ALLOW, kind: 'font-feature-settings' },
    { regex: FONT_VARIANT_RX, allow: FONT_VARIANT_ALLOW, kind: 'fontVariantNumeric' },
  ],
  exemptToken: NUMERIC_FEATURES_EXEMPT_TOKEN,
};

// ─── Tests — the grep-fence ──────────────────────────────────────────────

describe('numeric-features adoption — every numeric-typography literal routes through one of the two homes', () => {
  const violations = runLinePatterns(FENCE);

  /** Human-readable fix hint — names both homes and the exit token. */
  const fixHint =
    `    → SVG/canvas: import numericFeatureStyle() from lib/design/typography\n` +
    `    → DOM:       use <CaptionMetric> from components/shared/CaptionMetric.tsx\n` +
    `    → exempt:    // ${NUMERIC_FEATURES_EXEMPT_TOKEN} — <honest reason>`;

  it('no module outside the two homes spells font-feature-settings tnum/lnum or fontVariantNumeric', () => {
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + formatViolations(violations, fixHint));
  });
});

// ─── Positive tests — typography ledger owns the SVG/canvas register ─────

describe('numeric-features adoption — typography ledger exports the SVG/canvas helper', () => {
  const src = readFileSync(join(ROOT, 'lib/design/typography.ts'), 'utf8');

  it('exports NUMERIC_FEATURE_SETTINGS as the canonical literal', () => {
    expect(src).toContain('NUMERIC_FEATURE_SETTINGS');
  });

  it('NUMERIC_FEATURE_SETTINGS contains both tnum and lnum (load-bearing)', () => {
    // The value is a string literal embedding single-quoted OpenType
    // feature tags (e.g. `"... 'tnum' 1, 'lnum' 1"`); match the
    // assignment up to the next semicolon or end-of-line.
    expect(src).toMatch(/NUMERIC_FEATURE_SETTINGS\s*=[\s\S]*?tnum[\s\S]*?lnum/);
  });

  it('exports numericFeatureStyle() as the consumer-facing helper', () => {
    expect(src).toMatch(/numericFeatureStyle\s*=\s*\(\)\s*:\s*string/);
  });
});

// ─── Positive tests — the SVG consumer reaches for the helper ────────────

describe('numeric-features adoption — thread-render imports the helper', () => {
  const src = readFileSync(join(ROOT, 'lib/sharing/thread-render.ts'), 'utf8');

  it('thread-render imports numericFeatureStyle from typography ledger', () => {
    expect(src).toMatch(
      /import\s*\{[^}]*numericFeatureStyle[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it('thread-render uses numericFeatureStyle() at the SVG style attribute', () => {
    expect(src).toMatch(/style="\$\{numericFeatureStyle\(\)\}"/);
  });
});

// ─── Positive test — exempt token is a discoverable string constant ──────

describe('numeric-features adoption — exempt token is exported', () => {
  it('the inline-exempt token is a discoverable string constant', () => {
    expect(NUMERIC_FEATURES_EXEMPT_TOKEN).toBe('numeric-features:exempt');
  });
});
