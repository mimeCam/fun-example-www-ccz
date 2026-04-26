/**
 * empty-arrow-fence — the source-level fence around the `→` glyph in
 * `<EmptySurface />` action labels.
 *
 * This test is a static-analysis lint, not a DOM test. The fence operates
 * on source literals across every file that calls `<EmptySurface />`, so
 * regression #1 (a future caller re-glues the arrow into the label string,
 * producing a double arrow on focus) and regression #2 (a fifth orphan room
 * ships without inheriting the lean) are both caught at PR time.
 *
 * Two adjacent shapes — same scope, two failure modes:
 *
 *   Axis A — Caller fence (forbid trailing directional glyph in any
 *     `<EmptySurface />` `primary.label` / `secondary.label` literal).
 *     Glyph set: `→ ↗ ⟶ › »` (Tanya §5.3). The arrow is the system's
 *     job, not the copywriter's; localization stays glyph-blind
 *     (Elon §4 silent-failure mode #1).
 *
 *   Axis B — Primitive fence (the `EmptySurface` source itself emits
 *     the `<span class="plate-caption-arrow" aria-hidden="true">` for
 *     `kind: 'link'` actions — and ONLY for `kind: 'link'`). Mike §3
 *     architecture: the primitive owns the glyph, not the caller.
 *     Tanya §3 semantic gate: reset is not forward motion → no arrow
 *     on `kind: 'button'`.
 *
 * Pattern-cloned from `empty-adoption.test.ts` for collector / preprocess
 * shape only (Mike rule of three not satisfied — do NOT extract a shared
 * `_helpers.ts` until a third independent caller arrives).
 *
 * Credits: Mike K. (#48 napkin §5 #3 — string-content fence, not DOM,
 * scoped to all `<EmptySurface>` callers; §6 — DoD bullet 3 directly drives
 * Axis A), Tanya D. (UX §5.3 — directional-glyph rejection list,
 * §3 — semantic gate for `kind: 'button'`, §10 — one-sentence summary
 * driving Axis B), Elon M. (silent-failure-of-string-parsing — the
 * span-author authority belongs to the primitive), Paul K. (focus
 * discipline — fence ships in the same PR, no scope creep).
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Glyph rejection set (Tanya §5.3) ──────────────────────────────────────

/** The directional glyphs we forbid as a label suffix. Order does not matter. */
const FORBIDDEN_TRAILING_GLYPHS: readonly string[] = ['→', '↗', '⟶', '›', '»'];

// ─── File walker (pure, ≤10 LOC each — pattern-cloned from empty-adoption)

const SCAN_DIRS: readonly string[] = ['app', 'components', 'lib/sharing'];
const SCAN_EXTS: ReadonlySet<string> = new Set<string>(['.ts', '.tsx']);

function isScannableFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!SCAN_EXTS.has(ext)) return false;
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
  if (path.endsWith('.d.ts')) return false;
  return !path.includes(`${sep}__tests__${sep}`);
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
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

// ─── Comment / template stripping (so prose docs cannot trigger) ──────────

function stripComments(src: string): string {
  const blocks = src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  return blocks.replace(/\/\/[^\n]*/g, (m) => ' '.repeat(m.length));
}

function preprocess(src: string): string {
  return stripComments(src);
}

function lineAt(src: string, index: number): number {
  return src.slice(0, index).split(/\r?\n/).length;
}

// ─── Balanced-brace reader (the `primary={{ … }}` body, recursively) ──────

function readBalancedBraces(src: string, start: number): string | null {
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start + 1, i); }
  }
  return null;
}

// ─── EmptySurface attribute extraction ─────────────────────────────────────

interface EmptySurfaceCall { index: number; attrs: string }

function findEmptySurfaceCalls(src: string): EmptySurfaceCall[] {
  const out: EmptySurfaceCall[] = [];
  for (const m of src.matchAll(/<EmptySurface\b/g)) {
    const start = (m.index ?? 0) + m[0].length;
    const end = findElementClose(src, start);
    if (end < 0) continue;
    out.push({ index: m.index ?? 0, attrs: src.slice(start, end) });
  }
  return out;
}

/** Find the `>` that closes the opening tag, skipping over `{ ... }` blocks. */
function findElementClose(src: string, start: number): number {
  let i = start;
  while (i < src.length) {
    const c = src[i];
    if (c === '{') { const inner = readBalancedBraces(src, i); if (inner === null) return -1; i += inner.length + 2; continue; }
    if (c === '>') return i;
    i++;
  }
  return -1;
}

/** Read the `{ … }` body for an attribute name, or `null` if absent. */
function extractObjectAttr(attrs: string, name: string): string | null {
  const rx = new RegExp(`\\b${name}\\s*=\\s*\\{`);
  const m = rx.exec(attrs);
  if (!m) return null;
  // The attribute opens with `{`; for object literals, the inner reader
  // descends one extra level to land inside `{{ … }}`.
  return readBalancedBraces(attrs, m.index + m[0].length - 1);
}

// ─── Label-literal extraction inside an action body ───────────────────────

interface LabelHit { value: string; offset: number }

