/**
 * color-scheme-sync — physics gate for the Room Constitution.
 *
 * Reads `app/globals.css` and `app/layout.tsx`, asserts the four invariants
 * that make the page paint dark from byte zero with native form chrome
 * staying cool (anchored to the reader-invariant focus ink, NEVER to the
 * thermal accent fork).
 *
 * The four invariants — by regex, not by semantic analysis:
 *
 *   1. `<meta name="color-scheme">` content matches `:root color-scheme`
 *      VERBATIM. The meta tells the UA how to dress its chrome BEFORE CSS
 *      arrives; the :root rule pins the same string AFTER. They must agree.
 *   2. `:root accent-color` references `--sys-focus-ink` and contains NO
 *      `--token-*` / `--thermal-*` / `--arch-*` reference. Binding native
 *      checkboxes / progress bars / selects to `--token-accent` (the
 *      thermal fork) would silently warm the reader's pen with the
 *      engagement score. The reader-invariant promise forbids it.
 *   3. The `color-scheme` value is the literal string `"dark"` on both
 *      sides. Not `light dark`, not `normal`, not `only dark`. The
 *      constitution is unambiguous.
 *   4. `:root background-color` resolves to the same hex literal as
 *      `--token-bg`'s dormant declaration. Byte-identical canvas: the
 *      UA's first paint and the body's eventual paint are visually a
 *      no-op.
 *
 * Test pattern lifted verbatim from `focus-ink-byte-identity.test.ts`
 * and `focus-sync.test.ts` — same `readBalancedBlock`, `readVar`,
 * `parseHexLiteral` shapes. The symmetry is load-bearing: a future
 * sync-adoption audit finds this gate at the same grep-depth as every
 * other ledger's adoption test.
 *
 * NO new TS receipt module. Nothing in TS land needs to read
 * `color-scheme`; the receipt would be unjustified weight (Elon §3 —
 * "single-member layer = a line, not a layer"). The day a second OS-facing
 * declaration arrives (`theme-color`, `viewport-fit`, etc.) is the day to
 * rename this test and lift the helpers into `lib/design/room-constitution.ts`.
 *
 * Credits:
 *   - Jason F. (Creative Director) — the original bug catch:
 *     `accent-color: var(--token-accent)` would silently couple OS form
 *     chrome to the thermal fork. Re-binding to `--sys-focus-ink` is
 *     the structural fix this test enforces.
 *   - Mike K. (Architect, napkin) — the four-invariant punch list, the
 *     `:root` co-location call, the regex-over-CSS pattern.
 *   - Tanya D. (UIX) — the byte-identical canvas pin (#1a1a2e dormant
 *     thermal anchor), the cold-load frame-by-frame spec, the native
 *     form chrome enumeration.
 *   - Elon M. (First-principles) — the test-name-for-what-it-tests rule,
 *     the cut-list on Layer-0 vocabulary, the no-new-files discipline.
 *   - Paul K. (Business Analyst) — the make-or-break framing, the
 *     "polish-tier identical to focus-ring corner-parity" sprint shape.
 *   - Authors of `focus-ink-byte-identity.test.ts` (Mike K., Tanya D.,
 *     Elon M., Paul K., Krystle C.) — the byte-identity guard idiom
 *     this test mirrors directly.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const CSS = readFileSync(
  resolve(__dirname, '../../../app/globals.css'),
  'utf-8',
);

const LAYOUT = readFileSync(
  resolve(__dirname, '../../../app/layout.tsx'),
  'utf-8',
);

// ─── Parser helpers — pure, each ≤ 10 LOC, lifted from sibling tests ────

/** Strip C-style comments from CSS so declaration scans don't pick up
 *  property names that appear inside the authoring docblocks. Pure. */
