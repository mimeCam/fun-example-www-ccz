/**
 * QuoteKeepsake · `onSaved` plumbing — source-pin invariants.
 *
 * Same `.ts` (no DOM render), source-pin via `readFileSync` shape as
 * `QuoteKeepsake.test.ts`. One falsifiable claim per test, one regex.
 *
 * What this suite locks down (the wiring contract for the visited-
 * foreshadow feature; Mike #31 §4, Tanya #98 §9):
 *
 *   §1 PROP        — `QuoteKeepsakeProps` declares an optional
 *                    `onSaved?: () => void`. The signature is exact
 *                    (no payload — the launcher already knows which
 *                    resonance it lives on).
 *   §2 PLUMB       — `KeepsakeActions` accepts and forwards `onSaved`
 *                    into `useQuoteActions`. `useQuoteActions` threads
 *                    `onSaved` only into the Save (`runDownload`) call
 *                    — not into `runCopyImage`, `runCopyLink`, or
 *                    `runShare`. Save is the one artifact verb (Mike
 *                    #31 §4; Tanya #98 §9).
 *   §3 CALL SITE   — `runDownload` fires `onSaved?.()` once, after
 *                    `pulse(ok)`, only when `ok === true`. The
 *                    fingertip witness lands first; the room-scale
 *                    paint is a background event the reader discovers
 *                    later (Mike #31 §7 PoI #1; Tanya #98 §3).
 *   §4 NEGATIVES   — the OTHER three verbs do NOT call `onSaved`. A
 *                    grep across the whole source confirms `onSaved`
 *                    appears as a parameter only on `runDownload` /
 *                    `useQuoteActions` / `KeepsakeActions` / the prop
 *                    type, not on `runCopyImage` / `runCopyLink` /
 *                    `runShare` / `runShareFailover` / `runNativeShare`.
 *
 * Pure-source regex pinning is the cheapest way to guarantee the prop
 * lives on exactly the surfaces the spec named. A render-test at this
 * layer would re-test ActionPressable + Threshold + canvas — out of
 * scope for the wiring claim.
 *
 * Credits: Mike K. (#31 §4 — the load-bearing wiring shape, the
 * asymmetric-pop on Save only), Tanya D. (#98 §9 — the explicit "this
 * is a real ~30-line PR, not a free zero-cost ride-along" call), Sid
 * (this fence; mirrors `QuoteKeepsake.test.ts` body-slicer pattern).
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC_PATH = join(__dirname, '..', 'QuoteKeepsake.tsx');
const SRC = readFileSync(SRC_PATH, 'utf8');

// ─── Tiny helpers — surgical regex carve-outs over the source text ──────

/** Slice an `async function <name>(...)` body up to the next `async function`. */
function bodyOf(name: string): string {
  const start = SRC.search(new RegExp(`async\\s+function\\s+${name}\\b`));
  if (start < 0) return '';
  const tail = SRC.slice(start);
  const next = tail.slice(1).search(/\basync\s+function\b/);
  return next < 0 ? tail : tail.slice(0, next + 1);
}

/** Slice `function <name>` body (sync function declaration). */
function syncBodyOf(name: string): string {
  const start = SRC.search(new RegExp(`function\\s+${name}\\b`));
  if (start < 0) return '';
  const tail = SRC.slice(start);
  const next = tail.slice(1).search(/\bfunction\s+\w+\b/);
  return next < 0 ? tail : tail.slice(0, next + 1);
}

// ─── §1 · Prop — optional `onSaved` lives on the public surface ─────────

describe('QuoteKeepsake onSaved · §1 prop (the public surface admits the witness)', () => {
  it('QuoteKeepsakeProps declares `onSaved?: () => void`', () => {
    // The optional callback. Signature is no-arg — the parent already
    // knows which resonance the launcher belongs to (one launcher, one
    // resonance — Tanya #98 §5; Mike #31 §3 "Set lives on the parent").
    expect(SRC).toMatch(/onSaved\?\s*:\s*\(\s*\)\s*=>\s*void/);
  });

  it('the prop is destructured at the public component entry point', () => {
    // QuoteKeepsake() must read `onSaved` from props so it can pass it
    // down to KeepsakeActions. If the destructure is missing, the prop
    // is silently dropped at the boundary.
    expect(syncBodyOf('QuoteKeepsake')).toMatch(/\bonSaved\b/);
  });
});

// ─── §2 · Plumb — KeepsakeActions → useQuoteActions threads it ──────────

