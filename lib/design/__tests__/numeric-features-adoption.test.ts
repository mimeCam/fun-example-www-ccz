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
 *      `<CaptionMetric>` primitive (`components/shared/CaptionMetric.tsx`)
 *      carries `tabular-nums` as a Tailwind class. Every screen surface
 *      (Mirror MetaLine, hero reading-time, Explore card duration, screen
 *      read-progress, print read-progress) reaches for the primitive — no
 *      hand-rolled `fontVariantNumeric: 'tabular-nums'` style literals.
 *
 * **The narrow fence** (Mike #77 §3 — *one literal, two homes, one
 * adoption guard*): two regex families, one allow-list per family. A
 * third home for either literal fails CI and names the legal exits.
 *
 *   • `font-feature-settings.*tnum|lnum` — only legal in
 *     `lib/design/typography.ts` (the export) and
 *     `lib/sharing/thread-render.ts` (the SVG consumer).
 *   • `fontVariantNumeric` — only legal in
 *     `lib/design/typography.ts` (documentation home) and
 *     `components/shared/CaptionMetric.tsx` (the primitive — though it
 *     uses the Tailwind class, the documentation home is allow-listed
 *     for forward-compatibility with a possible future inline literal).
 *
 * Mirror of `caption-metric-adoption.test.ts` — comment-blind line
 * normalizer, word-boundary regex, path-allow-list, inline exempt token.
 * Reviewer muscle memory unchanged.
 *
 * Credits: Mike K. (#77 §3, §5 — adoption-guard spec, the *one literal,
 * two homes* shape, JSDoc-says-SVG-only rule, mirror of caption-metric
 * fence; #38 — the path-allow-list pattern lifted from alpha-adoption),
 * Tanya D. (#90 §3.7 — single-quoted feature tags so SVG attributes
 * embed without escaping; #90 §3.6 — the slot-pin-the-digit discipline
 * that makes this fence load-bearing), Krystle C. (referenced — original
 * promotion scope: one literal, two homes), Elon M. (referenced — *Name
 * the CSS, not the cosmology*; the boring fence shape), Paul K.
 * (referenced — *centrality, not coverage*; the test is the registry).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** Inline token a caller writes when intentionally bypassing the fence. */
export const NUMERIC_FEATURES_EXEMPT_TOKEN = 'numeric-features:exempt';

/** Files that legitimately spell the raw SVG/canvas `font-feature-settings`
 * literal. Two homes — the export and the one SVG consumer. */
const FEATURE_SETTINGS_ALLOW = new Set<string>([
  'lib/design/typography.ts',
  'lib/sharing/thread-render.ts',
]);

/** Files that legitimately spell `fontVariantNumeric` — only the
 * typography ledger (documentation + future-proofing) and the
 * `<CaptionMetric>` primitive. The primitive uses the Tailwind class
 * today; the allow-list is forward-compatible with a future inline
 * fallback. */
const FONT_VARIANT_ALLOW = new Set<string>([
  'lib/design/typography.ts',
  'components/shared/CaptionMetric.tsx',
]);

/** Directories to scan (matches caption-metric-adoption's footprint). */
const SCAN_DIRS = ['components', 'lib', 'app'];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

// ─── File walker (pure, ≤ 10 LOC each) ───────────────────────────────────

function isScannableFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!SCAN_EXTS.has(ext)) return false;
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
  if (path.endsWith('.d.ts')) return false;
  return !path.includes(`${sep}__tests__${sep}`);
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (isScannableFile(full)) acc.push(full);
  }
  return acc;
}

function collectFiles(): string[] {
  return SCAN_DIRS.flatMap((d) => walk(join(ROOT, d)));
}

function relativePath(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

// ─── Pattern scanners (pure) ─────────────────────────────────────────────

/** SVG/canvas literal — `font-feature-settings: ... 'tnum' ...` (or `lnum`). */
const FEATURE_TNUM_RX = /font-feature-settings\s*:[^;]*?(?<![\w-])tnum(?![\w-])/;
const FEATURE_LNUM_RX = /font-feature-settings\s*:[^;]*?(?<![\w-])lnum(?![\w-])/;

/** React style key — `fontVariantNumeric:` (with optional whitespace). */
const FONT_VARIANT_RX = /(?<![\w-])fontVariantNumeric\s*:/;

/** Strip every comment region (line, block, JSX-block) from `src`,
 * preserving newline boundaries so line numbers in violations remain
 * accurate. Three passes — `{/* ... *\/}` (JSX), `/* ... *\/` (JS
 * block), `// ...` (line). Pure, ≤ 10 LOC. */
function stripComments(src: string): string {
  const blank = (m: string): string => m.replace(/[^\n]/g, ' ');
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/\/\/[^\n]*/g, blank);
}

