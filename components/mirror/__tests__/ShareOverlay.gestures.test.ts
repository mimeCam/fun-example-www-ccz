/**
 * ShareOverlay gesture-graduation pin — the hover tooltip's opacity
 * transition is verb-resolved off the Gesture Atlas; the file is off the
 * grandfather list.
 *
 * What this test pins (Mike napkin #92 §6 + Tanya UIX #99 §6 lifted into
 * binary checks):
 *
 *   1. The tooltip span carries the verb literal `'crossfade-inline'` at
 *      the call site — greppable, JIT-visible, no template interpolation.
 *      Felt sentence: *"One label replacing another — instant enough I
 *      don't see the seam."*
 *
 *   2. `useReducedMotion()` is the source of `reduce` (no prop drilling
 *      from the parent, no separate hook), and the canonical import is
 *      `@/lib/hooks/useReducedMotion`.
 *
 *   3. `gestureClassesForMotion` is imported from the canonical seam
 *      `@/lib/design/gestures`. One source, one seam — same Axis B
 *      discipline as `gesture-call-site-fence.test.ts`.
 *
 *   4. No raw `duration-* ease-*` survives in the file outside a comment
 *      line. The `gesture-call-site-fence` fence (Axis C) closes around
 *      the file automatically once the path is off `GESTURE_GRANDFATHERED_
 *      PATHS`; this test is the *positive* dual that pins the migration
 *      receipt so a future renaming cannot re-bare the class.
 *
 *   5. The file is no longer in `GESTURE_GRANDFATHERED_PATHS` — the list
 *      shrank by exactly one entry this PR.
 *
 *   6. Layout polish (Tanya UIX #99 §2): the tooltip is positioned ABOVE
 *      the icon (`-top-9`, not `-bottom-8`); outer column gap is `gap-
 *      sys-4`; DeepLink alpha is on the `recede` rung (`text-mist/50`);
 *      tooltip carries `shadow-sys-rest` and a 6×6 `rotate-45 bg-void`
 *      caret. Each is a one-grep assertion on raw source.
 *
 * Test file is `.ts` (not `.tsx`); the assertions are pure source-string
 * lints — no DOM, no React render, no Jest jsdom warmup. Mirrors
 * `MirrorRevealCard.gestures.test.ts` (Mike #88 §4.2 — the positive shape
 * the file's own gesture pin took for the killer-feature carrier).
 *
 * Credits: Mike K. (architect napkin #92 — the per-file gesture-pin
 * shape, the four-axis fence assumption that this test is the dual of,
 * the JIT-literal contract this test holds the engineer to), Tanya D.
 * (UIX #99 — the felt sentence + the layout-polish carve-out + the
 * "reduced-motion users especially need fast, predictable labels"
 * discipline this test verifies in source), Krystle C. (file pick — the
 * canvas this regression fence protects), Paul K. (the binary-checklist
 * spirit + the kill-list discipline that puts the grandfather assertion
 * in this test, not just in the sync).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GESTURE_GRANDFATHERED_PATHS } from '@/lib/design/gestures';

const SOURCE_PATH = join(__dirname, '..', 'ShareOverlay.tsx');
const SOURCE = readFileSync(SOURCE_PATH, 'utf8');

/** Lines that are not comment-only — drop // … and JSDoc * … prefixes. */
const NON_COMMENT_LINES = SOURCE.split('\n').filter((l) => {
  const t = l.trim();
  return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
});

// ─── Verb adoption — the call-site spelling is the receipt ────────────────

