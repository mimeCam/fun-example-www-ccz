/**
 * Z-Index Adoption Test — raw stack-order guardrail.
 *
 * The 8th ledger speaks one dialect of stack order owned by
 * `lib/design/z-index.ts`. This test fails when:
 *
 *   - a JSX inline-style `zIndex: N` literal slips into a component;
 *   - a Tailwind arbitrary `z-[N]` class appears in `components/**`,
 *     `lib/hooks/**`, or `lib/utils/**`;
 *   - an imperative `.style.zIndex = '<N>'` assignment leaks into
 *     component or hook code;
 *   - a CSS `z-index: N;` declaration appears in any `.css` /
 *     `.module.css` outside the canonical `app/globals.css`.
 *
 * Allow-list: the module itself (`lib/design/z-index.ts`) and the
 * canonical CSS (`app/globals.css`). Same scanner shape as
 * `motion-adoption.test.ts`, scoped per Mike K. §7.
 *
 * Failure messages name the slot to reach for, mirroring the motion
 * adoption test's DX pattern.
 *
 * Credits: Mike K. (napkin §6, §7 — slot-not-scale, four scanners,
 * allow-list, name-the-rung error UX), Tanya D. (UX spec §3 — five
 * contracts the adoption guard ultimately defends), Paul K. (the four
 * binary product outcomes that motivate the fence), Elon M. (drift
 * argument — why a guard, not a convention), Krystle C. (pair-rule:
 * sync without adoption is not a row).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { Z_ORDER } from '../z-index';

const ROOT = join(__dirname, '..', '..', '..');

/** Files that legitimately own raw z-index values. */
const ALLOW = new Set<string>([
  'lib/design/z-index.ts',
]);

/** TS/TSX scan roots — same shape as motion-adoption.test.ts (Mike K. §7). */
const SCAN_DIRS = ['components', 'lib/hooks', 'lib/utils'];

/** File extensions to scan for TS/TSX violations. */
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

/** CSS scan roots — every stylesheet outside the canonical one is fenced. */
const CSS_DIRS = ['app', 'components', 'lib'];

/** Canonical CSS path — the only stylesheet allowed to declare z-index. */
const CANONICAL_CSS = 'app/globals.css';

// ─── File walker (pure, ≤ 10 LOC each) ─────────────────────────────────────

function isScannableTs(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!SCAN_EXTS.has(ext)) return false;
  if (path.endsWith('.test.ts') || path.endsWith('.test.tsx')) return false;
  if (path.endsWith('.d.ts')) return false;
  return !path.includes(`${sep}__tests__${sep}`);
}

function walk(dir: string, accept: (p: string) => boolean, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, accept, acc);
    else if (accept(full)) acc.push(full);
  }
  return acc;
}

function collectTsFiles(): string[] {
  return SCAN_DIRS.flatMap((d) => walk(join(ROOT, d), isScannableTs));
}

function collectCssFiles(): string[] {
  return CSS_DIRS.flatMap((d) => walk(join(ROOT, d), (p) => p.endsWith('.css')));
}

function relativePath(full: string): string {
  return relative(ROOT, full).split(sep).join('/');
}

// ─── Pattern scanners (pure, each ≤ 10 LOC) ────────────────────────────────

/** JSX inline-style: `zIndex: 40` (with optional minus, any whitespace). */
function hasInlineStyleZIndex(src: string): boolean {
  return /\bzIndex\s*:\s*-?\d+/.test(src);
}

/** Tailwind arbitrary class: `z-[40]` or `z-[-1]`. */
function hasTailwindArbitraryZ(src: string): boolean {
  return /\bz-\[-?\d+\]/.test(src);
}

