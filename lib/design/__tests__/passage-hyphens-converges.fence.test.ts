/**
 * Passage-Rhythm Body-Hyphens Converges — fourth perimeter on the typography
 * ledger; mirror sibling of `passage-wrap-converges.fence.test.ts`.
 *
 * Sister fences:
 *   • `passage-wrap-converges.fence.test.ts` — `wrapClassOf('passage')`
 *     routing on the same three body-prose carriers.
 *   • `caption-heading-wrap-converges.fence.test.ts` — caption-rhythm
 *     chapter labels routing through `wrapClassOf('heading')`.
 *
 * THIS fence pins the body-prose hyphenation register — three carriers of
 * the `thermal-typography` marquee surface composing
 * `hyphensClassOf('passage')` (which resolves to `'typo-hyphens-passage'`)
 * so the 320 px column never strands a long word like *"extraordinarily"*
 * or *"indistinguishable"* against the right edge.
 *
 * The compose contract (Tanya UX §1 — "the column is breathing"; Mike
 * napkin §1 — "compose, don't migrate"):
 *
 *   For every body-prose carrier S in SITES,
 *     S resolves its hyphenation policy through `hyphensClassOf('passage')`
 *     from `@/lib/design/typography`. No site spells `hyphens-*` or
 *     `typo-hyphens-*` as a string literal at the call site. The thermal
 *     contract on `.thermal-typography` and the wrap-only handle
 *     (`PASSAGE_WRAP`) stay untouched on every carrier — wrap and hyphens
 *     are disjoint properties; this is hyphens-only addition.
 *
 * Convergence, NOT prohibition (Mike napkin §2; Elon §3): the fence
 * re-proves the present. Wide viewports (≥640 px) silently no-op
 * `hyphens: auto` because `text-wrap: pretty` already rebalances the
 * column; the fence does not predict where future hyphenation belongs,
 * it pins where it lives today.
 *
 * Pure-source assertion — does NOT spin up React. Lifted byte-for-byte
 * from `passage-wrap-converges.fence.test.ts`; only the literal beat name
 * (`hyphens` ↔ `wrap`) and the helper name (`hyphensClassOf`) differ.
 * Reviewer muscle memory unchanged.
 *
 * Note for the reviewer: `ReturnLetter.tsx` consumes BOTH
 * `wrapClassOf('passage')` (pinned by the wrap fence) AND
 * `hyphensClassOf('passage')` (pinned here) on the same opening + body
 * siblings. Two helpers, one file, two fences — file-scoped §1/§2
 * assertions stay clean because each fence pins its own helper name.
 *
 * Credits: Mike Koch (architect napkin — the compose-don't-migrate verdict
 * extended to a fourth handle, the byte-shape-identical fence pattern, the
 * SITES list of three carriers, the two-helpers-in-ReturnLetter reviewer
 * note), Tanya Donska (UX spec — the felt-experience appendix, "polish
 * you don't notice is craft" framing, the 320-px invisible-handle
 * definition of done), Elon Musk (the `overflow-wrap: break-word` over
 * `anywhere` call, the print-side honesty note that demotes "first locale-
 * bound rule" to "first SCREEN-side locale-bound rule"), Krystle Clear
 * (VP Product brief #12 — three call sites, fence shape, `8 4 4`
 * threshold, one-sprint scope shipped verbatim), Paul Kim (the screenshot-
 * as-hard-exit-gate framing, the temptation table that defers `quotes` /
 * `'locl'` cleanly), Sid (≤ 10 LoC per helper, source-truthfulness
 * doctrine, no-renderer fence pattern lifted from passage-wrap-converges).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PASSAGE_BODY_CARRIERS as SITES,
  TYPOGRAPHY_ORDER,
  hyphensClassOf,
} from '@/lib/design/typography';

const ROOT = join(__dirname, '..', '..', '..');

// ─── The three body-prose carriers ────────────────────────────────────────
//
// `SITES` is the named tuple `PASSAGE_BODY_CARRIERS` from the typography
// ledger — shared with the wrap + hang fences. A fourth carrier is one
// diff in `lib/design/typography.ts`, no fence edit. Reviewer alias keeps
// `it.each(SITES)` muscle memory below.

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Read the source of a sibling body-prose carrier. ≤ 10 LoC. */
function readSite(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

/** True iff the source contains a quoted `typo-hyphens-<beat>` string literal.
 *  Single/double quotes only — markdown backticks in docblocks are
 *  documentation, not call-site code, and do not flip this fence. */
function hasHyphensLiteral(src: string, beat: string): boolean {
  const rx = new RegExp(`['"]typo-hyphens-${beat}['"]`);
  return rx.test(src);
}

// ─── §1 · Every body-prose carrier imports hyphensClassOf from the ledger ─

describe('passage body-hyphens converges · §1 every site imports the ledger helper', () => {
  it.each(SITES)('%s imports hyphensClassOf from @/lib/design/typography', (_, rel) => {
    const src = readSite(rel);
    expect(src).toMatch(
      /import\s*\{[^}]*\bhyphensClassOf\b[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it.each(SITES)('%s calls hyphensClassOf(\'passage\') verbatim', (_, rel) => {
    // The literal `'passage'` arg keeps the consumer-perimeter convergence
    // greppable. If a future PR routes a different beat through one site
    // (e.g. `'body'`), the fence breaks here and the divergence is named.
    const src = readSite(rel);
    expect(src).toMatch(/hyphensClassOf\(\s*['"]passage['"]\s*\)/);
  });
});

// ─── §2 · No carrier spells `hyphens-*` or `typo-hyphens-*` locally ──────

describe('passage body-hyphens converges · §2 no site inlines a hyphens literal', () => {
  it.each(SITES)('%s source does NOT contain a `hyphens-(auto|manual|none)` literal', (_, rel) => {
    // Tailwind's `hyphens-auto` / `hyphens-manual` / `hyphens-none` utilities
    // are the pre-convergence drift shape. The contract: hyphenation lives
    // in `hyphensClassOf` and `app/globals.css` ONLY. Three carriers consume.
    const src = readSite(rel);
    expect(src).not.toMatch(/['"\`]hyphens-(auto|manual|none)['"\`]/);
    expect(src).not.toMatch(/\bhyphens-(auto|manual|none)\b/);
  });

  it.each(SITES)('%s source does NOT contain a `typo-hyphens-<beat>` string literal', (_, rel) => {
    // The CSS class literal `'typo-hyphens-passage'` lives in the typography
    // ledger's `hyphensClassOf` switch (the JIT-emission home). If a carrier
    // pastes it back into a className the literal becomes a second source
    // of truth — the fence catches the drift before it ships.
    const src = readSite(rel);
    TYPOGRAPHY_ORDER.forEach((beat) => {
      expect(hasHyphensLiteral(src, beat)).toBe(false);
    });
  });
});

// ─── §3 · The unison contract — one literal resolves at every site ────────

describe('passage body-hyphens converges · §3 the unison contract (one shape)', () => {
  it('hyphensClassOf(\'passage\') resolves to typo-hyphens-passage (the body widow killer)', () => {
    // Same shape as the wrap fence's §3 receipt: if every site routes
    // through `hyphensClassOf` (§1) then the resolved string is byte-
    // identical by construction. CSS↔TS sync (the `hyphens: auto` +
    // `hyphenate-limit-chars: 8 4 4` + `overflow-wrap: break-word` body)
    // is enforced by `typography-sync.test.ts`. This assertion just pins
    // the byte the three body-prose carriers share. One byte, three
    // perimeters, one home.
    expect(hyphensClassOf('passage')).toBe('typo-hyphens-passage');
  });
});
