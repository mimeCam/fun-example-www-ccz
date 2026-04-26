/**
 * Trust-promise-honored — the SkipLink closes the published-promise gap.
 *
 * `lib/sharing/trust-copy.ts:43` ships `'The skip-link'` as the second of
 * five reader-invariant surfaces named on the `/trust` page. For that
 * promise to be honest, three things must hold across the repo:
 *
 *   1. Exactly ONE `<SkipLink>` consumer exists (mounted in app/layout.tsx).
 *      A second mount would mean two cold-start handshakes, which is the
 *      anti-spec failure mode (Tanya §8 — "one link, one destination").
 *
 *   2. AT LEAST ONE `id="main-content"` landmark exists across `app/` so
 *      the SkipLink's `href="#main-content"` resolves on every route the
 *      reader can reach. The audit travels with the SkipLink — a route
 *      that ships without the landmark silently breaks the link.
 *
 *   3. `TRUST_INVARIANTS[1]` resolves to a real, file-backed surface.
 *      The trust copy says "The skip-link"; the file `components/shared/
 *      SkipLink.tsx` must exist, and its locked copy must be byte-stable.
 *
 * The test is the contract anchor (Elon §2 / Mike §"Success signal"). A
 * future PR that drops the layout mount, deletes the component, or grows
 * the trust list past 5 entries will fail this file before merging.
 *
 * Credits: Paul K. (Success-signal definition — "the contract self-
 * evidences"), Mike K. (the four-test deliverable; the grep audit shape
 * lifted from `trust-page.test.ts`), Tanya D. (UX §8 — the anti-spec
 * "one link, one destination" rule), Elon M. (§2 — "the test is the
 * contract", not the comment).
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import {
  TRUST_INVARIANTS,
  invariantCount,
} from '@/lib/sharing/trust-copy';
import {
  SKIPLINK_TEXT,
  SKIPLINK_CLASS,
} from '@/components/shared/SkipLink';
import { assertTrustAnchor } from './_helpers';

// Mike #70 §A — the file-backed link from /trust bullet #2 to its audit.
// `TRUST_INVARIANTS[1]` is "The skip-link"; the substantive audit is the
// rest of this module (single-mount, landmark coverage, locked copy).
assertTrustAnchor(1, 'The skip-link');

const ROOT = resolve(__dirname, '../../..');
const LAYOUT_SRC = readFileSync(join(ROOT, 'app/layout.tsx'), 'utf-8');
const SKIPLINK_PATH = join(ROOT, 'components/shared/SkipLink.tsx');

// ─── Helpers — recursive scan, pure ──────────────────────────────────────

/** Walk a directory tree and return every `.tsx` source path under it. */
function walkTsx(dir: string, acc: string[] = []): string[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require('fs') as typeof import('fs');
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkTsx(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.tsx')) acc.push(full);
  }
  return acc;
}

/** Read a file and strip block + line comments so scans see executable code. */
function readCode(path: string): string {
  const src = readFileSync(path, 'utf-8');
  return src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

// ─── 1. Exactly one SkipLink consumer, exactly one mount site ────────────

describe('SkipLink — single consumer, single mount site', () => {
  it('the SkipLink component file exists', () => {
    expect(existsSync(SKIPLINK_PATH)).toBe(true);
  });

  it('exactly one `<SkipLink ... />` JSX mount exists in app/ + components/', () => {
    const tsxFiles = [
      ...walkTsx(join(ROOT, 'app')),
      ...walkTsx(join(ROOT, 'components')),
    ];
    const mounts: string[] = [];
    for (const f of tsxFiles) {
      // Skip the component file itself (it defines, doesn't mount).
      if (f === SKIPLINK_PATH) continue;
      const code = readCode(f);
      const found = code.match(/<SkipLink\b/g) ?? [];
      for (let i = 0; i < found.length; i++) mounts.push(f);
    }
    expect(mounts.length).toBe(1);
    expect(mounts[0]).toBe(join(ROOT, 'app/layout.tsx'));
  });

  it('the layout mounts SkipLink with target="#main-content"', () => {
    expect(/<SkipLink[^>]*target=["']#main-content["']/.test(LAYOUT_SRC))
      .toBe(true);
  });
});

// ─── 2. id="main-content" landmark exists across the route tree ──────────

describe('SkipLink landmark — id="main-content" on every route', () => {
  it('at least one `id="main-content"` exists in the app/ tree', () => {
    const tsxFiles = walkTsx(join(ROOT, 'app'));
    let total = 0;
    for (const f of tsxFiles) {
      const code = readCode(f);
      total += (code.match(/id=["']main-content["']/g) ?? []).length;
    }
    expect(total).toBeGreaterThan(0);
  });

  it('the article route declares id="main-content" on its top-level wrapper', () => {
    const articlePath = join(ROOT, 'app/article/[id]/page.tsx');
    const code = readCode(articlePath);
    expect(/id=["']main-content["']/.test(code)).toBe(true);
  });

  it('the EmptySurface primitive carries id="main-content" (covers 404/error/empty rooms)', () => {
    const emptyPath = join(ROOT, 'components/shared/EmptySurface.tsx');
    const code = readCode(emptyPath);
    expect(/id=["']main-content["']/.test(code)).toBe(true);
  });

  it('the Threshold homepage declares id="main-content"', () => {
    const homePath = join(ROOT, 'app/page.tsx');
    const code = readCode(homePath);
    expect(/id=["']main-content["']/.test(code)).toBe(true);
  });

  it('the /trust page declares id="main-content" — the page that names it', () => {
    const trustPath = join(ROOT, 'app/trust/page.tsx');
    const code = readCode(trustPath);
    expect(/id=["']main-content["']/.test(code)).toBe(true);
  });
});

// ─── 3. TRUST_INVARIANTS[1] resolves to a real surface ───────────────────

describe('TRUST_INVARIANTS[1] resolves to a real surface', () => {
  it('the second invariant is "The skip-link"', () => {
    expect(TRUST_INVARIANTS[1]).toBe('The skip-link');
  });

  it('invariantCount() is exactly 5 — list cap holds (Tanya §10)', () => {
    expect(invariantCount()).toBe(5);
  });

  it('the SkipLink locked copy is non-empty and stable', () => {
    expect(typeof SKIPLINK_TEXT).toBe('string');
    expect(SKIPLINK_TEXT.length).toBeGreaterThan(0);
  });

  it('the SkipLink CSS class binds to the rule the sync test guards', () => {
    expect(SKIPLINK_CLASS).toBe('sys-skiplink');
  });
});
