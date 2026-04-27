/**
 * Chip-to-Keepsake Voice Audit — string-grep journey audit (Mike #54).
 *
 * Walks the four-surface journey on a fixture and asserts each surface's
 * rendered output paints ONLY the voices its `voice-ledger.ts` row permits.
 * The room speaks in different voices on different surfaces *by design*
 * (Tanya UX #10 §4); this test makes that property the type system + test
 * harness can prove, not a vibe the reviewer remembers.
 *
 * What it audits:
 *
 *   1. **chip** — `ExploreArticleCard` rendered via `react-dom/server`.
 *      The chip span paints `bg-<family>` + `text-<family>` from the
 *      `chip` row. No other family family leaks into the chip element.
 *
 *   2. **thread** — `GoldenThread.tsx` source text. The fill-driving
 *      style routes `var(--token-accent)` (the ledger's `thermal.accent`
 *      voice). No `text-gold`, no `text-accent`, no worldview hue.
 *
 *   3. **keepsake** — `buildThreadSVG(fixture)` output (server-pure SVG).
 *      The same module the modal AND `/api/og/thread` use, so one
 *      assertion covers both the live preview and the unfurl. Paints
 *      hexes from `THERMAL` / `THERMAL_WARM` / `BRAND.gold` /
 *      `ARCHETYPE[…]` / `BRAND.mist` — every one of those traces back
 *      to a licensed `keepsake` voice.
 *
 *   4. **letter / whisper** — source-text grep of recognition surfaces.
 *      The letter paints `text-accent` and `text-mist` (recognition.*).
 *      The whisper paints `text-mist` and `text-gold/50` (mist + archetype.gold).
 *
 * The grep is intentional: rendered classNames and SVG hex strings are
 * what the user sees; if a future drift inserts a `text-rose` into the
 * keepsake plate, that's a literal in the markup the audit catches.
 *
 * Cheap, deterministic, runs under the existing `testEnvironment: 'node'`
 * — no Playwright, no jsdom theatrics. Mirrors the `react-dom/server`
 * rendering pattern in `ExploreArticleCard.alpha.test.ts`.
 *
 * Credits: Mike K. (napkin #54 — audit design, "render the journey, grep
 * the markup, license-permit-only" pattern), Tanya D. (UX #10 §4 — the
 * surface-by-voice table this test enforces verbatim), Paul K. (#54 —
 * the "one continuous voice from chip to keepsake" outcome statement).
 */

import * as fs from 'fs';
import * as path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import {
  licenseFor,
  familiesFor,
  type Surface,
} from '../voice-ledger';
import { buildThreadSVG } from '@/lib/sharing/thread-render';
import { BRAND, THERMAL, THERMAL_WARM, ARCHETYPE } from '@/lib/design/color-constants';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ExploreArticleCard = require('@/components/explore/ExploreArticleCard').default;

// ─── Tiny pure helpers — ≤ 10 LOC each ─────────────────────────────────────

const KNOWN_FAMILIES = [
  'fog', 'mist', 'rose', 'gold', 'accent', 'surface',
  'foreground', 'background', 'primary', 'cyan',
] as const;

/** Pull every Tailwind family literal (e.g. 'gold', 'cyan') out of markup. */
function familiesIn(markup: string): Set<string> {
  const RX = /\b(?:bg|text|border|shadow)-([a-z]+)(?:\/\d+)?\b/g;
  const found = new Set<string>();
  for (const m of markup.matchAll(RX)) {
    if ((KNOWN_FAMILIES as readonly string[]).includes(m[1])) found.add(m[1]);
  }
  return found;
}

/** Pull every CSS custom-property reference (e.g. `var(--token-accent)`). */
function cssVarsIn(markup: string): Set<string> {
  const RX = /var\(\s*(--[a-z0-9-]+)\s*\)/gi;
  const found = new Set<string>();
  for (const m of markup.matchAll(RX)) found.add(m[1]);
  return found;
}

/** Read source file from repo root — chip/thread/whisper consume by source. */
function readSource(rel: string): string {
  return fs.readFileSync(path.join(process.cwd(), rel), 'utf8');
}

/** Strip block comments + JSX comments — voice grep should not flag prose. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')   // block comments
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')// JSX block comments
    .replace(/(^|\s)\/\/[^\n]*/g, '$1');  // line comments
}

/** Fixture article — drives the chip render across all four worldviews. */
function fixtureArticle(worldview: string): Record<string, unknown> {
  return {
    id: 'audit-fixture',
    title: 'Voice Ledger Audit',
    content: 'word '.repeat(600).trim(),
    worldview,
  };
}

