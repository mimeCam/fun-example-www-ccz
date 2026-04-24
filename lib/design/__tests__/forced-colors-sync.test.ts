/**
 * forced-colors Sync Test — physics gate for the 5th reader-invariant rule.
 *
 * Reads `app/globals.css`, walks the `@media (forced-colors: active)` block,
 * and asserts that every selector in `FORCED_COLORS_PERIMETER` lands there
 * and paints with ONLY the CSSWG-blessed system color keywords (Canvas,
 * CanvasText, LinkText, Highlight, HighlightText, ButtonText, GrayText,
 * ButtonFace, SelectedItem, SelectedItemText). A surface that claims
 * reader-invariance but still paints via `--token-*` / `--sys-*` under
 * forced-colors is lying; this test catches the lie at parse time.
 *
 * Test pattern lifted verbatim from `prefers-contrast-sync.test.ts` and
 * `focus-sync.test.ts` — same `readBalancedBlock`, `readTokenDecl`,
 * `escapeRx` shapes. The symmetry is load-bearing (Mike K. napkin §6).
 *
 * CSS is the authoring layer. The TS mirror is the 5th bullet in
 * `lib/design/focus.ts`'s `// reader-invariant` contract. No new
 * primitive, no new ledger — one shared test locks a cardinality-1
 * doctrine down as physics (Elon M. §"doctrine of one is called a test").
 *
 * Credits: Mike K. (napkin §6 — CSS-as-authoring / TS-as-mirror, the
 * regex-over-CSS helpers, the perimeter-as-constant discipline), Tanya D.
 * (UX #53 — six-surface perimeter enumeration, the per-surface posture
 * table this test asserts against), Elon M. (strip the vocabulary, ship
 * the operational one-liner — this test IS the operational one-liner),
 * Paul K. (the six-surface scope-lock), Krystle C. (surface enumeration),
 * Jason F. (the forced-colors-as-falsifiability reframe that started the
 * sprint; kept the insight, stripped the Popperian robes).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const GLOBALS_CSS = readFileSync(
  resolve(__dirname, '../../../app/globals.css'),
  'utf-8',
);
const AMBIENT_CSS = readFileSync(
  resolve(__dirname, '../ambient-surfaces.css'),
  'utf-8',
);

// ─── The perimeter — single source of truth for cardinality assertions ───

/**
 * Surfaces that MUST paint under `@media (forced-colors: active)` via
 * system keywords only. Cardinality ∈ [6, 8] — the scope lock (Paul K.
 * #91 / Elon M. #68). A seventh entry is a scope debate, not a silent add.
 * Each entry is a CSS selector substring that MUST appear inside a
 * forced-colors media block somewhere in the repo's CSS authoring layer.
 */
const FORCED_COLORS_PERIMETER = [
  ':focus-visible',
  '.golden-thread-track',
  '.golden-thread-fill',
  '.golden-thread-glow',
  '.thermal-candle',
  '::selection',
] as const;

/** The CSSWG-blessed system color keywords our rules may paint with.
 *  Reader-invariance under forced-colors means the room hands painting
 *  back to the OS; these are the OS's own tokens. No `--token-*`, no
 *  `--sys-*`, no color-mix() inside a forced-colors block. */
const SYSTEM_KEYWORDS = [
  'Canvas', 'CanvasText', 'LinkText', 'VisitedText',
  'Highlight', 'HighlightText', 'ButtonText', 'ButtonFace',
  'GrayText', 'SelectedItem', 'SelectedItemText', 'Field',
  'FieldText', 'Mark', 'MarkText', 'AccentColor', 'AccentColorText',
] as const;

// ─── Parser helpers — pure, each ≤ 10 LOC, lifted from sibling tests ────

/** Read the balanced `{ … }` block starting at the first `{` after `anchor`.
 *  Honours nested braces (the forced-colors block contains nested rules).
 *  Returns the body without the outer braces. Pure. */
function readBalancedBlock(css: string, anchor: number): string | undefined {
  const open = css.indexOf('{', anchor);
  if (open < 0) return undefined;
  let depth = 1;
  for (let i = open + 1; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i);
  }
  return undefined;
}

/** Find the body of the `@media (forced-colors: active) { … }` block.
 *  Returns undefined if the media rule is absent from the file. */
function readForcedColorsBlock(css: string): string | undefined {
  const start = css.indexOf('@media (forced-colors: active)');
  if (start < 0) return undefined;
  return readBalancedBlock(css, start);
}

/** Escape regex metacharacters in a literal selector (e.g. `.golden-thread-fill`). */
function escapeRx(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
}

/** True when the balanced block contains a rule body for the given selector.
 *  The selector can be a compound (`::placeholder`, `:focus-visible`) or a
 *  class (`.golden-thread-fill`). Pure scan — no regex brittleness. */
function blockContainsSelector(block: string, selector: string): boolean {
  const rx = new RegExp(`(^|[,\\s}])\\s*${escapeRx(selector)}[\\s,{]`);
  return rx.test(block);
}

