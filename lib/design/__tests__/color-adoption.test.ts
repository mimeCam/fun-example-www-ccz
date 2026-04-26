/**
 * Color Adoption Test — the 7th gate.
 *
 * Every color on screen must route through the ledger. This test fails
 * when a component, util, hook, sharing, or app-tree file ships a raw
 * color value that bypasses `lib/design/color-constants.ts` (the canvas-
 * safe ledger) or `app/globals.css` (the CSS token home).
 *
 * Three scanners (content, not filenames — follows Mike §2):
 *
 *   1. HEX_RX        — raw `#RGB` / `#RRGGBB` / `#RRGGBBAA` literals.
 *   2. RGB_HSL_RX    — `rgb(<digit…)` / `rgba(<digit…)` / `hsl…` literal
 *                      calls. Template-interpolated composers
 *                      (`rgba(${r},${g},...)`) pass — the argument does
 *                      not start with a digit. That's the intended shape
 *                      for canvas helpers; the ledger provides channels.
 *   3. TW_PALETTE_RX — Tailwind DEFAULT palette classes that bypass
 *                      tokens: `bg-slate-900`, `text-red-500`, etc.
 *                      22 palette families enumerated explicitly so
 *                      project-custom tokens (`bg-accent`, `text-mist`)
 *                      are never false-positives.
 *
 * Honest exemptions are marked in source with a
 * `// color-ledger:exempt — <reason>` comment (see
 * `COLOR_LEDGER_EXEMPT_TOKEN` in `color-constants.ts`).
 *
 * Pre-gate drift is absorbed by `COLOR_GRANDFATHERED_PATHS` (one receipt
 * per file, shrinks only). Any NEW drift fails the build on first run
 * with a message that names the three legitimate homes (`BRAND`,
 * `THERMAL`, `ARCHETYPE`) plus the `alphaClassOf()` escape hatch — so
 * the fix is obvious without opening another tab. The failure message
 * IS the documentation.
 *
 * Credits: Mike K. (project-architect #10 §1/§2/§3/§5 — three-scanner
 * shape, grandfather list as shrinkage contract, "failure message IS
 * documentation"; reference implementation pattern lifted from
 * `alpha-adoption.test.ts`), Tanya D. (UIX #29 §2/§4 — "every color on
 * screen must route through the ledger" and the NextRead-style drift
 * audit that populated the initial grandfather receipts), Elon M.
 * (referenced — the one-sentence-over-meta-test discipline that shapes
 * the scope of this sprint), Krystle C. (referenced — 7-for-7 symmetry
 * framing), `lib/design/__tests__/alpha-adoption.test.ts` (Mike #24/#38 —
 * load-bearing template; copy, don't reinvent).
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import {
  ARCHETYPE,
  BRAND,
  COLOR_GRANDFATHERED_PATHS,
  COLOR_LEDGER_EXEMPT_TOKEN,
  THERMAL,
} from '../color-constants';

const ROOT = join(__dirname, '..', '..', '..');

/**
 * Files that legitimately own color literals (the ledger + its canvas
 * partner). `lib/design/color-constants.ts` is the TS source of truth;
 * `lib/thermal/thermal-tokens.ts` carries the dormant/warm anchor pairs
 * (already sync-tested against color-constants). Neither sits inside
 * SCAN_DIRS today, but the ALLOW list is the defensive statement of
 * intent — if a future refactor folds them into `lib/sharing`, this
 * list still keeps them off the fence.
 */
const ALLOW = new Set<string>([
  'lib/design/color-constants.ts',
  'lib/thermal/thermal-tokens.ts',
]);

/**
 * Scan corpus — same four roots as `alpha-adoption` / `elevation-adoption`.
 * CSS is intentionally NOT scanned (`app/globals.css` is the token owner;
 * scanning it would be tautological — Mike §5.4).
 */
const SCAN_DIRS = ['components', 'lib/utils', 'lib/hooks', 'lib/sharing', 'app'];

/** File extensions to scan. */
const SCAN_EXTS = new Set<string>(['.ts', '.tsx']);

// ─── File walker (pure, each ≤ 10 LOC — see alpha-adoption lineage) ───────

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

// ─── Pattern scanners (pure, word-bounded) ────────────────────────────────

