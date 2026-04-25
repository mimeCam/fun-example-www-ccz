/**
 * Caption-Metric Adoption Test — the standard-face grep-fence.
 *
 * Every metric-looking caption surface (Mirror MetaLine, hero reading-time,
 * Explore card duration, print read-progress) wears the same dialect,
 * owned by `components/shared/CaptionMetric.tsx`:
 *
 *   • `tracking-sys-caption`   — caption-attitude letter-spacing
 *   • `tabular-nums`            — digit-column lock; "5" → "12" no waltz
 *   • `text-mist/70`            — alpha-ledger `quiet` rung
 *   • `text-sys-(micro|caption)` — whisper register
 *
 * **The narrow fence** (Mike #38 §4 — the smaller the fence, the louder it
 * speaks): flag any line outside the primitive that hand-rolls the
 * standard face — namely, carries BOTH `tracking-sys-caption` AND
 * `tabular-nums` in the same className. That tuple is the primitive's
 * unique signature; reproducing it by hand is the exact anti-pattern the
 * primitive exists to retire. The fence does not try to identify *every*
 * digit-bearing caption (a heuristic doomed to false positives on
 * non-metric captions); it identifies *imitations* of the primitive.
 * False negatives — a partially-drifted caption with only one of the two
 * tokens — are caught by the existing `alpha-adoption.test.ts` (off-
 * ledger `text-mist/N`) and by PR review.
 *
 * The honest exit is `<CaptionMetric>` from `components/shared/`. For
 * intentional bypasses (a hand-built metric carve-out with a documented
 * reason), tag the line with `// caption-metric:exempt — <reason>`.
 *
 * Mirrors the shape of `alpha-adoption.test.ts` (path-allow-list +
 * inline-exempt token + named legal classes in the failure message).
 *
 * Credits: Mike K. (architect napkin #38 §4 — adoption-guard spec lifted
 * from alpha-adoption + the path-allow-list shape, the `caption-metric:
 * exempt` token mirroring `alpha-ledger:exempt`, the failure-message-is-
 * documentation rule, the JIT-safe class-factory pattern), Tanya D.
 * (UIX spec — the four-class standard face every metric surface must
 * wear; PortalHero / Explore / Mirror / print precedents that snap to
 * the primitive in the same PR), Paul K. (KPI / guard-first ordering —
 * without a fence the next caption drifts within a sprint), Elon M.
 * (pair-rule discipline — primitive + adoption test + migration in one
 * PR; honest fence shape — narrower beats noisier).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** Inline token a caller writes when intentionally bypassing the fence. */
export const CAPTION_METRIC_EXEMPT_TOKEN = 'caption-metric:exempt';

/**
 * Files that legitimately own the standard-face vocabulary (the primitive
 * itself, its test, this fence). Mirrors alpha-adoption's ALLOW shape.
 * Documentation files outside the source tree are scanned by content but
 * comments inside source files cannot trigger the fence — by construction,
 * comments do not produce className tokens.
 */
const ALLOW = new Set<string>([
  'components/shared/CaptionMetric.tsx',
  'components/shared/__tests__/CaptionMetric.test.ts',
  'lib/design/__tests__/caption-metric-adoption.test.ts',
]);

/** Directories to scan (matches alpha-adoption's footprint). */
const SCAN_DIRS = ['components', 'lib/utils', 'lib/hooks', 'lib/sharing', 'app'];

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

/** The two tokens whose co-occurrence on a line IS the primitive's
 * signature. The fence fires when both are present and the line is not
 * inside `<CaptionMetric>` (the primitive is the only legitimate place
 * to spell the pair). Kept as separate regexes so the failure message
 * can name precisely what was matched. */
const TABULAR_RX  = /(?<![\w-])tabular-nums(?![\w-])/;
const TRACKING_RX = /(?<![\w-])tracking-sys-caption(?![\w-])/;

/** Strip every comment region (line, block, JSX-block) from `src`,
 * preserving newline boundaries so line numbers in violations remain
 * accurate. Three passes — `{/* ... *\/}` (JSX), `/* ... *\/` (JS
 * block), `// ...` (line). Pure, ≤ 10 LOC. The replacement keeps
 * newlines so source line numbers survive; comment text becomes
 * spaces so a `tabular-nums` mention inside a doc-block cannot
 * masquerade as code. */
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
 * `lineIsExempt` in alpha-adoption — go past a blank line and the
 * exemption ends. Drift cannot sneak under a comment two paragraphs up.
 */