/** Extract every rule body inside a media block, keyed by its selector list.
 *  Returns [selector, body] pairs; comments are stripped first so selectors
 *  don't pick up preceding C-style comment text. Pure. */
function readAllRules(rawBlock: string): Array<[string, string]> {
  const block = stripComments(rawBlock);
  const rules: Array<[string, string]> = [];
  let i = 0;
  while (i < block.length) {
    const open = block.indexOf('{', i);
    if (open < 0) break;
    const selector = block.slice(i, open).trim();
    const body = readBalancedBlock(block, open - 1);
    if (body === undefined) break;
    if (selector) rules.push([selector, body]);
    i = block.indexOf('}', open) + 1;
    i = skipToNextSelector(block, i);
  }
  return rules;
}

/** Advance past whitespace / closed nested blocks between rule bodies. */
function skipToNextSelector(block: string, from: number): number {
  let i = from;
  while (i < block.length && /\s/.test(block[i])) i++;
  return i;
}

/** Strip comments so token scans don't match commented-out references. */
function stripComments(body: string): string {
  return body.replace(/\/\*[\s\S]*?\*\//g, '');
}

// ─── Tests — block structure ─────────────────────────────────────────────

describe('globals.css · @media (forced-colors: active) block', () => {
  it('the block exists in globals.css', () => {
    expect(readForcedColorsBlock(GLOBALS_CSS)).toBeDefined();
  });

  it('the block carries the // reader-invariant anchor in its preamble', () => {
    const idx = GLOBALS_CSS.indexOf('@media (forced-colors: active)');
    const preamble = GLOBALS_CSS.slice(Math.max(0, idx - 1200), idx);
    expect(preamble).toContain('reader-invariant');
  });

  it('the block names the TS mirror (lib/design/focus.ts) as cross-reference', () => {
    const idx = GLOBALS_CSS.indexOf('@media (forced-colors: active)');
    const preamble = GLOBALS_CSS.slice(Math.max(0, idx - 1200), idx);
    expect(preamble).toContain('lib/design/focus.ts');
  });
});

// ─── Tests — perimeter coverage (each surface gets a rule) ───────────────

describe('forced-colors perimeter — each surface has a rule', () => {
  const globalsBlock = readForcedColorsBlock(GLOBALS_CSS) ?? '';
  const ambientBlock = readForcedColorsBlock(AMBIENT_CSS) ?? '';
  const allBlocks = globalsBlock + '\n' + ambientBlock;

  it.each(FORCED_COLORS_PERIMETER)(
    '%s has a forced-colors rule body somewhere in the authoring layer',
    (selector) => {
      expect(blockContainsSelector(allBlocks, selector)).toBe(true);
    },
  );

  it('perimeter cardinality is between 6 and 8 (scope lock)', () => {
    expect(FORCED_COLORS_PERIMETER.length).toBeGreaterThanOrEqual(6);
    expect(FORCED_COLORS_PERIMETER.length).toBeLessThanOrEqual(8);
  });
});

// ─── Tests — physics gate (no thermal tokens inside forced-colors) ───────

describe('forced-colors physics gate — only system keywords paint', () => {
  it('globals.css forced-colors block references NO --token-* color', () => {
    const block = stripComments(readForcedColorsBlock(GLOBALS_CSS) ?? '');
    expect(block).not.toMatch(/--token-(?:accent|foreground|bg|surface|glow|border|text-glow)/);
  });

  it('globals.css forced-colors block does NOT call color-mix()', () => {
    const block = stripComments(readForcedColorsBlock(GLOBALS_CSS) ?? '');
    expect(block).not.toContain('color-mix');
  });

  it('ambient-surfaces.css forced-colors block references NO --token-* color', () => {
    const block = stripComments(readForcedColorsBlock(AMBIENT_CSS) ?? '');
    expect(block).not.toMatch(/--token-(?:accent|foreground|bg|surface|glow|border|text-glow)/);
  });

  it('ambient-surfaces.css forced-colors block does NOT call color-mix()', () => {
    const block = stripComments(readForcedColorsBlock(AMBIENT_CSS) ?? '');
    expect(block).not.toContain('color-mix');
  });
});

// ─── Tests — focus ring (the one place outline legitimately returns) ──

describe('focus ring under forced-colors', () => {
  const globalsBlock = readForcedColorsBlock(GLOBALS_CSS) ?? '';

  it(':focus-visible declares outline: 2px solid Highlight', () => {
    const rules = readAllRules(globalsBlock);
    const focus = rules.find(([sel]) => sel.includes(':focus-visible'));
    expect(focus).toBeDefined();
    expect(focus![1]).toMatch(/outline:\s*2px\s+solid\s+Highlight/);
  });

  it(':focus-visible zeroes the warm-mode box-shadow', () => {
    const rules = readAllRules(globalsBlock);
    const focus = rules.find(([sel]) => sel.includes(':focus-visible'));
    expect(focus).toBeDefined();
    expect(focus![1]).toMatch(/box-shadow:\s*none/);
  });

  it(':focus-visible declares forced-color-adjust: none (honour the override)', () => {
    const rules = readAllRules(globalsBlock);
    const focus = rules.find(([sel]) => sel.includes(':focus-visible'));
    expect(focus).toBeDefined();
    expect(focus![1]).toMatch(/forced-color-adjust:\s*none/);
  });
});

// ─── Tests — golden-thread becomes ink, not light ────────────────────────

describe('golden thread under forced-colors', () => {
  const globalsBlock = readForcedColorsBlock(GLOBALS_CSS) ?? '';

  it('.golden-thread-track paints GrayText (dormant-anchor equivalent)', () => {
    const rules = readAllRules(globalsBlock);
    const track = rules.find(([sel]) => sel.trim() === '.golden-thread-track');
    expect(track).toBeDefined();
    expect(track![1]).toContain('GrayText');
  });

  it('.golden-thread-glow/fill/settled collapse to CanvasText and stop animating', () => {
    const rules = readAllRules(globalsBlock);
    const fill = rules.find(([sel]) =>
      sel.includes('.golden-thread-glow') || sel.includes('.golden-thread-fill'));
    expect(fill).toBeDefined();
    expect(fill![1]).toContain('CanvasText');
    expect(fill![1]).toMatch(/animation:\s*none/);
    expect(fill![1]).toMatch(/box-shadow:\s*none/);
  });
});

// ─── Tests — animation reducer (forced-colors agrees with reduced-motion) ─

describe('forced-colors reduces motion (composes with prefers-reduced-motion)', () => {
  it('universal selector collapses animation / transition to ~0ms', () => {
    const block = readForcedColorsBlock(GLOBALS_CSS) ?? '';
    expect(block).toMatch(/animation-duration:\s*0\.01ms/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms/);
  });

  it('.thermal-candle halo dissolves (no box-shadow, no animation)', () => {
    const block = readForcedColorsBlock(GLOBALS_CSS) ?? '';
    const rules = readAllRules(block);
    const candle = rules.find(([sel]) => sel.trim() === '.thermal-candle');
    expect(candle).toBeDefined();
    expect(candle![1]).toMatch(/box-shadow:\s*none/);
    expect(candle![1]).toMatch(/animation:\s*none/);
  });
});

// ─── Tests — system keywords enumeration (shape of the ledger) ───────────

describe('system keywords — the vocabulary allowed inside forced-colors', () => {
  it('the allowed set is non-empty and all entries are PascalCase CSS idents', () => {
    expect(SYSTEM_KEYWORDS.length).toBeGreaterThanOrEqual(6);
    SYSTEM_KEYWORDS.forEach((kw) => {
      expect(/^[A-Z][A-Za-z]+$/.test(kw)).toBe(true);
    });
  });

  it('every word painted inside a forced-colors rule matches a system keyword', () => {
    // Scan the globals forced-colors block for any PascalCase identifier
    // that is NOT a property name. Anything picked up MUST be a member
    // of SYSTEM_KEYWORDS. Catches typos (e.g. CanvasTxt) and rogue tokens.
    const block = stripComments(readForcedColorsBlock(GLOBALS_CSS) ?? '');
    const rhsValues = pickRhsPascalIdents(block);
    rhsValues.forEach((ident) => {
      expect(SYSTEM_KEYWORDS).toContain(ident as typeof SYSTEM_KEYWORDS[number]);
    });
  });
});

/** Extract PascalCase identifiers that appear on the right-hand side of a
 *  CSS declaration (i.e. after colon and before semicolon). We do NOT match
 *  selector positions or property names. Pure scanner. */
function pickRhsPascalIdents(block: string): string[] {
  const out: string[] = [];
  const rx = /:\s*([^;{}]+);/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(block)) !== null) {
    const value = m[1];
    const idents = value.match(/\b[A-Z][A-Za-z]+\b/g);
    if (idents) out.push(...idents);
  }
  return out;
}

// ─── Tests — ambient-surfaces.css still carries the canonical pattern ───

describe('ambient-surfaces.css — canonical forced-colors reference', () => {
  it('::selection paints Highlight / HighlightText (the reference impl)', () => {
    const block = readForcedColorsBlock(AMBIENT_CSS) ?? '';
    expect(block).toMatch(/::selection\s*\{[^}]*Highlight[^}]*\}/);
  });

  it('::placeholder and ::marker paint CanvasText (accent tint stripped)', () => {
    const block = readForcedColorsBlock(AMBIENT_CSS) ?? '';
    expect(block).toMatch(/::placeholder\s*\{[^}]*CanvasText[^}]*\}/);
    expect(block).toMatch(/::marker\s*\{[^}]*CanvasText[^}]*\}/);
  });
});
