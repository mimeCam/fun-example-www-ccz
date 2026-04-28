/**
 * Chrome Color-Mix Banned — `color-mix(...)` literals MUST NOT appear
 * inside any source file under `components/**`. The alpha ledger owns
 * translucent paint via `alphaClassOf(family, rung, kind)` (e.g.
 * `text-mist/30`); the elevation/halo ledger owns shadow alpha via
 * `chromeMutedBorder()` and `cssVarOf('float')`. Reaching for a raw
 * `color-mix(...)` substring means *bypassing both* — a vocabulary drift
 * landing OFF the four-rung ledger (`hairline / muted / recede / quiet`)
 * with no compile-time witness that anyone noticed.
 *
 * The shape we close (Mike napkin #39 §1, Tanya UX #88 §2): the
 * `WhisperFooter` middle-dot floor at `var(--mist) 35%` — `/35` is OFF
 * the alpha ledger (legal rungs: `/10 /30 /50 /70`). The dot is now
 * snapped to the `muted` rung (mist/30) via `alphaClassOf`. This fence
 * keeps it that way and bans the same drift from any future sibling.
 *
 * Allow-list shape (rule-of-three not yet hit):
 *   • `components/resonances/SelectionPopoverTrigger.tsx` — accent halo
 *     `box-shadow` value `'0 0 12px color-mix(in srgb, var(--token-
 *     accent) 20%, transparent)'`. This is a **shadow-alpha lever**, not
 *     a **color/text-alpha lever**. Different ledger (Elevation/Halo,
 *     §3.1 thermal-aware popover float), different rule. When a third
 *     sibling appears, the rule-of-three fires and the right move is
 *     extracting `chromeHaloShadow(rung)` into `lib/design/elevation.ts`
 *     (or `chrome-paint.ts`) — at which point this allow-list shrinks
 *     to empty. Until then the carve-out is named, not invisible.
 *
 * Pure source-string lint. No DOM, no React render. Walks
 * `components/**` with the canonical `_fence.ts` kernel; one line-pattern
 * probe with one allow-list path. Each helper ≤ 10 LoC.
 *
 * Out-of-scope by design:
 *   • `lib/**` — the design-system kernel. CSS-canonical surfaces (e.g.
 *     `app/globals.css`) and ledger source modules legitimately author
 *     `color-mix(...)` for token plumbing; scoping the fence to
 *     `components/**` matches the napkin (§5 "Scope: 1 feature — close
 *     the alpha-ledger fence on `components/**`.").
 *   • `app/**` — different concern (route-level paint), not on the
 *     drift-sweep frontier this sprint.
 *   • Test files (`*.test.ts(x)` and `__tests__/`) — `_fence.ts`
 *     `isScannableFile` already excludes them; the fence's own test
 *     copy of the literal is in commentary, never in code.
 *
 * Credits: Mike K. (#39 napkin — fence shape, 1-path allow-list,
 * "compounding asset is the fence", rule-of-three for the halo sibling),
 * Tanya D. (UX spec #88 §2 — the snap to the `muted` rung; §6
 * acceptance criteria the fence enforces forever after), Krystle C.
 * (the surgical snap-target the napkin endorses verbatim), Paul K.
 * (the "the lint test enforces forever" discipline this fence joins),
 * Elon M. (the "skip the doctrine, ship the fence" verdict), Sid (the
 * ≤ 10 LoC per helper rhythm; lifted onto the canonical `_fence.ts`
 * kernel — one walker, one strip pass, one allow-list shape).
 */

import {
  runLinePatterns,
  formatViolations,
  type FenceDecl,
  type Violation,
} from './_fence';

/** Directories whose source MUST NOT spell `color-mix(...)` outside the carve-out. */
const SCAN_DIRS: readonly string[] = ['components'];

/**
 * Path-allow-list — one entry, named explicitly. Sibling halos route here
 * until the rule-of-three fires; at which point `chromeHaloShadow(rung)`
 * extracts to `lib/design/` and this list shrinks to empty.
 */
