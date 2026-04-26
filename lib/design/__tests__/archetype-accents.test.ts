/**
 * Archetype-accents Manifest Test — pin the design-module that owns the
 * NextRead farewell chip's per-archetype border + text + glyph.
 *
 * `lib/design/archetype-accents.ts` is the single typed home for the
 * five archetype voices the NextRead chip paints. The component now
 * imports from here; this test pins:
 *
 *   1. Every `ArchetypeKey` is a key in every Record (border, text,
 *      labels, glyphs) — compiler-enforced exhaustive maps. Adding a
 *      sixth archetype to `types/content.ts` red-flags this file the
 *      same PR.
 *
 *   2. Every chip border routes through `alphaClassOf` (the JIT-safe
 *      literal factory). The `<family>` slot is in `ALPHA_COLOR_FAMILIES`
 *      — so a future "let's add a `purple` archetype" requires promoting
 *      the family first; the helper round-trip catches the gap.
 *
 *   3. Every chip border sits at the `muted` rung (one register, five
 *      voices — Tanya UX #22 §3.3 #1, atomic fail-path Mike #95).
 *
 *   4. `archetypeAccentClass(undefined)` returns the fallback chrome.
 *      `archetypeLabel(undefined)` returns the empty string (the call
 *      site's `if (label)` gate suppresses the chip — Tanya UX #22 §5 #5).
 *      Fallbacks live INSIDE the helpers — call sites cannot forget them
 *      (Mike #51 §5 #4).
 *
 *   5. Snapshot pin of the full manifest. Two snapshots, one source: the
 *      design module is the system-of-record; the component snapshot
 *      becomes a mirror, not the source.
 *
 * Mirror of `worldview.test.ts`. Five sections, same shape, swap
 * `FilterType` → `ArchetypeKey` and `bg` → `border`.
 *
 * Credits: Mike K. (architect napkin #96 §7 — the test outline above and
 * the "test-the-data-not-the-component" call), Tanya D. (UX spec #22 §3.3
 * — the `muted` rung divergence pin; §3.4 — the glyph layer; §5 — DOD),
 * Elon M. (the `Record<ArchetypeKey, string>` exhaustiveness as the
 * centrality fence).
 */

import {
  ARCHETYPE_ACCENT_BORDER,
  ARCHETYPE_ACCENT_TEXT,
  ARCHETYPE_LABELS,
  ARCHETYPE_GLYPHS,
  ARCHETYPE_FALLBACK_BORDER,
  ARCHETYPE_FALLBACK_TEXT,
  archetypeAccentClass,
  archetypeLabel,
  archetypeAccentGlyph,
  archetypeAccentGlyphClass,
} from '../archetype-accents';
import {
  ALPHA_COLOR_FAMILIES,
  alphaClassOf,
} from '../alpha';
import type { ArchetypeKey } from '@/types/content';

// ─── Tiny pure helpers — ≤ 10 LOC each ─────────────────────────────────────

const ALL_ARCHETYPES: readonly ArchetypeKey[] = [
  'deep-diver', 'explorer', 'faithful', 'resonator', 'collector',
] as const;

/** Pull the `<family>` slot out of a `border-<family>/<pct>` literal. */
function familyOf(borderClass: string): string | null {
  const m = borderClass.match(/\bborder-([a-z]+)\/\d+\b/);
  return m ? m[1] : null;
}

/** Pull the `/<pct>` slot out of a `border-<family>/<pct>` literal. */
function pctOf(borderClass: string): number | null {
  const m = borderClass.match(/\bborder-[a-z]+\/(\d+)\b/);
  return m ? Number(m[1]) : null;
}

// ─── 1 · Exhaustive maps — every ArchetypeKey is keyed everywhere ──────────

