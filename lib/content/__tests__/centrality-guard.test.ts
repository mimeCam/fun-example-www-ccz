/**
 * Centrality guard — no surface re-derives the strip pipeline.
 *
 * Walks the repository and fails CI if a markdown-strip regex literal
 * appears outside `lib/content/`.  This is the cheapest insurance against
 * the threshold-leak class of bug regressing in a later sprint: a
 * filesystem grep that runs in Jest, no new dependency, no ESLint rule.
 *
 * Owned patterns (the markdown-strip vocabulary):
 *   • paired emphasis             `**…**` / `__…__` / `*…*` / `_…_`
 *   • markdown link tail          `](…)`
 *   • leading heading marker      `# `, `## `, … at line start
 *
 * If you genuinely need one of these regex literals OUTSIDE lib/content/
 * for a non-prose reason (e.g. parsing user search input that isn't
 * being rendered), justify it in a comment that ends with the marker
 * `// markdown-guard:exempt` on the SAME line.  The guard honors that
 * exemption deliberately — see the test below.
 *
 * Credits:
 *   • Mike K. (architect #78) — proposed the guard pattern, named it,
 *     and pinned its scope (one-file walk, no custom lint rule).
 *   • Jason Fried — broadened the guard wording from "one regex" to
 *     "the strip vocabulary".
 *   • Krystle Clear (VP Product) — flagged the bug class that this
 *     guard prevents from regressing.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const ALLOWED_DIR = join('lib', 'content');

/** Directories the guard never enters — dependencies, build output, tests. */
const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'public', 'logs', 'gh', 'openloop',
  '_my', '_reports', 'coverage', 'dist', 'build',
]);

/** File extensions the guard inspects (source code only). */
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Strip-vocabulary patterns forbidden outside `lib/content/`.
// Each pattern targets a SOURCE-CODE substring (the bytes that would
// appear inside a regex literal in someone's source), not a runtime
// value — so the JS regex itself escapes its metacharacters twice.
// The heading marker is kept broad: a `#{1,6}` quantifier anywhere
// in source is a strong tell that someone is hand-rolling a header
// strip; a narrower anchor would silently miss the next regression.
const FORBIDDEN_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'paired-emphasis-asterisk',  regex: /\\\*\\\*/ },
  { name: 'paired-emphasis-underscore', regex: /\\__/ },
  { name: 'markdown-link-tail',        regex: /\\\]\\\(/ },
  { name: 'heading-marker-quantifier', regex: /#\{1,6\}/ },
];

const EXEMPT_MARKER = '// markdown-guard:exempt';

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

function isAllowed(file: string): boolean {
  return relative(REPO_ROOT, file).split(sep).slice(0, 2).join(sep) === ALLOWED_DIR;
}

function scanLine(file: string, n: number, line: string): Hit[] {
  if (line.includes(EXEMPT_MARKER)) return [];
  return FORBIDDEN_PATTERNS
    .filter(p => p.regex.test(line))
    .map(p => ({ file: relative(REPO_ROOT, file), line: n + 1, pattern: p.name, text: line.trim() }));
}

function scanFile(file: string): Hit[] {
  const lines = readFileSync(file, 'utf8').split('\n');
  return lines.flatMap((line, i) => scanLine(file, i, line));
}

describe('centrality guard — no surface re-derives the strip pipeline', () => {
  const sourceFiles = listSourceFiles(REPO_ROOT)
    .filter(f => !isAllowed(f));

  test('repo enumerated at least one source file (sanity)', () => {
    expect(sourceFiles.length).toBeGreaterThan(20);
  });

  test('no markdown-strip regex literals appear outside lib/content/', () => {
    const hits = sourceFiles.flatMap(scanFile);
    if (hits.length > 0) {
      const detail = hits.map(h => `  ${h.file}:${h.line}  [${h.pattern}]  ${h.text}`).join('\n');
      throw new Error(
        `centrality guard: ${hits.length} markdown-strip regex literal(s) found outside lib/content/.\n` +
        `Import stripMarkdownTokens / collapseWhitespace from '@/lib/content/excerpt' instead.\n` +
        `If a use is genuinely unrelated to prose rendering, append the marker:\n` +
        `  ${EXEMPT_MARKER}\n` +
        `to the same line.\n\nFindings:\n${detail}`,
      );
    }
  });

  test('the exemption marker is honored (regression pin)', () => {
    // A synthetic line that carries a forbidden pattern AND the exemption
    // — the scanner must report zero hits for it.
    const synthetic = "const re = /\\*\\*/g; " + EXEMPT_MARKER;
    const hits = scanLine('synthetic.ts', 0, synthetic);
    expect(hits).toHaveLength(0);
  });

  test.each([
    ['paired-emphasis-asterisk',  "const re = /\\*\\*([^*]+)\\*\\*/g;"],
    ['paired-emphasis-underscore', "const re = /\\__([^_]+)\\__/g;"],
    ['markdown-link-tail',        "const re = /\\[([^\\]]+)\\]\\(/g;"],
    ['heading-marker-quantifier', "const re = /^#{1,6}\\s/gm;"],
  ])('detects forbidden %s pattern (negative control)', (_name, line) => {
    const hits = scanLine('synthetic.ts', 0, line);
    expect(hits.length).toBeGreaterThan(0);
  });
});