/** Split source on newlines so we can check exemption per line. */
function lines(src: string): string[] {
  return src.split(/\r?\n/);
}

/**
 * True iff this line carries the inline exempt token OR is inside a
 * contiguous code block opened by a comment carrying it. Same shape as
 * `lineIsExempt` in caption-metric-adoption — go past a blank line and
 * the exemption ends.
 */
function lineIsExempt(ls: readonly string[], i: number): boolean {
  for (let j = i; j >= 0; j--) {
    if (ls[j].includes(NUMERIC_FEATURES_EXEMPT_TOKEN)) return true;
    if (j < i && ls[j].trim() === '') return false;
  }
  return false;
}

/** True iff `line` carries the SVG/canvas `font-feature-settings` literal
 * with a `tnum` or `lnum` feature tag. */
function carriesFeatureSettings(line: string): boolean {
  return FEATURE_TNUM_RX.test(line) || FEATURE_LNUM_RX.test(line);
}

/** True iff `line` carries the React `fontVariantNumeric` style key. */
function carriesFontVariant(line: string): boolean {
  return FONT_VARIANT_RX.test(line);
}

// ─── Violation collector ─────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  match: string;
  kind: 'font-feature-settings' | 'fontVariantNumeric';
}

/** Collect a single line's violations (one or both kinds). Pure, ≤ 10 LOC. */
function collectLine(
  rel: string,
  code: readonly string[],
  original: readonly string[],
  i: number,
): Violation[] {
  if (lineIsExempt(original, i)) return [];
  const out: Violation[] = [];
  if (carriesFeatureSettings(code[i]) && !FEATURE_SETTINGS_ALLOW.has(rel)) {
    out.push({ file: rel, line: i + 1, match: original[i].trim(), kind: 'font-feature-settings' });
  }
  if (carriesFontVariant(code[i]) && !FONT_VARIANT_ALLOW.has(rel)) {
    out.push({ file: rel, line: i + 1, match: original[i].trim(), kind: 'fontVariantNumeric' });
  }
  return out;
}

function scanFile(rel: string, src: string): Violation[] {
  const original = lines(src);
  const code = lines(stripComments(src));
  const out: Violation[] = [];
  code.forEach((_, i) => {
    out.push(...collectLine(rel, code, original, i));
  });
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) =>
    scanFile(relativePath(p), readFileSync(p, 'utf8')),
  );
}

// ─── Tests — the grep-fence ──────────────────────────────────────────────

describe('numeric-features adoption — every numeric-typography literal routes through one of the two homes', () => {
  const violations = findAllViolations();

  /** Human-readable fix hint — names both homes and the exit token. */
  const fixHint =
    `    → SVG/canvas: import numericFeatureStyle() from lib/design/typography\n` +
    `    → DOM:       use <CaptionMetric> from components/shared/CaptionMetric.tsx\n` +
    `    → exempt:    // ${NUMERIC_FEATURES_EXEMPT_TOKEN} — <honest reason>`;

  it('no module outside the two homes spells font-feature-settings tnum/lnum or fontVariantNumeric', () => {
    const message = violations
      .map((v) => `  ${v.file}:${v.line} [${v.kind}] — ${v.match}\n${fixHint}`)
      .join('\n');
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + message);
  });
});

// ─── Positive tests — the typography ledger owns the SVG/canvas register ─

describe('numeric-features adoption — typography ledger exports the SVG/canvas helper', () => {
  const src = readFileSync(
    join(ROOT, 'lib/design/typography.ts'),
    'utf8',
  );

  it('exports NUMERIC_FEATURE_SETTINGS as the canonical literal', () => {
    expect(src).toContain('NUMERIC_FEATURE_SETTINGS');
  });

  it('NUMERIC_FEATURE_SETTINGS contains both tnum and lnum (load-bearing)', () => {
    // The value is a string literal that itself embeds single-quoted
    // OpenType feature tags (e.g. `"... 'tnum' 1, 'lnum' 1"`); match the
    // assignment up to the next semicolon or end-of-line so the inner
    // quotes do not break the match.
    expect(src).toMatch(
      /NUMERIC_FEATURE_SETTINGS\s*=[\s\S]*?tnum[\s\S]*?lnum/,
    );
  });

  it('exports numericFeatureStyle() as the consumer-facing helper', () => {
    expect(src).toMatch(/numericFeatureStyle\s*=\s*\(\)\s*:\s*string/);
  });
});

// ─── Positive tests — the SVG consumer reaches for the helper ────────────

describe('numeric-features adoption — thread-render imports the helper', () => {
  const src = readFileSync(
    join(ROOT, 'lib/sharing/thread-render.ts'),
    'utf8',
  );

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
