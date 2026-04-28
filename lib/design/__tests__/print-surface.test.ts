/**
 * print-surface.test.ts — the doctrinal lock for the @media print sheet.
 *
 * Five assertion blocks, mirroring Mike #24 napkin §1:
 *
 *   1. The file parses and ships exactly one `@media print { ... }` block.
 *   2. Every selector on the kill-list (Mike §4) appears with
 *      `display: none !important`. Subtraction is the gift (Tanya §3).
 *   3. NO `print-color-adjust: exact` anywhere. The reader's printer is
 *      the reader's printer (Tanya §3.2). The honoring value is
 *      `economy`; we lock that as the only allowed value.
 *   4. NO reference to thermal tokens or thread state — paper is a
 *      static portrait of the article, not a freeze-frame of the
 *      reader's last warm second (Tanya §4.2). Concretely:
 *      no `--token-*`, no `--thread-*`, no `localStorage`.
 *   5. NO `prefers-*`, `forced-colors`, or `:root { ... }` in this file.
 *      Print is a media TYPE, not a user preference. The OS-Honor
 *      Register parser must not see this file's `@media print` rule.
 *      Cardinality stays at 6.
 *
 * Pure Jest, regex over `readFileSync` — no CSS AST dependency. Mirrors
 * the convention established in `os-honor-register.test.ts` and
 * `ambient-surfaces.test.ts`. No new deps.
 *
 * Credits: Mike K. (#24 §1 — the five-block test design, the regex
 * pattern, the negative-assertion doctrine), Tanya D. (UX #13 §3 — the
 * three-noun spec the assertions encode), Elon M. (six-mode failure
 * analysis — the `--thread-*` / `localStorage` / `print-color-adjust`
 * traps the negative assertions defend), Krystle C. (foundation-PR
 * doctrine + sync-test pair-rule), Paul K. (the gap that started this
 * cycle — the named risk this file's negative assertions defuse).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const PRINT_CSS_PATH = join(__dirname, '..', 'print-surface.css');
const PRINT_CSS = readFileSync(PRINT_CSS_PATH, 'utf8');

// ─── Helpers — pure, each ≤ 10 LOC ───────────────────────────────────────

/** Strip C-style comments so doctrine prose in the file header doesn't
 *  trip negative-assertion matchers (e.g. the comment listing what
 *  we DON'T do). */
function stripComments(body: string): string {
  return body.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Lazy-cached rules-only view of the file. Used by every test below. */
function rules(): string {
  return stripComments(PRINT_CSS);
}

/** Extract the body of the FIRST `@media print { ... }` block, balanced
 *  to depth so nested at-rules (e.g. `@page` inside `@media print`) are
 *  preserved. Returns the empty string if no block is found. */
function extractPrintBlock(): string {
  const css = rules();
  const start = css.indexOf('@media print');
  if (start < 0) return '';
  let depth = 0;
  let i = css.indexOf('{', start);
  if (i < 0) return '';
  const open = i + 1;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') { depth--; if (depth === 0) return css.slice(open, i); }
  }
  return '';
}

/** Test whether a selector appears with `display: none !important` in the
 *  print block. Tolerates whitespace and surrounding modifiers. */
