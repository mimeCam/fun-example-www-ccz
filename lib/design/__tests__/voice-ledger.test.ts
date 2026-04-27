/**
 * Voice Ledger Test — pin the typed Surface→Voice fence.
 *
 * `lib/design/voice-ledger.ts` is the single typed home for every voice
 * the chip→keepsake journey is licensed to paint. This test pins:
 *
 *   1. The ledger is exhaustive over `Surface` — adding a 5th surface to
 *      the union without populating its row red-flags TS at compile time
 *      and this test at run time.
 *   2. Every voice listed in any row appears in BOTH lookup tables
 *      (Tailwind family + CSS variable). No voice can ship without both
 *      address modes — that is what makes the audit test grep-correct.
 *   3. `licenseFor`, `permits`, `familiesFor` are byte-honest — they
 *      return what the ledger actually says, no defaults, no hidden
 *      fallbacks.
 *   4. The ledger invariant holds (non-empty rows, unique voices per row).
 *   5. Snapshot pin of the full ledger — drift becomes a deliberate review.
 *
 * Credits: Mike K. (napkin #54 — test outline + "data-not-component"
 * pinning), Tanya D. (UX #10 §4.2 — the surface-by-voice table this
 * ledger encodes), Elon M. (#54 §3.3 — the empirical teardown that
 * named the seam this test now closes).
 */

import {
  VOICE_LEDGER,
  CONTRAST_PAIRS,
  contrastPairsFor,
  licenseFor,
  permits,
  familiesFor,
  tailwindFamilyOf,
  cssVarOf,
  cssVarRefOf,
  ledgerInvariantHolds,
  type Surface,
  type Voice,
} from '../voice-ledger';

// ─── Tiny pure helpers — ≤ 10 LOC each ─────────────────────────────────────

const ALL_SURFACES: readonly Surface[] = [
  'chip', 'thread', 'ceremony', 'keepPlate', 'keepsake', 'letter', 'whisper',
  'textLink',
  // ─── Navigation surfaces (Mike napkin #90 / Tanya UX #42) ──────────
  'gem', 'nav', 'navPulseDot',
] as const;

/** Every voice referenced anywhere in the ledger, deduped. */
function allVoicesUsed(): readonly Voice[] {
  const set = new Set<Voice>();
  ALL_SURFACES.forEach((s) => VOICE_LEDGER[s].forEach((v) => set.add(v)));
  return [...set];
}

// ─── 1 · Exhaustive map — every Surface has a row ─────────────────────────

describe('voice-ledger — exhaustive over Surface', () => {
  it.each(ALL_SURFACES)('VOICE_LEDGER has a row for `%s`', (s) => {
    expect(VOICE_LEDGER[s]).toBeDefined();
    expect(Array.isArray(VOICE_LEDGER[s])).toBe(true);
  });

  it('VOICE_LEDGER keys are exactly the eleven Surface members', () => {
    expect(new Set(Object.keys(VOICE_LEDGER))).toEqual(new Set(ALL_SURFACES));
  });

  it('every row is non-empty (a paintless surface does not belong here)', () => {
    ALL_SURFACES.forEach((s) => expect(VOICE_LEDGER[s].length).toBeGreaterThan(0));
  });
});

// ─── 2 · Address-mode coverage — every voice has both lookups ─────────────

describe('voice-ledger — every voice resolves both address modes', () => {
  it.each(allVoicesUsed())('voice `%s` has a Tailwind family', (v) => {
    const fam = tailwindFamilyOf(v);
    expect(typeof fam).toBe('string');
    expect(fam.length).toBeGreaterThan(0);
  });

  it.each(allVoicesUsed())('voice `%s` has a CSS custom property', (v) => {
    const css = cssVarOf(v);
    expect(css.startsWith('--')).toBe(true);
    expect(cssVarRefOf(v)).toBe(`var(${css})`);
  });

  it('thermal.accent resolves to --token-accent (the live thermal token)', () => {
    expect(cssVarOf('thermal.accent')).toBe('--token-accent');
  });

  it('recognition.accent and voice.accent share a Tailwind family but differ in role', () => {
    expect(tailwindFamilyOf('recognition.accent')).toBe('accent');
    expect(tailwindFamilyOf('voice.accent')).toBe('accent');
  });
});

// ─── 3 · Helpers — byte-honest, no hidden defaults ────────────────────────

describe('licenseFor — returns the ledger row verbatim', () => {
  it.each(ALL_SURFACES)('returns the same array as VOICE_LEDGER[%s]', (s) => {
    expect(licenseFor(s)).toBe(VOICE_LEDGER[s]);
  });
});

describe('permits — surface licenses contain exactly their listed voices', () => {
  it('chip permits worldview.primary', () => {
    expect(permits('chip', 'worldview.primary')).toBe(true);
  });

  it('thread does NOT permit archetype.gold (gold belongs to keepsake/ceremony/whisper)', () => {
    expect(permits('thread', 'archetype.gold')).toBe(false);
  });

  it('letter does NOT permit thermal.accent (recognition is its own register)', () => {
    expect(permits('letter', 'thermal.accent')).toBe(false);
  });

  it('keepPlate licenses ONLY archetype.gold (Tanya §4.2 — gold honors the reader)', () => {
    expect(licenseFor('keepPlate')).toEqual(['archetype.gold']);
  });
});