describe('archetype manifest — exhaustive over ArchetypeKey', () => {
  it.each(ALL_ARCHETYPES)('ARCHETYPE_ACCENT_BORDER has a class for `%s`', (a) => {
    expect(ARCHETYPE_ACCENT_BORDER[a]).toBeDefined();
    expect(typeof ARCHETYPE_ACCENT_BORDER[a]).toBe('string');
  });

  it.each(ALL_ARCHETYPES)('ARCHETYPE_ACCENT_TEXT has a class for `%s`', (a) => {
    expect(ARCHETYPE_ACCENT_TEXT[a]).toBeDefined();
    expect(typeof ARCHETYPE_ACCENT_TEXT[a]).toBe('string');
  });

  it.each(ALL_ARCHETYPES)('ARCHETYPE_LABELS has a label for `%s`', (a) => {
    expect(ARCHETYPE_LABELS[a]).toBeDefined();
    expect(typeof ARCHETYPE_LABELS[a]).toBe('string');
  });

  it.each(ALL_ARCHETYPES)('ARCHETYPE_GLYPHS has a glyph for `%s`', (a) => {
    expect(ARCHETYPE_GLYPHS[a]).toBeDefined();
    expect(typeof ARCHETYPE_GLYPHS[a]).toBe('string');
    expect(ARCHETYPE_GLYPHS[a].length).toBeGreaterThan(0);
  });

  it('ARCHETYPE_ACCENT_BORDER keys are exactly the five ArchetypeKey values', () => {
    expect(new Set(Object.keys(ARCHETYPE_ACCENT_BORDER)))
      .toEqual(new Set(ALL_ARCHETYPES));
  });

  it('ARCHETYPE_LABELS keys are exactly the five ArchetypeKey values', () => {
    expect(new Set(Object.keys(ARCHETYPE_LABELS)))
      .toEqual(new Set(ALL_ARCHETYPES));
  });

  it('ARCHETYPE_GLYPHS keys are exactly the five ArchetypeKey values', () => {
    expect(new Set(Object.keys(ARCHETYPE_GLYPHS)))
      .toEqual(new Set(ALL_ARCHETYPES));
  });
});

// ─── 2 · Family promotion — every accent family is alpha-promoted ──────────

describe('archetype chip borders — every family is alpha-promoted', () => {
  it.each(ALL_ARCHETYPES)(
    'chip `%s` border family is in ALPHA_COLOR_FAMILIES',
    (a) => {
      const fam = familyOf(ARCHETYPE_ACCENT_BORDER[a]);
      expect(fam).not.toBeNull();
      expect(ALPHA_COLOR_FAMILIES as readonly string[]).toContain(fam!);
    },
  );

  it('the five families used by accents include `secondary` and `amber`', () => {
    const fams = new Set(
      ALL_ARCHETYPES.map((a) => familyOf(ARCHETYPE_ACCENT_BORDER[a]))
        .filter(Boolean) as string[],
    );
    ['secondary', 'amber'].forEach((expected) =>
      expect(fams.has(expected)).toBe(true),
    );
  });

  it('every chip border is byte-identical to alphaClassOf(<family>, "muted", "border")', () => {
    ALL_ARCHETYPES.forEach((a) => {
      const fam = familyOf(ARCHETYPE_ACCENT_BORDER[a]) as
        Parameters<typeof alphaClassOf>[0];
      expect(ARCHETYPE_ACCENT_BORDER[a])
        .toBe(alphaClassOf(fam, 'muted', 'border'));
    });
  });
});

// ─── 3 · One register, five voices — all borders at the muted rung ────────

describe('archetype chip borders — one register at the `muted` rung (/30)', () => {
  it('all five borders carry the /30 percent', () => {
    ALL_ARCHETYPES.forEach((a) =>
      expect(pctOf(ARCHETYPE_ACCENT_BORDER[a])).toBe(30),
    );
  });

  it('the fallback border sits ONE rung lighter (`hairline`, /10) by intent', () => {
    expect(ARCHETYPE_FALLBACK_BORDER).toBe(alphaClassOf('fog', 'hairline', 'border'));
    expect(pctOf(ARCHETYPE_FALLBACK_BORDER)).toBe(10);
  });

  it('no chip border drifts to a non-ledger percent', () => {
    ALL_ARCHETYPES.forEach((a) => {
      const p = pctOf(ARCHETYPE_ACCENT_BORDER[a]) as number;
      expect([10, 30, 50, 70]).toContain(p);
    });
  });
});

// ─── 4 · Helpers — fallback baked in (one less footgun) ───────────────────

