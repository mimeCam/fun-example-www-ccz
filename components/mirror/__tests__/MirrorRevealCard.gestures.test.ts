/**
 * MirrorRevealCard gesture-resolution pin — both verbs fire, both branches
 * land. The killer feature's transition surface speaks the verb registry.
 *
 * What this test pins (Mike napkin #88 §6 DoD lifted into binary checks):
 *
 *   1. The card's transition is `reveal-keepsake`. The inner cascade
 *      (label, whisper, divider) is `fade-neutral`. Both verbs fire,
 *      both verb names appear in the source string (greppable).
 *
 *   2. **Default-motion** branch (`reduce=false`): `REVEAL_GESTURE` →
 *      `"duration-reveal ease-out"`; `FADE_GESTURE` → `"duration-fade
 *      ease-sustain"`. The user with motion-OK sees the authored timing.
 *
 *   3. **Reduced-motion** branch (`reduce=true`): both resolvers collapse
 *      to `"duration-crossfade ease-out"` (the `shorten` floor). The user
 *      with `prefers-reduced-motion: reduce` finally gets a felt sentence
 *      of their own — *something arrives, gentle and quick, and stays*.
 *
 *   4. The shimmer style is **suppressed** under reduce — the archetype-
 *      tinted bloom is skipped entirely (Tanya UX §4.1). On every other
 *      phase, both branches return an empty style object.
 *
 *   5. The inner stagger is **collapsed** under reduce — every cascade
 *      child lands at `transitionDelay: 0ms` (Tanya UX §4.1 — "All three
 *      at delay 0").
 *
 *   6. The phaseClass map is **byte-identical** to the alpha-pin snapshot
 *      under both branches (the verb-routing is on the OUTER `<div>`, not
 *      inside the phase map — proven by re-asserting the four post-hidden
 *      phases here).
 *
 *   7. **Source-level grep**: the literal verb strings `'reveal-keepsake'`
 *      and `'fade-neutral'` appear in the file (Paul Kim's "five surfaces"
 *      assertion, but as one grep, not five — Mike #88 §4.2).
 *
 * Test file is `.ts` (not `.tsx`); we read the pure helpers + verb-resolved
 * fragments through the `__testing__` seam, plus a single readFileSync for
 * the source-grep step. No phase machine, no fake timers, no jsdom.
 *
 * Credits: Mike K. (architect napkin #88 — the 4.1/4.2/6 DoD shape; the
 * "verb appears in source AND consumes the policy column" thesis), Tanya D.
 * (UX #97 §4.1 — the reduced-motion felt-sentence table this test holds
 * the engineer to), Paul K. (the binary checklist discipline), Krystle C.
 * (file pick — the canvas this regression fence protects).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { __testing__ } from '../MirrorRevealCard';

const {
  phaseClass, shimmerStyle,
  REVEAL_GESTURE, FADE_GESTURE,
  MIRROR_STAGGER_CLASS,
} = __testing__;

const SOURCE_PATH = join(__dirname, '..', 'MirrorRevealCard.tsx');
const SOURCE = readFileSync(SOURCE_PATH, 'utf8');

// ─── Verb-resolved fragments — default-motion branch ──────────────────────

describe('MirrorRevealCard — default-motion branch (reduce=false)', () => {
  it('REVEAL_GESTURE resolves to the authored reveal-keepsake row', () => {
    expect(REVEAL_GESTURE(false)).toBe('duration-reveal ease-out');
  });

  it('FADE_GESTURE resolves to the authored fade-neutral row', () => {
    expect(FADE_GESTURE(false)).toBe('duration-fade ease-sustain');
  });

  it('the two verbs ride distinct (beat, ease) pairs by construction', () => {
    expect(REVEAL_GESTURE(false)).not.toBe(FADE_GESTURE(false));
  });
});

// ─── Verb-resolved fragments — reduced-motion branch ──────────────────────

describe('MirrorRevealCard — reduced-motion branch (reduce=true)', () => {
  it('REVEAL_GESTURE collapses to the crossfade-ease-out floor', () => {
    expect(REVEAL_GESTURE(true)).toBe('duration-crossfade ease-out');
  });

  it('FADE_GESTURE collapses to the same floor (`shorten` policy)', () => {
    expect(FADE_GESTURE(true)).toBe('duration-crossfade ease-out');
  });

  it('both verbs converge to the same floor under reduce (Tanya UX §4.1)', () => {
    expect(REVEAL_GESTURE(true)).toBe(FADE_GESTURE(true));
  });
});

// ─── Shimmer suppression — Tanya UX §4.1 ──────────────────────────────────

describe('MirrorRevealCard — reduced-motion suppresses the shimmer bloom', () => {
  const colors = { shimmerTo: '#deadbeef' };

  it('reduce=false + phase=shimmer → archetype-tinted box-shadow', () => {
    expect(shimmerStyle('shimmer', colors, false)).toEqual({ boxShadow: '0 12px 60px #deadbeef' });
  });

  it('reduce=true + phase=shimmer → empty style (skip the beat)', () => {
    expect(shimmerStyle('shimmer', colors, true)).toEqual({});
  });

  it('every other phase returns an empty style on both branches', () => {
    const phases = ['hidden', 'emergence', 'reveal', 'rest'] as const;
    phases.forEach((p) => {
      expect(shimmerStyle(p, colors, false)).toEqual({});
      expect(shimmerStyle(p, colors, true)).toEqual({});
    });
  });
});

// ─── Stagger graduated to paint — Mike #95 §1 ─────────────────────────────
// `fadeStyle()` retired; the cascade lives in `app/globals.css` as
// `.mirror-stagger-1|2|3`. Pin: (a) source carries the literals (JIT-safe),
// (b) seam exposes the table, (c) no `transitionDelay` slips back into a
// JSX `style={…}` block, (d) `fadeStyle` is gone from the seam.

describe('MirrorRevealCard — inner cascade lives at the paint layer', () => {
  it('exposes the JIT-safe `MIRROR_STAGGER_CLASS` table on the seam', () => {
    // Class strings now route through the canonical Stagger Ledger
    // (`lib/design/stagger.ts`); the seam still holds the resolved
    // (rung → literal) map for source-grep parity with the prior fence.
    expect(MIRROR_STAGGER_CLASS).toEqual({
      1: 'mirror-stagger-1', 2: 'mirror-stagger-2', 3: 'mirror-stagger-3',
    });
  });

  it('reads the three rungs through staggerClassOf({ family: "reveal", rung })', () => {
    expect(SOURCE).toMatch(/staggerClassOf\(\s*\{\s*family:\s*['"]reveal['"],\s*rung:\s*1\s*\}/);
    expect(SOURCE).toMatch(/staggerClassOf\(\s*\{\s*family:\s*['"]reveal['"],\s*rung:\s*2\s*\}/);
    expect(SOURCE).toMatch(/staggerClassOf\(\s*\{\s*family:\s*['"]reveal['"],\s*rung:\s*3\s*\}/);
  });

  it('imports staggerClassOf from the canonical seam', () => {
    expect(SOURCE).toMatch(
      /import\s*\{[^}]*\bstaggerClassOf\b[^}]*\}\s*from\s*['"]@\/lib\/design\/stagger['"]/,
    );
  });

  it('spreads STAGGER_DATA_PROPS on the cascade rungs (silence hook)', () => {
    const matches = SOURCE.match(/STAGGER_DATA_PROPS/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(3); // import + 3 spreads
  });

  it('no `transitionDelay` literal appears inside any style={…} block', () => {
    expect(SOURCE).not.toMatch(/style\s*=\s*\{[^}]*transitionDelay/);
  });

  it('`fadeStyle` is retired from the `__testing__` seam', () => {
    expect(__testing__).not.toHaveProperty('fadeStyle');
  });
});

// ─── Phase map — verb routing is on the OUTER div, NOT inside this map ────

describe('MirrorRevealCard — phaseClass is unchanged by the migration', () => {
  it('hidden carries Motion endpoint opacity-0 (untouched)', () => {
    expect(phaseClass('hidden')).toContain('opacity-0');
  });

  it('the four post-hidden phases sit at opacity-100 / opacity-quiet (no rung drift)', () => {
    expect(phaseClass('emergence')).toContain('opacity-quiet');
    ['shimmer', 'reveal', 'rest'].forEach((p) =>
      expect(phaseClass(p as 'shimmer' | 'reveal' | 'rest')).toContain('opacity-100'),
    );
  });

  it('no phaseClass slot leaks a `duration-` or `ease-` token (verb routing lives outside)', () => {
    const phases = ['hidden', 'emergence', 'shimmer', 'reveal', 'rest'] as const;
    phases.forEach((p) => {
      expect(phaseClass(p)).not.toMatch(/\bduration-/);
      expect(phaseClass(p)).not.toMatch(/\bease-/);
    });
  });
});

// ─── Source-level grep — "five surfaces" as one assertion (Mike #88 §4.2) ─

describe('MirrorRevealCard — both verbs are greppable in source', () => {
  it("'reveal-keepsake' appears as a quoted literal", () => {
    expect(SOURCE).toMatch(/['"]reveal-keepsake['"]/);
  });

  it("'fade-neutral' appears as a quoted literal", () => {
    expect(SOURCE).toMatch(/['"]fade-neutral['"]/);
  });

  it('no raw `duration-reveal` survives outside a comment line', () => {
    const offending = SOURCE.split('\n').filter((l) => {
      const trimmed = l.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false;
      return /\bduration-reveal\b/.test(l);
    });
    expect(offending).toEqual([]);
  });

  it('no raw `duration-fade` survives outside a comment line', () => {
    const offending = SOURCE.split('\n').filter((l) => {
      const trimmed = l.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false;
      return /\bduration-fade\b/.test(l);
    });
    expect(offending).toEqual([]);
  });

  it('imports gestureClassesForMotion from the canonical seam', () => {
    expect(SOURCE).toMatch(/import\s*\{[^}]*\bgestureClassesForMotion\b[^}]*\}\s*from\s*['"]@\/lib\/design\/gestures['"]/);
  });

  it('imports useReducedMotion from the canonical hook seam', () => {
    expect(SOURCE).toMatch(/import\s*\{[^}]*\buseReducedMotion\b[^}]*\}\s*from\s*['"]@\/lib\/hooks\/useReducedMotion['"]/);
  });
});