function stripComments(body: string): string {
  return body.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** The first `:root { … }` block body, comments INCLUDED. Balanced-brace
 *  scan — comments contain literal `{…}` glyphs that defeat a lazy regex. */
function readRootBlockRaw(): string {
  const start = CSS.indexOf(':root');
  if (start < 0) return '';
  const open = CSS.indexOf('{', start);
  if (open < 0) return '';
  let depth = 1;
  for (let i = open + 1; i < CSS.length; i++) {
    if (CSS[i] === '{') depth++;
    else if (CSS[i] === '}' && --depth === 0) return CSS.slice(open + 1, i);
  }
  return '';
}

/** The first `:root { … }` block body with comments stripped — the body
 *  declaration scans run against. Authoring docblocks contain property
 *  names (`accent-color:`, `background-color:`) that would otherwise
 *  collide with the regex. Stripping is the canonical fix. */
function readRootBlock(): string {
  return stripComments(readRootBlockRaw());
}

/** The value of a named declaration inside a (comment-free) CSS block.
 *  Works for both custom properties (`--sys-focus-ink`) and standard
 *  properties (`color-scheme`, `accent-color`, `background-color`). */
function readDecl(block: string, name: string): string | undefined {
  const rx = new RegExp(`(?:^|[\\s;{])${name}:\\s*([^;]+);`);
  const match = block.match(rx);
  return match ? match[1].trim() : undefined;
}

/** All matches of a prefix family (e.g. `--thermal-`) inside a string. */
function matchesOf(input: string, prefix: string): string[] {
  const rx = new RegExp(`${prefix}[a-zA-Z0-9_-]+`, 'g');
  return input.match(rx) ?? [];
}

/** Parse a `#rrggbb` or `#rgb` literal into its lowercase 7-char form. */
function parseHexLiteral(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/);
  if (!match) return undefined;
  const raw = match[1].toLowerCase();
  if (raw.length === 3) return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  return `#${raw}`;
}

/** Pull the `content` attribute of `<meta name="color-scheme" …>` out of
 *  the layout source. Tolerant of attribute order and quote style. */
