/**
 * OS-Honor Register Pair-Rule — the institutional contract.
 *
 * Promotes the OS-honor list from "list in a markdown file" to the fourth
 * register with a pair rule (same status as ledgers, primitives, motion
 * beats). Without this test, the register is just prose and rots in 6
 * months. The test IS the register (Mike napkin #71 §5; Elon §"doctrine of
 * one is called a test").
 *
 * What it asserts (bijection, drift = build fail):
 *
 *   1. The "## OS-Honor Register" section in `AGENTS.md` parses to a flat
 *      bullet list of N reader-invariant queries / OS-facing declarations.
 *   2. The CSS authoring layer (app/globals.css + every lib/**\/*.css)
 *      declares EXACTLY that same set of `@media (prefers-*` /
 *      `@media (forced-colors` queries plus the `color-scheme:` and
 *      `accent-color:` `:root` declarations.
 *   3. Set difference both ways → fail with a precise message naming the
 *      missing entry. Doc-side missing → "AGENTS.md silent on X". CSS-side
 *      missing → "register claims X but no rule paints it".
 *   4. Cardinality is locked at 6. Bumps require an explicit constant
 *      change in this test — that's the scope debate the lock forces.
 *
 * NO new TS receipt module. The doctrine is enforced by parse, not by
 * runtime check (the CSS browser-side and the existing per-query sync
 * tests already cover the runtime gate). Elon §"single-member layer = a
 * line, not a layer."
 *
 * Credits: Mike K. (napkin #71 — register pair-rule architecture, the
 * regex-over-CSS pattern, "the test IS the register" framing), Elon M.
 * (varnish-without-enforcement critique → the kernel this test rescues),
 * Tanya D. (UX §6 — "six vows are a chord, not a stack" — the cardinality
 * argument), Jason F. (parenthetical-burial bug catch that motivated
 * promoting the register), Paul K. (one PR, three artifacts gate),
 * Krystle C. (surgical PR scope), authors of `forced-colors-sync.test.ts`
 * (Mike, Tanya, Elon, Paul, Krystle, Jason — the parser helpers and the
 * scope-lock cardinality idiom this test mirrors directly).
 */

import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const AGENTS_MD = readFileSync(
  resolve(__dirname, '../../../AGENTS.md'),
  'utf-8',
);
const GLOBALS_CSS = readFileSync(
  resolve(__dirname, '../../../app/globals.css'),
  'utf-8',
);
const LIB_DIR = resolve(__dirname, '../../');

// ─── Cardinality lock — bump requires explicit change here (Mike §5/§7) ──

/** The OS-honor register is locked at 6 entries. A 7th entry is a scope
 *  debate, not a silent add. Adding the 7th query means: bump this number,
 *  add the AGENTS.md bullet, add the CSS rule, add the per-query sync test,
 *  ship it as a PR. Fast-fail at the test level keeps the gate honest. */
const REGISTER_CARDINALITY = 6;

// ─── Parser helpers — pure, each ≤ 10 LOC, lifted from sibling tests ────

/** Strip C-style comments so declaration scans don't pick up commented-out
 *  references (e.g. `@media (forced-colors: active)` inside a docblock). */
