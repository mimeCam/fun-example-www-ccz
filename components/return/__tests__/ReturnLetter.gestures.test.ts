/**
 * ReturnLetter gesture-resolution pin — both verbs fire, both branches
 * land, and reduced-motion readers no longer stare at a frozen card.
 *
 * What this test pins (Mike napkin #9 §6 DoD lifted into binary checks;
 * Tanya UX §7 felt-sentence checklist turned into structural fences):
 *
 *   1. The card's transition is `reveal-keepsake`. The divider hairline
 *      and the Copy/Share label-swap ride `fade-neutral`. Both verbs fire,
 *      both verb names appear in the source string (greppable).
 *
 *   2. **Default-motion** branch (`reduce=false`): `REVEAL_GESTURE` →
 *      `"duration-reveal ease-out"`; `FADE_GESTURE` → `"duration-fade
 *      ease-sustain"`. Full-motion playback is byte-identical to the
 *      longhand it replaces (Tanya MH-5: *"the visitor feels nothing
 *      change"*).
 *
 *   3. **Reduced-motion** branch (`reduce=true`): both resolvers collapse
 *      to `"duration-crossfade ease-out"` — the `shorten` floor. *The
 *      warmth still arrives. The choreography does not.* (Tanya §2.4.)
 *
 *   4. **POI-1 — the load-bearing fix** (Mike §3.1 / Tanya §3, MH-2):
 *      `reducedMotionLanding(true)` returns `{ phase: 'rest', settled:
 *      true }` so the dismiss button + Copy & Share + Save as Image are
 *      rendered in the same instant the card lands. `reducedMotionLanding
 *      (false)` returns `null` so the 50ms / 1200ms cascade still runs.
 *      An SSR render of `LetterCard` at the rest+settled landing proves
 *      the dismiss + action buttons are present in the markup — the
 *      `visible = phase === 'rest'` gate is open for reduced-motion
 *      readers.
 *
 *   5. The `phaseStyles` map is **byte-identical to the alpha-pin**: the
 *      verb routing is on the OUTER `<div>`, not inside the phase map.
 *      Re-asserted here for the four post-approach phases so a future
 *      drift cannot move duration/ease tokens back into the state map.
 *
 *   6. **Source-level grep**: the literal verb strings `'reveal-keepsake'`
 *      and `'fade-neutral'` appear in the file (sibling to Paul Kim's
 *      "five surfaces" assertion as one grep, Mike #88 §4.2). No bare
 *      `duration-reveal` or `duration-fade` survives outside comment
 *      lines (Axis-C lint pre-image, locked at the per-file boundary).
 *
 * Test file is `.ts` (not `.tsx`); we read the pure helpers + verb-resolved
 * fragments through the `__testing__` seam, plus a single readFileSync for
 * the source-grep step + a `react-dom/server` SSR render for the visibility
 * pin (mirrors `ReturnLetter.alpha.test.ts`'s shape — node env, no jsdom).
 *
 * Credits: Mike K. (architect napkin #9 — the 4.1/4.2/6 DoD shape; the
 * "verb appears in source AND consumes the policy column" thesis; the
 * POI-1 timer-under-reduce structural fence — without that pin the
 * migration regresses accessibility), Tanya D. (UX #9 §3 — the felt
 * sentence "*A reader who turned motion off sees the letter, the dismiss
 * button, and the action row at the same instant*", §7 MH-checklist
 * shape this test holds the engineer to), Paul K. (the binary-checklist
 * discipline lifted into source-grep + SSR pin), Krystle C. (file pick;
 * the two verbs named).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import type { Letter } from '@/types/book-narration';
import { __testing__ } from '../ReturnLetter';

const {
  LetterCard,
  reducedMotionLanding,
  REVEAL_GESTURE,
  FADE_GESTURE,
  phaseStyles,
} = __testing__;

const SOURCE_PATH = join(__dirname, '..', 'ReturnLetter.tsx');
const SOURCE = readFileSync(SOURCE_PATH, 'utf8');

// ─── Tiny helpers — pure, ≤ 10 LOC each ────────────────────────────────────

/** Fixed-shape Letter so the SSR render is deterministic across runs. */
function fixedLetter(): Letter {
  return {
    salutation: 'Welcome back, Deep Diver.',
    opening: 'The currents have moved since you were last here.',
    body: ['New depths surfaced.', 'Old ones held.'],
    closing: 'May the descent feel like coming home.',
    signOff: '— the room',
    archetype: 'deep-diver',
    date: '2026-04-25',
  };
}

