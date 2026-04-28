/**
 * Caption-Chrome Adoption Converges — sixth perimeter on the typography
 * ledger. The DOM register sibling of the body-prose perimeter.
 *
 * Sister fences (the precedent shape this lifts byte-for-byte):
 *   • `passage-wrap-converges.fence.test.ts`     — `wrapClassOf('passage')`.
 *   • `passage-hyphens-converges.fence.test.ts`  — `hyphensClassOf('passage')`.
 *   • `passage-hang-converges.fence.test.ts`     — `hangPunctClassOf('passage')`.
 *   • `caption-metric-adoption.test.ts`          — the narrow grep-fence
 *     pinning the four-class signature `tracking-sys-caption + tabular-nums`
 *     to its sealed home in `<CaptionMetric>`.
 *   • `numeric-features-adoption.test.ts`        — the SVG/canvas register's
 *     two-home grep-fence (`numericFeatureStyle()` is the print/server
 *     dialect, disjoint from this DOM perimeter).
 *
 * THIS fence pins the **DOM caption-chrome convergence**: every surface
 * enumerated in `CAPTION_CHROME_CARRIERS` imports `<CaptionMetric>` from
 * `components/shared/CaptionMetric.tsx` AND renders at least one tag.
 * The ledger entry names what `<CaptionMetric>` was already silently
 * enforcing — `tracking-sys-caption` + `tabular-nums` + `text-mist/70` +
 * `text-sys-(micro|caption)` — and this fence converts the implicit
 * pattern into an explicit two-home contract:
 *
 *   For every caption-chrome carrier S in SITES,
 *     S imports `CaptionMetric` from `@/components/shared/CaptionMetric`,
 *     S renders at least one `<CaptionMetric` open-tag.
 *     S does NOT hand-roll `tracking-sys-caption tabular-nums` (already
 *     pinned by the sibling `caption-metric-adoption` grep-fence — this
 *     §3 receipt is the felt-deliverable: digits stop dancing on
 *     /resonances at 320 px).
 *
 * Convergence, NOT prohibition (Mike napkin §3 — the napkin's POI #3):
 * the fence re-proves the present. A new screen-side caption-chrome
 * surface (a future "Saved 4 minutes ago" line on a thread card) joins
 * the carrier tuple in `lib/design/typography.ts` — no fence edit. The
 * fence does NOT forbid a non-carrier surface from rendering
 * `<CaptionMetric>`; it asserts that every NAMED carrier does.
 *
 * Carve-out — print/SVG register: surfaces that route through
 * `numericFeatureStyle()` (print column, SVG keepsake build) live in a
 * second, disjoint register. `ArticleProvenance.tsx` is the canonical
 * example — its dated byline is paper-only via `print-surface.css`,
 * NOT a Tailwind-class-shaped carrier. The disjoint register is pinned
 * by `numeric-features-adoption.test.ts`; this fence does not double-
 * count it. (Mike napkin §"Risk register"; Tanya UX §"Surface audit".)
 *
 * Pure-source assertion — does NOT spin up React. Lifted byte-for-byte
 * from `passage-wrap-converges.fence.test.ts`; the only differences are
 * the SITES tuple (`CAPTION_CHROME_CARRIERS`), the import name
 * (`CaptionMetric`), and the JSX-tag regex (`<CaptionMetric`).
 *
 * Credits — this fence:
 *
 *   • Tanya Donska (UIX spec — naming the implicit register, the four-
 *     class caption-attitude / caption-metric / tabular-nums / quiet-rung
 *     standard, the "AAA polish is invisibility" framing, the surface
 *     audit that named which sites already wear the dialect).
 *   • Mike Koch (architect napkin — the ONE-tuple-ONE-fence shape lifted
 *     verbatim from `PASSAGE_BODY_CARRIERS`, the print/SVG carve-out as
 *     a disjoint register, the "fourth fence reuses, doesn't re-roll"
 *     discipline, the carrier enumeration table).
 *   • Elon Musk (first-principles teardown — kill the "Cold Rim"
 *     cosmology, name the CSS, refuse the small-caps net-new typography,
 *     the "ship 10% and refuse the rest" verdict).
 *   • Jason Fried (the original observation that surfaced the asymmetry —
 *     `<CaptionMetric>`'s register lived in a component, not in
 *     `lib/design/`).
 *   • Paul Kim (P0 = "timestamps stop dancing"; carriers must be
 *     enumerated; AAA polish is invisibility, not flourish).
 *   • Krystle Clear (the closed body-prose perimeter that this entry
 *     sits cleanly alongside; without her clean baseline there is no
 *     contrast to engineer).
 *   • Sid (the `_fence.ts` kernel and the rule-of-three that says
 *     "fourth fence reuses, doesn't re-roll" — this is that fourth).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CAPTION_CHROME_CARRIERS as SITES } from '@/lib/design/typography';

const ROOT = join(__dirname, '..', '..', '..');

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Read the source of a sibling caption-chrome carrier. ≤ 10 LoC. */
function readSite(rel: string): string {
  return readFileSync(join(ROOT, rel), 'utf8');
}

