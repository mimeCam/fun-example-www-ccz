/**
 * Worldview Manifest Test — pin the design-module that owns the chip map.
 *
 * `lib/design/worldview.ts` is the single typed home for the four worldview
 * voices the Explore card paints. The card now imports from here; this test
 * pins:
 *
 *   1. Every `FilterType` is a key in `WORLDVIEW_COLORS` and
 *      `WORLDVIEW_CHIP_LABELS` — compiler-enforced exhaustive map. Adding a
 *      5th worldview to `types/filter.ts` red-flags this file the same PR.
 *
 *   2. Every chip background routes through `alphaClassOf` (the JIT-safe
 *      literal factory). The `<family>` slot is in `ALPHA_COLOR_FAMILIES`
 *      — so a future "let's add a `purple` worldview" requires promoting
 *      the family first; the helper round-trip catches the gap.
 *
 *   3. Every chip background sits at the `muted` rung (one register, four
 *      voices — Tanya UX #58 §6).
 *
 *   4. `worldviewChipClass(undefined)` returns the fallback chrome.
 *      `worldviewChipLabel(undefined)` returns an em-dash. Fallbacks live
 *      INSIDE the helpers — call sites cannot forget them (Mike #51 §5 #4).
 *
 *   5. Snapshot pin of the full manifest — mirrors the existing snapshot in
 *      `components/explore/__tests__/ExploreArticleCard.alpha.test.ts.snap`.
 *      Two snapshots, one source: the design module is the system-of-record;
 *      the component snapshot becomes a mirror, not the source.
 *
 * Credits: Mike K. (architect napkin #51 §3 — the test outline above and the
 * "test-the-data-not-the-component" call), Tanya D. (UX spec #58 §3.3 — the
 * `WORLDVIEW_CHIP_LABELS` upgrade pin; §7 DOD), Elon M. (the `Record<
 * FilterType,string>` exhaustiveness as the centrality fence).
 */

import {
  WORLDVIEW_COLORS,
  WORLDVIEW_CHIP_LABELS,
  WORLDVIEW_FALLBACK_BG,
  worldviewChipClass,
  worldviewChipLabel,
} from '../worldview';
import {
  ALPHA_COLOR_FAMILIES,
  alphaClassOf,
} from '../alpha';
import type { FilterType } from '@/types/filter';

// ─── Tiny pure helpers — ≤ 10 LOC each ─────────────────────────────────────

const ALL_WORLDVIEWS: readonly FilterType[] = [
  'technical', 'philosophical', 'practical', 'contrarian',
] as const;

/** Pull the `<family>` slot out of a `bg-<family>/<pct>` literal. */
function familyOf(bgClass: string): string | null {
  const m = bgClass.match(/\bbg-([a-z]+)\/\d+\b/);
  return m ? m[1] : null;
}

/** Pull the `/<pct>` slot out of a `bg-<family>/<pct>` literal. */
function pctOf(bgClass: string): number | null {
  const m = bgClass.match(/\bbg-[a-z]+\/(\d+)\b/);
  return m ? Number(m[1]) : null;
}

// ─── 1 · Exhaustive map — every FilterType has a chip class + label ────────

describe('worldview manifest — exhaustive over FilterType', () => {
  it.each(ALL_WORLDVIEWS)('WORLDVIEW_COLORS has a class for `%s`', (w) => {
    expect(WORLDVIEW_COLORS[w]).toBeDefined();
    expect(typeof WORLDVIEW_COLORS[w]).toBe('string');
  });

  it.each(ALL_WORLDVIEWS)('WORLDVIEW_CHIP_LABELS has a label for `%s`', (w) => {
    expect(WORLDVIEW_CHIP_LABELS[w]).toBeDefined();
    expect(typeof WORLDVIEW_CHIP_LABELS[w]).toBe('string');
  });

  it('WORLDVIEW_COLORS keys are exactly the four FilterType values', () => {
    expect(new Set(Object.keys(WORLDVIEW_COLORS))).toEqual(new Set(ALL_WORLDVIEWS));
  });

  it('WORLDVIEW_CHIP_LABELS keys are exactly the four FilterType values', () => {
    expect(new Set(Object.keys(WORLDVIEW_CHIP_LABELS))).toEqual(new Set(ALL_WORLDVIEWS));
  });
});