/** Render `LetterCard` at the reduced-motion landing (rest, settled, reduce). */
function renderReducedLanding(): string {
  return renderToStaticMarkup(
    createElement(LetterCard, {
      letter: fixedLetter(), phase: 'rest', settled: true, reduce: true,
      onDismiss: () => {},
    }),
  );
}

/** Lines of the file with leading-comment lines stripped — for grep tests. */
function nonCommentLines(): string[] {
  return SOURCE.split('\n').filter((l) => {
    const trimmed = l.trim();
    return !(trimmed.startsWith('//') || trimmed.startsWith('*'));
  });
}

// ─── Verb-resolved fragments — default-motion branch ──────────────────────

describe('ReturnLetter — default-motion branch (reduce=false)', () => {
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

describe('ReturnLetter — reduced-motion branch (reduce=true)', () => {
  it('REVEAL_GESTURE collapses to the crossfade-ease-out floor', () => {
    expect(REVEAL_GESTURE(true)).toBe('duration-crossfade ease-out');
  });

  it('FADE_GESTURE collapses to the same floor (`shorten` policy)', () => {
    expect(FADE_GESTURE(true)).toBe('duration-crossfade ease-out');
  });

  it('both verbs converge to the same floor under reduce (Tanya §2.4)', () => {
    expect(REVEAL_GESTURE(true)).toBe(FADE_GESTURE(true));
  });
});

// ─── POI-1 · timer-under-reduce — Mike §3.1 / Tanya §3, MH-2 ──────────────
//
// The load-bearing fix this PR ships. Without these assertions the
// migration is decorative — the class strings collapse to the floor but
// the `visible = phase === 'rest'` gate still hides the dismiss button +
// action row for ~1.2 seconds because the timer cascade did not branch.

describe('ReturnLetter — reducedMotionLanding (POI-1 timer branch)', () => {
  it('reduce=true → land at rest+settled in the same render', () => {
    expect(reducedMotionLanding(true)).toEqual({ phase: 'rest', settled: true });
  });

  it('reduce=false → null (the 50ms / 1200ms cascade runs as authored)', () => {
    expect(reducedMotionLanding(false)).toBeNull();
  });
});

describe('ReturnLetter — under reduce the dismiss + action row render immediately', () => {
  const html = renderReducedLanding();

  it('the dismiss button is in the SSR markup at first paint', () => {
    expect(html).toContain('aria-label="Dismiss"');
  });

  it('the Copy button rides the canonical fingertip witness via aria-label', () => {
    // Long-form name moves to `hint=` (→ `aria-label` + `title`) so the
    // visible label can ride the primitive's ±1 ch swap (Mike POI-1).
    expect(html).toContain('aria-label="Copy &amp; Share this letter"');
    expect(html).toContain('title="Copy &amp; Share this letter"');
  });

  it('the Copy button paints the idle "Copy" label (within ±1 ch of "Copied")', () => {
    // Idle phase renders the short-form verb. A future drift to
    // "Copy & Share" inside `idleLabel` would reintroduce the bounding-
    // box flinch the primitive's contract explicitly forbids.
    expect(html).toMatch(/>Copy<\/span>/);
  });

  it('the Copy button paints the idle <CopyIcon> glyph (CheckIcon swap is owned by the primitive)', () => {
    // The 14-px viewBox + the canonical Copy-glyph path proves the idle
    // glyph is in markup. The primitive owns the post-`pulse(true)` swap
    // to `<CheckIcon>` — that path is pinned in the primitive's own tests.
    expect(html).toMatch(/<svg[^>]+width="14"[^>]+height="14"/);
  });

  it('the Save as Image button is in the SSR markup at first paint', () => {
    // Out of scope for the migration (Mike POI-6): a download leaves the
    // tab; the browser owns the receipt. Plain `<Pressable>` survives.
    expect(html).toContain('Save as Image');
  });

  it('the bloom shadow is on the canvas (warmth arrives without choreography)', () => {
    expect(html).toContain('shadow-sys-bloom');
  });

  it('the reduced-motion divider hairline rides the crossfade floor', () => {
    expect(html).toContain('duration-crossfade ease-out');
  });
});

// ─── phaseStyles map — verb routing lives OUTSIDE this map ───────────────

describe('ReturnLetter — phaseStyles is unchanged by the migration', () => {
  it('approach carries the Motion endpoint opacity-0 (untouched)', () => {
    expect(phaseStyles('approach', false)).toContain('opacity-0');
  });

  it('settle carries the bloom shadow + hairline border (no transition tokens)', () => {
    const cls = phaseStyles('settle', false);
    expect(cls).toContain('shadow-sys-bloom');
    expect(cls).toContain('opacity-100');
  });

  it('rest holds the hairline + shadow split (settled vs un-settled)', () => {
    expect(phaseStyles('rest', true)).toContain('shadow-sys-bloom');
    expect(phaseStyles('rest', false)).toContain('shadow-sys-rest');
  });

  it('no phaseStyles slot leaks a `duration-` or `ease-` token (verb routing lives outside)', () => {
    (['approach', 'settle', 'rest'] as const).forEach((p) => {
      expect(phaseStyles(p, true)).not.toMatch(/\bduration-/);
      expect(phaseStyles(p, false)).not.toMatch(/\bduration-/);
      expect(phaseStyles(p, true)).not.toMatch(/\bease-/);
      expect(phaseStyles(p, false)).not.toMatch(/\bease-/);
    });
  });
});

// ─── Source-level grep — verbs are greppable; bare classes are gone ──────

describe('ReturnLetter — both verbs are greppable in source', () => {
  it("'reveal-keepsake' appears as a quoted literal", () => {
    expect(SOURCE).toMatch(/['"]reveal-keepsake['"]/);
  });

  it("'fade-neutral' appears as a quoted literal", () => {
    expect(SOURCE).toMatch(/['"]fade-neutral['"]/);
  });

  it('no raw `duration-reveal` survives outside a comment line', () => {
    const offending = nonCommentLines().filter((l) => /\bduration-reveal\b/.test(l));
    expect(offending).toEqual([]);
  });

  it('no raw `duration-fade` survives outside a comment line', () => {
    const offending = nonCommentLines().filter((l) => /\bduration-fade\b/.test(l));
    expect(offending).toEqual([]);
  });

  it('imports gestureClassesForMotion from the canonical seam', () => {
    expect(SOURCE).toMatch(/import\s*\{[^}]*\bgestureClassesForMotion\b[^}]*\}\s*from\s*['"]@\/lib\/design\/gestures['"]/);
  });

  it('imports useReducedMotion from the canonical hook seam', () => {
    expect(SOURCE).toMatch(/import\s*\{[^}]*\buseReducedMotion\b[^}]*\}\s*from\s*['"]@\/lib\/hooks\/useReducedMotion['"]/);
  });

  it('the useEffect deps array carries `reduce` (POI-1 wired, not just authored)', () => {
    // Match `[showLetter, letter, reduce]` (whitespace-tolerant) — proves the
    // effect re-runs when the OS-level preference toggles mid-session.
    expect(SOURCE).toMatch(/\[\s*showLetter\s*,\s*letter\s*,\s*reduce\s*\]/);
  });

  it('imports the canonical action-receipt primitive (Mike napkin #100)', () => {
    expect(SOURCE).toMatch(/import\s*\{[^}]*\bActionPressable\b[^}]*\}\s*from\s*['"]@\/components\/shared\/ActionPressable['"]/);
  });

  it('imports the action-phase hook from the canonical seam', () => {
    expect(SOURCE).toMatch(/import\s*\{[^}]*\buseActionPhase\b[^}]*\}\s*from\s*['"]@\/lib\/hooks\/useActionPhase['"]/);
  });

  it('the hand-rolled COPY_TOAST_MS setTimeout cascade is gone', () => {
    // The resolved-layer dwell now lives inside `useActionPhase`
    // (`ACTION_HOLD_MS`). A future contributor cannot accidentally re-
    // mint the bespoke toast cascade in this file. The parallel constant
    // in `ShareOverlay` is also gone — that surface graduated to
    // `<ActionPressable>` in Mike #100 / Sid's lift; the verb is the
    // only home for the dwell now.
    const offending = nonCommentLines().filter((l) => /\bCOPY_TOAST_MS\b/.test(l));
    expect(offending).toEqual([]);
  });
});
