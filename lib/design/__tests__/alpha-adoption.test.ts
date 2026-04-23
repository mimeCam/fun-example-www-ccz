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
 * Phase II (Mike #38): the color-alpha shorthand `(bg|text|border|shadow)-
 * <color>/<N>` joins the fence. Only ledger rungs (N ∈ {10, 30, 50, 70})
 * plus the Motion carve-out (N = 100) are admitted; a path-grandfather
 * list in `alpha.ts` absorbs the pre-Phase-II drift (one receipt per file,
 * shrinks only), so the fence enforces *new* drift at zero cost to CI.
 *
 * Credits: Mike K. (architect #24 §7 — adoption-guard spec, scope fence,
 * path-allow-list shape lifted from elevation-adoption.test.ts; #38 §4/§5
 * — color-alpha COLOR_ALPHA_RX, JIT-safe helper, 100-as-Motion-carve-out,
 * widen to shadow-<color>/N), Tanya D. (UIX #80 §6 / UX #58 §2.1 — the
 * grep-fence-is-documentation rule; "one ambient-chrome voice" is what
 * this enforces at the surface level), Paul K. (guard-first ordering,
 * adoption-guard-as-KPI), Elon M. (Motion-endpoint ownership call).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS,
  ALPHA_COLOR_SHORTHAND_LEGAL_PCTS,
  ALPHA_LEDGER_EXEMPT_TOKEN,
  ALPHA_MOTION_ENDPOINT_PATHS,
  ALPHA_ORDER,
  alphaClassOf,
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

/**
 * Match an inline-style `opacity: <number>` literal in JSX — exactly the
 * shape `style={{ opacity: 0.3 }}` drifts as. Matches:
 *   - `opacity: 0.4`, `opacity: .4`, `opacity: 1`, `opacity: 0`
 * Does NOT match:
 *   - `opacity: <expr>` (ternary / variable — no numeric literal head)
 *   - `opacity-{rung}` Tailwind utility (handled by `RAW_OPACITY_RX`)
 *
 * Per Mike K. §4c: `0` and `1` are Motion endpoints, permitted only when
 * the line carries the exemption token.
 */
const INLINE_OPACITY_RX = /opacity\s*:\s*(0?\.\d+|\d+)\b/g;

/**
 * Match a Tailwind color-alpha shorthand: `(bg|text|border|shadow)-
 * <color>/<N>`. Phase II (Mike #38 §4.2). The property prefixes are the
 * four where the slash-percent syntax is a *presence* dial on a tinted
 * surface; excluded: `from-`/`to-`/`via-` (gradient stops are a Color-ledger
 * composition semantic, not Alpha — Mike §5.7). Excluded: `ring-` / `outline-`
 * — no current usage; revisit when one appears.
 *
 * The regex is word-bounded so it won't accidentally chew `not-border-foo/30`.
 * Capture group 2 is the percent; the guard filters by
 * ALPHA_COLOR_SHORTHAND_LEGAL_PCTS to decide snap-vs-drift.
 */
const COLOR_ALPHA_RX = /(?<![\w-])(bg|text|border|shadow)-([a-z][\w-]*)\/(\d+)(?![\w-])/g;

/** Files grandfathered — drift pending migration (shrinks as PRs land). */
const COLOR_GRANDFATHER = new Set<string>(
  ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS,
);

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

type Kind = 'raw-tw' | 'inline-style' | 'color-alpha';

interface Violation {
  file: string;
  line: number;
  match: string;
  kind: Kind;
}

/**
 * Collect matches for one regex on one line, honouring the per-line
 * exempt-token convention. Pure. `≤ 10 LOC` by design.
 */
function collectLine(
  rel: string,
  ls: readonly string[],
  i: number,
  rx: RegExp,
  kind: Kind,
): Violation[] {
  const hits = Array.from(ls[i].matchAll(rx));
  if (hits.length === 0 || lineIsExempt(ls, i)) return [];
  return hits.map((m) => ({ file: rel, line: i + 1, match: m[0], kind }));
}

/**
 * Collect color-alpha shorthand violations — matches only when the percent
 * is NOT one of the legal rungs (ledger × 100 plus the Motion carve-out
 * `/100`). Pure, ≤ 10 LOC. Honours the same exempt-token convention.
 */
function collectColorAlphaLine(
  rel: string,
  ls: readonly string[],
  i: number,
): Violation[] {
  const hits = Array.from(ls[i].matchAll(COLOR_ALPHA_RX));
  if (hits.length === 0 || lineIsExempt(ls, i)) return [];
  return hits
    .filter((m) => !ALPHA_COLOR_SHORTHAND_LEGAL_PCTS.has(Number(m[3])))
    .map((m) => ({ file: rel, line: i + 1, match: m[0], kind: 'color-alpha' as const }));
}

function scanFile(rel: string, src: string): Violation[] {
  if (ALLOW.has(rel)) return [];
  const skipColor = COLOR_GRANDFATHER.has(rel);
  const ls = lines(src);
  const out: Violation[] = [];
  ls.forEach((_, i) => {
    out.push(...collectLine(rel, ls, i, RAW_OPACITY_RX, 'raw-tw'));
    out.push(...collectLine(rel, ls, i, INLINE_OPACITY_RX, 'inline-style'));
    if (!skipColor) out.push(...collectColorAlphaLine(rel, ls, i));
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

  /** Human-readable fix hint — same shape for both Tailwind and inline-style. */
  const fixHint =
    `    → use opacity-{${ALPHA_ORDER.join('|')}} from the Alpha ledger` +
    ` (or alphaOf('<rung>') in JS),\n` +
    `      or mark the line with  // ${ALPHA_LEDGER_EXEMPT_TOKEN} — motion fade endpoint`;

  /**
   * The failure report names the file, the line, the raw match, and the
   * four valid rungs + the Motion carve-out — so the fix is obvious without
   * opening another tab. The message IS the documentation.
   */
  it('no raw `opacity-NN` outside the ledger and Motion carve-out', () => {
    const hits = violations.filter((v) => v.kind === 'raw-tw');
    const message = hits
      .map((v) => `  ${v.file}:${v.line} — ${v.match}\n${fixHint}`)
      .join('\n');
    expect(hits.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });

  /**
   * Mike K. §4c: the inline-style drift is the exact shape
   * `opacity: phase === 'fading' ? 0.3 : 1` lived as in GoldenThread.tsx.
   * Catch the literal-number head so a contributor can't re-introduce a
   * raw `opacity: 0.4` under cover of `style={{ ... }}`.
   */
  it('no inline-style `opacity: N` literals outside the Motion carve-out', () => {
    const hits = violations.filter((v) => v.kind === 'inline-style');
    const message = hits
      .map((v) => `  ${v.file}:${v.line} — style ${v.match}\n${fixHint}`)
      .join('\n');
    expect(hits.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });

  /**
   * Phase II (Mike #38 §4.2): the `(bg|text|border|shadow)-<color>/N`
   * shorthand joins the fence. Only ledger rungs (N ∈ {10, 30, 50, 70})
   * plus the Motion carve-out (N = 100) pass. Files on the grandfather
   * list are skipped until migrated. The failure message names the
   * legal rungs AND points to the helper so the fix is one import away.
   */
  it('no off-ledger `(bg|text|border|shadow)-<color>/N` shorthand outside grandfathered paths', () => {
    const hits = violations.filter((v) => v.kind === 'color-alpha');
    const rungsHint = Array.from(ALPHA_COLOR_SHORTHAND_LEGAL_PCTS)
      .sort((a, b) => a - b).join('|');
    const colorHint =
      `    → snap to legal rungs {${rungsHint}} (the last is the Motion endpoint),\n` +
      `      OR route through alphaClassOf(color, rung, kind) from lib/design/alpha.ts,\n` +
      `      OR mark the line with // ${ALPHA_LEDGER_EXEMPT_TOKEN} — <honest reason>`;
    const message = hits
      .map((v) => `  ${v.file}:${v.line} — ${v.match}\n${colorHint}`)
      .join('\n');
    expect(hits.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });
});

// ─── Color-alpha helper — JIT-safe literal emission ───────────────────────

describe('alphaClassOf — JIT-safe color-alpha literal factory', () => {
  it('emits the canonical string for the flagship migration', () => {
    // GoldenThread + ResonanceEntry both route through this exact call.
    expect(alphaClassOf('fog', 'muted')).toBe('bg-fog/30');
  });

  it('default kind is "bg"', () => {
    expect(alphaClassOf('fog', 'muted', 'bg')).toBe(alphaClassOf('fog', 'muted'));
  });

  it('all four kinds emit the expected property prefix', () => {
    expect(alphaClassOf('accent', 'hairline', 'bg')).toBe('bg-accent/10');
    expect(alphaClassOf('accent', 'recede',   'text')).toBe('text-accent/50');
    expect(alphaClassOf('accent', 'quiet',    'border')).toBe('border-accent/70');
    expect(alphaClassOf('accent', 'muted',    'shadow')).toBe('shadow-accent/30');
  });
});

// ─── Grandfather list — drift receipts, shrinking ─────────────────────────

describe('color-alpha grandfather list — auditable drift, shrinking', () => {
  it('every entry is a real, scannable source path', () => {
    ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS.forEach((p) => {
      expect(() => readFileSync(join(ROOT, p), 'utf8')).not.toThrow();
    });
  });

  it('no entry duplicates an existing allow-list path (Motion carve-out)', () => {
    ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS.forEach((p) => {
      expect(ALLOW.has(p)).toBe(false);
    });
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