describe('ShareOverlay — the verb literal is greppable in source', () => {
  it("'crossfade-inline' appears as a quoted literal", () => {
    expect(SOURCE).toMatch(/['"]crossfade-inline['"]/);
  });

  it('the verb is invoked through gestureClassesForMotion', () => {
    expect(SOURCE).toMatch(/gestureClassesForMotion\s*\(\s*['"]crossfade-inline['"]/);
  });

  it('imports gestureClassesForMotion from the canonical seam', () => {
    expect(SOURCE).toMatch(
      /import\s*\{[^}]*\bgestureClassesForMotion\b[^}]*\}\s*from\s*['"]@\/lib\/design\/gestures['"]/,
    );
  });

  it('imports useReducedMotion from the canonical hook seam', () => {
    expect(SOURCE).toMatch(
      /import\s*\{[^}]*\buseReducedMotion\b[^}]*\}\s*from\s*['"]@\/lib\/hooks\/useReducedMotion['"]/,
    );
  });

  it('useReducedMotion() is wired exactly once at the component top', () => {
    const matches = SOURCE.match(/useReducedMotion\s*\(/g) ?? [];
    expect(matches.length).toBe(1);
  });
});

// ─── Bare-class fence — no `duration-* ease-*` survives outside a comment ─

describe('ShareOverlay — no bare duration/ease class survives', () => {
  it('no `duration-instant` literal outside a comment line', () => {
    const offending = NON_COMMENT_LINES.filter((l) => /\bduration-instant\b/.test(l));
    expect(offending).toEqual([]);
  });

  it('no bare `duration-<word>` survives outside a comment line', () => {
    const offending = NON_COMMENT_LINES.filter((l) => /(?<![\w-])duration-[a-z]+(?![\w-])/.test(l));
    expect(offending).toEqual([]);
  });

  it('no bare `ease-<word>` survives outside a comment line', () => {
    const offending = NON_COMMENT_LINES.filter((l) => /(?<![\w-])ease-[a-z]+(?![\w-])/.test(l));
    expect(offending).toEqual([]);
  });
});

// ─── Grandfather discipline — the file is off the list ────────────────────

describe('ShareOverlay — the path is OFF the grandfather list', () => {
  it("'components/mirror/ShareOverlay.tsx' is not a grandfathered path", () => {
    expect(GESTURE_GRANDFATHERED_PATHS).not.toContain('components/mirror/ShareOverlay.tsx');
  });

  it('the list has shrunk to exactly one remaining entry', () => {
    // ShareOverlay's PR shrunk the list from 3 → 2 (ShareOverlay redeemed).
    // Sid napkin (this PR) shrunk the list from 2 → 1 (ReturnLetter
    // redeemed onto `reveal-keepsake` + `fade-neutral`). Next graduation
    // closes the Atlas to length 0 — *"room speaks in one accent."*
    expect(GESTURE_GRANDFATHERED_PATHS.length).toBe(1);
  });

  it('the remaining entry is visited-launcher (the last unmigrated site)', () => {
    expect([...GESTURE_GRANDFATHERED_PATHS].sort()).toEqual([
      'lib/resonances/visited-launcher.ts',
    ]);
  });
});

// ─── Layout polish — Tanya UIX #99 §2 + §3 ────────────────────────────────

describe('ShareOverlay — tooltip is anchored above the icon', () => {
  it('the tooltip uses `-top-9` (above) — not `-bottom-8` (below)', () => {
    expect(SOURCE).toMatch(/-top-9\b/);
    expect(SOURCE).not.toMatch(/-bottom-8\b/);
  });

  it('the outer column gap stepped to `gap-sys-4`', () => {
    expect(SOURCE).toMatch(/gap-sys-4/);
  });

  it('the DeepLink alpha is on the recede rung (`text-mist/50`)', () => {
    expect(SOURCE).toMatch(/text-mist\/50/);
    expect(SOURCE).not.toMatch(/text-mist\/30/);
  });

  it('the tooltip carries `shadow-sys-rest` (rest-elevation lift)', () => {
    expect(SOURCE).toMatch(/shadow-sys-rest/);
  });

  it('the tooltip caret is a 6×6 `rotate-45 bg-void` square', () => {
    expect(SOURCE).toMatch(/h-1\.5\s+w-1\.5/);
    expect(SOURCE).toMatch(/rotate-45/);
    expect(SOURCE).toMatch(/bg-void/);
  });
});

// ─── Sanity — the file scanned is non-empty (catch path-drift) ────────────

describe('ShareOverlay — the test reads the right file', () => {
  it('the source path resolves and is non-empty', () => {
    expect(SOURCE.length).toBeGreaterThan(0);
  });

  it('the file is `use client` and exports a default React component', () => {
    expect(SOURCE).toMatch(/'use client'/);
    expect(SOURCE).toMatch(/export\s+default\s+function\s+ShareOverlay/);
  });
});
