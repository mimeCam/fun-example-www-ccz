/**
 * Caption-Rhythm Heading-Wrap Converges — second perimeter, same kernel.
 *
 * Sister fence to `lib/return/__tests__/whisper-typography-converges.fence.test.ts`.
 * Both fences guard the same one literal (`'typo-wrap-heading'` from
 * `wrapClassOf('heading')`) but on TWO different felt registers:
 *
 *   • Whisper carriers (italic body, three reveal surfaces) — that fence.
 *   • Caption-rhythm CHAPTER LABELS (uppercase micro-eyebrow, seven mostly
 *     non-animating surfaces) — THIS fence.
 *
 * They share the resolver but not the felt category. Bundling both into one
 * SITES array would smear two registers behind one selector — the
 * polymorphism trap (Mike #122 §1; Elon §2 — *self-similar is the
 * seductive word*). The folder is the register; the file is the contract;
 * the kernel below them is shared.
 *
 * The unison contract (Tanya UIX "Indivisible Label" §1.2 — "every multi-
 * word label arrives whole at 320 px"):
 *
 *   For every caption-rhythm chapter-label site S in SITES,
 *     S resolves its `text-wrap` policy through `wrapClassOf('heading')`
 *     from `@/lib/design/typography`. No site spells `text-wrap-*` or
 *     `typo-wrap-*` as a string literal at the call site.
 *
 * Convergence, NOT prohibition (Mike napkin §2; Elon §3): the fence
 * re-proves the present. It does not forbid future caption-rhythm sites
 * from shipping without the wrap — that predicate (uppercase + caption
 * tracking + micro size ⇒ wrap) misfires on single-word labels (`BLEND`,
 * `EVOLUTION`) where `text-wrap: balance` is a no-op. Unconditional
 * application is correct (browser gates by content, not the fence by
 * predicate). When a fifth uppercase orphan ships in production, the
 * shape MAY graduate to a prohibition fence; until then, prohibition is
 * theatre.
 *
 * Pure-source assertion — does NOT spin up React. Mirrors the
 * `whisper-typography-converges.fence.test.ts` shape verbatim — same
 * §1 (every site imports the ledger helper) / §2 (no site inlines a wrap
 * literal) / §3 (the unison contract pins the resolved class). Reviewer
 * muscle memory unchanged.
 *
 * Credits: Mike Koch (architect napkin — the second-perimeter / same-kernel
 * verdict, the byte-shape-identical fence pattern lifted from the whisper
 * fence, the convergence-not-prohibition reconciliation), Tanya Donska
 * (UIX "Indivisible Label" — the felt-experience appendix, the seven-site
 * audit, the §6 felt-sentence acceptance gates), Elon Musk (the predicate
 * teardown that killed the prohibition fence and kept this fence honest;
 * the single-word-label no-op physics), Krystle Clear (the original
 * Sprint 1 mechanics — `wrapClassOf('heading')` extension shape, the
 * convergence-fence rename), Paul Kim (trust-artifact framing — the label
 * IS the voice; the no-new-public-API constraint), Sid (≤ 10 LoC per
 * helper, source-truthfulness doctrine, no-renderer fence pattern).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TYPOGRAPHY_ORDER, wrapClassOf } from '@/lib/design/typography';

const ROOT = join(__dirname, '..', '..', '..');

// ─── The seven caption-rhythm chapter-label sites ─────────────────────────
//
// Each entry: [reviewer-friendly name, repo-relative path]. The names are
// surface-named (the file the contributor is in), not concept-named — when
// the fence reds, the name in the failure block IS the file the reviewer
// will open. (Mike #38 §4 — failure-message-is-documentation.)
//
// Two sites share one file (`StratifiedRenderer.tsx` carries both the
// extension-block label AND the resonance-marginalia label). One entry
// per file in SITES — the §1 / §2 assertions are file-scoped, and §3 pins
// the byte once. The two-call-sites-per-file detail is documented here
// for the reviewer (Tanya §3 — the seven-site audit).

const SITES: ReadonlyArray<readonly [string, string]> = [
  ['ResonanceSectionHeader', 'components/resonances/ResonanceSectionHeader.tsx'],
  ['ResonanceEntry',         'app/resonances/ResonanceEntry.tsx'],
  ['ReturnLetter',           'components/return/ReturnLetter.tsx'],
  ['NextRead',               'components/reading/NextRead.tsx'],
  ['StratifiedRenderer',     'components/content/StratifiedRenderer.tsx'],
  ['MirrorRevealCard',       'components/mirror/MirrorRevealCard.tsx'],
] as const;

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Read the source of a sibling caption-rhythm chapter-label carrier. ≤ 10 LoC. */
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

// ─── §1 · Every chapter-label site imports wrapClassOf from the ledger ───

describe('caption-rhythm heading-wrap converges · §1 every site imports the ledger helper', () => {
  it.each(SITES)('%s imports wrapClassOf from @/lib/design/typography', (_, rel) => {
    const src = readSite(rel);
    expect(src).toMatch(
      /import\s*\{[^}]*\bwrapClassOf\b[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it.each(SITES)('%s calls wrapClassOf(\'heading\') verbatim', (_, rel) => {
    // The literal `'heading'` arg keeps the consumer-perimeter convergence
    // greppable. If a future PR routes a different beat through one site
    // (e.g. `'caption'`), the fence breaks here and the divergence is named.
    const src = readSite(rel);
    expect(src).toMatch(/wrapClassOf\(\s*['"]heading['"]\s*\)/);
  });
});

// ─── §2 · No carrier spells `text-wrap-*` or `typo-wrap-*` locally ───────

describe('caption-rhythm heading-wrap converges · §2 no site inlines a wrap literal', () => {
  it.each(SITES)('%s source does NOT contain a `text-wrap-*` literal', (_, rel) => {
    // Tailwind's `text-wrap-balance` / `text-wrap-pretty` utilities are the
    // pre-convergence drift shape. The contract: the literal lives in
    // `wrapClassOf` and `app/globals.css` ONLY. Seven carriers consume it.
    const src = readSite(rel);
    expect(src).not.toMatch(/['"\`]text-wrap-(auto|pretty|balance)['"\`]/);
    expect(src).not.toMatch(/\btext-wrap-(auto|pretty|balance)\b/);
  });

  it.each(SITES)('%s source does NOT contain a `typo-wrap-<beat>` string literal', (_, rel) => {
    // The CSS class literal `'typo-wrap-heading'` lives in the typography
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

describe('caption-rhythm heading-wrap converges · §3 the unison contract (one shape)', () => {
  it('wrapClassOf(\'heading\') resolves to typo-wrap-heading (the orphan killer)', () => {
    // Same shape as the whisper fence's §3 receipt: if every site routes
    // through `wrapClassOf` (§1) then the resolved string is byte-identical
    // by construction. Tanya UIX "Indivisible Label" §1.2: "every multi-
    // word label arrives whole at 320 px." CSS↔TS sync is enforced by
    // `typography-sync.test.ts` — this assertion just pins the byte the
    // seven carriers will share with the three whisper carriers. One byte,
    // two perimeters, one home.
    expect(wrapClassOf('heading')).toBe('typo-wrap-heading');
  });
});
