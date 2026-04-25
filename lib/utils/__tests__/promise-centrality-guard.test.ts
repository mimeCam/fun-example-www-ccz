/**
 * Promise-centrality guard — only one place stamps `min read`.
 *
 * Walks the repository and fails CI if the literal substring `min read`
 * appears in source code outside the canonical substrate
 * (`lib/utils/reading-time.ts`) and the dynamic resolver that delegates
 * to it (`lib/utils/read-progress.ts`). Mirrors the proven pattern in
 * `lib/content/__tests__/centrality-guard.test.ts`: a Jest filesystem
 * walk, no new dependency, no ESLint rule.
 *
 * Why a guard at all:
 *   The label `{N} min read` is the publisher's promise — the first
 *   sentence the reader meets at the door of every article. Three React
 *   components (hero, card, print fallback) used to stamp it by hand;
 *   the substrate (`formatReadingTime`) was already there, with edge
 *   cases (`0 → "No content"`, `1 → "1 min read"`) and a discoverable
 *   name. This guard prevents a fourth drift site from ever appearing.
 *
 * Allow-list (the only legitimate homes for the literal in source):
 *   - the substrate file, `lib/utils/reading-time.ts`
 *   - the delegating resolver, `lib/utils/read-progress.ts` (its JSDoc
 *     names the literal but the runtime `formatPromise` delegates and
 *     never stamps it)
 *   - the substrate's own tests under `lib/utils/__tests__`
 *   - render-assertion tests under any `components` `__tests__` folder
 *
 * Comment-blind by design:
 *   The guard inspects the EXECUTABLE surface only — block and line
 *   comments are stripped before scanning. JSDoc legitimately NAMES the
 *   forbidden literal to document the rule (the read-progress JSDoc
 *   names it; this caption JSDoc names it; the substrate's docstring
 *   names it). Forcing the documentation to invent euphemisms would
 *   age worse than the moat. Same idiom as the no-clock import-graph
 *   guard in `read-progress.test.ts`.
 *
 * Same-line escape hatch:
 *   If a non-comment use is genuinely unrelated to the duration label
 *   (e.g. a string constant under test that just happens to share the
 *   bytes), append the marker `// promise-guard:exempt` on the SAME
 *   line. Reviewer-visible exemptions beat invisible drift — same
 *   discipline as the markdown centrality guard.
 *
 * Credits:
 *   • Mike K. (architect #35) — the napkin plan, "static is substrate"
 *     framing, the copy-paste-from-content-guard rule (no new tooling).
 *   • Krystle C. (referenced via Mike #35) — original drift-site teardown,
 *     the centrality-guard mechanism.
 *   • Paul K. (referenced via Mike #35) — "ship one thing, guard it,
 *     go home" sprint shape adopted verbatim.
 *   • Elon M. (referenced via Mike #35) — substrate-versus-resolver
 *     dependency direction; the guard exempts the substrate, not the
 *     resolver's identity case.
 */

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, sep } from 'path';

const REPO_ROOT = join(__dirname, '..', '..', '..');

/**
 * Path-allow-list: files that may legitimately contain the literal
 * `min read`. Substrate + delegating resolver + their own tests +
 * render-assertion tests for the consumers. Anything else is drift.
 */
const ALLOWED_PATHS = new Set<string>([
  join('lib', 'utils', 'reading-time.ts'),
  join('lib', 'utils', 'read-progress.ts'),
]);

/** Directories the guard never enters — dependencies, build output, fixtures. */
const SKIP_DIRS = new Set([
  'node_modules', '.next', '.git', 'public', 'logs', 'gh', 'openloop',
  '_my', '_reports', 'coverage', 'dist', 'build',
]);

/** File extensions the guard inspects (source code only — not markdown). */
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/** The forbidden literal — the publisher's promise, stamped only at the substrate. */
const FORBIDDEN_LITERAL = 'min read';

/** Same-line escape-hatch marker. */
const EXEMPT_MARKER = '// promise-guard:exempt';

interface Hit {
  file: string;
  line: number;
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

/** A path is allowed if it is the substrate, the resolver, or under a test dir. */
function isAllowed(absFile: string): boolean {
  const rel = relative(REPO_ROOT, absFile);
  if (ALLOWED_PATHS.has(rel)) return true;
  if (rel.startsWith(join('lib', 'utils', '__tests__') + sep)) return true;
  if (rel.includes(`${sep}__tests__${sep}`)) return true;
  return false;
}

function scanLine(file: string, n: number, line: string): Hit[] {
  if (line.includes(EXEMPT_MARKER)) return [];
  if (!line.includes(FORBIDDEN_LITERAL)) return [];
  return [{ file: relative(REPO_ROOT, file), line: n + 1, text: line.trim() }];
}

/**
 * Replace block comment bodies and line comment bodies with whitespace
 * (preserving newline count so reported line numbers stay accurate).
 * Borrowed verbatim from the no-clock guard in `read-progress.test.ts`
 * — JSDoc may name the forbidden literal to document the moat.
 */
function stripComments(src: string): string {
  const noBlock = src.replace(
    /\/\*[\s\S]*?\*\//g,
    (m) => m.replace(/[^\n]/g, ' '),
  );
  return noBlock.replace(/^\s*\/\/.*$/gm, (m) => ' '.repeat(m.length));
}

function scanFile(file: string): Hit[] {
  const lines = stripComments(readFileSync(file, 'utf8')).split('\n');
  return lines.flatMap((line, i) => scanLine(file, i, line));
}

describe('promise centrality guard — one place stamps `min read`', () => {
  const sourceFiles = listSourceFiles(REPO_ROOT)
    .filter(f => !isAllowed(f));

  test('repo enumerated at least one source file (sanity)', () => {
    expect(sourceFiles.length).toBeGreaterThan(20);
  });

  test('no `min read` literal appears outside the substrate + resolver', () => {
    const hits = sourceFiles.flatMap(scanFile);
    if (hits.length > 0) {
      const detail = hits.map(h => `  ${h.file}:${h.line}  ${h.text}`).join('\n');
      throw new Error(
        `promise-centrality guard: ${hits.length} drift site(s) found.\n` +
        `Import \`formatReadingTime\` from '@/lib/utils/reading-time' instead.\n` +
        `If a use is genuinely unrelated to the duration label, append:\n` +
        `  ${EXEMPT_MARKER}\n` +
        `to the same line.\n\nFindings:\n${detail}`,
      );
    }
  });

  test('the exemption marker is honored (regression pin)', () => {
    const synthetic = `const sample = '5 ${FORBIDDEN_LITERAL}'; ${EXEMPT_MARKER}`;
    expect(scanLine('synthetic.ts', 0, synthetic)).toHaveLength(0);
  });

  test('the substrate file is allow-listed (positive control)', () => {
    const substrate = join(REPO_ROOT, 'lib', 'utils', 'reading-time.ts');
    expect(isAllowed(substrate)).toBe(true);
  });

  test('the resolver file is allow-listed (positive control)', () => {
    const resolver = join(REPO_ROOT, 'lib', 'utils', 'read-progress.ts');
    expect(isAllowed(resolver)).toBe(true);
  });

  test('a synthetic drift site IS detected (negative control)', () => {
    const synthetic = `const ui = <span>{n} ${FORBIDDEN_LITERAL}</span>;`;
    expect(scanLine('synthetic.tsx', 0, synthetic).length).toBeGreaterThan(0);
  });
});
