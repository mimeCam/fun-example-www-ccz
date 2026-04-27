/**
 * ShareOverlay action-swap graduation pin — the "Copy Link" icon button
 * has retired its bespoke `mirror-share-confirm` flash and routes its
 * receipt through the canonical `<ActionPressable>` + `useActionPhase`
 * primitive (verb #4 of `action-swap`, the fourth speaker).
 *
 * What this test pins (Mike napkin #100 §"Definition of done" lifted into
 * binary checks; Tanya UIX #99 §3 felt-experience layer turned into
 * structural fences):
 *
 *   1. `<ActionPressable>` is the JSX host for the Copy Link slot. The
 *      receipt-bearing primitive is live-wired (Axis E of the action-
 *      receipt fence already ratchets the floor; this test pins the
 *      file-local presence so a refactor inside ShareOverlay cannot
 *      silently revert without going red here first).
 *
 *   2. `<ActionPressable variant="icon" labelMode="hidden">` — the icon-
 *      row aesthetic survives the graduation. The visible verb paints
 *      in the tooltip; the SR receipt rides `<PhaseAnnouncement>` from
 *      the primitive. (Mike napkin #100 §5 path A; Tanya UIX #99 §6 A.)
 *
 *   3. `useActionPhase` is wired exactly once at the component top
 *      (matching the ReturnLetter / QuoteKeepsake / ThreadKeepsake
 *      pattern). The `pulse` callback is invoked from the copy handler
 *      so the resolved layer fires after the awaitable settles.
 *
 *   4. The bespoke `mirror-share-confirm` className is **gone** from the
 *      file. The `confirm` flag prop is **gone** from `IconBtn`. A future
 *      "special-feel" share button cannot revive the dialect by grep
 *      (Tanya UIX #99 §7 — *delete, do not tombstone*).
 *
 *   5. The COPY_TOAST_MS hand-rolled setTimeout cascade is gone — the
 *      dwell lives inside `useActionPhase` (`ACTION_HOLD_MS`). Mirrors
 *      the same fence the ReturnLetter graduation paid for.
 *
 *   6. Width discipline (Tanya UIX #99 §5): the tooltip carries a
 *      `min-w-[6.5rem]` so the chip width does not jitter between
 *      `Copy Link` (9 ch) and `Copied!` (7 ch). One Tailwind class.
 *
 * Test file is `.ts` (not `.tsx`); pure source-string lints — no DOM,
 * no React render, no Jest jsdom warmup. Same shape as
 * `ShareOverlay.gestures.test.ts` (the verb pin) and
 * `ReturnLetter.gestures.test.ts` (the action-swap precedent).
 *
 * Credits: Mike K. (architect napkin #100 — the per-file action-swap pin
 * shape, the four-block DoD this test inherits, the "delete-don't-tombstone"
 * call on the keyframe, the verb-floor discipline that lifts the fence
 * Axis E from 1 → 2), Tanya D. (UIX #99 — the felt-experience layer the
 * source pins protect, the icon-only / tooltip-as-label decision the
 * `labelMode='hidden'` prop encodes, the width-discipline `min-w-[6.5rem]`
 * fix for the chip jitter), Krystle C. (file pick, byte-identity unit-
 * test discipline), the existing `ShareOverlay.gestures.test.ts` (the
 * source-pin shape this file mirrors).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_PATH = join(__dirname, '..', 'ShareOverlay.tsx');
const SOURCE = readFileSync(SOURCE_PATH, 'utf8');

/** Lines that are not comment-only — drop // …, JSDoc * … and /* … prefixes. */
const NON_COMMENT_LINES = SOURCE.split('\n').filter((l) => {
  const t = l.trim();
  return !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
});

// ─── 1 · ActionPressable is the live-wired host for Copy Link ────────────

describe('ShareOverlay — `<ActionPressable>` is the Copy Link host', () => {
  it('opens an `<ActionPressable` JSX tag at least once in the file', () => {
    // Match the JSX opening (not the import + not a JSDoc reference). Since
    // `<` does not occur in the import line, anchoring on `<ActionPressable`
    // is enough to discriminate against the `import { ActionPressable }` line.
    const opens = NON_COMMENT_LINES.filter((l) => /<ActionPressable\b/.test(l));
    expect(opens.length).toBeGreaterThanOrEqual(1);
  });

  it('imports ActionPressable from the canonical seam', () => {
    expect(SOURCE).toMatch(
      /import\s*\{[^}]*\bActionPressable\b[^}]*\}\s*from\s*['"]@\/components\/shared\/ActionPressable['"]/,
    );
  });
});

