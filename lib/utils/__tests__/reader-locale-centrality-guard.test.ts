/**
 * Reader-locale centrality guard — every reader-facing date renders
 * in the reader's OS locale, never in a hard-coded `en-US`.
 *
 * Walks the repository and fails CI if a literal locale is passed
 * to `toLocaleDateString`, `toLocaleString`, or `Intl.DateTimeFormat`
 * outside the substrate at `lib/utils/reader-locale.ts`. Mirrors the
 * proven shape of `lib/content/__tests__/centrality-guard.test.ts`
 * and `lib/utils/__tests__/promise-centrality-guard.test.ts`: a Jest
 * filesystem walk, no new dependency, no ESLint rule.
 *
 * Why a guard at all (Paul §5, Mike §5):
 *   The literal `'en-US'` quietly overwrites who the reader is —
 *   their calendar, their typographic conventions, their first-
 *   archetype-by-OS. Three surfaces had drifted into stamping it
 *   (Mirror MetaLine, letter sign-off, the ArticleProvenance inline
 *   formatter). The substrate covers all three; this guard prevents
 *   a fourth drift site from ever appearing.
 *
 * Forbidden patterns — any literal locale into a date formatter:
 *   • `\.toLocaleDateString\(\s*['"][^'"]+['"]`
 *   • `\.toLocaleString\(\s*['"][^'"]+['"]`
 *   • `Intl\.DateTimeFormat\(\s*['"][^'"]+['"]`
 * Passing `undefined` (or no first arg) is the only permitted shape
 * outside the substrate, and the substrate itself is the only file
 * allowed to call `Intl.DateTimeFormat` at all.
 *
 * Allow-list (the only legitimate homes):
 *   • the substrate file, `lib/utils/reader-locale.ts`
 *   • the substrate's own tests under `lib/utils/__tests__/reader-locale*.test.ts`
 *   • render-assertion tests under any `__tests__` folder
 *
 * Comment-blind by design:
 *   The guard inspects the EXECUTABLE surface only — block and line
 *   comments are stripped before scanning. JSDoc legitimately NAMES
 *   the forbidden literal `en-US` to document the rule (the substrate's
 *   docstring names it; this guard's docstring names it; that is on
 *   purpose). Same idiom as `promise-centrality-guard.test.ts`.
 *
 * Same-line escape hatch (the carve-out vocabulary):
 *   `// reader-invariant: locale-independent` on the SAME line marks
 *   a surface as a *shared* artifact whose output must render byte-
 *   identically for every viewer (e.g. the keepsake SVG ISO stamp).
 *   This is the colon-suffixed extension of the existing
 *   `// reader-invariant` lineage in `lib/design/` — same vocabulary
 *   family, no conflation. Reader-invariants clarify; they do not
 *   warm; and locale is one of them.
 *
 * Substrate-itself assertion:
 *   The substrate file is also pinned: it must pass `undefined` (or
 *   no first arg) to `Intl.DateTimeFormat`. This prevents the
 *   substrate from secretly locking en-US the day someone "improves"
 *   it. Jason's surviving contribution, distilled by Elon, ratified
 *   by Mike (§5 bonus assertion).
 *
 * Credits:
 *   • Mike K. (#76) — the napkin plan, allow-list shape, comment-blind
 *     idiom, copy-job lineage.
 *   • Krystle C. (referenced via Mike) — drift-site teardown, perimeter shape.
 *   • Tanya D. (#2 §9) — the inspection-only acceptance test that this
 *     guard's failure message echoes ("import the substrate, or mark it
 *     reader-invariant"). The CI message names the promise, not the rule.
 *   • Jason F. (referenced via Mike) — the renamed exemption marker
 *     `// reader-invariant: locale-independent`, the substrate-self-
 *     assertion bonus.
 *   • Paul K. (referenced via Mike) — "CI failures name the promise,
 *     not the rule" — the failure-message wording below.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const SUBSTRATE_PATH = join('lib', 'utils', 'reader-locale.ts');

/** Directories the guard never enters — dependencies, build output, fixtures. */
const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'public', 'logs', 'gh', 'openloop',
  '_my', '_reports', 'coverage', 'dist', 'build',
]);

/** File extensions the guard inspects (source code only). */
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Forbidden patterns — any literal locale into a date formatter.
 * Each regex matches the SOURCE-CODE bytes; the leading `\.` ensures we
 * only catch method calls, not bare identifiers in unrelated contexts.
 * The first-arg literal must be a non-empty quoted string.
 */
const FORBIDDEN_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'toLocaleDateString-literal', regex: /\.toLocaleDateString\s*\(\s*['"][^'"]+['"]/ },
  { name: 'toLocaleString-literal',     regex: /\.toLocaleString\s*\(\s*['"][^'"]+['"]/ },
  { name: 'DateTimeFormat-literal',     regex: /Intl\.DateTimeFormat\s*\(\s*['"][^'"]+['"]/ },
];

/** Same-line escape-hatch marker — colon-suffixed reader-invariant family. */
const EXEMPT_MARKER = '// reader-invariant: locale-independent';

interface Hit {
  file: string;
  line: number;
  pattern: string;
  text: string;
}

function isSourceFile(name: string): boolean {
  return SOURCE_EXTENSIONS.some(ext => name.endsWith(ext));
}

function shouldSkip(name: string): boolean {
  return name.startsWith('.') || SKIP_DIRS.has(name);
}

function listSourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (shouldSkip(entry)) continue;
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) listSourceFiles(full, out);
    else if (s.isFile() && isSourceFile(entry)) out.push(full);
  }
  return out;
}

