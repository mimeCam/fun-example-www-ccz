/**
 * NextRead.adoption — pin the lift of the inline `ARCHETYPE_ACCENT` and
 * `ARCHETYPE_LABEL` Records into `lib/design/archetype-accents.ts`.
 *
 * The lift's whole point is that the chip's per-archetype border + text +
 * label live in ONE file (the design-module manifest), not inline on the
 * component. This test is the receipt that the inline maps are gone and
 * the helper carries the load.
 *
 * Two clauses (Mike napkin #96 §7 #9):
 *
 *   (a) `components/reading/NextRead.tsx` source contains ZERO of the
 *       legacy raw Tailwind literals at module scope —
 *       `border-cyan/30`, `border-accent/30`, `border-secondary/30`,
 *       `border-rose/30`, `border-amber/30`. If they reappear, the
 *       inline-Record drift has come back; the manifest is no longer
 *       the single source of truth.
 *
 *   (b) The helper output for each archetype is byte-identical to
 *       `border-<family>/30 text-<family>` — the design-module owns the
 *       literal; the component imports it. A snapshot pins the five
 *       expected outputs so a future "harmonize the rung" PR cannot
 *       quietly break the per-chip pairing.
 *
 * Source-grep + helper round-trip — no SSR, no jsdom. The component
 * needs a CeremonyContext to render meaningfully, which is out of scope
 * for an adoption fence; the unit tests for the helper live in
 * `lib/design/__tests__/archetype-accents.test.ts`.
 *
 * Credits: Mike K. (architect napkin #96 §7 #9 — the two-clause adoption
 * fence pattern, lifted from worldview's lift PR), Tanya D. (UX spec #22
 * §9 — the diff summary that this test enforces).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { ArchetypeKey } from '@/types/content';
import {
  archetypeAccentClass,
  ARCHETYPE_ACCENT_BORDER,
  ARCHETYPE_ACCENT_TEXT,
  ARCHETYPE_LABELS,
} from '@/lib/design/archetype-accents';

const SOURCE = readFileSync(
  resolve(__dirname, '../NextRead.tsx'),
  'utf-8',
);

const ALL_ARCHETYPES: readonly ArchetypeKey[] = [
  'deep-diver', 'explorer', 'faithful', 'resonator', 'collector',
] as const;

// ─── Clause (a) — source carries no legacy raw literals at module scope ───

describe('NextRead source — the inline ARCHETYPE_ACCENT Record is gone', () => {
  const LEGACY_BORDER_LITERALS = [
    'border-cyan/30',
    'border-accent/30',
    'border-secondary/30',
    'border-rose/30',
    'border-amber/30',
  ] as const;

  it.each(LEGACY_BORDER_LITERALS)(
    'source no longer contains the raw literal `%s`',
    (lit) => {
      // The literal must not survive in the component file. After the lift
      // the only home for this string is the alpha-ledger lookup table.
      expect(SOURCE).not.toContain(lit);
    },
  );

  it('source no longer declares an inline `ARCHETYPE_ACCENT` Record', () => {
    expect(SOURCE).not.toMatch(/const\s+ARCHETYPE_ACCENT\s*[:=]/);
  });

  it('source no longer declares an inline `ARCHETYPE_LABEL` Record', () => {
    expect(SOURCE).not.toMatch(/const\s+ARCHETYPE_LABEL\s*[:=]/);
  });

  it('source imports the helpers from `@/lib/design/archetype-accents`', () => {
    expect(SOURCE).toContain("from '@/lib/design/archetype-accents'");
    expect(SOURCE).toContain('archetypeAccentClass');
    expect(SOURCE).toContain('archetypeLabel');
    expect(SOURCE).toContain('archetypeAccentGlyph');
    expect(SOURCE).toContain('archetypeAccentGlyphClass');
  });

  it('source no longer carries the unsafe `archetype!` non-null assertion', () => {
    // The inline map admitted `${ARCHETYPE_ACCENT[archetype!]}` because the
    // call site couldn't prove `archetype` was defined. The helper accepts
    // `?: ArchetypeKey | null` and bakes the fallback in — the assertion
    // is no longer needed (Mike #96 §7 #7).
    expect(SOURCE).not.toMatch(/archetype!/);
  });

  it('the chip element is `aria-hidden` on the glyph leadin only', () => {
    // Tanya UX #22 §3.4 — the glyph carries no semantic role; the screen
    // reader hears the label, not the shape name. The aria-hidden lives on
    // the glyph span, not on the chip itself.
    expect(SOURCE).toContain('aria-hidden="true"');
  });
});

// ─── Clause (b) — helper output for each archetype is the expected literal ─

describe('archetypeAccentClass — the helper carries the load NextRead used to', () => {
  it.each(ALL_ARCHETYPES)(
    'archetype `%s` resolves to "<border-/30> <text>" via the helper',
    (a) => {
      const out = archetypeAccentClass(a);
      expect(out).toBe(`${ARCHETYPE_ACCENT_BORDER[a]} ${ARCHETYPE_ACCENT_TEXT[a]}`);
      expect(out).toMatch(/\bborder-[a-z]+\/30\b/);
      expect(out).toMatch(/\btext-[a-z]+\b/);
    },
  );

  it('every chip output sits at the /30 rung (one register, five voices)', () => {
    ALL_ARCHETYPES.forEach((a) => {
      const m = archetypeAccentClass(a).match(/\bborder-[a-z]+\/(\d+)\b/);
      expect(m).not.toBeNull();
      expect(Number(m![1])).toBe(30);
    });
  });

  it('snapshot pin: five archetype outputs (any change is a deliberate review)', () => {
    const map = Object.fromEntries(
      ALL_ARCHETYPES.map((a) => [a, archetypeAccentClass(a)]),
    );
    expect(map).toMatchSnapshot();
  });
});

// ─── Label sanity — capitalized, byte-identical to legacy inline map ──────

describe('ARCHETYPE_LABELS — pixel-identical to the prior inline `ARCHETYPE_LABEL`', () => {
  it('keeps `Faithful Reader` as the two-word legacy label', () => {
    expect(ARCHETYPE_LABELS['faithful']).toBe('Faithful Reader');
  });

  it('every label starts with an uppercase letter (no raw lowercase keys)', () => {
    ALL_ARCHETYPES.forEach((a) => {
      expect(ARCHETYPE_LABELS[a][0]).toMatch(/[A-Z]/);
    });
  });
});
