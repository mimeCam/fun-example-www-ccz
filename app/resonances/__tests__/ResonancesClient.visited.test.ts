/**
 * ResonancesClient · visited-launcher wiring — source-pin invariants.
 *
 * Source-pin via `readFileSync`. Pure-Node, no DOM, no React, no
 * test-renderer. The wiring claim is a structural one: a Set lives on
 * the parent, the parent passes `visited` + `onSaved` down to each
 * `<ResonanceEntry>`, refresh forgets (because the Set is `useState`,
 * not `localStorage`).
 *
 * What this suite locks down (Mike #31 §6 / Tanya #98 §6 — the parent-
 * owned, session-only contract):
 *
 *   §1 OWNER       — `useVisitedLaunchers()` is the single hook on the
 *                    parent. Returns `{ isVisited, markVisited }`.
 *                    Holds the Set in `useState`. ≤ 10 LOC.
 *   §2 NO PERSIST  — no `localStorage`, no `sessionStorage`, no
 *                    `quiet-store`, no new `lib/visited/` import. The
 *                    Set evaporates on tab close, by intent.
 *   §3 NO LEDGER   — no new ledger module. The Set lives next to the
 *                    page that owns the data, not as a sibling of
 *                    `quiet-store` / `toast-store`. Caller #2 earns
 *                    the lift, not this PR (rule of three).
 *   §4 PROP THREAD — the carrying section's `<ResonanceEntry>` call
 *                    threads `visited={isVisited(r.id)}` AND
 *                    `onSaved={() => markVisited(r.id)}`. The shaped
 *                    section's call does NOT — faded resonances do
 *                    not render the launcher (Tanya #98 §5).
 *   §5 LAUNCHER    — `<QuoteCardLauncher>` consumes `visited` and
 *                    routes through the `resolveLauncherPaint` resolver
 *                    (no inline `text-mist/70` / `text-gold/70` literal,
 *                    no fork to a `VisitedQuoteCardLauncher` variant).
 *
 * Render-tests deferred: they would re-test scroll-rise + thermal +
 * canvas under a node-environment Jest preset that does not currently
 * mount React. The wiring claim is structural and grep-able; a
 * future render-tested smoke can land in its own ticket if a second
 * caller earns it.
 *
 * Credits: Mike K. (#31 §6 module-map / §7 PoI #3 — Set lives on parent;
 * §10 — refusal of `lib/resonances/visited-store.ts`), Tanya D. (#98 §6
 * — session-scope contract / §11.6 — refresh resets feel correct, the
 * design-done gate), Sid (this fence; mirrors the `QuoteKeepsake.test.ts`
 * source-pin pattern).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const CLIENT_PATH = join(__dirname, '..', 'ResonancesClient.tsx');
const ENTRY_PATH  = join(__dirname, '..', 'ResonanceEntry.tsx');
const CLIENT_SRC  = readFileSync(CLIENT_PATH, 'utf8');
const ENTRY_SRC   = readFileSync(ENTRY_PATH,  'utf8');

// ─── §1 · Owner — the Set lives on the parent's useState ─────────────────

describe('ResonancesClient visited · §1 owner (parent-owned, single hook)', () => {
  it('declares `useVisitedLaunchers` as a local hook (no external import)', () => {
    expect(CLIENT_SRC).toMatch(/function\s+useVisitedLaunchers\b/);
    // The hook is local — not from `lib/visited/` or `lib/resonances/`.
    expect(CLIENT_SRC).not.toMatch(/from\s+['"]@\/lib\/visited\b/);
    expect(CLIENT_SRC).not.toMatch(/from\s+['"]@\/lib\/resonances\/visited-store/);
  });

  it('the hook holds the Set in useState (no module-level singleton)', () => {
    // The Set must be component-local React state. Module-level
    // `let visited = new Set()` survives navigation between pages —
    // exactly the cross-session leak the spec refuses.
    expect(CLIENT_SRC).toMatch(/useState<Set<string>>/);
  });

  it('the hook exposes `{ isVisited, markVisited }` (the two-verb surface)', () => {
    expect(CLIENT_SRC).toMatch(/return\s*\{\s*isVisited\s*,\s*markVisited\s*\}/);
  });

  it('the parent calls the hook exactly once', () => {
    // Negative lookbehind excludes the declaration `function useVisitedLaunchers()`
    // — we want the call-site count, not the declaration site.
    const calls = CLIENT_SRC.match(/(?<!function\s)useVisitedLaunchers\(\s*\)/g) ?? [];
    expect(calls.length).toBe(1);
  });
});

// ─── §2 · No persistence — refresh forgets, by intent ────────────────────

describe('ResonancesClient visited · §2 no persistence (session scope)', () => {
  it('no `localStorage` write inside `useVisitedLaunchers`', () => {
    // Grep the function body. `localStorage` may legitimately appear
    // *elsewhere* in this file (anon-id, mirror snapshot) but not on
    // the visited path.
    const start = CLIENT_SRC.search(/function\s+useVisitedLaunchers\b/);
    const tail  = CLIENT_SRC.slice(start);
    const next  = tail.slice(1).search(/\bfunction\s+\w+\b/);
    const body  = next < 0 ? tail : tail.slice(0, next + 1);
    expect(body).not.toMatch(/localStorage/);
    expect(body).not.toMatch(/sessionStorage/);
  });

  it('no quiet-store / toast-store import on this surface', () => {
    // Both ledgers exist for legitimate uses elsewhere; the visited
    // foreshadow is NOT one of them (Mike #31 §10 / Tanya #98 §6 —
    // no new ledger).
    expect(CLIENT_SRC).not.toMatch(/from\s+['"]@\/lib\/ceremony\/quiet-store/);
    expect(CLIENT_SRC).not.toMatch(/from\s+['"]@\/lib\/sharing\/toast-store/);
  });
});

// ─── §3 · No new ledger — the Set is local, not a sibling module ─────────

describe('ResonancesClient visited · §3 no new ledger module', () => {
  it('does NOT import a `visited-store` / `useVisited` module', () => {
    // Mike #31 §10 — the explicit refusal of the 9th ledger. Caller #2
    // earns the lift, not this PR.
    expect(CLIENT_SRC).not.toMatch(/visited-store/);
    expect(CLIENT_SRC).not.toMatch(/useVisited\b(?!Launchers)/);
  });
});

// ─── §4 · Prop thread — carrying threads, shaped does not ────────────────

describe('ResonancesClient visited · §4 prop thread (carrying-only)', () => {
  it('the carrying-section `<ResonanceEntry>` call threads `visited` + `onSaved`', () => {
    // Grep for the pair appearing on the same `<ResonanceEntry>` call
    // tree. The two attributes are textually adjacent in the source —
    // pin both to catch a half-thread (one without the other).
    expect(CLIENT_SRC).toMatch(/visited=\{isVisited\(r\.id\)\}/);
    expect(CLIENT_SRC).toMatch(/onSaved=\{\(\)\s*=>\s*markVisited\(r\.id\)\}/);
  });

  it('the shaped-section call does NOT thread `visited` / `onSaved`', () => {
    // Faded resonances do not render the launcher, by design (Tanya
    // §98 §5 — visited paint is launcher-only). Threading the props
    // through is dead weight that confuses future readers; refuse it.
    const shapedStart = CLIENT_SRC.indexOf("ResonanceSectionHeader label=\"what shaped you\"");
    expect(shapedStart).toBeGreaterThan(0);
    const shapedTail = CLIENT_SRC.slice(shapedStart);
    // Within the shaped section, the next ResonanceEntry call must not
    // carry `visited=` or `onSaved=` props.
    const nextEntryStart = shapedTail.indexOf('<ResonanceEntry');
    const nextEntryEnd   = shapedTail.indexOf('/>', nextEntryStart);
    const shapedEntry    = shapedTail.slice(nextEntryStart, nextEntryEnd);
    expect(shapedEntry).not.toMatch(/\bvisited=/);
    expect(shapedEntry).not.toMatch(/\bonSaved=/);
  });
});

// ─── §5 · Launcher — consumes visited via the resolver, no inline literal ─

describe('ResonancesClient visited · §5 launcher (resolver-routed paint)', () => {
  it('ResonanceEntry imports `resolveLauncherPaint` from the lib', () => {
    expect(ENTRY_SRC).toMatch(
      /from\s+['"]@\/lib\/resonances\/visited-launcher['"]/,
    );
    expect(ENTRY_SRC).toMatch(/\bresolveLauncherPaint\b/);
  });

  it('QuoteCardLauncher accepts `visited` and routes paint through the resolver', () => {
    // Pin the prop signature and the call site. The resolver is the
    // one place the rung+colour decision lives; the launcher must NOT
    // hardcode a `text-gold/70` literal here — drift would silently
    // out-rank the resolver's audit-driven choice.
    const idx = ENTRY_SRC.search(/function\s+QuoteCardLauncher\b/);
    const tail = ENTRY_SRC.slice(idx);
    const end = tail.search(/\n\}\n/);
    const body = end < 0 ? tail : tail.slice(0, end);
    expect(body).toMatch(/visited\?\s*:\s*boolean/);
    expect(body).toMatch(/resolveLauncherPaint\(/);
    // No inline literal — the resolver owns the paint.
    expect(body).not.toMatch(/text-gold\/\d+/);
    expect(body).not.toMatch(/text-mist\/\d+/);
  });

  it('ResonanceEntry forwards `visited` to the launcher and `onSaved` to the keepsake', () => {
    expect(ENTRY_SRC).toMatch(/<QuoteCardLauncher\s+onOpen=\{[^}]+\}\s+visited=\{visited\}/);
    expect(ENTRY_SRC).toMatch(/<QuoteKeepsake[\s\S]*?onSaved=\{onSaved\}/);
  });
});
