/**
 * Passage-Rhythm Body-Wrap Converges — third perimeter, same kernel.
 *
 * Sister fence to:
 *   • `lib/design/__tests__/caption-heading-wrap-converges.fence.test.ts`
 *     — caption-rhythm chapter labels routing through `wrapClassOf('heading')`.
 *   • `lib/return/__tests__/whisper-typography-converges.fence.test.ts`
 *     — italic whisper carriers routing through `wrapClassOf('heading')`.
 *
 * All three fences guard one ledger helper (`wrapClassOf`) but on three
 * different felt registers. THIS fence pins the body-prose register —
 * three carriers of the `thermal-typography` marquee surface routing
 * their `text-wrap` policy through `wrapClassOf('passage')` so the
 * 320 px column never strands a final word on the longest-read surface.
 *
 * The compose contract (Tanya UX #85 §1.2 — "the breath stays; the widow
 * goes"; Mike napkin #26 §1 — "compose, don't migrate"):
 *
 *   For every body-prose carrier S in SITES,
 *     S resolves its `text-wrap` policy through `wrapClassOf('passage')`
 *     from `@/lib/design/typography`. No site spells `text-wrap-*` or
 *     `typo-wrap-*` as a string literal at the call site. The thermal
 *     contract on `.thermal-typography` (line-height, font-weight,
 *     text-shadow halo, paragraph translateY rhythm, print-pin) stays
 *     untouched on every carrier — this is wrap-only addition.
 *
 * Convergence, NOT prohibition (Mike napkin §2; Elon §3): the fence
 * re-proves the present. It does not forbid future body-prose carriers
 * from shipping without the wrap — `text-wrap: pretty` on a single-line
 * paragraph is a silent CSS no-op (browser gates by content, not the
 * fence by predicate). Unconditional application is correct.
 *
 * Pure-source assertion — does NOT spin up React. Mirrors the
 * `caption-heading-wrap-converges.fence.test.ts` shape verbatim — same
 * §1 (every site imports the ledger helper) / §2 (no site inlines a wrap
 * literal) / §3 (the resolved-byte assertion). Reviewer muscle memory
 * unchanged; the only difference is the literal beat (`'passage'`) and
 * the SITES list.
 *
 * Note for the reviewer: `ReturnLetter.tsx` consumes BOTH
 * `wrapClassOf('heading')` (the eyebrow label, pinned by the caption
 * fence) AND `wrapClassOf('passage')` (the opening + body siblings,
 * pinned here). Two calls, one file, two fences — file-scoped §1/§2
 * assertions stay clean because each fence pins its own beat literal.
 *
 * Credits: Mike Koch (architect napkin #26 — the compose-don't-migrate
 * verdict, the third-perimeter / same-kernel pattern lifted byte-for-
 * byte from the caption fence, the SITES list of three carriers, the
 * two-calls-in-ReturnLetter reviewer note), Tanya Donska (UX #85 §3 —
 * the felt-experience appendix, "add the wrap; keep the breath" kernel
 * sentence, the disjoint-set table that proves migration deletes the
 * thermal contract; UX #85 §7 — the explicit decision not to fence-
 * deprecate `thermal-typography` until decomposition lands), Elon Musk
 * (the disjoint-set teardown — `.thermal-typography` and
 * `.typo-passage-thermal` share one property, not three; migration is
 * regression dressed as polish), Krystle Clear (VP Product — the felt-
 * problem identification on the longest-read surface and the minimum-
 * energy compose prescription this fence pins), Paul Kim (the no-new-
 * public-API constraint and the ONE-thing focus discipline), Sid (≤ 10
 * LoC per helper, source-truthfulness doctrine, no-renderer fence
 * pattern lifted from caption-heading-wrap-converges).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  PASSAGE_BODY_CARRIERS as SITES,
  TYPOGRAPHY_ORDER,
  wrapClassOf,
} from '@/lib/design/typography';

const ROOT = join(__dirname, '..', '..', '..');

// ─── The three body-prose carriers ────────────────────────────────────────
//
// `SITES` is the named tuple `PASSAGE_BODY_CARRIERS` from the typography
// ledger — shared with the hyphens + hang fences. A fourth carrier is one
// diff in `lib/design/typography.ts`, no fence edit. Reviewer alias keeps
// `it.each(SITES)` muscle memory below.
//
// `ReturnLetter.tsx` carries TWO `wrapClassOf` calls — `'heading'` for the
// eyebrow label (pinned by `caption-heading-wrap-converges`) and `'passage'`
// for the opening + body siblings (pinned HERE). One entry per file; the
// two-calls-per-file detail is documented in the module header.

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Read the source of a sibling body-prose carrier. ≤ 10 LoC. */
function readSite(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

/** True iff the source contains a quoted `typo-wrap-<beat>` string literal.
 *  Single/double quotes only — markdown backticks in docblocks are
 *  documentation, not call-site code, and do not flip this fence. */
function hasWrapLiteral(src: string, beat: string): boolean {
  const rx = new RegExp(`['"]typo-wrap-${beat}['"]`);
  return rx.test(src);
}

// ─── §1 · Every body-prose carrier imports wrapClassOf from the ledger ───

describe('passage body-wrap converges · §1 every site imports the ledger helper', () => {
  it.each(SITES)('%s imports wrapClassOf from @/lib/design/typography', (_, rel) => {
    const src = readSite(rel);
    expect(src).toMatch(
      /import\s*\{[^}]*\bwrapClassOf\b[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it.each(SITES)('%s calls wrapClassOf(\'passage\') verbatim', (_, rel) => {
    // The literal `'passage'` arg keeps the consumer-perimeter convergence
    // greppable. If a future PR routes a different beat through one site
    // (e.g. `'body'`), the fence breaks here and the divergence is named.
    const src = readSite(rel);
    expect(src).toMatch(/wrapClassOf\(\s*['"]passage['"]\s*\)/);
  });
});

// ─── §2 · No carrier spells `text-wrap-*` or `typo-wrap-*` locally ───────

describe('passage body-wrap converges · §2 no site inlines a wrap literal', () => {
  it.each(SITES)('%s source does NOT contain a `text-wrap-*` literal', (_, rel) => {
    // Tailwind's `text-wrap-balance` / `text-wrap-pretty` utilities are the
    // pre-convergence drift shape. The contract: the literal lives in
    // `wrapClassOf` and `app/globals.css` ONLY. Three carriers consume it.
    const src = readSite(rel);
    expect(src).not.toMatch(/['"\`]text-wrap-(auto|pretty|balance)['"\`]/);
    expect(src).not.toMatch(/\btext-wrap-(auto|pretty|balance)\b/);
  });

  it.each(SITES)('%s source does NOT contain a `typo-wrap-<beat>` string literal', (_, rel) => {
    // The CSS class literal `'typo-wrap-passage'` lives in the typography
    // ledger's `wrapClassOf` switch (the JIT-emission home). If a carrier
    // pastes it back into a className the literal becomes a second source
    // of truth — the fence catches the drift before it ships.
    const src = readSite(rel);
    TYPOGRAPHY_ORDER.forEach((beat) => {
      expect(hasWrapLiteral(src, beat)).toBe(false);
    });
  });
});

// ─── §3 · The unison contract — one literal resolves at every site ────────

describe('passage body-wrap converges · §3 the unison contract (one shape)', () => {
  it('wrapClassOf(\'passage\') resolves to typo-wrap-passage (the body widow killer)', () => {
    // Same shape as the caption fence's §3 receipt: if every site routes
    // through `wrapClassOf` (§1) then the resolved string is byte-identical
    // by construction. Tanya UX #85 §1.2: "every long paragraph reads
    // whole at 320 px." CSS↔TS sync is enforced by `typography-sync.test.ts`
    // — this assertion just pins the byte the three body-prose carriers
    // share with the seven caption-rhythm and three whisper carriers.
    // One byte, three perimeters, one home.
    expect(wrapClassOf('passage')).toBe('typo-wrap-passage');
  });
});
