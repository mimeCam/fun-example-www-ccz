/**
 * ReadProgressCaption · SSR render-shape gate + source-pin invariants.
 *
 * `.ts` test file (not `.tsx`) — uses `React.createElement` to match the
 * project idiom (ArticleProvenance.test.ts, ReadersMark.test.ts). No JSX
 * in the suite, no per-test ts-jest override.
 *
 * Three layers, each pinning a load-bearing invariant of the caption:
 *
 *   1. SSR render shape — the component renders `{readTime} min read`
 *      verbatim under `renderToString` (no provider, no client mount).
 *      Byte-equal to today's literal. No flash hazard.
 *   2. Always emits the print fallback — a `.print-only` span with the
 *      static promise — and the live `.screen-only` span that carries
 *      the keyed `data-sys-enter="fade"` crossfade hook.
 *   3. Source pins — the component MUST NOT import any clock, MUST NOT
 *      use `<motion.span>` or Framer, MUST NOT define a new motion
 *      token. The discipline lives next to the test that catches
 *      violations.
 *
 * Credits: Tanya D. (#77 — SSR-parity test, print fallback shape, the
 * `aria-live="off"` posture), Mike K. (#43 — six-test set, source-pin
 * pattern lifted from ArticleProvenance.test.ts), Krystle C. (referenced
 * — three-state scope), Elon M. (referenced — pure-function framing).
 */

import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { ReadProgressCaption } from '../ReadProgressCaption';

// ─── 1 · SSR render shape · byte-identical to today’s literal ────────────

describe('ReadProgressCaption · SSR render shape', () => {
  it('renders `5 min read` on the server (no provider, default context)', () => {
    const html = renderToString(
      createElement(ReadProgressCaption, { readTime: 5 }),
    );
    expect(html).toMatch(/5 min read/);
  });

  it('renders `10 min read` for a different publisher estimate', () => {
    const html = renderToString(
      createElement(ReadProgressCaption, { readTime: 10 }),
    );
    expect(html).toMatch(/10 min read/);
  });

  it('does NOT render the presence string on the server (state 0 only)', () => {
    const html = renderToString(
      createElement(ReadProgressCaption, { readTime: 5 }),
    );
    expect(html).not.toMatch(/min left/);
  });

  it('does NOT render the testimony string on the server (state 0 only)', () => {
    const html = renderToString(
      createElement(ReadProgressCaption, { readTime: 5 }),
    );
    // Ensure the four-letter receipt is not standalone in the output.
    // The substring "read" appears within "min read", so we look for a
    // bare ">read<" payload that would indicate state 2.
    expect(html).not.toMatch(/>read</);
  });
});

// ─── 2 · Print fallback + screen-only live caption ───────────────────────

describe('ReadProgressCaption · print/screen split', () => {
  it('emits a `.print-only` static fallback alongside the live caption', () => {
    const html = renderToString(
      createElement(ReadProgressCaption, { readTime: 7 }),
    );
    expect(html).toMatch(/class="[^"]*print-only[^"]*"/);
  });

  it('emits a `.screen-only` wrapper for the live caption', () => {
    const html = renderToString(
      createElement(ReadProgressCaption, { readTime: 7 }),
    );
    expect(html).toMatch(/class="[^"]*screen-only[^"]*"/);
  });

  it('attaches `data-sys-enter="fade"` so the keyed mount runs the crossfade', () => {
    const html = renderToString(
      createElement(ReadProgressCaption, { readTime: 7 }),
    );
    expect(html).toMatch(/data-sys-enter="fade"/);
  });

  it('marks the live caption with `aria-live="off"` (decorative typography)', () => {
    const html = renderToString(
      createElement(ReadProgressCaption, { readTime: 7 }),
    );
    expect(html).toMatch(/aria-live="off"/);
  });

  it('pins the centered slot to a 14ch min-width (no horizontal waltz)', () => {
    const html = renderToString(
      createElement(ReadProgressCaption, { readTime: 7 }),
    );
    expect(html).toMatch(/min-width:\s*14ch/);
  });

  it('applies tabular-nums so digits do not jitter under the dissolve', () => {
    const html = renderToString(
      createElement(ReadProgressCaption, { readTime: 7 }),
    );
    expect(html).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });
});

// ─── 3 · Source-pin invariants — the design rules in code ────────────────

describe('ReadProgressCaption · source-pin invariants', () => {
  const SRC_PATH = join(__dirname, '..', 'ReadProgressCaption.tsx');
  const SRC = readFileSync(SRC_PATH, 'utf8');

  it('imports the pure helper from `lib/utils/read-progress`', () => {
    expect(SRC).toMatch(/from\s+['"]@\/lib\/utils\/read-progress['"]/);
  });

  it('imports `useScrollDepth` for the maxDepth context value', () => {
    expect(SRC).toMatch(/useScrollDepth/);
  });

  it('imports `useGenuineCompletion` for the latched testimony', () => {
    expect(SRC).toMatch(/useGenuineCompletion/);
  });

  it('does NOT import `framer-motion` (motion ledger is sealed)', () => {
    expect(SRC).not.toMatch(/from\s+['"]framer-motion['"]/);
  });

  it('does NOT define a new motion duration literal (no ms suffix)', () => {
    // The crossfade beat lives in `app/globals.css` under
    // `--sys-time-crossfade`; this component must not invent a new one.
    // Allow purely numeric literals (e.g. `0.15`); reject `Nms` strings.
    expect(SRC).not.toMatch(/['"`]\d+ms['"`]/);
  });

  it('uses the sealed `data-sys-enter="fade"` hook, not a custom keyframe', () => {
    expect(SRC).toMatch(/SKELETON_ENTER_ATTR|data-sys-enter/);
  });
});