/** Pull every `label: 'literal'` (or `"literal"`) pair from an action body. */
function extractLabelLiterals(body: string): LabelHit[] {
  const out: LabelHit[] = [];
  const rx = /\blabel\s*:\s*(['"])([^'"]*)\1/g;
  for (const m of body.matchAll(rx)) {
    out.push({ value: m[2], offset: m.index ?? 0 });
  }
  return out;
}

// ─── Violation shape ───────────────────────────────────────────────────────

interface Violation {
  file: string;
  line: number;
  prop: 'primary' | 'secondary';
  label: string;
  glyph: string;
}

function endsWithForbiddenGlyph(label: string): string | null {
  const trimmed = label.trimEnd();
  for (const g of FORBIDDEN_TRAILING_GLYPHS) {
    if (trimmed.endsWith(g)) return g;
  }
  return null;
}

// ─── Per-call scanner ──────────────────────────────────────────────────────

const ACTION_PROPS: ReadonlyArray<'primary' | 'secondary'> = ['primary', 'secondary'];

function scanCall(rel: string, src: string, call: EmptySurfaceCall): Violation[] {
  return ACTION_PROPS.flatMap((prop) => {
    const body = extractObjectAttr(call.attrs, prop);
    if (body === null) return [];
    return extractLabelLiterals(body).flatMap((hit) =>
      classifyLabel(rel, src, call.index, prop, hit),
    );
  });
}

function classifyLabel(
  rel: string, src: string, callIndex: number,
  prop: 'primary' | 'secondary', hit: LabelHit,
): Violation[] {
  const glyph = endsWithForbiddenGlyph(hit.value);
  if (glyph === null) return [];
  return [{ file: rel, line: lineAt(src, callIndex), prop, label: hit.value, glyph }];
}

// ─── Single-pass collector (memoized — multiple describes read it) ────────

let cachedViolations: Violation[] | null = null;

function scanAll(): Violation[] {
  if (cachedViolations !== null) return cachedViolations;
  cachedViolations = collectFiles().flatMap((p) => {
    const rel = relativePath(p);
    const src = preprocess(readFileSync(p, 'utf8'));
    return findEmptySurfaceCalls(src).flatMap((c) => scanCall(rel, src, c));
  });
  return cachedViolations;
}

// ─── Failure formatter (three-block, parity with empty-adoption) ──────────

function formatFailure(v: Violation): string {
  return (
    `  ${v.file}:${v.line} — <EmptySurface /> ${v.prop}.label ` +
    `ends with '${v.glyph}'\n\n` +
    `    label literal: '${v.label}'\n` +
    `    The arrow is the EmptySurface primitive's job, not the caller's.\n` +
    `    Strip the trailing glyph; the primitive renders the lean span\n` +
    `    automatically when primary.kind === 'link'.`
  );
}

// ─── Tests — Axis A · caller fence ─────────────────────────────────────────

describe('empty-arrow-fence — Axis A · caller labels carry no trailing glyph', () => {
  it('no <EmptySurface /> primary/secondary label ends with a directional glyph', () => {
    const violations = scanAll();
    expect(violations.map((v) => `${v.file}:${v.line} ${v.prop}=${v.label}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + violations.map(formatFailure).join('\n\n'));
  });

  it('the rejection set names the five canonical directional glyphs', () => {
    expect([...FORBIDDEN_TRAILING_GLYPHS].sort()).toEqual(['↗', '→', '⟶', '›', '»'].sort());
  });

  it('at least one <EmptySurface /> call exists in the scanned tree (not a no-op test)', () => {
    const calls = collectFiles().flatMap((p) =>
      findEmptySurfaceCalls(preprocess(readFileSync(p, 'utf8'))),
    );
    expect(calls.length).toBeGreaterThanOrEqual(4);
  });
});

// ─── Tests — Axis B · primitive owns the arrow span ───────────────────────

const PRIMITIVE_PATH = 'components/shared/EmptySurface.tsx';

describe('empty-arrow-fence — Axis B · primitive owns the arrow span', () => {
  const src = readFileSync(join(ROOT, PRIMITIVE_PATH), 'utf8');

  it('the primitive renders a `.plate-caption-arrow` span (the kernel anchor)', () => {
    expect(src).toMatch(/className=['"]plate-caption-arrow['"]/);
  });

  it('the arrow span is marked `aria-hidden` (decorative, not announced)', () => {
    const span = src.match(/<span[^>]*plate-caption-arrow[^>]*>/);
    expect(span).not.toBeNull();
    expect(span![0]).toMatch(/aria-hidden/);
  });

  it('the arrow span lives inside the `kind === \'link\'` branch only', () => {
    const linkBranch = sliceLinkBranch(src);
    const buttonBranch = sliceButtonBranch(src);
    expect(linkBranch).toMatch(/plate-caption-arrow/);
    expect(buttonBranch).not.toMatch(/plate-caption-arrow/);
  });

  it('the arrow glyph itself (`→`) appears once in the primitive code (no double-glue)', () => {
    // Comments may use `→` in prose ("Composition (top → bottom)"); only
    // count occurrences in real code so the doc-comment cannot pollute.
    const matches = preprocess(src).match(/→/g) ?? [];
    expect(matches.length).toBe(1);
  });
});

/** Slice the body of `PrimaryAction` after the `kind === 'button'` early return. */
function sliceLinkBranch(src: string): string {
  const buttonReturn = src.search(/if\s*\(\s*action\.kind\s*===\s*['"]button['"]\s*\)\s*return\s*\(/);
  return buttonReturn < 0 ? src : src.slice(buttonReturn + 1);
}

/** Slice the early-return body for `kind === 'button'` (the closing `);`). */
function sliceButtonBranch(src: string): string {
  const start = src.search(/if\s*\(\s*action\.kind\s*===\s*['"]button['"]\s*\)\s*return\s*\(/);
  if (start < 0) return '';
  const after = src.indexOf('return (', start);
  if (after < 0) return '';
  const close = src.indexOf(');', after);
  return close < 0 ? '' : src.slice(after, close);
}
