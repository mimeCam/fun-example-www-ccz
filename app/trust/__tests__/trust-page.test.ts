/**
 * /trust page — structural + invariance tests. Tanya #76 §15.
 *
 * Three promises this test locks down:
 *   1. The copy module `lib/sharing/trust-copy.ts` has the right shape
 *      (headline exists; paragraph is exactly three sentences; list is
 *      exactly five entries — §10 list-does-not-grow rule).
 *   2. The page source refuses thermal tokens on foreground-critical sites
 *      — no `--token-accent`, no `--token-foreground`, no `--gold`, no
 *      `--amber`, no `--accent-violet`. This is the *code-level* receipt
 *      that the page "feels cold" (Tanya §5 — forbidden palette).
 *   3. `// reader-invariant — /trust page` tags are grep-visible so the
 *      byte-identity audit finds them alongside Mike's ink gate.
 *
 * We deliberately do NOT render the page through `react-dom/server` here
 * because the page imports a client component (`SuspenseFade`, which reads
 * `'use client'`). A source-level text scan is the honest receipt at
 * `testEnvironment: 'node'`.
 *
 * Credits: Tanya D. (the discipline that this file enforces — §5 forbidden
 * palette, §10 five-item cap, §4.3 "what is not on this page"), Mike K.
 * (napkin #62 — the byte-identity grep pattern this test reuses), Elon M.
 * (the "grep is the contract" rule that makes this a test, not a vibe).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  TRUST_HEADLINE,
  TRUST_PARAGRAPH,
  TRUST_INVARIANTS,
  invariantCount,
} from '@/lib/sharing/trust-copy';

const PAGE_PATH = resolve(__dirname, '../page.tsx');
const COPY_PATH = resolve(__dirname, '../../../lib/sharing/trust-copy.ts');
const PAGE_SRC = readFileSync(PAGE_PATH, 'utf-8');
const COPY_SRC = readFileSync(COPY_PATH, 'utf-8');

/** Strip block + line comments so palette assertions scan executable source. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

const PAGE_CODE = stripComments(PAGE_SRC);
const COPY_CODE = stripComments(COPY_SRC);

// ─── 1. Copy shape — §10 list-does-not-grow ───────────────────────────────

describe('/trust copy — §10 list shape', () => {
  it('headline is non-empty', () => {
    expect(TRUST_HEADLINE.length).toBeGreaterThan(0);
  });

  it('paragraph is exactly three sentences — §10', () => {
    expect(TRUST_PARAGRAPH.length).toBe(3);
    for (const sentence of TRUST_PARAGRAPH) {
      expect(sentence.length).toBeGreaterThan(0);
      expect(sentence.endsWith('.')).toBe(true);
    }
  });

  it('invariant list is exactly five entries — the cap', () => {
    expect(TRUST_INVARIANTS.length).toBe(5);
    expect(invariantCount()).toBe(5);
  });

  it('each invariant entry is a reader-verifiable surface (non-empty)', () => {
    for (const entry of TRUST_INVARIANTS) {
      expect(entry.length).toBeGreaterThan(0);
    }
  });
});

// ─── 2. Page palette — §5 forbidden thermal tokens ────────────────────────

describe('/trust palette — §5 no thermal tokens on foreground-critical sites', () => {
  const FORBIDDEN_VARS = [
    '--token-accent',
    '--token-foreground',
    '--token-fg-warm',
    '--gold',
    '--amber',
    '--accent-violet',
  ];

  it.each(FORBIDDEN_VARS)('page executable source does NOT reference %s', (v) => {
    expect(PAGE_CODE.includes(v)).toBe(false);
  });

  it('page uses the static --mist / --primary / --void-deep palette', () => {
    // At least one static token must appear — the page MUST paint something.
    const anyStatic =
      PAGE_CODE.includes('--mist') ||
      PAGE_CODE.includes('--primary') ||
      PAGE_CODE.includes('var(--mist)') ||
      PAGE_CODE.includes('text-mist');
    expect(anyStatic).toBe(true);
  });
});

// ─── 3. Reader-invariant tag — §16 item #5 ────────────────────────────────

describe('/trust reader-invariant tags — grep contract', () => {
  it('page source carries the // reader-invariant tag at ≥2 sites', () => {
    const matches = PAGE_SRC.match(/\/\/ reader-invariant/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('copy module is archetype-invariant (no lexicon fold)', () => {
    // Voice parity skipped by design here — the /trust page does not fold
    // through reply-lexicon's 5 → 3 archetype bucket. Enforce absence in
    // EXECUTABLE code — docblocks may mention the name for context.
    expect(COPY_CODE.includes('reply-lexicon')).toBe(false);
    expect(COPY_CODE.includes('replyPhrase')).toBe(false);
    expect(COPY_CODE.includes('emptyPhrase')).toBe(false);
  });
});

// ─── 4. Entry point — §3 footer is the ONLY sitewide entry ────────────────

describe('/trust entry — only via WhisperFooter', () => {
  const FOOTER_PATH = resolve(
    __dirname,
    '../../../components/shared/WhisperFooter.tsx',
  );
  const FOOTER_SRC = readFileSync(FOOTER_PATH, 'utf-8');

  it('WhisperFooter includes the /trust link', () => {
    expect(FOOTER_SRC.includes("href: '/trust'")).toBe(true);
    expect(FOOTER_SRC.includes("label: 'Trust'")).toBe(true);
  });

  it('WhisperFooter lists exactly three footer links', () => {
    const matches = FOOTER_SRC.match(/href:\s*'\/[^']+'/g) ?? [];
    expect(matches.length).toBe(3);
  });
});