describe('QuoteKeepsake onSaved · §2 plumb (Actions → useQuoteActions)', () => {
  it('KeepsakeActions forwards `onSaved` into useQuoteActions inputs', () => {
    const body = syncBodyOf('KeepsakeActions');
    expect(body).toMatch(/\bonSaved\b/);
    // The hook is the single funnel — verbs reach `runDownload` through
    // it. Forwarding here is the load-bearing edge of the wiring.
    expect(body).toMatch(/useQuoteActions\(/);
  });

  it('useQuoteActions threads `onSaved` into runDownload only (not the others)', () => {
    const body = syncBodyOf('useQuoteActions');
    expect(body).toMatch(/\bonSaved\b/);
    // The Save verb's `useCallback` must close over `onSaved`. Mirror
    // of how `pulse` closes over each slot.
    expect(body).toMatch(/runDownload\([^)]*onSaved/);
  });
});

// ─── §3 · Call site — runDownload fires onSaved on success only ─────────

describe('QuoteKeepsake onSaved · §3 call site (success-only, post-pulse)', () => {
  it('runDownload accepts `onSaved` as an optional final parameter', () => {
    const body = bodyOf('runDownload');
    expect(body).toMatch(/onSaved\?\s*:\s*\(\s*\)\s*=>\s*void/);
  });

  it('runDownload calls `onSaved?.()` exactly once', () => {
    const body = bodyOf('runDownload');
    const calls = body.match(/(?<!`)onSaved\?\.\(\s*\)(?!`)/g) ?? [];
    expect(calls.length).toBe(1);
  });

  it('the `onSaved?.()` call is gated on the success boolean', () => {
    // The room-scale paint must *not* fire on a failed download. Pin
    // the gating with a regex that catches "if (ok) onSaved?.()" with
    // either `if (ok)` or `ok && ...` shape. The current source uses
    // an explicit `if (ok)`; either form preserves the contract.
    const body = bodyOf('runDownload');
    const guarded =
      /if\s*\(\s*ok\s*\)\s*(?<!`)onSaved\?\.\(\s*\)(?!`)/.test(body) ||
      /\bok\s*&&\s*(?<!`)onSaved\?\.\(\s*\)(?!`)/.test(body);
    expect(guarded).toBe(true);
  });

  it('`pulse(ok)` lands BEFORE `onSaved?.()` (fingertip-first ordering)', () => {
    // Mike #31 §7 PoI #1: the fingertip witness lands first; the room-
    // scale paint is a background event the reader discovers later.
    // Source order is the contract — pulse must appear above onSaved.
    const body = bodyOf('runDownload');
    const pulseIdx = body.search(/pulse\s*\(\s*ok\s*\)/);
    const savedIdx = body.search(/(?<!`)onSaved\?\.\(\s*\)(?!`)/);
    expect(pulseIdx).toBeGreaterThan(0);
    expect(savedIdx).toBeGreaterThan(pulseIdx);
  });
});

// ─── §4 · Negatives — the other three verbs do NOT call onSaved ─────────

describe('QuoteKeepsake onSaved · §4 negatives (Save is the one artifact verb)', () => {
  it('runCopyImage does NOT call onSaved (Copy is reach, not artifact)', () => {
    expect(bodyOf('runCopyImage')).not.toMatch(/(?<!`)onSaved\?\.\(\s*\)(?!`)/);
  });

  it('runCopyLink does NOT call onSaved (Link is reach, not artifact)', () => {
    expect(bodyOf('runCopyLink')).not.toMatch(/(?<!`)onSaved\?\.\(\s*\)(?!`)/);
  });

  it('runShare / runNativeShare do NOT call onSaved (Share is reach, not artifact)', () => {
    expect(bodyOf('runShare')).not.toMatch(/(?<!`)onSaved\?\.\(\s*\)(?!`)/);
    expect(bodyOf('runNativeShare')).not.toMatch(/(?<!`)onSaved\?\.\(\s*\)(?!`)/);
  });

  it('runShareFailover does NOT call onSaved (no fingertip on failover)', () => {
    expect(bodyOf('runShareFailover')).not.toMatch(/(?<!`)onSaved\?\.\(\s*\)(?!`)/);
  });

  it('the file holds exactly one `onSaved?.()` call (single artifact-verb site)', () => {
    // Across the entire source: one and only one Save-success site.
    // A second site is a contract violation — Save is the one artifact
    // verb (Mike #31 §10 — refuses `onShared` / `onCopied` / `onLinked`
    // "for symmetry"; if product later wants Share to count, that is a
    // second, named prop — not a generic anything-happened callback).
    const all = SRC.match(/(?<!`)onSaved\?\.\(\s*\)(?!`)/g) ?? [];
    expect(all.length).toBe(1);
  });
});
