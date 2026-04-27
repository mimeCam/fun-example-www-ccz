/**
 * Motion Inline-Style Fence — `var(--sys-time-*)` / `var(--sys-ease-*)`
 * MUST NOT appear inside any JSX `style={…}` block in `app/**` or
 * `components/**`. Motion timing is owned by the Gesture Atlas (`lib/design/
 * gestures.ts`) which emits LITERAL Tailwind class fragments Tailwind's JIT
 * can see in source. Pasting the same tokens via inline `style.transition`
 * sidesteps every guard in the room — `gestures-sync`, `gestures-call-site-
 * rhythm`, the bare-class lint, the `useReducedMotion` seam — and the only
 * way to forbid it structurally is to scan the source.
 *
 * The shape we close (Mike napkin #62 §2, Tanya UIX #23 §3): the
 * `GoldenThread.tsx:162` inline `transition: 'opacity var(--sys-time-settle)
 * var(--sys-ease-out), …'` declaration. Lifted onto the verb
 * `thread-settle`; the inline shape MUST NOT come back. CSS keeps owning
 * the tokens (`app/globals.css` is out-of-scan by extension); TS does not
 * paste them.
 *
 * Pure source-string lint. No DOM, no React render, no Jest jsdom warmup.
 * One file, zero config, two scan patterns. Mirrors the file-walker shape
 * of `motion-adoption.test.ts` and the violation-collector shape of
 * `alpha-adoption.test.ts`. Each function ≤ 10 LoC.
 *
 * Allow-list shape:
 *   • The kernel — `lib/design/**` and `lib/thermal/**` — is out-of-scan
 *     by directory (the Atlas itself emits the strings; the thermal
 *     ceremony layer authors them at the runtime token-paint seam).
 *   • The well-known JSDoc/comment shape `// `empty-stagger-headline` adds
 *     animation-delay: var(--sys-time-crossfade)` is fine — the scanner
 *     skips line/block comments before searching, so a doc reference does
 *     not trigger a false positive.
 *
 * Credits: Mike K. (napkin #62 §2 — fence shape, scan dirs, allow-list
 * doctrine; the four-axis fence shape lifted from `motion-adoption.test.ts`),
 * Tanya D. (UIX #23 §6 — receipt #5: "the fence catches future regressions"
 * is the visible auditor receipt this test makes structural), Sid (the ≤ 10
 * LoC per function rhythm; comment-stripping helper before the scanner).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** Directories whose `*.tsx` (and `*.ts`) speak Atlas verbs, not raw tokens. */
const SCAN_DIRS: readonly string[] = ['app', 'components'];

/** File extensions to scan. Matches `motion-adoption.test.ts:SCAN_EXTS`. */
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

/**
 * Path-allow-list — kernel modules that legitimately author the tokens.
 * Empty by design (the kernel lives under `lib/`, which is out-of-scan).
 * The list shape is preserved so a future "carve-out" review surfaces a
 * named path instead of a quiet edit to a regex. Mirror of
 * `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`.
 */
const ALLOW: readonly string[] = [] as const;
const ALLOW_SET = new Set<string>(ALLOW);

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

// ─── Comment & style-block helpers (pure, each ≤ 10 LoC) ───────────────────

/**
 * Strip JS line + block comments. JSDoc references like `// adds
 * animation-delay: var(--sys-time-crossfade)` are documentation, not
 * runtime drift — the fence must not blush at them.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

/**
 * Collect every JSX `style={…}` block as a list of substring spans. The
 * matcher tracks `{` depth from the opening `{` after `style=` to the
 * matching `}` — handles `style={{…}}` (object literal) and `style={x}`
 * (variable reference). Returns the inner text of each block.
 */
function styleBlocks(src: string): string[] {
  const blocks: string[] = [];
  const re = /style\s*=\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) blocks.push(extractBalanced(src, re.lastIndex));
  return blocks;
}

/**
 * From an offset just past a `{`, return the substring up to the matching
 * `}` at the same brace depth. Bare-bones — does not honor strings or
 * regex literals, but the JSX-style-block grammar is simple enough that
 * a `{`-counter suffices for our scan budget.
 */
function extractBalanced(src: string, start: number): string {
  let depth = 1;
  for (let i = start; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') { depth -= 1; if (depth === 0) return src.slice(start, i); }
  }
  return src.slice(start);
}

// ─── Pattern scanners (pure, each returns a boolean) ──────────────────────

