/**
 * Skeleton Adoption Test — raw `animate-pulse` grep-fence.
 *
 * Every transient-absence surface speaks one dialect owned by
 * `components/shared/Skeleton.tsx` (breath) and `lib/design/skeleton.ts`
 * (ledger). This test fails when:
 *
 *   - a raw `animate-pulse` Tailwind utility (with or without a
 *     `motion-reduce:` / `hover:` / other variant prefix) appears in
 *     component or app code outside the allow-list.
 *   - the allow-list grows past its two canonical members.
 *
 * One file, zero config, one allow-list. Mirrors the pattern of
 * `alpha-adoption.test.ts`. The failure message IS the documentation —
 * a PR that adds `animate-pulse` back to a loading.tsx should fail on
 * first run with a message that names the three valid variants and
 * points at `<Skeleton>`.
 *
 * Out of scope for this sprint (Mike §10 — do not rename anything):
 *   - generic `animate-*` utilities (they're owned by Motion / specific
 *     ledgers — `animate-mirror-shimmer`, `animate-resonance-success-enter`,
 *     etc., and are already fenced by those ledgers' own adoption tests).
 *     Conflating them doubles the risk and the regex.
 *
 * Credits: Mike K. (napkin §5 #6 — allow-list of exactly two paths,
 * failure-message-as-documentation, model after alpha-adoption.test.ts),
 * Tanya D. (the "no shimmer" rule that closes the door on future
 * variants), Paul K. (guard-first ordering).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { SKELETON_ORDER } from '../skeleton';

const ROOT = join(__dirname, '..', '..', '..');

/**
 * Files that legitimately mention the term `animate-pulse` — the ledger
 * mirror (for documentation / migration notes) and the primitive itself
 * (for the same reason). The CSS canonical source is `app/globals.css`,
 * but it never uses the Tailwind utility name — it defines its own
 * `.sys-skeleton` carrier — so it is NOT on this list by necessity.
 */
const ALLOW = new Set<string>([
  'lib/design/skeleton.ts',
  'components/shared/Skeleton.tsx',
]);

/** Directories to scan (matches alpha-adoption.test.ts's footprint). */
const SCAN_DIRS = ['components', 'lib/utils', 'lib/hooks', 'lib/sharing', 'app'];

/** File extensions to scan. Skeleton drift only lives in TSX/TS. */
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

// ─── Pattern scanner (pure) ──────────────────────────────────────────────

/**
 * Match a raw Tailwind `animate-pulse` utility, with or without a
 * variant prefix like `motion-reduce:` or `md:`. The negative lookbehind
 * / lookahead guards against substring false-positives in names like
 * `animate-pulse-slow` (we want raw `animate-pulse` only).
 */
const RAW_PULSE_RX = /(?<![\w-])(?:[a-z-]+:)*animate-pulse(?![\w-])/g;

// ─── Violation collector ─────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  match: string;
}

function scanFile(rel: string, src: string): Violation[] {
  if (ALLOW.has(rel)) return [];
  const out: Violation[] = [];
  src.split(/\r?\n/).forEach((line, i) => {
    const hits = Array.from(line.matchAll(RAW_PULSE_RX));
    hits.forEach((m) => out.push({ file: rel, line: i + 1, match: m[0] }));
  });
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) =>
    scanFile(relativePath(p), readFileSync(p, 'utf8')),
  );
}

// ─── Tests — the grep-fence ──────────────────────────────────────────────

describe('skeleton adoption — every absent surface goes through the primitive', () => {
  const violations = findAllViolations();

  /**
   * The failure report names the file, the line, the raw match, and the
   * three valid variants — so the fix is obvious without opening another
   * tab. The message IS the documentation.
   */
  it('no raw `animate-pulse` outside the Skeleton primitive', () => {
    const message = violations
      .map(
        (v) =>
          `  ${v.file}:${v.line} — ${v.match}\n` +
          `    → use <Skeleton variant="${SKELETON_ORDER.join('|')}"> from\n` +
          `      components/shared/Skeleton.tsx — never hand-wire animate-pulse.`,
      )
      .join('\n');
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + message);
  });
});

// ─── Positive tests — the two legitimate homes are present ───────────────

describe('skeleton adoption — allow-list is exactly the canonical pair', () => {
  it('ledger + primitive — and nothing else', () => {
    expect(Array.from(ALLOW).sort()).toEqual([
      'components/shared/Skeleton.tsx',
      'lib/design/skeleton.ts',
    ]);
  });

  it('allow-list stays at two entries — a third is drift re-entering', () => {
    expect(ALLOW.size).toBe(2);
  });

  it('the primitive file exists and exports the Skeleton component', () => {
    const src = readFileSync(
      join(ROOT, 'components/shared/Skeleton.tsx'),
      'utf8',
    );
    expect(src).toMatch(/export function Skeleton/);
  });

  it('the ledger file exports SKELETON_SHAPES with three variants', () => {
    const src = readFileSync(join(ROOT, 'lib/design/skeleton.ts'), 'utf8');
    expect(src).toContain('SKELETON_SHAPES');
    SKELETON_ORDER.forEach((v) => expect(src).toContain(`${v}:`));
  });
});