/** Imperative DOM: `el.style.zIndex = '40'` or `el.style.zIndex = 40`. */
function hasImperativeZIndex(src: string): boolean {
  return /\.style\.zIndex\s*=\s*['"]?-?\d+/.test(src);
}

/** CSS declaration: `z-index: 40;` (any whitespace, optional minus). */
function hasCssZIndexDecl(src: string): boolean {
  return /z-index\s*:\s*-?\d+/.test(src);
}

// ─── Violation collection (single source of truth) ─────────────────────────

type Kind = 'inline-style' | 'tw-arbitrary' | 'imperative' | 'css-decl';

interface Violation {
  file: string;
  kind: Kind;
}

function checkTs(path: string, src: string): Violation[] {
  const rel = relativePath(path);
  if (ALLOW.has(rel)) return [];
  const out: Violation[] = [];
  if (hasInlineStyleZIndex(src)) out.push({ file: rel, kind: 'inline-style' });
  if (hasTailwindArbitraryZ(src)) out.push({ file: rel, kind: 'tw-arbitrary' });
  if (hasImperativeZIndex(src)) out.push({ file: rel, kind: 'imperative' });
  return out;
}

function checkCss(path: string): Violation[] {
  const rel = relativePath(path);
  if (rel === CANONICAL_CSS) return [];
  const src = readFileSync(path, 'utf8');
  return hasCssZIndexDecl(src) ? [{ file: rel, kind: 'css-decl' }] : [];
}

function findAllViolations(): Violation[] {
  const tsHits = collectTsFiles().flatMap((p) => checkTs(p, readFileSync(p, 'utf8')));
  const cssHits = collectCssFiles().flatMap(checkCss);
  return [...tsHits, ...cssHits];
}

// ─── Failure-message builder — names the slot to reach for ─────────────────

const SLOT_LIST = Z_ORDER.join(', ');

function nameTheRungMessage(hits: Violation[]): string {
  return hits
    .map(
      (v) =>
        `  ${v.file} — ${v.kind} z-index literal\n` +
        `    → use Z.<slot> / z-sys-<slot> / var(--sys-z-<slot>)\n` +
        `      from lib/design/z-index.ts (slots: ${SLOT_LIST}).`,
    )
    .join('\n');
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('z-index adoption — every stack speaks one dialect', () => {
  const violations = findAllViolations();

  it('no JSX inline-style zIndex literals (e.g. style={{ zIndex: 40 }})', () => {
    const hits = violations.filter((v) => v.kind === 'inline-style');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no Tailwind arbitrary z-classes (e.g. z-[40])', () => {
    const hits = violations.filter((v) => v.kind === 'tw-arbitrary');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no imperative .style.zIndex assignments', () => {
    const hits = violations.filter((v) => v.kind === 'imperative');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('no z-index declarations in stylesheets outside app/globals.css', () => {
    const hits = violations.filter((v) => v.kind === 'css-decl');
    expect(hits.map((v) => v.file)).toEqual([]);
  });

  it('failure message names the offending file, the kind, and every slot', () => {
    const sample: Violation = { file: 'components/Demo.tsx', kind: 'inline-style' };
    const msg = nameTheRungMessage([sample]);
    expect(msg).toContain('components/Demo.tsx');
    expect(msg).toContain('inline-style');
    Z_ORDER.forEach((slot) => expect(msg).toContain(slot));
  });

  it('throws the named-slot message when violations exist (DX safety net)', () => {
    if (violations.length === 0) return;
    throw new Error('\n' + nameTheRungMessage(violations));
  });
});

// ─── Positive test — z-index.ts is the one legitimate home ─────────────────

describe('z-index adoption — z-index.ts is the one legitimate home', () => {
  const src = readFileSync(join(ROOT, 'lib/design/z-index.ts'), 'utf8');

  it('defines the floor (base: 1) and the apex (toast: 60)', () => {
    expect(src).toMatch(/base:\s*1/);
    expect(src).toMatch(/toast:\s*60/);
  });

  it('defines the modal seam (backdrop: 39 → drawer: 40)', () => {
    expect(src).toMatch(/backdrop:\s*39/);
    expect(src).toMatch(/drawer:\s*40/);
  });
});
