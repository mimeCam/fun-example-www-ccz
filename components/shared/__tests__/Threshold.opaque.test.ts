/**
 * Threshold.opaque — per-file pin for the "Honest Doorway" snap.
 *
 * The Mirror chamber paints opaque (`bg-surface`, no `/N`); the chamber's
 * own `backdrop-blur-sm` retires alongside the alpha shorthand because
 * blur on an opaque fill is a dead compositor pass (Elon §3.1).
 * The backdrop scrim (`bg-void/65 backdrop-blur-sm`) is **load-bearing**
 * translucency and stays put — that is where the GPU blur produces visible
 * pixels (Tanya UIX #3 §3.2; Mike napkin "Honest Doorway" §1).
 *
 * The file leaves `ALPHA_COLOR_SHORTHAND_GRANDFATHERED_PATHS`. From this
 * commit forward `alpha-adoption.test.ts` enforces ledger snap on
 * `Threshold.tsx` site-wide; this per-file pin is the receipt for the snap
 * itself.
 *
 * Credits: Mike K. (architect napkin "Honest Doorway" — Path C, the
 * receipt-comment standard, and the per-file SSR pin shape), Tanya D.
 * (UIX #3 §1–§7 — the felt-experience teardown that reframed translucency
 * as the chamber arguing with itself; the doorway-not-window framing the
 * "held" posture inherits), Elon M. (first-principles fork that exposed
 * Path A's internal inconsistency — opaque chamber + GPU blur on dead
 * pixels), Paul K. (focus discipline; the held-for-later list that names
 * the temptations out loud), Krystle C. (one-rung-per-sprint cadence),
 * Sid (this lift — six LOC of production diff + this 30-LOC pin).
 */

import { __testing__ } from '../Threshold';

const { CHAMBER_BASE, BACKDROP_BASE } = __testing__;

// ─── 1 · Chamber paints opaque — the snap itself ──────────────────────────

describe('Threshold — chamber surface paints opaque (Path C)', () => {
  it('CHAMBER_BASE carries the default `bg-surface` class', () => {
    expect(CHAMBER_BASE).toContain('bg-surface ');
  });

  it('CHAMBER_BASE carries no color-alpha shorthand (no `/N`)', () => {
    expect(CHAMBER_BASE).not.toContain('bg-surface/');
    expect(CHAMBER_BASE).not.toMatch(/bg-[a-z]+\/\d+/);
  });

  it('CHAMBER_BASE drops the chamber-side `backdrop-blur-sm`', () => {
    expect(CHAMBER_BASE).not.toContain('backdrop-blur-sm');
    expect(CHAMBER_BASE).not.toContain('backdrop-blur');
  });

  it('CHAMBER_BASE preserves the held-posture invariants', () => {
    // Shadow + radius are now the sole carriers of "this is a held object."
    expect(CHAMBER_BASE).toContain('thermal-shadow');
    expect(CHAMBER_BASE).toContain('overflow-hidden');
    // Forced-colors door-frame (Tanya UX #53 §3.3) — preserved verbatim.
    expect(CHAMBER_BASE).toContain('forced-colors:outline');
    expect(CHAMBER_BASE).toContain('forced-colors:outline-2');
    expect(CHAMBER_BASE).toContain('forced-colors:outline-[CanvasText]');
  });
});

// ─── 2 · Backdrop scrim is load-bearing — DO NOT TOUCH ────────────────────

describe('Threshold — backdrop scrim keeps its translucent blur', () => {
  it('BACKDROP_BASE carries the void/65 + blur duet (Tanya UIX #3 §3.2)', () => {
    expect(BACKDROP_BASE).toContain('bg-void/65');
    expect(BACKDROP_BASE).toContain('backdrop-blur-sm');
  });

  it('BACKDROP_BASE keeps the reduced-motion fade endpoint', () => {
    expect(BACKDROP_BASE).toContain('motion-reduce:opacity-100');
  });
});

// ─── 3 · Drift sweep — the snapped surface carries zero off-ledger alpha ──

describe('Threshold — chamber surface shows zero off-ledger color-alpha', () => {
  it('no `/N` on any (bg|text|border|shadow) shorthand outside legal rungs', () => {
    const RX = /\b(?:bg|text|border|shadow)-[a-z]+\/(\d+)\b/g;
    const offLedger: string[] = [];
    for (const m of CHAMBER_BASE.matchAll(RX)) {
      // Legal rungs: 10/30/50/70 (+ /100 motion endpoint).
      if (![10, 30, 50, 70, 100].includes(Number(m[1]))) offLedger.push(m[0]);
    }
    expect(offLedger).toEqual([]);
  });
});