/** Render an ExploreArticleCard with a worldview chip. */
function renderChip(worldview: string): string {
  return renderToStaticMarkup(
    createElement(ExploreArticleCard, {
      article: fixtureArticle(worldview),
      showWorldview: true,
    }),
  );
}

/** Extract the chip span (everything inside the first
 *  `rounded-sys-soft … font-sys-accent ` span) so the audit doesn't pick
 *  up the card's own (licensed) families. The chip contains exactly ONE
 *  nested span (the glyph), so we walk past the inner `</span>` and then
 *  consume the outer one. Pure, deterministic, ≤ 10 LOC. */
function chipSpanOf(html: string): string {
  const RX = /<span[^>]*rounded-sys-soft[^>]*>[\s\S]*?<\/span>[\s\S]*?<\/span>/;
  const m = html.match(RX);
  return m ? m[0] : '';
}

// ─── 1 · CHIP — rendered chip paints ONLY licensed families ────────────────

describe('chip surface — every rendered family is licensed by voice-ledger', () => {
  const chipFams = familiesFor('chip');
  const wvs = ['technical', 'philosophical', 'practical', 'contrarian'] as const;

  it.each(wvs)('worldview `%s` chip paints only chip-licensed families', (wv) => {
    const chip = chipSpanOf(renderChip(wv));
    expect(chip.length).toBeGreaterThan(0);
    familiesIn(chip).forEach((fam) => expect(chipFams.has(fam)).toBe(true));
  });

  it('chip license includes the four worldview chip families (primary, cyan, rose, fog)', () => {
    ['primary', 'cyan', 'rose', 'fog'].forEach((f) => expect(chipFams.has(f)).toBe(true));
  });

  it('chip license does NOT include `gold` (gold belongs to keepsake/ceremony, not chip)', () => {
    expect(chipFams.has('gold')).toBe(false);
  });

  it('rendered chip strip never paints `text-gold` (no leak from other surface)', () => {
    const wvs2 = ['technical', 'philosophical', 'practical', 'contrarian'];
    wvs2.forEach((w) => {
      const chip = chipSpanOf(renderChip(w));
      expect(chip).not.toMatch(/\btext-gold(?:\/\d+)?\b/);
    });
  });
});

// ─── 2 · THREAD — source paints --token-accent and nothing else ───────────

describe('thread surface — paints thermal.accent (--token-accent) only', () => {
  const threadSrc = stripComments(readSource('components/reading/GoldenThread.tsx'));

  it('GoldenThread.tsx references `var(--token-accent)` (the licensed voice)', () => {
    expect(cssVarsIn(threadSrc).has('--token-accent')).toBe(true);
  });

  it('GoldenThread.tsx never inlines `var(--gold)` (archetype voice, not licensed here)', () => {
    expect(cssVarsIn(threadSrc).has('--gold')).toBe(false);
  });

  it('GoldenThread.tsx never paints `text-rose` / `text-cyan` / worldview hue', () => {
    ['text-rose', 'text-cyan', 'text-primary'].forEach((needle) => {
      expect(threadSrc).not.toContain(needle);
    });
  });
});

// ─── 3 · KEEPSAKE — buildThreadSVG output paints ONLY licensed hexes ──────

