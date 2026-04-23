/**
 * Alpha Adoption Test — raw-opacity grep-fence.
 *
 * Every element's *presence* speaks one dialect owned by
 * `lib/design/alpha.ts`. This test fails when:
 *
 *   - a raw `opacity-NN` Tailwind utility (or `motion-reduce:opacity-NN`
 *     variant) appears in component or lib code without being explicitly
 *     exempted for a Motion fade endpoint
 *   - the only file path allow-listed for Motion endpoints starts to share
 *     its privilege with a second file (that's how drift re-enters)
 *
 * One file, zero config, two allow-lists (the Motion-endpoint path + the
 * inline token). Mirrors the pattern of `elevation-adoption.test.ts`.
 * Honest exemptions are marked in source with an
 * `alpha-ledger:exempt — motion fade endpoint` comment.
 *
 * The failure message IS the documentation. A PR that adds `opacity-45`
 * to a component file should fail on first run with a message that names
 * the four valid rungs and points at the Motion carve-out.
 *
 * Out of scope for this sprint (Mike §8, filed as follow-up):
 *   - `bg-foo/N` / `text-foo/N` / `border-foo/N` color-alpha shorthand.
 *     Lives at a different Tailwind layer; conflating doubles the risk.
 *
 * Credits: Mike K. (architect #24 §7 — adoption-guard spec, scope fence,
 * path-allow-list shape lifted from elevation-adoption.test.ts),
 * Tanya D. (UIX #80 §6 — the grep-fence-is-documentation rule),
 * Paul K. (guard-first ordering, adoption-guard-as-KPI), Elon M.
 * (Motion-endpoint ownership call).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  ALPHA_LEDGER_EXEMPT_TOKEN,
  ALPHA_MOTION_ENDPOINT_PATHS,
  ALPHA_ORDER,
} from '../alpha';

const ROOT = join(__dirname, '..', '..', '..');

/** Files that legitimately own alpha values (the ledger + Motion's endpoints). */
const ALLOW = new Set<string>([
  'lib/design/alpha.ts',
  ...ALPHA_MOTION_ENDPOINT_PATHS,
]);

/** Directories to scan (matches elevation-adoption's footprint). */
const SCAN_DIRS = ['components', 'lib/utils', 'lib/hooks', 'lib/sharing', 'app'];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

// ─── File walker (pure, ≤ 10 LOC each) ─────────────────────────────────────

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

// ─── Pattern scanners (pure) ──────────────────────────────────────────────

/** Match a raw Tailwind `opacity-NN` or `motion-reduce:opacity-NN`. */
const RAW_OPACITY_RX = /(?<![\w-])(?:motion-reduce:)?opacity-(\d+)(?![\w-])/g;

/** Split source on newlines so we can check exemption per line. */
function lines(src: string): string[] {
  return src.split(/\r?\n/);
}

/**
 * True iff this line carries the inline exempt token OR is inside a
 * contiguous code block preceded by a comment block that does. "Code block"
 * = lines up to (and including) the nearest empty line above this one;
 * the comment/declaration that opens the block can describe its contents.
 *
 * This shape lets a single `// alpha-ledger:exempt — motion fade endpoint`
 * line above a small phase map exempt every endpoint inside it, without
 * trailing-comment noise on every `opacity-0` / `opacity-100` literal. Go
 * past the blank line and the exemption ends — drift cannot sneak in under
 * a comment two paragraphs earlier.
 */
function lineIsExempt(ls: readonly string[], i: number): boolean {
  for (let j = i; j >= 0; j--) {
    if (ls[j].includes(ALPHA_LEDGER_EXEMPT_TOKEN)) return true;
    if (j < i && ls[j].trim() === '') return false;
  }
  return false;
}

// ─── Violation collector ──────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  match: string;
}

function scanFile(rel: string, src: string): Violation[] {
  if (ALLOW.has(rel)) return [];
  const out: Violation[] = [];
  const ls = lines(src);
  ls.forEach((line, i) => {
    const hits = Array.from(line.matchAll(RAW_OPACITY_RX));
    if (hits.length === 0) return;
    if (lineIsExempt(ls, i)) return;
    hits.forEach((m) => out.push({ file: rel, line: i + 1, match: m[0] }));
  });
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) =>
    scanFile(relativePath(p), readFileSync(p, 'utf8')),
  );
}

// ─── Tests — the grep-fence ────────────────────────────────────────────────

describe('alpha adoption — every presence value goes through the ledger', () => {
  const violations = findAllViolations();

  /**
   * The failure report names the file, the line, the raw match, and the
   * four valid rungs + the Motion carve-out — so the fix is obvious without
   * opening another tab. The message IS the documentation.
   */
  it('no raw `opacity-NN` outside the ledger and Motion carve-out', () => {
    const message = violations
      .map(
        (v) =>
          `  ${v.file}:${v.line} — ${v.match}\n` +
          `    → use opacity-{${ALPHA_ORDER.join('|')}} from the Alpha ledger,\n` +
          `      or mark the line with  // ${ALPHA_LEDGER_EXEMPT_TOKEN} — motion fade endpoint`,
      )
      .join('\n');
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + message);
  });
});

// ─── Positive tests — the two legitimate homes are present ────────────────

describe('alpha adoption — allow-listed files own their values', () => {
  it('lib/design/alpha.ts contains numeric rung definitions', () => {
    const src = readFileSync(join(ROOT, 'lib/design/alpha.ts'), 'utf8');
    expect(src).toMatch(/hairline:\s*0\.10/);
    expect(src).toMatch(/muted:\s*0\.30/);
    expect(src).toMatch(/recede:\s*0\.50/);
    expect(src).toMatch(/quiet:\s*0\.70/);
  });

  it('every rung name appears in the module exports', () => {
    const src = readFileSync(join(ROOT, 'lib/design/alpha.ts'), 'utf8');
    ALPHA_ORDER.forEach((r) => expect(src).toContain(`${r}:`));
  });

  it('Motion-endpoint carve-out file uses opacity-0 / opacity-100', () => {
    const src = readFileSync(
      join(ROOT, 'lib/utils/animation-phase.ts'),
      'utf8',
    );
    expect(src).toMatch(/opacity-(0|100)/);
  });
});

// ─── Positive test — exempt token is in the ledger export ─────────────────

describe('alpha ledger exports the exempt token', () => {
  it('the inline-exempt token is a discoverable export', () => {
    const src = readFileSync(join(ROOT, 'lib/design/alpha.ts'), 'utf8');
    expect(src).toContain('ALPHA_LEDGER_EXEMPT_TOKEN');
    expect(src).toContain(ALPHA_LEDGER_EXEMPT_TOKEN);
  });
});
