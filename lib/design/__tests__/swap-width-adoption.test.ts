/**
 * Swap-Width Adoption Test — the fourth grep-fence riding the
 * `_adoption-fence` kernel; the 15th sibling adoption ledger overall.
 *
 * Three discrete `min-w-[Xrem]` literals carry the label-swap floors
 * across the codebase. The canonical home is exactly one file —
 * `lib/design/swap-width.ts`, which composes them through
 * `swapWidthClassOf(n)`. Four call-sites reach for the helper:
 *
 *   rung 1 — `min-w-[5.5rem]`   → ReturnLetter.tsx       (Copy ↔ Copied)
 *   rung 2 — `min-w-[6.5rem]`   → ShareOverlay.tsx       (Copy Link ↔ Copied!)
 *   rung 3 — `min-w-[14rem]`    → QuoteKeepsake.tsx      (Share this card ↔ Shared)
 *   rung 3 — `min-w-[14rem]`    → ThreadKeepsake.tsx     (Share this thread ↔ Shared)
 *
 * **The narrow fence** (Mike #N §POI-2 — *three patterns, one allow-list
 * each, day-one empty*): one regex per rung literal, each labelled with
 * a `kind` so the failure prose names which floor was bypassed. The
 * `swap-width-sync.test.ts` pins CSS↔TS drift; the host-scoped
 * `label-swap-width-fence.test.ts` defends the `<ActionPressable>`
 * host against any `min-w-[…]` literal; this file defends the *three
 * exact rung literals* against any tag, anywhere outside the canonical
 * home — different blast radius, complementary fence (Mike #N §1).
 *
 * Walker / comment-stripper / exempt-token check live in
 * `_adoption-fence.ts` (kernel; precedents: `caption-metric-adoption`,
 * `numeric-features-adoption`, `filled-glyph-lift-adoption`).
 *
 * **What this test does NOT try to assert** (Tanya UX §0, §7): the
 * crossfade sub-pixel paint, the visual swap-moment receipt, any DOM
 * timing, or the `--token-motion-crossfade` 120ms beat. Those live in
 * the motion ledger and are out of scope for a source-grep adoption
 * fence. The test pins the *vocabulary*; the user feels the *moment*.
 *
 * Credits: Krystle C. (#86 — identified the missing 6th sibling, scoped
 * it as a kernel-tenant, the doctrine-consistency case for shipping),
 * Mike K. (#N napkin — three-pattern shape, allow-list locked at one
 * canonical home, fix-hint as documentation, "ship the file, stop
 * there" anti-scope discipline), Tanya D. (UX #41, #50 — the rung
 * sizing table from labels not chars, the centring discipline, the
 * "button stays still while the word changes its mind" felt sentence
 * the fence pins below the surface), Elon M. (#15 — refused doctrine
 * inflation; the kill list that kept this PR honest), Sid (the original
 * lift discipline — byte-identical helper output, four one-line JSX
 * edits — without which this allow-list could not lock at empty on day
 * one), prior fences (`filled-glyph-lift-adoption.test.ts` — the shape
 * mirror, three patterns paid for by `numeric-features-adoption`).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runFence, formatViolations, type FenceDecl } from './_adoption-fence';
import { SWAP_WIDTH_EXEMPT_TOKEN } from '../swap-width';

const ROOT = join(__dirname, '..', '..', '..');

/** Files that legitimately spell the raw `min-w-[Xrem]` rung literals.
 * One home — the canonical helper in `lib/design/swap-width.ts`. The
 * four call-sites compose the literal through `swapWidthClassOf(n)`,
 * so the raw literal does not survive in source. */
const SWAP_WIDTH_ALLOW: ReadonlySet<string> = new Set(['lib/design/swap-width.ts']);

/** The three rung regexes — word-boundary lookarounds prevent partial
 * matches inside a longer literal (e.g. `min-w-[14rem]` should never
 * accidentally match `min-w-[14rem-foo]`). Pattern-by-pattern `kind`
 * labels surface in the failure prose so the contributor sees exactly
 * which floor was bypassed. */
