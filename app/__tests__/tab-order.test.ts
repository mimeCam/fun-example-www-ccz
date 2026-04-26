/**
 * Tab-order test — first focusable surface after `<body>`.
 *
 * The cold-start handshake is only a contract if the SkipLink is *literally*
 * the first focusable node a keyboard reader meets. This test asserts the
 * structural invariant at the source level — the `<SkipLink ... />` JSX
 * lands as the first child of `<body>` in `app/layout.tsx`, *before*
 * `<ThermalLayout>` and any other surface.
 *
 * Why source-level instead of DOM tab traversal:
 *
 *   • `app/layout.tsx` imports `next/font/google` and Next.js client
 *     bundles that need a build-time runtime. Calling `renderToStaticMarkup`
 *     under Jest's `testEnvironment: 'node'` is hostile.
 *
 *   • The invariant we want to assert is *positional*, not *behavioural*.
 *     "First child of <body>" survives dev-overlays, analytics widgets, and
 *     hydration races (Elon §4.1). Asserting on the source guarantees the
 *     first focusable seat in the layout, before any client component or
 *     portal can prepend a sibling.
 *
 * The test is intentionally narrow: parse the body's JSX, find the first
 * tag, expect `<SkipLink`. Anything more elaborate becomes a runtime test
 * that flaps on unrelated change.
 *
 * Credits: Mike K. (the source-level audit pattern; Elon §4.1 mitigation —
 * "assert on document.body.firstElementChild, not on simulated tab order"),
 * Tanya D. (the first-focusable seat as the contract anchor), Elon M. (the
 * "test the structural invariant, not the behaviour" rule).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const LAYOUT_PATH = resolve(__dirname, '../layout.tsx');
const LAYOUT_SRC = readFileSync(LAYOUT_PATH, 'utf-8');

// ─── Helpers — pure, ≤10 LOC ─────────────────────────────────────────────

/** Strip block + line comments so positional scans see executable JSX. */
function stripComments(src: string): string {
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

/** Find the body of the JSX `<body … > … </body>` element in the source.
 *  Uses balanced-tag scanning (no nested `<body>` exists in our layout). */
function readBodyJsx(src: string): string | undefined {
  const open = src.match(/<body\b[^>]*>/);
  if (!open || open.index === undefined) return undefined;
  const start = open.index + open[0].length;
  const end = src.indexOf('</body>', start);
  if (end < 0) return undefined;
  return src.slice(start, end);
}

/** Pull the first JSX tag name out of a JSX fragment, e.g. `SkipLink`. */
function firstTagName(jsx: string): string | undefined {
  const trimmed = jsx.replace(/^\s+/, '');
  const match = trimmed.match(/^<\/?([A-Za-z][A-Za-z0-9]*)\b/);
  return match ? match[1] : undefined;
}

// ─── Source-level structural assertions ───────────────────────────────────

const CODE = stripComments(LAYOUT_SRC);

describe('tab-order — SkipLink is the first child of <body>', () => {
  it('layout source imports SkipLink', () => {
    expect(LAYOUT_SRC.includes('SkipLink')).toBe(true);
    expect(/from\s+['"]@\/components\/shared\/SkipLink['"]/.test(LAYOUT_SRC))
      .toBe(true);
  });

  it('the <body> element appears in the layout JSX', () => {
    expect(readBodyJsx(CODE)).toBeDefined();
  });

  it('the first child of <body> is the SkipLink component', () => {
    const body = readBodyJsx(CODE);
    expect(body).toBeDefined();
    expect(firstTagName(body!)).toBe('SkipLink');
  });

  it('the SkipLink JSX appears BEFORE <ThermalLayout> in the body', () => {
    const body = readBodyJsx(CODE)!;
    const skipIdx = body.indexOf('<SkipLink');
    const thermalIdx = body.indexOf('<ThermalLayout');
    expect(skipIdx).toBeGreaterThan(-1);
    expect(thermalIdx).toBeGreaterThan(skipIdx);
  });

  it('the SkipLink is mounted with target="#main-content"', () => {
    const body = readBodyJsx(CODE)!;
    expect(/<SkipLink[^>]*target=["']#main-content["']/.test(body)).toBe(true);
  });

  it('exactly one <SkipLink … /> mount site exists in the layout', () => {
    const matches = CODE.match(/<SkipLink\b/g) ?? [];
    expect(matches.length).toBe(1);
  });
});
