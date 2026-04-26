/**
 * Caption-Metric Adoption Test — the standard-face grep-fence.
 *
 * Every metric-looking caption surface (Mirror MetaLine, hero reading-time,
 * Explore card duration, print read-progress) wears the same dialect,
 * owned by `components/shared/CaptionMetric.tsx`:
 *
 *   • `tracking-sys-caption`   — caption-attitude letter-spacing
 *   • `tabular-nums`            — digit-column lock; "5" → "12" no waltz
 *   • `text-mist/70`            — alpha-ledger `quiet` rung
 *   • `text-sys-(micro|caption)` — whisper register
 *
 * **The narrow fence** (Mike #38 §4 — the smaller the fence, the louder it
 * speaks): flag any line outside the primitive that hand-rolls the
 * standard face — namely, carries BOTH `tracking-sys-caption` AND
 * `tabular-nums` in the same className. That tuple is the primitive's
 * unique signature; the kernel models it via `{ regex, co }`.
 *
 * The honest exit is `<CaptionMetric>` from `components/shared/`. For
 * intentional bypasses tag the line with `// caption-metric:exempt — <reason>`.
 *
 * The walker, comment-stripper, exempt-token check and per-pattern
 * collector live one floor down in `_adoption-fence.ts` (rule-of-three;
 * precedents: `lib/design/hue.ts`, `lib/design/hue-distance.ts`).
 *
 * Credits: Mike K. (#38 §4 + #48 — adoption-guard spec, kernel-lift
 * napkin), Tanya D. (UIX — the four-class standard face every metric
 * surface must wear), Paul K. (KPI / guard-first ordering), Elon M.
 * (pair-rule discipline; primitive + adoption test + migration in one PR).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runFence, formatViolations, type FenceDecl } from './_adoption-fence';

const ROOT = join(__dirname, '..', '..', '..');

/** Inline token a caller writes when intentionally bypassing the fence. */
export const CAPTION_METRIC_EXEMPT_TOKEN = 'caption-metric:exempt';

/** Files that legitimately own the standard-face vocabulary (the
 * primitive itself, its test, this fence). */
const ALLOW: ReadonlySet<string> = new Set([
  'components/shared/CaptionMetric.tsx',
  'components/shared/__tests__/CaptionMetric.test.ts',
  'lib/design/__tests__/caption-metric-adoption.test.ts',
]);

/** The two tokens whose co-occurrence on a line IS the primitive's
 * signature. The kernel fires only when both regexes match the same
 * code line; word-boundary lookarounds prevent partial-token matches. */
const TABULAR_RX = /(?<![\w-])tabular-nums(?![\w-])/;
const TRACKING_RX = /(?<![\w-])tracking-sys-caption(?![\w-])/;

const FENCE: FenceDecl = {
  scanDirs: ['components', 'lib/utils', 'lib/hooks', 'lib/sharing', 'app'],
  patterns: [{ regex: TABULAR_RX, co: TRACKING_RX, allow: ALLOW }],
  exemptToken: CAPTION_METRIC_EXEMPT_TOKEN,
};

// ─── Tests — the grep-fence ──────────────────────────────────────────────

describe('caption-metric adoption — every hand-rolled metric face routes through the primitive', () => {
  const violations = runFence(FENCE);

  /** Human-readable fix hint — names the primitive and the exit. */
  const fixHint =
    `    → use <CaptionMetric> from components/shared/CaptionMetric.tsx,\n` +
    `      OR mark the line with  // ${CAPTION_METRIC_EXEMPT_TOKEN} — <honest reason>`;

  it('no line outside CaptionMetric carries both tracking-sys-caption AND tabular-nums', () => {
    expect(violations.map((v) => `${v.file}:${v.line}`)).toEqual([]);
    if (violations.length > 0) throw new Error('\n' + formatViolations(violations, fixHint));
  });
});

// ─── Positive tests — the primitive owns the standard ────────────────────

describe('caption-metric adoption — the primitive carries the four classes', () => {
  const src = readFileSync(join(ROOT, 'components/shared/CaptionMetric.tsx'), 'utf8');

  it('CaptionMetric.tsx contains tracking-sys-caption', () => {
    expect(src).toContain('tracking-sys-caption');
  });

  it('CaptionMetric.tsx contains tabular-nums', () => {
    expect(src).toContain('tabular-nums');
  });

  it('CaptionMetric.tsx routes alpha through alphaClassOf (mist, quiet)', () => {
    expect(src).toContain("alphaClassOf('mist', 'quiet'");
  });

  it('CaptionMetric.tsx maps both micro + caption sizes', () => {
    expect(src).toContain('text-sys-micro');
    expect(src).toContain('text-sys-caption');
  });
});

// ─── Positive tests — primitive is adopted by the precedent surfaces ─────

describe('caption-metric adoption — the precedent surfaces use the primitive', () => {
  const SURFACES: readonly string[] = [
    'app/mirror/page.tsx',
    'components/home/PortalHero.tsx',
    'components/explore/ExploreArticleCard.tsx',
    'components/reading/ReadProgressCaption.tsx',
  ];

  const importsPrimitive = (src: string): boolean =>
    /from\s+['"]@\/components\/shared\/CaptionMetric['"]/.test(src);

  const rendersPrimitive = (src: string): boolean => /<CaptionMetric[\s>]/.test(src);

  it('every precedent surface imports AND renders <CaptionMetric>', () => {
    SURFACES.forEach((p) => {
      const src = readFileSync(join(ROOT, p), 'utf8');
      expect(importsPrimitive(src)).toBe(true);
      expect(rendersPrimitive(src)).toBe(true);
    });
  });
});

// ─── Positive test — exempt token is a discoverable string constant ──────

describe('caption-metric adoption — exempt token is exported', () => {
  it('the inline-exempt token is a discoverable string constant', () => {
    expect(CAPTION_METRIC_EXEMPT_TOKEN).toBe('caption-metric:exempt');
  });
});
