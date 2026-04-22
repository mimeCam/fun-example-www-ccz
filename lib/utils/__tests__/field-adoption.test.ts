/**
 * field-adoption — adoption guardrail for the `<Field>` primitive.
 *
 * Direct fork of `pressable-adoption.test.ts`. Every reader-writes-back
 * surface on the site goes through `components/shared/Field.tsx`. This test
 * fails when a raw `<textarea>`, a text-family `<input>`, or
 * `contenteditable` slips into `components/**` or `app/**`.
 *
 * Jest-level scan, zero config, one allow-list. Mirrors Mike §3.2.
 *
 * Credits: Mike K. (napkin §3.2), Tanya D. (§8 acceptance — "grep = zero"),
 * Elon M. (guard-as-test, not guard-as-prose).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** The one module that legitimately owns a raw <textarea>/<input>. */
const FIELD_ALLOW = new Set<string>([
  'components/shared/Field.tsx',
]);

/** Modules allowed to import field-phase's recipe helpers. */
const RECIPE_ALLOW = new Set<string>([
  'components/shared/Field.tsx',
  'lib/utils/field-phase.ts',
]);

/** Directories to scan. */
const SCAN_DIRS = ['components', 'app'];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.tsx']);

// ─── File walker (pure, ≤ 10 LOC each) ─────────────────────────────────────

function isScannableFile(path: string): boolean {
  if (!SCAN_EXTS.has(path.slice(path.lastIndexOf('.')))) return false;
  return !path.endsWith('.test.tsx') && !path.endsWith('.d.tsx');
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

// ─── Pattern scanners (pure, each returns a boolean) ───────────────────────

const TEXT_INPUT_TYPES = /<input[^>]*\stype=["'](?:text|email|search|url|tel|password)["']/;

function hasRawTextarea(src: string): boolean {
  return /<textarea(\s|>)/.test(src);
}

function hasTextInput(src: string): boolean {
  return TEXT_INPUT_TYPES.test(src);
}

function hasContentEditable(src: string): boolean {
  return /contentEditable=/i.test(src) || /contenteditable=/.test(src);
}

/**
 * Static no-focus-glow rule (§4.1): the Field module must not introduce
 * `box-shadow: 0 0` ring-style patterns — the one focus ring is global.
 */
function hasFocusGlow(src: string): boolean {
  return /focus:(?:ring-|shadow-\[0_0)/.test(src);
}

// ─── Violation collector (single source of truth) ──────────────────────────

type Kind = 'raw-textarea' | 'text-input' | 'contenteditable' | 'focus-glow';

interface Violation { file: string; kind: Kind }

function checkOne(rel: string, src: string, k: Kind, test: boolean, allow: Set<string>): Violation[] {
  return test && !allow.has(rel) ? [{ file: rel, kind: k }] : [];
}

function check(path: string, src: string): Violation[] {
  const rel = relativePath(path);
  return [
    ...checkOne(rel, src, 'raw-textarea', hasRawTextarea(src), FIELD_ALLOW),
    ...checkOne(rel, src, 'text-input', hasTextInput(src), FIELD_ALLOW),
    ...checkOne(rel, src, 'contenteditable', hasContentEditable(src), FIELD_ALLOW),
    ...checkOne(rel, src, 'focus-glow', hasFocusGlow(src), RECIPE_ALLOW),
  ];
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) => check(p, readFileSync(p, 'utf8')));
}

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('field adoption — every input speaks one dialect', () => {
  const violations = findAllViolations();

  it('no raw <textarea> outside components/shared/Field.tsx', () => {
    const raw = violations.filter((v) => v.kind === 'raw-textarea');
    expect(raw.map((v) => v.file)).toEqual([]);
  });

  it('no raw text/email/search/url/tel/password <input> outside Field.tsx', () => {
    const inputs = violations.filter((v) => v.kind === 'text-input');
    expect(inputs.map((v) => v.file)).toEqual([]);
  });

  it('no contentEditable surfaces (allow-list is empty today)', () => {
    const ce = violations.filter((v) => v.kind === 'contenteditable');
    expect(ce.map((v) => v.file)).toEqual([]);
  });

  it('no per-component focus rings (the global :focus-visible is the one ring)', () => {
    const glows = violations.filter((v) => v.kind === 'focus-glow');
    expect(glows.map((v) => v.file)).toEqual([]);
  });
});