function lineIsExempt(ls: readonly string[], i: number): boolean {
  for (let j = i; j >= 0; j--) {
    if (ls[j].includes(CAPTION_METRIC_EXEMPT_TOKEN)) return true;
    if (j < i && ls[j].trim() === '') return false;
  }
  return false;
}

/** True iff the line carries BOTH tracking-sys-caption AND tabular-nums. */
function carriesBothStandardTokens(line: string): boolean {
  return TRACKING_RX.test(line) && TABULAR_RX.test(line);
}

// ─── Violation collector ─────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  match: string;
}

/** Collect a single line's violation, if any. Pure, ≤ 10 LOC.
 * `code` is the comment-stripped source split into lines (line numbers
 * preserved); `original` is the raw source for the human-readable
 * `match` field and for exempt-token detection (tokens live in comments
 * by design). */
function collectLine(
  rel: string,
  code: readonly string[],
  original: readonly string[],
  i: number,
): Violation | null {
  if (!carriesBothStandardTokens(code[i])) return null;
  if (lineIsExempt(original, i)) return null;
  return { file: rel, line: i + 1, match: original[i].trim() };
}

function scanFile(rel: string, src: string): Violation[] {
  if (ALLOW.has(rel)) return [];
  const original = lines(src);
  const code = lines(stripComments(src));
  const out: Violation[] = [];
  code.forEach((_, i) => {
    const v = collectLine(rel, code, original, i);
    if (v) out.push(v);
  });
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) =>
    scanFile(relativePath(p), readFileSync(p, 'utf8')),
  );
}

// ─── Tests — the grep-fence ──────────────────────────────────────────────

describe('caption-metric adoption — every hand-rolled metric face routes through the primitive', () => {
  const violations = findAllViolations();

  /** Human-readable fix hint — names the primitive and the exit. */
  const fixHint =
    `    → use <CaptionMetric> from components/shared/CaptionMetric.tsx,\n` +
    `      OR mark the line with  // ${CAPTION_METRIC_EXEMPT_TOKEN} — <honest reason>`;

  it('no line outside CaptionMetric carries both tracking-sys-caption AND tabular-nums', () => {
    const message = violations
      .map((v) => `  ${v.file}:${v.line} — ${v.match}\n${fixHint}`)
      .join('\n');
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + message);
  });
});

// ─── Positive tests — the primitive owns the standard ────────────────────

describe('caption-metric adoption — the primitive carries the four classes', () => {
  const src = readFileSync(
    join(ROOT, 'components/shared/CaptionMetric.tsx'),
    'utf8',
  );

  it('CaptionMetric.tsx contains tracking-sys-caption', () => {
    expect(src).toContain('tracking-sys-caption');
  });

  it('CaptionMetric.tsx contains tabular-nums', () => {
    expect(src).toContain('tabular-nums');
  });

  it('CaptionMetric.tsx routes alpha through alphaClassOf (mist, quiet)', () => {
    expect(src).toContain("alphaClassOf('mist', 'quiet'");
  });

  it('CaptionMetric.tsx maps both micro + caption sizes', () => {
    expect(src).toContain('text-sys-micro');
    expect(src).toContain('text-sys-caption');
  });
});

// ─── Positive tests — primitive is adopted by the precedent surfaces ─────

describe('caption-metric adoption — the precedent surfaces use the primitive', () => {
  const SURFACES: readonly string[] = [
    'app/mirror/page.tsx',
    'components/home/PortalHero.tsx',
    'components/explore/ExploreArticleCard.tsx',
    'components/reading/ReadProgressCaption.tsx',
  ];

  /** True iff `src` imports the CaptionMetric primitive. */
  const importsPrimitive = (src: string): boolean =>
    /from\s+['"]@\/components\/shared\/CaptionMetric['"]/.test(src);

  /** True iff `src` renders the CaptionMetric tag. */
  const rendersPrimitive = (src: string): boolean =>
    /<CaptionMetric[\s>]/.test(src);

  it('every precedent surface imports AND renders <CaptionMetric>', () => {
    SURFACES.forEach((p) => {
      const src = readFileSync(join(ROOT, p), 'utf8');
      expect(importsPrimitive(src)).toBe(true);
      expect(rendersPrimitive(src)).toBe(true);
    });
  });
});

// ─── Positive test — exempt token is a discoverable string constant ──────

describe('caption-metric adoption — exempt token is exported', () => {
  it('the inline-exempt token is a discoverable string constant', () => {
    expect(CAPTION_METRIC_EXEMPT_TOKEN).toBe('caption-metric:exempt');
  });
});