const TIME_RX = /var\(--sys-time-/;
const EASE_RX = /var\(--sys-ease-/;

/** True iff the given style-block payload contains a forbidden substring. */
function blockHasMotionToken(block: string): boolean {
  return TIME_RX.test(block) || EASE_RX.test(block);
}

// ─── Violation collector (single source of truth, ≤ 10 LoC) ────────────────

type Kind = 'time-token' | 'ease-token';

interface Violation {
  file: string;
  kind: Kind;
}

function check(path: string, src: string): Violation[] {
  const rel = relativePath(path);
  if (ALLOW_SET.has(rel)) return [];
  const stripped = stripComments(src);
  const out: Violation[] = [];
  styleBlocks(stripped).forEach((block) => {
    if (TIME_RX.test(block)) out.push({ file: rel, kind: 'time-token' });
    if (EASE_RX.test(block)) out.push({ file: rel, kind: 'ease-token' });
  });
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) => check(p, readFileSync(p, 'utf8')));
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('motion inline-style fence — Atlas owns the timing tokens', () => {
  const violations = findAllViolations();

  it('no var(--sys-time-*) inside any JSX style={…} block', () => {
    const hits = violations.filter((v) => v.kind === 'time-token');
    const message = hits
      .map(
        (v) =>
          `  ${v.file} — inline style={…} contains var(--sys-time-*)\n` +
          `    → lift onto a Gesture Atlas verb via gestureClassesForMotion()\n` +
          `      (lib/design/gestures.ts). The verb owns the timing.`,
      )
      .join('\n');
    expect(hits.map((v) => v.file)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });

  it('no var(--sys-ease-*) inside any JSX style={…} block', () => {
    const hits = violations.filter((v) => v.kind === 'ease-token');
    const message = hits
      .map(
        (v) =>
          `  ${v.file} — inline style={…} contains var(--sys-ease-*)\n` +
          `    → lift onto a Gesture Atlas verb via gestureClassesForMotion()\n` +
          `      (lib/design/gestures.ts). The verb owns the easing.`,
      )
      .join('\n');
    expect(hits.map((v) => v.file)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });
});

// ─── Self-tests for the helpers — no false positives, no false negatives ──

describe('motion inline-style fence — helpers behave under known shapes', () => {
  it('stripComments removes line comments containing the forbidden tokens', () => {
    const src = '// note: var(--sys-time-settle) is fine in a comment\nconst x = 1;';
    expect(stripComments(src)).not.toMatch(TIME_RX);
  });

  it('stripComments removes block comments containing the forbidden tokens', () => {
    const src = '/* refs var(--sys-ease-out) */ const y = 2;';
    expect(stripComments(src)).not.toMatch(EASE_RX);
  });

  it('styleBlocks captures the inner payload of a style={{…}} prop', () => {
    const src = '<div style={{ color: "red", transition: "opacity var(--sys-time-settle)" }} />';
    const blocks = styleBlocks(src);
    expect(blocks.length).toBe(1);
    expect(blocks[0]).toContain('var(--sys-time-settle)');
  });

  it('styleBlocks captures multiple props in one file', () => {
    const src = '<a style={{x:1}}/> <b style={{y:2}}/>';
    expect(styleBlocks(src).length).toBe(2);
  });

  it('blockHasMotionToken detects either token family', () => {
    expect(blockHasMotionToken('transition: var(--sys-time-settle)')).toBe(true);
    expect(blockHasMotionToken('transition: var(--sys-ease-out)')).toBe(true);
    expect(blockHasMotionToken('color: var(--token-accent)')).toBe(false);
  });

  it('check ignores allow-listed paths even if the substring is present', () => {
    if (ALLOW.length === 0) return;
    const fakeSrc = '<div style={{transition:"opacity var(--sys-time-settle)"}} />';
    const fake = join(ROOT, ALLOW[0]);
    expect(check(fake, fakeSrc)).toEqual([]);
  });
});

// ─── Positive smoke — the fix this fence enforces is in place ──────────────

describe('motion inline-style fence — the surface the fence was born for', () => {
  it('GoldenThread.tsx has no inline var(--sys-time-*) / var(--sys-ease-*) substring', () => {
    const src = readFileSync(
      join(ROOT, 'components/reading/GoldenThread.tsx'),
      'utf8',
    );
    const stripped = stripComments(src);
    styleBlocks(stripped).forEach((block) => {
      expect(block).not.toMatch(TIME_RX);
      expect(block).not.toMatch(EASE_RX);
    });
  });
});