/**
 * Raw hex literals. Word-bounded on both sides so `var(--foo-#xxx)` does
 * NOT chew the hash (Mike §5.2). Matches `#rgb`, `#rrggbb`, `#rrggbbaa`.
 * The lookbehind forbids a word char, `#`, or `-` immediately before the
 * hash — the last one absorbs CSS-in-JS var-interpolation shapes
 * (`var(--foo-#xxx)`) which are ledger-owned, not drift.
 */
const HEX_RX =
  /(?<![\w#\-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

/**
 * rgb / rgba / hsl / hsla literal calls. The FIRST argument must be a
 * digit (possibly preceded by `.` for fractional alpha). Template-
 * interpolated `rgba(${r},${g},...)` has `$` after the `(` and is
 * *intentionally* not matched — those are canvas composers whose raw
 * channels come from the ledger. They are the correct shape.
 */
const RGB_HSL_RX = /\b(?:rgba?|hsla?)\(\s*(?:\.\d|\d)/g;

/**
 * Tailwind DEFAULT palette bypass. Enumerate the 22 palette families
 * explicitly (Mike §5.5) so `bg-accent-800` never false-matches —
 * `accent` is ours and is deliberately NOT in this list. Any digit
 * shade on a listed family is drift. Word-bounded on both sides.
 */
const TW_PALETTE_FAMILIES = [
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime',
  'green', 'emerald', 'teal', 'cyan', 'sky',
  'blue', 'indigo', 'violet', 'purple', 'fuchsia',
  'pink', 'rose',
] as const;

const TW_PALETTE_PROPS =
  '(?:bg|text|border|shadow|from|to|via|ring|outline|divide|decoration|placeholder|accent|caret|fill|stroke)';

const TW_PALETTE_RX = new RegExp(
  `(?<![\\w-])${TW_PALETTE_PROPS}-(?:${TW_PALETTE_FAMILIES.join('|')})-\\d{2,3}\\b`,
  'g',
);

// ─── Line-level helpers (each ≤ 10 LOC) ───────────────────────────────────

/** Split source on newlines so we can check exemption per line. */
function splitLines(src: string): string[] {
  return src.split(/\r?\n/);
}

/**
 * Strip `//…` line comments and same-line `/* … *\/` block comments before
 * scanning so that JSDoc examples (`// see #f0c674 — gold`) don't light up
 * the fence. Multi-line `/* … *\/` spanning several lines is outside scope
 * — those are rare; a per-line exempt token covers the exception.
 */
function stripComments(line: string): string {
  return line
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/, '$1');
}

/**
 * True iff the line carries the inline exempt token OR is inside a
 * contiguous code block preceded by a comment that does. Same shape as
 * `alpha-adoption`'s `lineIsExempt` — keep the behaviour aligned so a
 * future `_shared/exempt.ts` helper can absorb both (TODO below).
 *
 * TODO(mike #10 §6): hoist this helper into
 *   `lib/design/__tests__/_shared/exempt.ts` after the 7th gate lands, so
 *   Alpha / Elevation / Color share one definition of "exempt walk."
 *   Not this sprint — keep the copy, keep the scope.
 */
function lineIsExempt(ls: readonly string[], i: number): boolean {
  for (let j = i; j >= 0; j--) {
    if (ls[j].includes(COLOR_LEDGER_EXEMPT_TOKEN)) return true;
    if (j < i && ls[j].trim() === '') return false;
  }
  return false;
}

// ─── Violation collector ──────────────────────────────────────────────────

type Kind = 'hex' | 'rgb-hsl' | 'tw-palette';

interface Violation {
  file: string;
  line: number;
  match: string;
  kind: Kind;
}

/**
 * Collect matches for one regex on one line, honouring the per-line
 * exempt-token convention. Scans the comment-stripped line so docstring
 * colors don't false-fire. Pure, ≤ 10 LOC.
 */
function collectLine(
  rel: string,
  ls: readonly string[],
  i: number,
  rx: RegExp,
  kind: Kind,
): Violation[] {
  const stripped = stripComments(ls[i]);
  const hits = Array.from(stripped.matchAll(rx));
  if (hits.length === 0 || lineIsExempt(ls, i)) return [];
  return hits.map((m) => ({ file: rel, line: i + 1, match: m[0], kind }));
}

/** Scan one file for all three drift shapes. Honours ALLOW + grandfather. */
function scanFile(rel: string, src: string): Violation[] {
  if (ALLOW.has(rel)) return [];
  if ((COLOR_GRANDFATHERED_PATHS as readonly string[]).includes(rel)) return [];
  const ls = splitLines(src);
  const out: Violation[] = [];
  ls.forEach((_, i) => {
    out.push(...collectLine(rel, ls, i, HEX_RX, 'hex'));
    out.push(...collectLine(rel, ls, i, RGB_HSL_RX, 'rgb-hsl'));
    out.push(...collectLine(rel, ls, i, TW_PALETTE_RX, 'tw-palette'));
  });
  return out;
}

function findAllViolations(): Violation[] {
  return collectFiles().flatMap((p) =>
    scanFile(relativePath(p), readFileSync(p, 'utf8')),
  );
}

/** Compose the reviewer-facing fix hint — failure message IS docs. */
function fixHintFor(kind: Kind): string {
  const homes =
    `      • quote a key from BRAND / THERMAL / ARCHETYPE` +
    ` in lib/design/color-constants.ts\n` +
    `      • use a CSS token var (--token-* / --gold / --mist / --fog …)\n` +
    `      • route alpha-of-color through alphaClassOf(color, rung, kind)` +
    ` from lib/design/alpha.ts`;
  const exempt =
    `      • or mark the line with  // ${COLOR_LEDGER_EXEMPT_TOKEN} — <honest reason>`;
  const tailwindHint =
    kind === 'tw-palette'
      ? `\n      The project palette is token-driven: use bg-accent, text-mist,` +
        ` border-fog, or archetype classes — default Tailwind families are not ours.`
      : '';
  return `    →\n${homes}\n${exempt}${tailwindHint}`;
}

// ─── Tests — the grep-fence ────────────────────────────────────────────────

describe('color adoption — every color goes through the ledger', () => {
  const violations = findAllViolations();

  it('no raw hex `#rgb` / `#rrggbb` / `#rrggbbaa` literals in source', () => {
    const hits = violations.filter((v) => v.kind === 'hex');
    const message = hits
      .map((v) => `  ${v.file}:${v.line} — ${v.match}\n${fixHintFor(v.kind)}`)
      .join('\n');
    expect(hits.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });

  it('no literal rgb()/rgba()/hsl()/hsla() calls in source', () => {
    const hits = violations.filter((v) => v.kind === 'rgb-hsl');
    const message = hits
      .map((v) => `  ${v.file}:${v.line} — ${v.match}\n${fixHintFor(v.kind)}`)
      .join('\n');
    expect(hits.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });

  it('no Tailwind default-palette classes (bg-slate-900, text-red-500, …)', () => {
    const hits = violations.filter((v) => v.kind === 'tw-palette');
    const message = hits
      .map((v) => `  ${v.file}:${v.line} — ${v.match}\n${fixHintFor(v.kind)}`)
      .join('\n');
    expect(hits.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (hits.length > 0) throw new Error('\n' + message);
  });
});

// ─── Grandfather list — drift receipts, shrinking ─────────────────────────

describe('color grandfather list — auditable drift, shrinking', () => {
  it('every entry is a real, readable source path (no dead receipts)', () => {
    COLOR_GRANDFATHERED_PATHS.forEach((p) => {
      expect(() => readFileSync(join(ROOT, p), 'utf8')).not.toThrow();
    });
  });

  it('no grandfather entry duplicates an ALLOW-list path (no double-coverage)', () => {
    COLOR_GRANDFATHERED_PATHS.forEach((p) => {
      expect(ALLOW.has(p)).toBe(false);
    });
  });
});

// ─── Positive tests — ledger shape matches AGENTS.md table ────────────────

describe('color ledger — exports match the AGENTS.md contract', () => {
  it('THERMAL carries the five dormant anchor keys', () => {
    expect(Object.keys(THERMAL).sort()).toEqual(
      ['accent', 'bg', 'border', 'foreground', 'surface'],
    );
  });

  it('BRAND carries the ten static-token keys', () => {
    // `accentViolet` joined the static-brand inventory in the chip-contrast
    // audit PR (Mike napkin #95) so canvas-safe consumers can resolve the
    // colour Tailwind paints under `text-accent` (see `tailwind.config.ts`
    // → `accent: var(--accent-violet)`) without scraping CSS at runtime.
    expect(Object.keys(BRAND).sort()).toEqual([
      'accentViolet', 'amber', 'cyan', 'fog', 'gold', 'mist',
      'primary', 'rose', 'secondary', 'void',
    ]);
  });

  it('ARCHETYPE carries exactly five keys (one per reader archetype)', () => {
    const keys = Object.keys(ARCHETYPE).sort();
    expect(keys).toEqual(
      ['collector', 'deep-diver', 'explorer', 'faithful', 'resonator'],
    );
  });
});

// ─── Positive test — exempt token is a discoverable export ────────────────

describe('color ledger exports the exempt token', () => {
  it('the inline-exempt token is a discoverable export', () => {
    const src = readFileSync(
      join(ROOT, 'lib/design/color-constants.ts'),
      'utf8',
    );
    expect(src).toContain('COLOR_LEDGER_EXEMPT_TOKEN');
    expect(src).toContain(COLOR_LEDGER_EXEMPT_TOKEN);
  });

  it('the grandfather list is a discoverable export', () => {
    const src = readFileSync(
      join(ROOT, 'lib/design/color-constants.ts'),
      'utf8',
    );
    expect(src).toContain('COLOR_GRANDFATHERED_PATHS');
  });
});

// ─── Self-check — the scanners match synthetic drift, skip legal shapes ───
//
// A handful of unit tests on the three regexes, so a future refactor
// that "simplifies" one of them trips here first. The patterns are
// load-bearing for the gate; lock them down.

describe('HEX_RX — matches drift, skips tokens', () => {
  it('matches #rgb / #rrggbb / #rrggbbaa', () => {
    expect('#f0c' .match(HEX_RX)).toEqual(['#f0c']);
    expect('#f0c674'.match(HEX_RX)).toEqual(['#f0c674']);
    expect('#f0c67480'.match(HEX_RX)).toEqual(['#f0c67480']);
  });

  it('ignores var(--foo-#xxx) style interpolation', () => {
    expect('var(--foo-#f0c674)'.match(HEX_RX)).toBeNull();
  });
});

describe('RGB_HSL_RX — matches literals, skips composers', () => {
  it('matches literal rgba(240, 198, 116, 0.15)', () => {
    expect('rgba(240, 198, 116, 0.15)'.match(RGB_HSL_RX))
      .toEqual(['rgba(2']);
  });

  it('matches hsl(210, 50%, 50%)', () => {
    expect('hsl(210, 50%, 50%)'.match(RGB_HSL_RX)).toEqual(['hsl(2']);
  });

  it('skips template-composed `rgba(${r},...)`', () => {
    // eslint-disable-next-line no-template-curly-in-string
    expect('rgba(${r},${g},${b},${alpha})'.match(RGB_HSL_RX)).toBeNull();
  });
});

describe('TW_PALETTE_RX — matches default palette, skips project tokens', () => {
  it('matches bg-slate-900 / text-red-500', () => {
    expect('bg-slate-900'.match(TW_PALETTE_RX)).toEqual(['bg-slate-900']);
    expect('text-red-500'.match(TW_PALETTE_RX)).toEqual(['text-red-500']);
  });

  it('skips bg-accent / text-mist / border-fog (project tokens)', () => {
    expect('bg-accent'.match(TW_PALETTE_RX)).toBeNull();
    expect('text-mist'.match(TW_PALETTE_RX)).toBeNull();
    expect('border-fog'.match(TW_PALETTE_RX)).toBeNull();
  });

  it('skips bg-cyan / text-rose (single-value project tokens)', () => {
    expect('bg-cyan'.match(TW_PALETTE_RX)).toBeNull();
    expect('text-rose'.match(TW_PALETTE_RX)).toBeNull();
  });

  it('matches bg-cyan-500 (shaded = default palette, not ours)', () => {
    expect('bg-cyan-500'.match(TW_PALETTE_RX)).toEqual(['bg-cyan-500']);
  });
});

describe('stripComments — inline comments are erased before scan', () => {
  it('strips `// foo` tails', () => {
    expect(stripComments('const x = 1; // see #f0c674')).not.toContain('#f0c');
  });

  it('strips same-line `/* … */` blocks', () => {
    expect(stripComments('a /* #ffffff */ b')).not.toContain('#ffffff');
  });

  it('keeps `http://` (not a comment opener)', () => {
    expect(stripComments('url = "http://x"')).toContain('http://x');
  });
});