describe('familiesFor — returns deduped Tailwind families per surface', () => {
  it('chip families include primary, cyan, rose, accent, mist, fog', () => {
    const fams = familiesFor('chip');
    ['primary', 'cyan', 'rose', 'accent', 'mist', 'fog'].forEach((f) =>
      expect(fams.has(f)).toBe(true),
    );
  });

  it('thread families is exactly { accent } — one voice, one family', () => {
    expect(familiesFor('thread')).toEqual(new Set(['accent']));
  });

  it('keepPlate families is exactly { gold } — one register', () => {
    expect(familiesFor('keepPlate')).toEqual(new Set(['gold']));
  });
});

// ─── 4 · Invariants ───────────────────────────────────────────────────────

describe('ledger invariants', () => {
  it('ledgerInvariantHolds returns true at module-load time', () => {
    expect(ledgerInvariantHolds()).toBe(true);
  });

  it('no row repeats a voice (a surface licenses each voice at most once)', () => {
    ALL_SURFACES.forEach((s) => {
      const row = VOICE_LEDGER[s];
      expect(new Set(row).size).toBe(row.length);
    });
  });
});

// ─── 5 · CONTRAST_PAIRS — every paired voice is licensed by its surface ───

describe('CONTRAST_PAIRS — every (fg, bg) is in licenseFor(surface)', () => {
  // Mike napkin #95 §4 — `chip` was the only row.
  // Mike napkin #99 §3 — added `keepsake` for the halo ambient floor.
  // Mike napkin #101 — added `thread` for the `thermal.accent` ambient
  // floor (the fifth sibling).
  // Mike napkin #45 / Sid (this implementation, 2026-04-26) — added
  // `textLink` for the `passage` foreshadow gesture at WCAG 1.4.3 (the
  // seventh sibling). Four rows now — past the rule-of-three threshold
  // — but the `ContrastFamily` genus is STILL deferred: chip/keepsake/
  // thread/textLink share *shape* (one fg over one bg at one floor),
  // they do not share *role* (text legibility / signal gem / ambient
  // cue / foreshadow gesture). Genus extraction needs shared role, not
  // shared shape (Mike napkin #54 — "polymorphism is a killer"). Four
  // siblings sit honestly side-by-side; a fifth sibling with a fifth
  // distinct role earns the genus, not before.
  it('five rows today: four Surface + one chrome (`focusRing`); genus deferred (shape ≠ role)', () => {
    // Mike #103 §5 file #2 / Sid 2026-04-26 — `focusRing` joins as the
    // *first* member of the chrome group via `ReaderInvariantPair` brand.
    // The key is NOT a `Surface` member (chrome ≠ paint-bearing journey
    // surface); it lives under `ContrastPairsKey` (Surface | 'focusRing')
    // with the index signature minimally widened (Mike #103 §6 #6).
    expect(Object.keys(CONTRAST_PAIRS).sort())
      .toEqual(['chip', 'focusRing', 'keepsake', 'textLink', 'thread'].sort());
  });

  // Surface-row license check — focusRing is not a Surface (it is chrome),
  // so it is excluded from this iteration. Its own structural assertion
  // lives in the next describe block (Mike #103 §5 file #6).
  ALL_SURFACES.filter((s) => s in CONTRAST_PAIRS).forEach((surface) => {
    const licensed = new Set<Voice>(licenseFor(surface));
    contrastPairsFor(surface).forEach((pair) => {
      it(`${surface} pair (${pair.fg}, ${pair.bg}) names licensed voices`, () => {
        expect(licensed.has(pair.fg)).toBe(true);
        expect(licensed.has(pair.bg)).toBe(true);
        expect(pair.floor).toBeGreaterThan(0);
      });
    });
  });

  it('contrastPairsFor returns empty for surfaces without rows (no crash)', () => {
    // `thread` joined the manifest in this PR (Mike napkin #101); `letter`
    // remains paired-row-free until its own concrete consumer lands.
    expect(contrastPairsFor('letter')).toEqual([]);
    expect(contrastPairsFor('whisper')).toEqual([]);
  });
});

// ─── 5b · focusRing — structural drift gate (Mike #103 §5 file #6) ────────
// Drift test, not behavior. The brand `invariant: true` makes
// `cold ≡ warm` a SHAPE invariant; the audit module
// `focus-ring-contrast-audit.test.ts` measures the math behind it. This
// block pins the structural shape so a refactor that drops the brand or
// extends the row trips here, before the audit runs.

describe('CONTRAST_PAIRS.focusRing — reader-invariant chrome (one cell, by shape)', () => {
  it('exists with exactly one cell — cardinality-1 by intent', () => {
    expect(CONTRAST_PAIRS.focusRing).toBeDefined();
    expect(CONTRAST_PAIRS.focusRing!.length).toBe(1);
  });

  it('the cell carries `invariant: true` (the ReaderInvariantPair brand)', () => {
    const cell = CONTRAST_PAIRS.focusRing![0] as { invariant?: boolean };
    expect(cell.invariant).toBe(true);
  });

  it('is NOT iterated as a Surface (chrome ≠ journey surface)', () => {
    // Mike #103 §6 #6 — `focusRing` is added as a `CONTRAST_PAIRS` *key*
    // but the `Surface` union is *not* extended. This pin documents the
    // separation: future refactors that promote chrome into Surface must
    // delete this assertion deliberately.
    expect(ALL_SURFACES.includes('focusRing' as Surface)).toBe(false);
  });
});

// ─── 6 · Snapshot pin — the ledger as system-of-record ────────────────────

describe('voice-ledger — snapshot pin (any change is a deliberate review)', () => {
  it('VOICE_LEDGER shape is byte-pinned', () => {
    expect(VOICE_LEDGER).toMatchSnapshot();
  });
});