// ─── 2 · Icon-row aesthetic preserved via labelMode="hidden" ─────────────

describe('ShareOverlay — Copy Link rides `variant="icon" labelMode="hidden"`', () => {
  it('the ActionPressable call site sets `variant="icon"`', () => {
    expect(SOURCE).toMatch(/variant=["']icon["']/);
  });

  it('the ActionPressable call site sets `labelMode="hidden"`', () => {
    expect(SOURCE).toMatch(/labelMode=["']hidden["']/);
  });

  it('the call site declares the canonical `idleLabel` / `settledLabel` pair', () => {
    expect(SOURCE).toMatch(/idleLabel=["']Copy Link["']/);
    expect(SOURCE).toMatch(/settledLabel=["']Copied!["']/);
  });
});

// ─── 3 · useActionPhase is the resolved-layer source ─────────────────────

describe('ShareOverlay — `useActionPhase` is wired through the call site', () => {
  it('imports useActionPhase from the canonical hook seam', () => {
    expect(SOURCE).toMatch(
      /import\s*\{[^}]*\buseActionPhase\b[^}]*\}\s*from\s*['"]@\/lib\/hooks\/useActionPhase['"]/,
    );
  });

  it('useActionPhase() is invoked exactly once at the component top', () => {
    const matches = SOURCE.match(/useActionPhase\s*\(/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('the copy handler calls `pulse(ok)` after the awaitable settles', () => {
    // The fail-quiet covenant: pulse(true) → settled, pulse(false) → idle.
    // Greppable so a future drift to a hand-rolled setTimeout cascade is
    // immediately visible (Tanya §3.3, Krystle's original spec).
    expect(SOURCE).toMatch(/pulse\s*\(\s*ok\s*\)/);
  });
});

// ─── 4 · The bespoke recipe is gone — delete, do not tombstone (§7) ──────

describe('ShareOverlay — the `mirror-share-confirm` dialect is retired', () => {
  it('no `mirror-share-confirm` className survives outside a comment line', () => {
    const offending = NON_COMMENT_LINES.filter((l) => /mirror-share-confirm/.test(l));
    expect(offending).toEqual([]);
  });

  it('no `confirm` JSX attribute survives on any IconBtn-shaped call site', () => {
    // The bespoke prop name lives in the historical commit. A future
    // contributor cannot revive the dialect by grep without going red.
    const offending = NON_COMMENT_LINES.filter((l) => /\bconfirm\s*=\s*\{/.test(l));
    expect(offending).toEqual([]);
  });
});

// ─── 5 · COPY_TOAST_MS cascade is gone — dwell lives in the primitive ───

describe('ShareOverlay — the bespoke COPY_TOAST_MS cascade is gone', () => {
  it('no `COPY_TOAST_MS` constant survives outside a comment line', () => {
    // The resolved-layer dwell now lives inside `useActionPhase`
    // (`ACTION_HOLD_MS`). Mirrors the ReturnLetter graduation fence.
    const offending = NON_COMMENT_LINES.filter((l) => /\bCOPY_TOAST_MS\b/.test(l));
    expect(offending).toEqual([]);
  });

  it('no `setTimeout` survives in the file (the primitive owns the timer)', () => {
    const offending = NON_COMMENT_LINES.filter((l) => /\bsetTimeout\b/.test(l));
    expect(offending).toEqual([]);
  });
});

// ─── 6 · Width discipline — tooltip min-width pins the chip ──────────────

describe('ShareOverlay — tooltip width is pinned across the verb swap', () => {
  it('the tooltip carries `min-w-[6.5rem]` (Tanya UIX #99 §5)', () => {
    expect(SOURCE).toMatch(/min-w-\[6\.5rem\]/);
  });
});

// ─── Sanity — the file scanned is non-empty ──────────────────────────────

describe('ShareOverlay.action — the test reads the right file', () => {
  it('the source path resolves and is non-empty', () => {
    expect(SOURCE.length).toBeGreaterThan(0);
  });

  it('the file is `use client` and exports a default React component', () => {
    expect(SOURCE).toMatch(/'use client'/);
    expect(SOURCE).toMatch(/export\s+default\s+function\s+ShareOverlay/);
  });
});
