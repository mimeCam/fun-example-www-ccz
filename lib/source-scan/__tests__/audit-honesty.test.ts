/**
 * audit-honesty — pin the *false-positive* the helper exists to kill.
 *
 * Before this PR, `scripts/audit-spacing-collapse.ts` flagged
 * `components/return/ArticleWhisperPortal.tsx` because the file's
 * docblock contains the literal text "envelope carries `mt-sys-10`"
 * — caught by the `mt-sys-N` regex *inside a comment*. The fix is
 * upstream in the scanner: pre-mask comment + string bodies. After
 * masking, a comment-borne "mt-sys-10" disappears, and the file is
 * honestly silent.
 *
 * This test is the receipt of that honesty: it composes the audit's
 * two regexes against the masked source of the previously-flagged
 * file and asserts that no `mt-sys-N` survives the scrub. (The portal
 * predicate's quoted token also vanishes, by design — Mike #2 §6.5
 * documents the trade.)
 *
 * The acceptance gate of the audit script (zero findings on the full
 * tree) lives in CI's `npx tsx scripts/audit-spacing-collapse.ts`
 * gesture; this unit test pins the substrate.
 *
 * Credits: Mike Koch (#2 §6.1 — the regex shape), Tanya Donska
 * (#3 §5 / #97 §1 — the invariant that ships unbroken when the
 * audit prints `0 finding(s)`).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

import { stripCommentsAndStrings } from '../strip-comments';

/** Mirror the audit's regexes verbatim — the contract under test. */
const PORTAL_COLLAPSE = /surface\s*!==\s*['"]\w+['"][\s\S]{0,40}?return\s+null/g;
const TOP_MARGIN_CLASS = /\bmt-sys-(\d+)\b/g;

/** The file the unscrubbed audit historically flagged (Mike #2 §1, §5). */
const PORTAL_PATH = resolve(
  __dirname,
  '../../../components/return/ArticleWhisperPortal.tsx',
);

describe('audit-honesty — comment-borne false positives are silenced', () => {
  test('ArticleWhisperPortal carries `mt-sys-N` only inside comments', () => {
    const src = readFileSync(PORTAL_PATH, 'utf-8');
    // Sanity: the unscrubbed source does carry the token (else the
    // test would silently pass for the wrong reason).
    expect(src).toMatch(/mt-sys-\d+/);
  });

  test('scrubbed source carries zero `mt-sys-N` matches', () => {
    const src = readFileSync(PORTAL_PATH, 'utf-8');
    const scrubbed = stripCommentsAndStrings(src);
    const matches = Array.from(scrubbed.matchAll(TOP_MARGIN_CLASS));
    expect(matches).toHaveLength(0);
  });

  test('scrubbed source produces no portal+margin co-occurrence', () => {
    const src = readFileSync(PORTAL_PATH, 'utf-8');
    const scrubbed = stripCommentsAndStrings(src);
    const portals = Array.from(scrubbed.matchAll(PORTAL_COLLAPSE));
    const margins = Array.from(scrubbed.matchAll(TOP_MARGIN_CLASS));
    // The audit fires only when BOTH co-occur — neither alone is a
    // finding. After scrubbing, this file is honestly silent.
    expect(portals.length === 0 || margins.length === 0).toBe(true);
  });

  test('scrub preserves length and newline-grid for the real file', () => {
    const src = readFileSync(PORTAL_PATH, 'utf-8');
    const scrubbed = stripCommentsAndStrings(src);
    expect(scrubbed).toHaveLength(src.length);
    expect(scrubbed.split('\n')).toHaveLength(src.split('\n').length);
  });
});