/** Substrate + its tests are allow-listed; render-assertion tests too. */
function isAllowed(absFile: string): boolean {
  const rel = relative(REPO_ROOT, absFile);
  if (rel === SUBSTRATE_PATH) return true;
  if (rel.startsWith(join('lib', 'utils', '__tests__', 'reader-locale'))) return true;
  if (rel.includes(`${sep}__tests__${sep}`)) return true;
  return false;
}

/**
 * Strip block + line comments. Borrowed verbatim from the promise guard
 * — JSDoc may name the forbidden literal to document the rule.
 */
function stripComments(src: string): string {
  const noBlock = src.replace(
    /\/\*[\s\S]*?\*\//g,
    (m) => m.replace(/[^\n]/g, ' '),
  );
  return noBlock.replace(/^\s*\/\/.*$/gm, (m) => ' '.repeat(m.length));
}

function scanLine(file: string, n: number, line: string): Hit[] {
  if (line.includes(EXEMPT_MARKER)) return [];
  return FORBIDDEN_PATTERNS
    .filter(p => p.regex.test(line))
    .map(p => ({ file: relative(REPO_ROOT, file), line: n + 1, pattern: p.name, text: line.trim() }));
}

function scanFile(file: string): Hit[] {
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
  return lines.flatMap((line, i) => scanLine(file, i, line));
}

/**
 * Substrate-self-assertion: the substrate must only ever pass `undefined`
 * (or no first arg) to `Intl.DateTimeFormat`. Any literal locale in the
 * substrate file is itself a bug — the substrate cannot quietly default.
 */
function scanSubstrateForLockedLocale(): Hit[] {
  const abs = join(REPO_ROOT, SUBSTRATE_PATH);
  const lines = stripComments(readFileSync(abs, 'utf8')).split('\n');
  const lockedLocale = /Intl\.DateTimeFormat\s*\(\s*['"][^'"]+['"]/;
  return lines.flatMap((line, i) =>
    lockedLocale.test(line)
      ? [{ file: SUBSTRATE_PATH, line: i + 1, pattern: 'substrate-self-lock', text: line.trim() }]
      : [],
  );
}

const FAIL_MESSAGE_HEADER =
  'reader-locale override detected — every reader-facing date renders ' +
  'in the reader\'s OS locale; en-US is not a default, it is a forbidden ' +
  'literal. Import formatReaderShortDate / formatReaderMonthDay / ' +
  'formatReaderLongDate from \'@/lib/utils/reader-locale\', or mark the ' +
  'surface\n  ' + EXEMPT_MARKER + '\nif it is a shared artifact whose ' +
  'output must render byte-identically for every viewer.';

describe('reader-locale centrality guard — every reader-facing date is locale-correct', () => {
  const sourceFiles = listSourceFiles(REPO_ROOT)
    .filter(f => !isAllowed(f));

  test('repo enumerated at least one source file (sanity)', () => {
    expect(sourceFiles.length).toBeGreaterThan(20);
  });

  test('no literal-locale date formatter calls outside the substrate', () => {
    const hits = sourceFiles.flatMap(scanFile);
    if (hits.length > 0) {
      const detail = hits.map(h => `  ${h.file}:${h.line}  [${h.pattern}]  ${h.text}`).join('\n');
      throw new Error(`${FAIL_MESSAGE_HEADER}\n\nFindings:\n${detail}`);
    }
  });

  test('the substrate itself never passes a literal locale (self-assertion)', () => {
    const hits = scanSubstrateForLockedLocale();
    expect(hits).toEqual([]);
  });

  test('the substrate file is allow-listed (positive control)', () => {
    const substrate = join(REPO_ROOT, SUBSTRATE_PATH);
    expect(isAllowed(substrate)).toBe(true);
  });

  test('the exemption marker is honored (regression pin)', () => {
    const synthetic = `const x = new Date().toLocaleDateString('en-US'); ${EXEMPT_MARKER}`;
    expect(scanLine('synthetic.ts', 0, synthetic)).toHaveLength(0);
  });

  test.each([
    ['toLocaleDateString-literal', "const s = d.toLocaleDateString('en-US', { month: 'short' });"],
    ['toLocaleString-literal',     "const s = d.toLocaleString('fr-FR', { dateStyle: 'long' });"],
    ['DateTimeFormat-literal',     "const f = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });"],
  ])('detects forbidden %s pattern (negative control)', (_name, line) => {
    expect(scanLine('synthetic.ts', 0, line).length).toBeGreaterThan(0);
  });

  test('passing `undefined` to Intl.DateTimeFormat is permitted (positive control)', () => {
    const synthetic = "new Intl.DateTimeFormat(undefined, { dateStyle: 'long' });";
    expect(scanLine('synthetic.ts', 0, synthetic)).toHaveLength(0);
  });

  test('comment-blind: a docstring naming en-US does not trigger', () => {
    // The guard strips comments before scanning — a JSDoc that names
    // the forbidden literal to document the rule must not fire.
    const synthetic = "/** uses 'en-US' as the forbidden default */";
    expect(scanFileSrc(synthetic)).toEqual([]);
  });
});

/** Helper for the comment-blind assertion — runs the same pipeline scanFile uses. */
function scanFileSrc(src: string): Hit[] {
  const lines = stripComments(src).split('\n');
  return lines.flatMap((line, i) => scanLine('synthetic.ts', i, line));
}