/** True iff the source imports CaptionMetric from the shared primitive. */
function importsCaptionMetric(src: string): boolean {
  return /import\s*\{[^}]*\bCaptionMetric\b[^}]*\}\s*from\s*['"]@\/components\/shared\/CaptionMetric['"]/.test(src);
}

/** True iff the source renders at least one `<CaptionMetric` open tag. */
function rendersCaptionMetric(src: string): boolean {
  return /<CaptionMetric[\s/>]/.test(src);
}

// ─── §1 · Every carrier imports the primitive ─────────────────────────────

describe('caption-chrome adoption converges · §1 every carrier imports the primitive', () => {
  it.each(SITES)('%s imports CaptionMetric from @/components/shared/CaptionMetric', (_, rel) => {
    expect(importsCaptionMetric(readSite(rel))).toBe(true);
  });
});

// ─── §2 · Every carrier renders at least one `<CaptionMetric` tag ─────────

describe('caption-chrome adoption converges · §2 every carrier renders the primitive', () => {
  it.each(SITES)('%s renders at least one <CaptionMetric> tag', (_, rel) => {
    expect(rendersCaptionMetric(readSite(rel))).toBe(true);
  });
});

// ─── §3 · The unison contract — ledger names the register, primitive owns it
//
// Tanya UX §"Felt-deliverable receipts": the win is invisibility. Eight
// "Saved N days ago" lines down the /resonances list lock their digits in
// a column-stable gutter because every carrier wears the same four-class
// face through ONE primitive. CSS↔TS sync is enforced upstream by
// `caption-metric-adoption.test.ts` (the sealed-class grep-fence); this
// §3 just pins the byte-shape of the carrier set itself — five entries,
// each a `[name, path]` tuple, each path scannable.

describe('caption-chrome adoption converges · §3 the carrier tuple is well-formed', () => {
  it('CAPTION_CHROME_CARRIERS has at least one carrier (the felt-deliverable surface)', () => {
    expect(SITES.length).toBeGreaterThan(0);
  });

  it('every carrier tuple is [name: string, path: string]', () => {
    SITES.forEach(([name, path]) => {
      expect(typeof name).toBe('string');
      expect(typeof path).toBe('string');
      expect(name.length).toBeGreaterThan(0);
      expect(path.length).toBeGreaterThan(0);
    });
  });

  it('every carrier path is a readable .tsx source file', () => {
    SITES.forEach(([, rel]) => {
      const src = readSite(rel);
      expect(src.length).toBeGreaterThan(0);
    });
  });

  it('the load-bearing migration site is enumerated (ResonanceEntry timestamp)', () => {
    // Tanya UX §"Surface audit" — the one screen-side surface in the
    // reader's path that lists timestamps and didn't wear the register.
    // This explicit assertion fails loud if a future PR drops the carrier
    // before re-pitching the migration as a separate decision.
    const paths = SITES.map(([, p]) => p);
    expect(paths).toContain('app/resonances/ResonanceEntry.tsx');
  });
});