function readMetaColorScheme(): string | undefined {
  const tag = LAYOUT.match(/<meta[^>]*name=["']color-scheme["'][^>]*\/?>/);
  if (!tag) return undefined;
  const content = tag[0].match(/content=["']([^"']+)["']/);
  return content ? content[1].trim() : undefined;
}

/** True iff the <meta> tag appears BEFORE the inline-restore <script>
 *  tag in the layout source. UAs parse <head> top-down; the meta must
 *  land first or the canvas-paint hint arrives too late. We anchor on
 *  the literal `<script` glyph, not the import identifier — the import
 *  appears at file top and would defeat a naive `indexOf` search. */
function metaPrecedesInlineRestore(): boolean {
  const meta = LAYOUT.indexOf('name="color-scheme"');
  const script = LAYOUT.indexOf('<script');
  return meta > 0 && script > 0 && meta < script;
}

// ─── Tests — invariant #1: meta ↔ :root color-scheme byte-identity ──────

describe('Room Constitution · invariant #1 — meta ↔ :root color-scheme', () => {
  it('app/layout.tsx declares <meta name="color-scheme" content="…" />', () => {
    expect(readMetaColorScheme()).toBeDefined();
  });

  it(':root declares color-scheme: …;', () => {
    expect(readDecl(readRootBlock(), 'color-scheme')).toBeDefined();
  });

  it('meta content equals :root color-scheme value VERBATIM', () => {
    expect(readMetaColorScheme()).toBe(readDecl(readRootBlock(), 'color-scheme'));
  });

  it('the meta tag appears BEFORE the inline restore <script> in <head>', () => {
    expect(metaPrecedesInlineRestore()).toBe(true);
  });
});

// ─── Tests — invariant #2: accent-color is reader-invariant ─────────────

describe('Room Constitution · invariant #2 — accent-color anchors --sys-focus-ink', () => {
  it(':root declares accent-color: var(--sys-focus-ink);', () => {
    const decl = readDecl(readRootBlock(), 'accent-color');
    expect(decl).toBeDefined();
    expect(decl!.includes('--sys-focus-ink')).toBe(true);
  });

  it('accent-color references NO --token-* / --thermal-* / --arch-* token', () => {
    const decl = readDecl(readRootBlock(), 'accent-color') ?? '';
    const forbidden = ['--token-', '--thermal-', '--arch-'];
    for (const prefix of forbidden) {
      expect(matchesOf(decl, prefix)).toEqual([]);
    }
  });

  it('accent-color does NOT call color-mix() (constitution stays literal)', () => {
    const decl = readDecl(readRootBlock(), 'accent-color') ?? '';
    expect(decl.includes('color-mix')).toBe(false);
  });
});

// ─── Tests — invariant #3: color-scheme is the literal "dark" ───────────

describe('Room Constitution · invariant #3 — color-scheme is "dark"', () => {
  it(':root color-scheme is the literal string "dark"', () => {
    expect(readDecl(readRootBlock(), 'color-scheme')).toBe('dark');
  });

  it('meta name="color-scheme" content is the literal string "dark"', () => {
    expect(readMetaColorScheme()).toBe('dark');
  });
});

// ─── Tests — invariant #4: canvas pin is byte-identical to --token-bg ───

describe('Room Constitution · invariant #4 — background pinned to --token-bg', () => {
  it(':root declares background-color: var(--token-bg);', () => {
    const decl = readDecl(readRootBlock(), 'background-color');
    expect(decl).toBeDefined();
    expect(decl!.includes('--token-bg')).toBe(true);
  });

  it(':root --token-bg is a hex literal (no var/color-mix delegation)', () => {
    const decl = readDecl(readRootBlock(), '--token-bg');
    expect(decl).toBeDefined();
    expect(/^#[0-9a-fA-F]{3,6}$/.test(decl!)).toBe(true);
    expect(decl!.includes('var(')).toBe(false);
    expect(decl!.includes('color-mix')).toBe(false);
  });

  it('--token-bg resolves to a parseable 7-char hex literal', () => {
    const decl = readDecl(readRootBlock(), '--token-bg');
    expect(parseHexLiteral(decl)).toMatch(/^#[0-9a-f]{6}$/);
  });
});

// ─── Tests — co-location and reader-invariant tag ───────────────────────

describe('Room Constitution · authoring discipline (grep-visible)', () => {
  it('the three constitution declarations live INSIDE :root (not in a media query)', () => {
    const root = readRootBlock();
    expect(readDecl(root, 'color-scheme')).toBeDefined();
    expect(readDecl(root, 'accent-color')).toBeDefined();
    expect(readDecl(root, 'background-color')).toBeDefined();
  });

  it('the constitution block carries the // reader-invariant tag in its preamble', () => {
    // Read the RAW root block (comments included) — the tag is grep-visible
    // BY LIVING in the docblock. A reviewer editing :root sees it instantly.
    const raw = readRootBlockRaw();
    const idx = raw.indexOf('color-scheme:');
    expect(idx).toBeGreaterThan(0);
    const preamble = raw.slice(Math.max(0, idx - 1600), idx);
    expect(preamble.includes('reader-invariant')).toBe(true);
  });

  it('color-scheme is NOT declared inside ambient-surfaces.css (wrong layer)', () => {
    // ambient-surfaces.css's atom is "render only when the reader acts" —
    // color-scheme paints BEFORE any reader action, so it belongs upstream.
    const ambient = readFileSync(
      resolve(__dirname, '../ambient-surfaces.css'),
      'utf-8',
    );
    expect(/(^|\s|;|\{)\s*color-scheme\s*:/.test(ambient)).toBe(false);
  });

  it('exactly one <meta name="color-scheme"> tag in app/layout.tsx', () => {
    const matches = LAYOUT.match(/<meta[^>]*name=["']color-scheme["']/g) ?? [];
    expect(matches.length).toBe(1);
  });
});
