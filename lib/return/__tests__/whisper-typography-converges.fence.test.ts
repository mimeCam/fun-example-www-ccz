/**
 * Whisper Typography Converges — third sister-surface fence.
 *
 * Sibling to `whisper-paint-converges.fence.test.ts` (paint) and
 * `whisper-surfaces-share-timeline.fence.test.ts` (timing). Together the
 * three fences ARE the consumer-perimeter contract that makes the whisper
 * paint, breathe, and break as one register across every surface — without
 * birthing a `<WhisperLine>` god-component to enforce it (Mike #122).
 *
 * The unison contract (Tanya UIX #22 §4.2 — "the felt sentence holds its
 * shape on every viewport"):
 *
 *   For every whisper carrier S in SITES,
 *     S resolves its `text-wrap` policy through `wrapClassOf('heading')`
 *     from `@/lib/design/typography`. No site spells `text-wrap-*` or
 *     `typo-wrap-*` as a string literal at the call site.
 *
 * Why a third fence — not a third file in `lib/return/`:
 * paint depends on phase, tempo depends on thermal state, wrap depends on
 * neither. Three independent reactive surfaces should not be bundled
 * behind one selector because they happen to co-occur on two surfaces
 * today — that's the polymorphism trap (Mike #122 §1). The folder is the
 * register; the three fences are the contract.
 *
 * Pure-source assertion — does NOT spin up React. Mirrors the
 * `whisper-paint-converges.fence.test.ts` shape verbatim.
 *
 * Credits: Mike Koch (architect napkin #122 — the third-fence verdict,
 * the one-literal/three-consumers/one-grep-fence shape, the source-import
 * audit pattern lifted from `whisper-paint-converges.fence.test.ts`),
 * Tanya Donska (UIX #22 §4.2 / §8 — the felt-sentence guarantee, the 320px
 * orphan as the named defect, the "three fences are the contract" frame),
 * Krystle Clear (the seed pick — route the Mirror Reveal whisper through
 * the typography ledger; this whole fence is a scope around her defect),
 * Sid (≤ 10 LoC per helper, source-truthfulness doctrine).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { TYPOGRAPHY_ORDER, wrapClassOf } from '@/lib/design/typography';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

const SITES: ReadonlyArray<readonly [string, string]> = [
  ['RecognitionWhisper', 'components/return/RecognitionWhisper.tsx'],
  ['ViaWhisper',         'components/home/ViaWhisper.tsx'],
  ['MirrorRevealCard',   'components/mirror/MirrorRevealCard.tsx'],
] as const;

/** Read the source of a sibling whisper carrier. ≤ 10 LoC. */
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

// ─── §1 · Every whisper carrier imports wrapClassOf from the ledger ───────

describe('whisper typography converges · §1 every carrier imports the ledger helper', () => {
  it.each(SITES)('%s imports wrapClassOf from @/lib/design/typography', (_, rel) => {
    const src = readSite(rel);
    expect(src).toMatch(
      /import\s*\{[^}]*\bwrapClassOf\b[^}]*\}\s*from\s*['"]@\/lib\/design\/typography['"]/,
    );
  });

  it.each(SITES)('%s calls wrapClassOf(\'heading\') verbatim', (_, rel) => {
    // The literal `'heading'` arg keeps the consumer-perimeter convergence
    // greppable. If a future PR routes a different beat through one site,
    // the fence breaks here and the divergence is named.
    const src = readSite(rel);
    expect(src).toMatch(/wrapClassOf\(\s*['"]heading['"]\s*\)/);
  });
});

// ─── §2 · No carrier spells `text-wrap-*` or `typo-wrap-*` locally ───────

describe('whisper typography converges · §2 no carrier inlines a wrap literal', () => {
  it.each(SITES)('%s source does NOT contain a `text-wrap-*` literal', (_, rel) => {
    // Tailwind's `text-wrap-balance` / `text-wrap-pretty` utilities are the
    // pre-convergence drift shape. The contract: the literal lives in
    // `wrapClassOf` and `app/globals.css` ONLY. Three carriers consume it.
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

describe('whisper typography converges · §3 the unison contract (one shape)', () => {
  it('wrapClassOf(\'heading\') resolves to typo-wrap-heading (the orphan killer)', () => {
    // Same shape as the paint fence's §2 receipt: if every site routes
    // through `wrapClassOf` (§1) then the resolved string is byte-identical
    // by construction. Tanya UIX #22 §4.2: "Heading's `wrap: 'balance'`
    // is the orphan killer; leading stays at caption." CSS↔TS sync is
    // enforced by `typography-sync.test.ts` — this assertion just pins
    // the byte the three carriers will share.
    expect(wrapClassOf('heading')).toBe('typo-wrap-heading');
  });
});