function hidesInPrint(selector: string): boolean {
  const block = extractPrintBlock();
  const escaped = selector.replace(/[.[\]"=*]/g, (c) => '\\' + c);
  const rx = new RegExp(`(^|[\\s,{}])${escaped}([\\s,{}])`, 'm');
  if (!rx.test(block)) return false;
  // Find the rule body containing this selector and check display: none !important
  const ruleRx = new RegExp(`${escaped}[^{}]*\\{([^{}]*)\\}`, 'm');
  const m = block.match(ruleRx);
  if (!m) {
    // Selector may be grouped; widen to any rule mentioning the selector.
    const groupRx = new RegExp(`[^{}]*${escaped}[^{}]*\\{([^{}]*)\\}`, 'm');
    const g = block.match(groupRx);
    return !!g && /display\s*:\s*none\s*!important/.test(g[1]);
  }
  return /display\s*:\s*none\s*!important/.test(m[1]);
}

// ─── 1 · the file parses, exactly one @media print ────────────────────────

describe('print-surface · structure', () => {
  it('the file is non-empty and parses', () => {
    expect(PRINT_CSS.length).toBeGreaterThan(500);
  });

  it('ships exactly one @media print block', () => {
    const body = rules();
    const matches = body.match(/@media\s+print\s*\{/g);
    expect(matches?.length ?? 0).toBe(1);
  });

  it('the @media print block is balanced and non-empty', () => {
    const block = extractPrintBlock();
    expect(block.trim().length).toBeGreaterThan(100);
  });
});

// ─── 2 · subtraction kill-list (Mike §4 + Tanya §2) ──────────────────────

describe('print-surface · §A subtraction (kill-list hides every chrome layer)', () => {
  const WHISPER_FOOTER = readFileSync(
    join(__dirname, '..', '..', '..', 'components/shared/WhisperFooter.tsx'),
    'utf8',
  );

  // Each entry: [selector, comment for failure messages]
  const KILL_LIST: Array<[string, string]> = [
    ['.z-sys-thread', 'Golden Thread spine (left-edge fixed)'],
    ['.z-sys-nav', 'AmbientNav (bottom bar fixed)'],
    ['.z-sys-gem', 'GemHome (top-left fixed)'],
    ['.z-sys-popover', 'SelectionPopover (portal fixed)'],
    ['.z-sys-backdrop', 'Threshold backdrop (modal layer)'],
    ['.z-sys-drawer', 'Threshold/Drawer (modal layer)'],
    ['.z-sys-toast', 'Toast pill (portal fixed)'],
    ['.crossing-flash', 'StateCrossingFlash thermal bloom'],
    ['.completion-shimmer', 'CompletionShimmer ceremony beat'],
  ];

  for (const [selector, label] of KILL_LIST) {
    it(`${label}: \`${selector}\` is display:none !important in print`, () => {
      expect(hidesInPrint(selector)).toBe(true);
    });
  }

  it('toast host portal data hook is display:none !important in print', () => {
    expect(hidesInPrint('[data-testid="toast-host"]')).toBe(true);
  });

  it('NextRead recommendation surface is hidden via [data-next-read]', () => {
    expect(hidesInPrint('[data-next-read]')).toBe(true);
  });

  it('WhisperFooter must hide in print — paper bow lives in <ReadersMark>', () => {
    expect(hidesInPrint('[data-whisper-footer]')).toBe(true);
  });

  it('WhisperFooter.tsx emits the data-whisper-footer hook on its <footer> root', () => {
    // `[^>]*` clamps the match to the single opening tag — a stray attribute
    // on a sibling element won't satisfy the contract by accident.
    expect(WHISPER_FOOTER).toMatch(/<footer\b[^>]*\bdata-whisper-footer\b/);
  });
});

// ─── 3 · NO print-color-adjust: exact (Tanya §3.2) ───────────────────────

describe('print-surface · §B reader-printer agency', () => {
  it('NEVER references `print-color-adjust: exact`', () => {
    const block = extractPrintBlock();
    expect(block).not.toMatch(/print-color-adjust\s*:\s*exact/);
    expect(block).not.toMatch(/-webkit-print-color-adjust\s*:\s*exact/);
  });

  it('declares `print-color-adjust: economy` (the explicit honoring value)', () => {
    const block = extractPrintBlock();
    expect(block).toMatch(/print-color-adjust\s*:\s*economy/);
  });

  it('@page geometry is declared (paper hygiene §B)', () => {
    const block = extractPrintBlock();
    expect(block).toMatch(/@page\s*(:[a-z]+\s*)?\{[^}]*margin[^}]*\}/);
  });

  it('body posture: white background + black ink override', () => {
    const block = extractPrintBlock();
    expect(block).toMatch(/background\s*:\s*#fff/);
    expect(block).toMatch(/color\s*:\s*#000/);
  });
});

// ─── 4 · negative-assertion lock on thermal/thread/localStorage refs ─────

describe('print-surface · reader-invariant lock (no thermal, no thread)', () => {
  it('NEVER references thermal `--token-*` variables', () => {
    expect(rules()).not.toMatch(/var\(\s*--token-/);
  });

  it('NEVER references thread `--thread-*` variables', () => {
    expect(rules()).not.toMatch(/var\(\s*--thread-/);
  });

  it('NEVER mentions localStorage (paper is not a per-device freeze-frame)', () => {
    expect(rules()).not.toMatch(/localStorage/);
  });
});

// ─── 4b · shared `.print-hairline` rule has BOTH paper consumers ─────────
//
// The printed page is bracketed by two paper-only components (Tanya UX #8
// §3 — bracketed-page rhyme). They share one geometry rule: `.print-hairline`,
// 16ch / 0.4pt #000. This block is the drift-lock — if either consumer
// renames its hairline class in isolation, the rhyme dies and this test
// fails. Mike #20 §6.10 — "naming review is the polish at this level."
//
// Two regressions this guards:
//   1. The CSS rule itself disappears or loses its 16ch/0.4pt geometry.
//   2. Either consumer (ReadersMark / ArticleProvenance) renames its
//      hairline class away from `.print-hairline`.
// All three sources (CSS + 2 TSX) are read fresh; this is a fast file
// read, not a build-graph traversal.

describe('print-surface · shared hairline (.print-hairline) is the bracketed-page rhyme', () => {
  const READERS_MARK = readFileSync(
    join(__dirname, '..', '..', '..', 'components/reading/ReadersMark.tsx'),
    'utf8',
  );
  const ARTICLE_PROVENANCE = readFileSync(
    join(__dirname, '..', '..', '..', 'components/reading/ArticleProvenance.tsx'),
    'utf8',
  );

  it('the rule `.print-hairline` is authored in print-surface.css', () => {
    const block = extractPrintBlock();
    expect(block).toMatch(/\.print-hairline\s*\{[^}]*border-top:\s*0\.4pt\s+solid\s+#000[^}]*\}/);
  });

  it('the rule fixes the width at 16ch (the bracket measure)', () => {
    const block = extractPrintBlock();
    expect(block).toMatch(/\.print-hairline\s*\{[^}]*width:\s*16ch[^}]*\}/);
  });

  it('ReadersMark consumes `.print-hairline` (parting bow)', () => {
    expect(READERS_MARK).toMatch(/className=["']print-hairline["']/);
  });

  it('ArticleProvenance consumes `.print-hairline` (greeting bow)', () => {
    expect(ARTICLE_PROVENANCE).toMatch(/className=["']print-hairline["']/);
  });

  it('the legacy `.readers-mark-rule` selector is fully gone from CSS + components', () => {
    expect(rules()).not.toMatch(/\.readers-mark-rule/);
    expect(READERS_MARK).not.toMatch(/readers-mark-rule/);
    expect(ARTICLE_PROVENANCE).not.toMatch(/readers-mark-rule/);
  });
});

// ─── 5 · OS-Honor Register parser MUST NOT see this file ─────────────────

describe('print-surface · stays outside the OS-Honor Register bijection', () => {
  it('NO `prefers-*` media query (cardinality stays at 6)', () => {
    expect(rules()).not.toMatch(/@media\s*\(\s*prefers-/);
  });

  it('NO `forced-colors:` media query (cardinality stays at 6)', () => {
    expect(rules()).not.toMatch(/@media\s*\(\s*forced-colors:/);
  });

  it('NO `:root { ... }` declarations (no register-bumping side channel)', () => {
    expect(rules()).not.toMatch(/:root\s*\{/);
  });
});
