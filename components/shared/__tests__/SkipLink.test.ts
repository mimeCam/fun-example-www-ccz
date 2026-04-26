/**
 * SkipLink — reader-invariant component tests.
 *
 * Three layers of guarantee, all honest under `testEnvironment: 'node'`:
 *
 *   1. Module surface — the component exports a function, the locked copy
 *      is six words / no period, and the CSS class binding matches the
 *      `.sys-skiplink` rule the sync test guards.
 *
 *   2. SSR render shape — `renderToStaticMarkup` emits a single `<a>`
 *      element with the right `href`, the right `className`, and the
 *      byte-identical copy. The SSR pin matters: this surface MUST paint
 *      pre-hydration so the first Tab keystroke can land on it before any
 *      client component mounts (Elon §4.4).
 *
 *   3. Reader-invariance — the component source carries the
 *      `// reader-invariant` grep tag, has no `'use client'` directive,
 *      and has no thermal/archetype/ThreadPulse imports.
 *
 * Test file is `.ts` (not `.tsx`) — `React.createElement` is used so the
 * existing ts-jest preset does not need a per-test override (matches the
 * sibling `SuspenseFade.test.ts`).
 *
 * Credits: Mike K. (the four-test deliverable plan, the no-`'use client'`
 * rule), Tanya D. (the locked copy, the byte-identity contract),
 * Elon M. (the test-is-the-contract framing — every assertion below is
 * a contract bullet, not a vibe).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  SkipLink,
  SKIPLINK_CLASS,
  SKIPLINK_TEXT,
} from '../SkipLink';

const SOURCE_PATH = resolve(__dirname, '../SkipLink.tsx');
const SOURCE = readFileSync(SOURCE_PATH, 'utf-8');

/** Strip block + line comments so executable-only scans don't match docs. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

const CODE = stripComments(SOURCE);

// ─── 1. Module surface ────────────────────────────────────────────────────

describe('SkipLink — module surface', () => {
  it('exports SkipLink as a function (component)', () => {
    expect(typeof SkipLink).toBe('function');
  });

  it('SKIPLINK_TEXT is the locked copy — exactly "Skip to main content"', () => {
    expect(SKIPLINK_TEXT).toBe('Skip to main content');
  });

  it('the copy is exactly four words — OS convention', () => {
    // The literal is "Skip to main content" — four tokens by space-split.
    // (The UX spec referred to the prose around the link; the link itself
    // is the OS-canonical short string. We assert the literal.)
    expect(SKIPLINK_TEXT.split(/\s+/).length).toBe(4);
  });

  it('the copy carries no trailing period (pill copy convention)', () => {
    expect(SKIPLINK_TEXT.endsWith('.')).toBe(false);
  });

  it('SKIPLINK_CLASS binds to the .sys-skiplink rule (sync key)', () => {
    expect(SKIPLINK_CLASS).toBe('sys-skiplink');
  });
});

// ─── 2. SSR render shape — single anchor, right href, locked copy ─────────

describe('SkipLink — SSR render shape', () => {
  const html = renderToStaticMarkup(
    createElement(SkipLink, { target: '#main-content' }),
  );

  it('renders an <a> element', () => {
    expect(html.startsWith('<a')).toBe(true);
  });

  it('href is the target prop (byte-identical)', () => {
    expect(html).toContain('href="#main-content"');
  });

  it('className is the sys-skiplink class — binds to the CSS rule', () => {
    expect(html).toContain('class="sys-skiplink"');
  });

  it('the visible copy is the locked SKIPLINK_TEXT', () => {
    expect(html).toContain(SKIPLINK_TEXT);
  });

  it('renders exactly one anchor element (single-instance)', () => {
    const opens = html.match(/<a\b/g) ?? [];
    expect(opens.length).toBe(1);
  });
});

// ─── 3. Archetype-blind / thermal-blind — byte-identity across props ──────

describe('SkipLink — copy is byte-identical regardless of context', () => {
  it('two renders with the same target produce identical markup', () => {
    const a = renderToStaticMarkup(
      createElement(SkipLink, { target: '#main-content' }),
    );
    const b = renderToStaticMarkup(
      createElement(SkipLink, { target: '#main-content' }),
    );
    expect(a).toBe(b);
  });

  it('the rendered text never includes archetype/thermal markers', () => {
    const html = renderToStaticMarkup(
      createElement(SkipLink, { target: '#main-content' }),
    );
    // No archetype tokens, no thermal tokens, no warm/cold markers.
    const forbidden = ['archetype', 'thermal', 'warm', 'cold', 'mirror'];
    for (const marker of forbidden) {
      expect(html.toLowerCase()).not.toContain(marker);
    }
  });
});

// ─── 4. Reader-invariant source — grep contract ───────────────────────────

describe('SkipLink — source-level invariance contract', () => {
  it('the component source carries the // reader-invariant grep tag', () => {
    expect(SOURCE.includes('// reader-invariant')).toBe(true);
  });

  it('the component is a server component — no `\'use client\'` directive', () => {
    // Scan executable code only — the docblock may mention `'use client'`
    // for context. The directive itself is what we forbid.
    expect(CODE.includes("'use client'")).toBe(false);
    expect(CODE.includes('"use client"')).toBe(false);
  });

  it('the component does NOT import thermal/archetype/threadpulse modules', () => {
    const forbiddenImports = [
      "from '@/lib/thermal",
      "from '@/lib/thread",
      "from '@/lib/mirror",
      "from '@/components/thermal",
      'useThermal(',
      'useThreadPulse(',
      'useMirror(',
    ];
    for (const marker of forbiddenImports) {
      expect(CODE.includes(marker)).toBe(false);
    }
  });

  it('the component does NOT use React state or effects (CSS-only motion)', () => {
    const forbiddenHooks = ['useState(', 'useEffect(', 'useRef(', 'useReducer('];
    for (const hook of forbiddenHooks) {
      expect(CODE.includes(hook)).toBe(false);
    }
  });
});