describe('archetypeAccentClass — fallback lives inside the helper', () => {
  it('returns the fallback for undefined input', () => {
    expect(archetypeAccentClass(undefined))
      .toBe(`${ARCHETYPE_FALLBACK_BORDER} ${ARCHETYPE_FALLBACK_TEXT}`);
  });

  it('returns the fallback for null input', () => {
    expect(archetypeAccentClass(null))
      .toBe(`${ARCHETYPE_FALLBACK_BORDER} ${ARCHETYPE_FALLBACK_TEXT}`);
  });

  it.each(ALL_ARCHETYPES)('returns "<border> <text>" for archetype `%s`', (a) => {
    expect(archetypeAccentClass(a))
      .toBe(`${ARCHETYPE_ACCENT_BORDER[a]} ${ARCHETYPE_ACCENT_TEXT[a]}`);
  });
});

describe('archetypeLabel — silent fallback (Tanya §5 #5)', () => {
  it('returns the empty string for undefined input', () => {
    expect(archetypeLabel(undefined)).toBe('');
  });

  it('returns the empty string for null input', () => {
    expect(archetypeLabel(null)).toBe('');
  });

  it.each(ALL_ARCHETYPES)('returns the capitalized label for archetype `%s`', (a) => {
    expect(archetypeLabel(a)).toBe(ARCHETYPE_LABELS[a]);
  });

  it('every label starts with an uppercase letter (no raw lowercase keys)', () => {
    ALL_ARCHETYPES.forEach((a) => {
      expect(ARCHETYPE_LABELS[a][0]).toMatch(/[A-Z]/);
    });
  });
});

describe('archetypeAccentGlyph — fallback dot when undefined', () => {
  it('returns the centered dot for undefined input', () => {
    expect(archetypeAccentGlyph(undefined)).toBe('·');
  });

  it('returns the centered dot for null input', () => {
    expect(archetypeAccentGlyph(null)).toBe('·');
  });

  it.each(ALL_ARCHETYPES)('returns the per-archetype glyph for `%s`', (a) => {
    expect(archetypeAccentGlyph(a)).toBe(ARCHETYPE_GLYPHS[a]);
  });
});

// ─── 4b · Glyph optical compensation (Tanya UX #22 §7) ────────────────────

describe('archetypeAccentGlyphClass — per-glyph optical lift, JIT-safe literal', () => {
  it('deep-diver earns the `◉` filled-glyph 0.5px lift', () => {
    const cls = archetypeAccentGlyphClass('deep-diver');
    expect(cls).toContain('mr-sys-1');
    expect(cls).toContain('relative');
    expect(cls).toContain('-top-[0.5px]');
  });

  it('collector earns the `❒` filled-glyph 0.5px lift', () => {
    const cls = archetypeAccentGlyphClass('collector');
    expect(cls).toContain('mr-sys-1');
    expect(cls).toContain('relative');
    expect(cls).toContain('-top-[0.5px]');
  });

  it.each(['explorer', 'faithful', 'resonator'] as const)(
    '%s carries no optical nudge (line-only or directional glyph)',
    (a) => {
      expect(archetypeAccentGlyphClass(a)).toBe('mr-sys-1');
    },
  );

  it('undefined falls back to the bare base spacing (fallback dot)', () => {
    expect(archetypeAccentGlyphClass(undefined)).toBe('mr-sys-1');
  });

  it('null falls back to the bare base spacing (fallback dot)', () => {
    expect(archetypeAccentGlyphClass(null)).toBe('mr-sys-1');
  });
});

// ─── 5 · Snapshot pin — the manifest as the system-of-record ──────────────

describe('archetype manifest — snapshot pin (any change is a deliberate review)', () => {
  it('ARCHETYPE_ACCENT_BORDER shape is byte-pinned', () => {
    expect(ARCHETYPE_ACCENT_BORDER).toMatchSnapshot();
  });

  it('ARCHETYPE_ACCENT_TEXT shape is byte-pinned', () => {
    expect(ARCHETYPE_ACCENT_TEXT).toMatchSnapshot();
  });

  it('ARCHETYPE_LABELS shape is byte-pinned', () => {
    expect(ARCHETYPE_LABELS).toMatchSnapshot();
  });

  it('ARCHETYPE_GLYPHS shape is byte-pinned', () => {
    expect(ARCHETYPE_GLYPHS).toMatchSnapshot();
  });
});