const ALLOW: readonly string[] = [
  'components/resonances/SelectionPopoverTrigger.tsx',
] as const;
const ALLOW_SET: ReadonlySet<string> = new Set<string>(ALLOW);

/** The trigger — any `color-mix(` literal substring, anywhere on a code line. */
const COLOR_MIX_RX = /color-mix\(/;

/** Per-line exempt token — `// alpha-ledger:exempt — <reason>` honors mid-file carve-outs. */
const EXEMPT_TOKEN = 'alpha-ledger:exempt';

/** Fence declaration — one line-pattern probe, scoped to `components/**`. */
const FENCE: FenceDecl = {
  scanDirs: SCAN_DIRS,
  patterns: [
    { regex: COLOR_MIX_RX, allow: ALLOW_SET, kind: 'color-mix' },
  ],
  exemptToken: EXEMPT_TOKEN,
};

/** Pure: collect every `color-mix(` violation under `components/**`. */
function findAllViolations(): readonly Violation[] {
  return runLinePatterns(FENCE);
}

/** The fix hint the failure prints below each offending line. */
const FIX_HINT =
  '    → use alphaClassOf(family, rung, kind) for color/text/border/bg alpha\n' +
  '      (lib/design/alpha.ts), or cssVarOf() / chromeMutedBorder() for\n' +
  '      elevation-owned shadow alpha (lib/design/elevation.ts,\n' +
  '      lib/design/chrome-paint.ts). Off-ledger /N → snap to /10 /30 /50 /70.';

// ─── Tests — the whole point ───────────────────────────────────────────────

describe('chrome-color-mix-banned fence — components/** rides the alpha ledger', () => {
  const violations = findAllViolations();

  it('no `color-mix(` literal under components/** outside the named allow-list', () => {
    expect(violations.map((v) => v.file)).toEqual([]);
    if (violations.length > 0) {
      throw new Error('\n' + formatViolations(violations, FIX_HINT));
    }
  });

  it('the carve-out allow-list contains exactly one path (the halo sibling)', () => {
    // If a third instance appears, the rule-of-three fires — extract a
    // shared `chromeHaloShadow(rung)` helper, then shrink this list.
    expect(ALLOW.length).toBe(1);
    expect(ALLOW[0]).toBe('components/resonances/SelectionPopoverTrigger.tsx');
  });
});

// ─── Self-tests for the kernel under known shapes ─────────────────────────

describe('chrome-color-mix-banned fence — probe + allow-list under known shapes', () => {
  it('COLOR_MIX_RX matches a typical text-color use', () => {
    expect(COLOR_MIX_RX.test('color: color-mix(in srgb, var(--mist) 30%, transparent)')).toBe(true);
  });

  it('COLOR_MIX_RX matches a typical box-shadow use (the halo carve-out shape)', () => {
    expect(COLOR_MIX_RX.test("'0 0 12px color-mix(in srgb, var(--token-accent) 20%, transparent)'")).toBe(true);
  });

  it('COLOR_MIX_RX does NOT match unrelated code', () => {
    expect(COLOR_MIX_RX.test('const colorMix = 42')).toBe(false);
    expect(COLOR_MIX_RX.test('text-mist/30')).toBe(false);
  });

  it('the allow-list is preserved as a single, named carve-out', () => {
    expect(ALLOW_SET.size).toBe(1);
    expect(ALLOW_SET.has('components/resonances/SelectionPopoverTrigger.tsx')).toBe(true);
  });

  it('the exempt-token vocabulary mirrors the alpha ledger', () => {
    expect(EXEMPT_TOKEN).toBe('alpha-ledger:exempt');
  });
});

// ─── Positive smoke — the fix this fence enforces is in place ──────────────

describe('chrome-color-mix-banned fence — the surface the fence was born for', () => {
  it('WhisperFooter.tsx contains no `color-mix(` substring (snap landed)', () => {
    const hits = findAllViolations().filter(
      (v) => v.file === 'components/shared/WhisperFooter.tsx',
    );
    expect(hits).toEqual([]);
  });
});