function stripComments(body: string): string {
  return body.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Recursively walk a directory and yield every `.css` file path. Pure (in
 *  the readdirSync sense — no caching). Skips `node_modules` and `.next`. */
function walkCss(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkCss(full));
    else if (entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

/** Concatenate every CSS file under `lib/` plus app/globals.css, comments
 *  stripped, into one string for set-extraction scans. */
function readAllAuthoringCss(): string {
  const libCss = walkCss(LIB_DIR).map((p) => readFileSync(p, 'utf-8')).join('\n');
  return stripComments(GLOBALS_CSS + '\n' + libCss);
}

// ─── Register key normalization ──────────────────────────────────────────

/** A register key is the canonical fingerprint of one OS-honor entry.
 *  Both sides (AGENTS.md and CSS) normalize to this shape so set-equality
 *  is a string compare. */
type RegisterKey = string;

/** Normalize a media-query argument like `prefers-contrast: more` →
 *  `prefers-contrast: more` (already canonical — but folds whitespace). */
function normalizeMediaArg(arg: string): RegisterKey {
  return arg.trim().replace(/\s+/g, ' ');
}

/** Normalize an OS-facing declaration to the canonical `name → value`
 *  fingerprint. The arrow disambiguates from `@media` keys at a glance. */
function normalizeDecl(name: string, value: string): RegisterKey {
  const v = value.trim().replace(/^var\((.*)\)$/, '$1');
  return `${name.trim()} → ${v}`;
}

// ─── AGENTS.md side — parse the OS-Honor Register block ──────────────────

/** Extract the "## OS-Honor Register" section body — every line up to (but
 *  not including) the next `## ` heading. Pure substring slice. */
function readRegisterSection(): string {
  const start = AGENTS_MD.indexOf('## OS-Honor Register');
  if (start < 0) return '';
  const next = AGENTS_MD.indexOf('\n## ', start + 1);
  return AGENTS_MD.slice(start, next < 0 ? AGENTS_MD.length : next);
}

/** Pull the backtick-quoted register key out of one numbered bullet line.
 *  Bullets look like:  `1. \`prefers-contrast: more\` — the room…`.
 *  Returns undefined if the line isn't a register entry. */
function parseBulletKey(line: string): RegisterKey | undefined {
  const m = line.match(/^\s*\d+\.\s*`([^`]+)`/);
  if (!m) return undefined;
  return m[1].trim().replace(/\s+/g, ' ');
}

/** Walk the register section line-by-line, return every numbered bullet's
 *  backtick-quoted key as a normalized RegisterKey. Order preserved. */
function parseRegisterBullets(): RegisterKey[] {
  const section = readRegisterSection();
  const out: RegisterKey[] = [];
  for (const line of section.split('\n')) {
    const key = parseBulletKey(line);
    if (key) out.push(key);
  }
  return out;
}

// ─── CSS side — extract every reader-invariant query / OS-facing decl ────

/** Find every distinct `@media (prefers-* : *)` argument across the CSS,
 *  comments stripped. Returns the set as RegisterKeys (e.g. `prefers-…`). */
function extractPrefersMediaKeys(css: string): Set<RegisterKey> {
  const out = new Set<RegisterKey>();
  const rx = /@media\s*\(\s*(prefers-[^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(css)) !== null) out.add(normalizeMediaArg(m[1]));
  return out;
}

/** Find every distinct `@media (forced-colors: …)` argument across the CSS,
 *  comments stripped. Returns the set as RegisterKeys. */
function extractForcedColorsKeys(css: string): Set<RegisterKey> {
  const out = new Set<RegisterKey>();
  const rx = /@media\s*\(\s*(forced-colors:[^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(css)) !== null) out.add(normalizeMediaArg(m[1]));
  return out;
}

/** Find one `name: value;` declaration inside the first `:root { … }` block.
 *  Returns undefined if absent. Comments must be stripped first. */
function readRootDecl(css: string, name: string): string | undefined {
  const root = css.match(/:root\s*\{([\s\S]*?)\}/);
  if (!root) return undefined;
  const rx = new RegExp(`(?:^|;|\\s)${name.replace(/[-]/g, '\\-')}:\\s*([^;]+);`);
  const m = root[1].match(rx);
  return m ? m[1].trim() : undefined;
}

/** Compose the full RegisterKey set the CSS authoring layer publishes.
 *  Three sources: prefers-* media, forced-colors media, two `:root` decls. */
function extractCssRegister(): Set<RegisterKey> {
  const css = readAllAuthoringCss();
  const out = new Set<RegisterKey>();
  extractPrefersMediaKeys(css).forEach((k) => out.add(k));
  extractForcedColorsKeys(css).forEach((k) => out.add(k));
  addRootDecl(css, out, 'color-scheme');
  addRootDecl(css, out, 'accent-color');
  return out;
}

/** Look up `name` in `:root` and, if present, fold it into `keys` as a
 *  normalized declaration RegisterKey. Side-effecting helper, ≤10 LOC. */
function addRootDecl(css: string, keys: Set<RegisterKey>, name: string): void {
  const value = readRootDecl(css, name);
  if (value !== undefined) keys.add(normalizeDecl(name, value));
}

// ─── Tests — register section parses ─────────────────────────────────────

describe('AGENTS.md · ## OS-Honor Register section', () => {
  it('the section exists in AGENTS.md', () => {
    expect(AGENTS_MD).toContain('## OS-Honor Register');
  });

  it('parses to a flat numbered bullet list', () => {
    const bullets = parseRegisterBullets();
    expect(bullets.length).toBeGreaterThan(0);
  });

  it('cardinality is locked at REGISTER_CARDINALITY (6)', () => {
    const bullets = parseRegisterBullets();
    expect(bullets.length).toBe(REGISTER_CARDINALITY);
  });

  it('every bullet carries a backtick-quoted register key', () => {
    const bullets = parseRegisterBullets();
    bullets.forEach((b) => expect(b.length).toBeGreaterThan(0));
  });

  it('every bullet names the sync test that guards it (pair rule)', () => {
    const section = readRegisterSection();
    const bulletLines = section.split('\n').filter((l) => /^\s*\d+\./.test(l));
    bulletLines.forEach((line) => expect(line.toLowerCase()).toMatch(/sync:/));
  });
});

// ─── Tests — CSS side publishes the same register ────────────────────────

describe('CSS authoring layer · OS-honor surface', () => {
  it('publishes at least REGISTER_CARDINALITY distinct register keys', () => {
    const css = extractCssRegister();
    expect(css.size).toBeGreaterThanOrEqual(REGISTER_CARDINALITY);
  });

  it('declares color-scheme: dark on :root', () => {
    const css = extractCssRegister();
    expect(css.has('color-scheme → dark')).toBe(true);
  });

  it('declares accent-color → --sys-focus-ink on :root (NEVER --token-accent)', () => {
    const css = extractCssRegister();
    expect(css.has('accent-color → --sys-focus-ink')).toBe(true);
  });
});

// ─── Tests — bijection (drift = build fail) ──────────────────────────────

describe('AGENTS.md ↔ CSS bijection', () => {
  it('every register bullet has a matching CSS rule (doc-side complete)', () => {
    const bullets = new Set(parseRegisterBullets());
    const css = extractCssRegister();
    const missing = Array.from(bullets).filter((k) => !css.has(k));
    expect({ missingFromCss: missing }).toEqual({ missingFromCss: [] });
  });

  it('every CSS register key has a matching AGENTS.md bullet (CSS-side complete)', () => {
    const bullets = new Set(parseRegisterBullets());
    const css = extractCssRegister();
    const orphans = Array.from(css).filter((k) => !bullets.has(k));
    expect({ missingFromAgentsMd: orphans }).toEqual({ missingFromAgentsMd: [] });
  });
});

// ─── Tests — the 6th query landed (sanity gate for THIS sprint) ──────────

describe('OS-Honor Register · the 6th query', () => {
  it('AGENTS.md names prefers-reduced-transparency: reduce', () => {
    const bullets = parseRegisterBullets();
    expect(bullets).toContain('prefers-reduced-transparency: reduce');
  });

  it('the CSS authoring layer paints prefers-reduced-transparency: reduce', () => {
    const css = extractCssRegister();
    expect(css.has('prefers-reduced-transparency: reduce')).toBe(true);
  });

  it('AGENTS.md no longer claims forced-colors is "future" (stale claim fix)', () => {
    // Mike #71 §4 — drop "future" in the same PR. Doc rot is a category of
    // bug; fix it where you find it. forced-colors is shipped (sync test
    // exists; CSS rules paint).
    expect(AGENTS_MD).not.toMatch(/future\s+`?forced-colors`?/);
  });
});