// ─── 2 · Family promotion — every chip family is in ALPHA_COLOR_FAMILIES ──

describe('worldview chip backgrounds — every family is alpha-promoted', () => {
  it.each(ALL_WORLDVIEWS)('chip `%s` background family is in ALPHA_COLOR_FAMILIES', (w) => {
    const fam = familyOf(WORLDVIEW_COLORS[w]);
    expect(fam).not.toBeNull();
    expect(ALPHA_COLOR_FAMILIES as readonly string[]).toContain(fam!);
  });

  it('the four families used by chips include `primary`, `cyan`, `rose`', () => {
    const fams = new Set(
      ALL_WORLDVIEWS.map((w) => familyOf(WORLDVIEW_COLORS[w])).filter(Boolean) as string[],
    );
    ['primary', 'cyan', 'rose'].forEach((expected) => expect(fams.has(expected)).toBe(true));
  });

  it('every chip background is byte-identical to alphaClassOf(<family>, "muted", "bg")', () => {
    ALL_WORLDVIEWS.forEach((w) => {
      const fam = familyOf(WORLDVIEW_COLORS[w]) as Parameters<typeof alphaClassOf>[0];
      const bgFromHelper = alphaClassOf(fam, 'muted', 'bg');
      expect(WORLDVIEW_COLORS[w]).toContain(bgFromHelper);
    });
  });
});

// ─── 3 · One register, four voices — all backgrounds at the muted rung ───

describe('worldview chip backgrounds — one register at the `muted` rung (/30)', () => {
  it('all four backgrounds carry the /30 percent', () => {
    ALL_WORLDVIEWS.forEach((w) => expect(pctOf(WORLDVIEW_COLORS[w])).toBe(30));
  });

  it('the fallback background also sits at the `muted` rung', () => {
    expect(WORLDVIEW_FALLBACK_BG).toBe(alphaClassOf('fog', 'muted', 'bg'));
    expect(pctOf(WORLDVIEW_FALLBACK_BG)).toBe(30);
  });

  it('no chip background drifts to a non-ledger percent', () => {
    ALL_WORLDVIEWS.forEach((w) => {
      const p = pctOf(WORLDVIEW_COLORS[w]) as number;
      expect([10, 30, 50, 70]).toContain(p);
    });
  });
});

// ─── 4 · Helpers — fallback baked in (one less footgun) ───────────────────

describe('worldviewChipClass — fallback lives inside the helper', () => {
  it('returns the fallback for undefined input', () => {
    expect(worldviewChipClass(undefined)).toBe(`${WORLDVIEW_FALLBACK_BG} text-mist`);
  });

  it.each(ALL_WORLDVIEWS)('returns the chip-class for worldview `%s`', (w) => {
    expect(worldviewChipClass(w)).toBe(WORLDVIEW_COLORS[w]);
  });
});

describe('worldviewChipLabel — fallback lives inside the helper', () => {
  it('returns an em-dash for undefined input', () => {
    expect(worldviewChipLabel(undefined)).toBe('—');
  });

  it.each(ALL_WORLDVIEWS)('returns the capitalized label for worldview `%s`', (w) => {
    expect(worldviewChipLabel(w)).toBe(WORLDVIEW_CHIP_LABELS[w]);
  });

  it('every label starts with an uppercase letter (no raw lowercase keys)', () => {
    ALL_WORLDVIEWS.forEach((w) => {
      expect(WORLDVIEW_CHIP_LABELS[w][0]).toMatch(/[A-Z]/);
    });
  });
});

// ─── 5 · Snapshot pin — the manifest as the system-of-record ──────────────

describe('worldview manifest — snapshot pin (any change is a deliberate review)', () => {
  it('WORLDVIEW_COLORS shape is byte-pinned', () => {
    expect(WORLDVIEW_COLORS).toMatchSnapshot();
  });

  it('WORLDVIEW_CHIP_LABELS shape is byte-pinned', () => {
    expect(WORLDVIEW_CHIP_LABELS).toMatchSnapshot();
  });
});
