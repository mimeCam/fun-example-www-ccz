/**
 * Passage-Rhythm Body-Hang Converges — fifth perimeter on the typography
 * ledger; mirror sibling of `passage-hyphens-converges.fence.test.ts`.
 *
 * Sister fences:
 *   • `passage-wrap-converges.fence.test.ts` — `wrapClassOf('passage')`
 *     routing on the same three body-prose carriers.
 *   • `passage-hyphens-converges.fence.test.ts` — `hyphensClassOf('passage')`
 *     routing on the same three body-prose carriers.
 *
 * THIS fence pins the body-prose hanging-punctuation register — three
 * carriers of the `thermal-typography` marquee surface composing
 * `hangPunctClassOf('passage')` (which resolves to `'typo-hang-passage'`)
 * so quotes, periods, and commas stop poking holes in the right edge of
 * the column on Safari readers.
 *
 * The compose contract (Tanya UX §1 — "the column edge stops wobbling";
 * Mike napkin §3 — "compose, don't migrate"):
 *
 *   For every body-prose carrier S in SITES,
 *     S resolves its hanging-punctuation policy through
 *     `hangPunctClassOf('passage')` from `@/lib/design/typography`. No
 *     site spells `hanging-punctuation` or `typo-hang-*` as a string
 *     literal at the call site. The thermal contract on
 *     `.thermal-typography`, the wrap-only handle (`PASSAGE_WRAP`), and
 *     the hyphens handle (`PASSAGE_HYPHENS`) stay untouched on every
 *     carrier — wrap, hyphens, and hang declare disjoint properties; this
 *     is hang-only addition.
 *
 * Convergence, NOT prohibition (Mike napkin §3; Elon §3): the fence
 * re-proves the present. Chrome / Firefox / Edge silently no-op the
 * declaration because they ship no `hanging-punctuation` painter; the
 * fence does not predict where future hang belongs, it pins where it
 * lives today. ~30–35% of traffic sees the effect; the other ~65% see
 * today's column unchanged. That is progressive enhancement done right
 * — Safari-only paint is the receipt, not the bug (Tanya UX §3.1, Elon
 * §1.2).
 *
 * Pure-source assertion — does NOT spin up React. Lifted byte-for-byte
 * from `passage-hyphens-converges.fence.test.ts`; only the literal beat
 * name (`hang` ↔ `hyphens`) and the helper name (`hangPunctClassOf`)
 * differ. Reviewer muscle memory unchanged.
 *
 * Note for the reviewer: `ReturnLetter.tsx` consumes THREE compose
 * helpers — `wrapClassOf('passage')` (pinned by the wrap fence),
 * `hyphensClassOf('passage')` (pinned by the hyphens fence), and now
 * `hangPunctClassOf('passage')` (pinned here) — on the same opening +
 * body siblings. Three helpers, one file, three fences — file-scoped
 * §1/§2 assertions stay clean because each fence pins its own helper
 * name.
 *
 * Credits: Mike Koch (architect napkin — the fifth-perimeter / same-
 * kernel pattern, the byte-shape-identical fence template, the SITES
 * list of three carriers, the compose-don't-migrate verdict extended to
 * a fifth handle, the three-helpers-in-ReturnLetter reviewer note),
 * Tanya Donska (UX spec — the "quotes stop poking holes" felt-experience
 * appendix, "polish you don't notice is craft" framing, the 320-px
 * dialogue-paragraph definition of done, the Safari-only honesty), Elon
 * Musk (the browser-coverage asymmetry teardown that demoted the helper
 * to "fifth perimeter" from "right-edge counterpart of the Golden
 * Thread", the category-error verdict that kept the AGENTS.md voice
 * mechanical), Krystle Clear (VP Product brief — three call sites,
 * fence shape, `first last allow-end` combo, one-sprint scope shipped
 * verbatim), Paul Kim (the screenshot-as-hard-exit-gate framing, the
 * temptation table that defers headings / displays cleanly), Sid (≤ 10
 * LoC per helper, source-truthfulness doctrine, no-renderer fence
 * pattern lifted from passage-hyphens-converges).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TYPOGRAPHY_ORDER, hangPunctClassOf } from '@/lib/design/typography';

const ROOT = join(__dirname, '..', '..', '..');

// ─── The three body-prose carriers ────────────────────────────────────────
//
// Same SITES list as `passage-wrap-converges.fence.test.ts` and
// `passage-hyphens-converges.fence.test.ts` — wrap, hyphens, and hang
// are sibling handles on the same prose surfaces. If a future carrier
// joins the wrap + hyphens fences, it joins this fence too (or a comment
// here documents the carve-out).
//
// Each entry: [reviewer-friendly name, repo-relative path]. Surface-named
// (the file the contributor opens), not concept-named — failure-message-
// is-documentation (Mike #38 §4).

const SITES: ReadonlyArray<readonly [string, string]> = [
  ['ArticlePage',   'app/article/[id]/page.tsx'],
  ['ReturnLetter',  'components/return/ReturnLetter.tsx'],
  ['PortalHero',    'components/home/PortalHero.tsx'],
] as const;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Read the source of a sibling body-prose carrier. ≤ 10 LoC. */
function readSite(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

/** True iff the source contains a quoted `typo-hang-<beat>` string literal.
 *  Single/double quotes only — markdown backticks in docblocks are
 *  documentation, not call-site code, and do not flip this fence. */
function hasHangLiteral(src: string, beat: string): boolean {
  const rx = new RegExp(`['"]typo-hang-${beat}['"]`);
  return rx.test(src);
}

// ─── §1 · Every body-prose carrier imports hangPunctClassOf from the ledger ─

describe('passage body-hang converges · §1 every site imports the ledger helper', () => {
  it.each(SITES)('%s imports hangPunctClassOf from @/lib/design/typography', (_, rel) => {
    const src = readSite(rel);
    expect(src).toMatch(
      /import\s*\{[^}]*\bhangPunctClassOf\b[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it.each(SITES)('%s calls hangPunctClassOf(\'passage\') verbatim', (_, rel) => {
    // The literal `'passage'` arg keeps the consumer-perimeter convergence
    // greppable. If a future PR routes a different beat through one site
    // (e.g. `'body'`), the fence breaks here and the divergence is named.
    const src = readSite(rel);
    expect(src).toMatch(/hangPunctClassOf\(\s*['"]passage['"]\s*\)/);
  });
});

// ─── §2 · No carrier spells `hanging-punctuation` or `typo-hang-*` locally ─

describe('passage body-hang converges · §2 no site inlines a hang literal', () => {
  it.each(SITES)('%s source does NOT contain an inline hang declaration (Tailwind arb / React style)', (_, rel) => {
    // The CSS property literal is the pre-convergence drift shape:
    //   • Tailwind arbitrary value: `[hanging-punctuation:first_last_allow-end]`
    //   • React inline style: `style={{ hangingPunctuation: '…' }}`
    // The contract: hang declarations live in `app/globals.css` (canonical
    // home) and `lib/design/typography.ts` (mirror). Three carriers
    // consume the class via `hangPunctClassOf`. The honesty fence
    // (`hang-progressive-enhancement.fence.test.ts`) pins the property-
    // literal home count globally; this assertion catches the two call-
    // site drift shapes specifically — the ones a future PR is most
    // likely to introduce while wiring up "Chrome parity."
    const src = readSite(rel);
    expect(src).not.toMatch(/\[hanging-punctuation\s*:/);
    expect(src).not.toMatch(/\bhangingPunctuation\s*:/);
  });

  it.each(SITES)('%s source does NOT contain a `typo-hang-<beat>` string literal', (_, rel) => {
    // The CSS class literal `'typo-hang-passage'` lives in the typography
    // ledger's `hangPunctClassOf` switch (the JIT-emission home). If a
    // carrier pastes it back into a className the literal becomes a second
    // source of truth — the fence catches the drift before it ships.
    const src = readSite(rel);
    TYPOGRAPHY_ORDER.forEach((beat) => {
      expect(hasHangLiteral(src, beat)).toBe(false);
    });
  });
});

// ─── §3 · The unison contract — one literal resolves at every site ────────

describe('passage body-hang converges · §3 the unison contract (one shape)', () => {
  it('hangPunctClassOf(\'passage\') resolves to typo-hang-passage (the optical edge polish)', () => {
    // Same shape as the hyphens fence's §3 receipt: if every site routes
    // through `hangPunctClassOf` (§1) then the resolved string is byte-
    // identical by construction. CSS↔TS sync (the `hanging-punctuation:
    // first last allow-end` body) is enforced by `typography-sync.test.ts`.
    // This assertion just pins the byte the three body-prose carriers
    // share. One byte, three perimeters, one home.
    expect(hangPunctClassOf('passage')).toBe('typo-hang-passage');
  });
});