const RUNG_1_RX = /(?<![\w-])min-w-\[5\.5rem\](?![\w-])/;
const RUNG_2_RX = /(?<![\w-])min-w-\[6\.5rem\](?![\w-])/;
const RUNG_3_RX = /(?<![\w-])min-w-\[14rem\](?![\w-])/;

const FENCE: FenceDecl = {
  scanDirs: ['components', 'lib', 'app'],
  patterns: [
    { regex: RUNG_1_RX, allow: SWAP_WIDTH_ALLOW, kind: 'rung-1' },
    { regex: RUNG_2_RX, allow: SWAP_WIDTH_ALLOW, kind: 'rung-2' },
    { regex: RUNG_3_RX, allow: SWAP_WIDTH_ALLOW, kind: 'rung-3' },
  ],
  exemptToken: SWAP_WIDTH_EXEMPT_TOKEN,
};

// ─── Tests — the grep-fence ──────────────────────────────────────────────

describe('swap-width adoption — every rung literal routes through swapWidthClassOf', () => {
  const violations = runFence(FENCE);

  /** Human-readable fix hint — names the helper, the three rung floors,
   * the canonical labels each rung was sized for, and the exit token.
   * Failure-message-is-documentation (Mike #38 §4). */
  const fixHint =
    `    → import swapWidthClassOf from @/lib/design/swap-width\n` +
    `      swapWidthClassOf(1) → min-w-[5.5rem]   (rung 1, "Copied")\n` +
    `      swapWidthClassOf(2) → min-w-[6.5rem]   (rung 2, "Copy Link"/"Copied!")\n` +
    `      swapWidthClassOf(3) → min-w-[14rem]    (rung 3, "Share this card")\n` +
    `    → exempt: // ${SWAP_WIDTH_EXEMPT_TOKEN} — <honest reason>`;

  it('no module outside lib/design/swap-width.ts spells any of the three rung literals', () => {
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + formatViolations(violations, fixHint));
  });
});

// ─── Positive tests — the four canonical call-sites adopt the helper ─────

/** The four call-sites that must reach for `swapWidthClassOf(n)`.
 * Mirrors the `caption-metric-adoption` "precedent surfaces" pattern —
 * one row per surface, the rung index pinned per row. */
const SURFACES: ReadonlyArray<readonly [string, 1 | 2 | 3]> = [
  ['components/return/ReturnLetter.tsx', 1],
  ['components/mirror/ShareOverlay.tsx', 2],
  ['components/articles/QuoteKeepsake.tsx', 3],
  ['components/reading/ThreadKeepsake.tsx', 3],
];

/** True iff the surface imports `swapWidthClassOf` from the canonical
 * `@/lib/design/swap-width` path (no relative-path drift). */
function importsHelper(src: string): boolean {
  return /import\s*\{[^}]*swapWidthClassOf[^}]*\}\s*from\s*['"]@\/lib\/design\/swap-width['"]/.test(
    src,
  );
}

/** True iff the surface invokes `swapWidthClassOf(n)` for the expected
 * rung index. Tolerates whitespace inside the call (formatter-proof). */
function invokesHelper(src: string, rung: 1 | 2 | 3): boolean {
  const rx = new RegExp(`swapWidthClassOf\\s*\\(\\s*${rung}\\s*\\)`);
  return rx.test(src);
}

describe('swap-width adoption — the four canonical call-sites import the helper', () => {
  it.each(SURFACES)('%s imports swapWidthClassOf from the canonical path', (path) => {
    const src = readFileSync(join(ROOT, path), 'utf8');
    expect(importsHelper(src)).toBe(true);
  });
});

describe('swap-width adoption — the four canonical call-sites invoke the helper at the expected rung', () => {
  it.each(SURFACES)('%s invokes swapWidthClassOf(%i)', (path, rung) => {
    const src = readFileSync(join(ROOT, path), 'utf8');
    expect(invokesHelper(src, rung)).toBe(true);
  });
});

// ─── Positive test — exempt token is a discoverable string constant ──────

describe('swap-width adoption — exempt token is exported', () => {
  it('the inline-exempt token is a discoverable string constant', () => {
    expect(SWAP_WIDTH_EXEMPT_TOKEN).toBe('swap-width:exempt');
  });
});
