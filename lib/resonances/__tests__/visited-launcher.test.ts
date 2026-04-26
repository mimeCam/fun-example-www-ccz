/**
 * visited-launcher · resolver invariants + snapshot.
 *
 * Pure-Jest, no DOM, no React, no canvas. The resolver is a one-boolean
 * pure function; this suite locks down its shape:
 *
 *   §1 SHAPE      — `false` → mist rest, `true` → gold visited; both
 *                   strings are Tailwind text-class literals on the ledger.
 *   §2 LEDGER     — `VISITED_RUNG` and `REST_RUNG` are alpha-ledger rungs;
 *                   recognition rung lives in {recede, quiet} (loud-enough
 *                   to glance; never `hairline`/`muted`).
 *   §3 INVARIANT  — `visitedLauncherInvariantHolds()` is true.
 *   §4 FAMILY     — rest and visited share a rung; recognition is carried
 *                   by colour family (mist → gold), not by rung jump.
 *
 * NOTE: §3 also includes a snapshot of the literal class strings the
 * resolver emits, so a future PR that quietly retargets gold to amber
 * (or mist to fog) trips a red snapshot diff before the colour family
 * shifts on the screen.
 *
 * Credits: Tanya D. (#98 §11 — definition of design-done, the rung
 * fence), Mike K. (#31 §3 — resolver shape; §7 PoI #4 — paint resolver
 * is one pure function, snapshot-tested), Sid (this fence).
 */

import {
  ALPHA_ORDER, alphaClassOf, ALPHA, type AlphaRung,
} from '@/lib/design/alpha';
import {
  REST_RUNG, VISITED_RUNG,
  resolveLauncherPaint,
  visitedLauncherInvariantHolds,
} from '../visited-launcher';

// ─── §1 · Shape — boolean in, ledger string out ──────────────────────────

describe('visited-launcher · §1 shape (one boolean → one ledger class)', () => {
  it('rest (false) paints mist at the REST_RUNG', () => {
    expect(resolveLauncherPaint(false))
      .toBe(alphaClassOf('mist', REST_RUNG, 'text'));
  });

  it('visited (true) paints gold at the VISITED_RUNG', () => {
    expect(resolveLauncherPaint(true))
      .toBe(alphaClassOf('gold', VISITED_RUNG, 'text'));
  });

  it('both outputs are JIT-visible literals (start with `text-`)', () => {
    expect(resolveLauncherPaint(false)).toMatch(/^text-mist\/\d+$/);
    expect(resolveLauncherPaint(true)).toMatch(/^text-gold\/\d+$/);
  });
});

// ─── §2 · Ledger — rungs live in the alpha-ledger glance band ────────────

describe('visited-launcher · §2 ledger (rungs live in {recede, quiet})', () => {
  it('VISITED_RUNG is on the alpha ledger', () => {
    expect(ALPHA_ORDER as readonly AlphaRung[]).toContain(VISITED_RUNG);
  });

  it('REST_RUNG is on the alpha ledger', () => {
    expect(ALPHA_ORDER as readonly AlphaRung[]).toContain(REST_RUNG);
  });

  it('VISITED_RUNG ∈ {recede, quiet} — never `hairline`/`muted` (Tanya §11.1)', () => {
    // Recognition must be glanceable. `hairline` (0.10) and `muted`
    // (0.30) are ambient-chrome rungs — the eye skips past them. The
    // visited launcher fails the recognition test (§7 of #98) at those
    // rungs even before contrast.
    expect(['recede', 'quiet']).toContain(VISITED_RUNG);
  });

  it('VISITED_RUNG numeric alpha is in (0, 1) — not a Motion endpoint', () => {
    const a = ALPHA[VISITED_RUNG];
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThan(1);
  });
});

// ─── §3 · Invariant + snapshot — the function obeys its own contract ─────

describe('visited-launcher · §3 invariant + snapshot', () => {
  it('visitedLauncherInvariantHolds() is true', () => {
    expect(visitedLauncherInvariantHolds()).toBe(true);
  });

  it('rest paint snapshot — text-mist at quiet rung', () => {
    // The literal: a future palette nudge or rung shift trips this line.
    expect(resolveLauncherPaint(false)).toBe('text-mist/70');
  });

  it('visited paint snapshot — text-gold at quiet rung', () => {
    // The literal: a quiet-rung step-down to recede (or step-up off the
    // ledger) trips this line. Update with a deliberate palette review.
    expect(resolveLauncherPaint(true)).toBe('text-gold/70');
  });
});

// ─── §4 · Family resemblance — rest and visited share a rung ─────────────

describe('visited-launcher · §4 family (recognition carried by colour, not rung)', () => {
  it('rest and visited share a rung — no rung jump on save', () => {
    // The reader's recognition lives in the colour family swap (mist →
    // gold). A rung jump on top of the family swap reads as "a new
    // element entered the room" — exactly the failure mode Paul named
    // (#54 "clamouring for attention"). One degree of freedom only.
    expect(REST_RUNG).toBe(VISITED_RUNG);
  });

  it('outputs differ — recognition is non-trivial (Tanya §7 step 4)', () => {
    expect(resolveLauncherPaint(false))
      .not.toBe(resolveLauncherPaint(true));
  });
});