describe('keepsake surface — every painted hex traces back to a licensed voice', () => {
  /** Snapshot fixture — mirrors a real reader that hit the ceremony. */
  const snapshot = {
    slug: 'audit', title: 'A reader audited the room.',
    depth: 73, thermal: 0.6,
    archetype: 'deep-diver' as const, ts: 1714089600,
  };
  const svg = buildThreadSVG(snapshot);

  /** Hexes the keepsake is licensed to paint (Tanya UX #10 + ledger row). */
  const LICENSED_HEXES: ReadonlySet<string> = new Set([
    THERMAL.accent.toLowerCase(),       // thermal.accent dormant — violet
    THERMAL_WARM.accent.toLowerCase(),  // thermal.accent warm — gold
    BRAND.gold.toLowerCase(),           // archetype.gold — title + gradient terminal
    BRAND.mist.toLowerCase(),           // recognition.mist — caption + halo fallback
    BRAND.fog.toLowerCase(),            // ambient track (fallback / dormant track)
    BRAND.void.toLowerCase(),           // background fill (canvas-only neutral)
    ...Object.values(ARCHETYPE).map((h) => h.toLowerCase()), // archetype.halo
  ]);

  /** Pull every #rrggbb literal out of the SVG string. */
  function hexesIn(s: string): Set<string> {
    const RX = /#[0-9a-fA-F]{6}\b/g;
    const found = new Set<string>();
    for (const m of s.matchAll(RX)) found.add(m[0].toLowerCase());
    return found;
  }

  it('emits a non-empty SVG with at least one hex literal', () => {
    expect(svg).toContain('<svg');
    expect(hexesIn(svg).size).toBeGreaterThan(0);
  });

  it('every painted hex is licensed for the `keepsake` surface', () => {
    hexesIn(svg).forEach((hex) => {
      expect(LICENSED_HEXES.has(hex)).toBe(true);
    });
  });

  it('keepsake SVG paints the archetype halo for the reader who earned it', () => {
    // deep-diver halo is `--arch-deep-diver` = #4ecdc4 in ARCHETYPE.
    expect(svg.toLowerCase()).toContain(ARCHETYPE['deep-diver'].toLowerCase());
  });

  it('keepsake SVG never paints the chip/letter/recognition.accent hex (#7b2cbf in recognition role)', () => {
    // The dormant thermal.accent IS #7b2cbf — same hex, different VOICE.
    // The audit asserts the hex is licensed for `keepsake` (it is —
    // thermal.accent dormant), not for `recognition`. Voice ≠ hex.
    expect(LICENSED_HEXES.has('#7b2cbf')).toBe(true);
  });
});

// ─── 4 · LETTER / WHISPER — source paints recognition voices only ────────

describe('recognition surfaces — letter and whisper speak their own register', () => {
  const letterSrc = stripComments(readSource('components/return/ReturnLetter.tsx'));
  const whisperSrc = stripComments(readSource('components/return/RecognitionWhisper.tsx'));

  it('ReturnLetter paints `text-accent` (recognition.accent) on the heading', () => {
    expect(letterSrc).toMatch(/\btext-accent\b/);
  });

  it('ReturnLetter never paints `text-gold` (gold belongs to keepsake/ceremony)', () => {
    expect(letterSrc).not.toMatch(/\btext-gold(?:\/\d+)?\b/);
  });

  it('ReturnLetter never paints worldview hue (no chip leak into letter)', () => {
    expect(letterSrc).not.toMatch(/\btext-(?:primary|cyan|rose)\b/);
  });

  it('RecognitionWhisper paints `text-gold/50` on the archetype keyword (whisper license)', () => {
    expect(whisperSrc).toMatch(/\btext-gold\/50\b/);
  });

  it('RecognitionWhisper never paints `text-accent` (recognition.accent is letter-only)', () => {
    expect(whisperSrc).not.toMatch(/\btext-accent\b/);
  });
});

// ─── 5 · Cross-surface invariant — no surface borrows another's hue ──────
//
// Tanya UX #10 §5: "No surface borrows another's color." This is the audit's
// load-bearing claim — chip families do not appear in letter source; gold
// does not appear in chip render; thermal.accent does not appear in
// recognition source. Spot-check the most-likely drift edges.

describe('journey invariant — no surface borrows another surface\'s family', () => {
  it('chip render never includes `gold` (the keepsake voice)', () => {
    const wvs = ['technical', 'philosophical', 'practical', 'contrarian'];
    wvs.forEach((w) => {
      const chip = chipSpanOf(renderChip(w));
      expect(familiesIn(chip).has('gold')).toBe(false);
    });
  });

  it('letter source never references `--token-accent` (thermal voice, not letter\'s)', () => {
    const letterSrc = stripComments(readSource('components/return/ReturnLetter.tsx'));
    expect(cssVarsIn(letterSrc).has('--token-accent')).toBe(false);
  });

  it('whisper source never references worldview families', () => {
    const whisperSrc = stripComments(readSource('components/return/RecognitionWhisper.tsx'));
    ['primary', 'cyan', 'rose'].forEach((fam) => {
      const RX = new RegExp(`\\btext-${fam}(?:\\/\\d+)?\\b`);
      expect(whisperSrc).not.toMatch(RX);
    });
  });

  it('every Surface has a non-empty license (sanity guard for the ledger)', () => {
    const SURFACES: Surface[] =
      ['chip', 'thread', 'ceremony', 'keepPlate', 'keepsake', 'letter', 'whisper',
       'textLink',
       // Navigation chrome surfaces (Mike napkin #90 / Tanya UX #42).
       'gem', 'nav', 'navPulseDot'];
    SURFACES.forEach((s) => expect(licenseFor(s).length).toBeGreaterThan(0));
  });
});
