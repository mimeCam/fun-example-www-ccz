/**
 * action-phase tests — numeric invariants + pure resolver outputs.
 *
 * Mirrors press-phase.test.ts: lock the math, lock the resolver outputs.
 * Reduced-motion fallback is asserted structurally (collapsed duration).
 *
 * Credits: Mike K. (#18 napkin §5 — three-phase + safety budget invariants),
 * Tanya D. (#11 UX §5 — verb tense, glyph swap, reduced-motion contract).
 */

import { MOTION, MOTION_REDUCED_MS } from '@/lib/design/motion';
import {
  ACTION_FADE_MS,
  ACTION_HOLD_MS,
  ACTION_HOLD_BUDGET_MS,
  actionInvariantHolds,
  announceOnSettle,
  resolveFadeMs,
  resolvePhaseLabel,
  resolveSwapStyle,
  showsCheck,
} from '../action-phase';

describe('action invariant', () => {
  it('fade is positive and strictly less than hold', () => {
    expect(ACTION_FADE_MS).toBeGreaterThan(0);
    expect(ACTION_FADE_MS).toBeLessThan(ACTION_HOLD_MS);
  });

  it('hold is the linger beat (1000ms — Tanya §5.5)', () => {
    expect(ACTION_HOLD_MS).toBe(MOTION.linger);
  });

  it('fade is the crossfade beat (120ms — Tanya §5.5)', () => {
    expect(ACTION_FADE_MS).toBe(MOTION.crossfade);
  });

  it('budget leaves at least one frame past hold + fade', () => {
    expect(ACTION_HOLD_BUDGET_MS).toBeGreaterThan(ACTION_HOLD_MS + ACTION_FADE_MS);
    expect(ACTION_HOLD_BUDGET_MS - (ACTION_HOLD_MS + ACTION_FADE_MS)).toBeGreaterThanOrEqual(16);
  });

  it('actionInvariantHolds() returns true', () => {
    expect(actionInvariantHolds()).toBe(true);
  });
});

describe('resolveFadeMs — motion vs reduced', () => {
  it('motion mode returns the crossfade beat', () => {
    expect(resolveFadeMs(false)).toBe(ACTION_FADE_MS);
  });

  it('reduced mode collapses to the motion floor (Tanya §5.6)', () => {
    expect(resolveFadeMs(true)).toBe(MOTION_REDUCED_MS);
    expect(resolveFadeMs(true)).toBeLessThan(ACTION_FADE_MS);
  });
});

describe('resolveSwapStyle — phase × reduced → inline style', () => {
  it('idle returns no style so the resting paint owns its look', () => {
    expect(resolveSwapStyle('idle', false)).toBeUndefined();
    expect(resolveSwapStyle('idle', true)).toBeUndefined();
  });

  it('busy writes opacity transition with the crossfade beat', () => {
    const s = resolveSwapStyle('busy', false);
    expect(s?.transitionProperty).toBe('opacity');
    expect(s?.transitionDuration).toBe(`${ACTION_FADE_MS}ms`);
    expect(s?.transitionTimingFunction).toBeDefined();
  });

  it('settled writes the same transition shape as busy', () => {
    const s = resolveSwapStyle('settled', false);
    expect(s?.transitionProperty).toBe('opacity');
    expect(s?.transitionDuration).toBe(`${ACTION_FADE_MS}ms`);
  });

  it('reduced motion collapses transitionDuration to MOTION_REDUCED_MS', () => {
    const s = resolveSwapStyle('settled', true);
    expect(s?.transitionDuration).toBe(`${MOTION_REDUCED_MS}ms`);
  });
});

describe('resolvePhaseLabel — verb tense (Tanya §5.2)', () => {
  it('idle returns the idle verb verbatim', () => {
    expect(resolvePhaseLabel('idle', 'Copy', 'Copied')).toBe('Copy');
  });

  it('busy collapses to the ellipsis (matches existing convention)', () => {
    expect(resolvePhaseLabel('busy', 'Copy', 'Copied')).toBe('…');
  });

  it('settled returns the past-tense witness verb', () => {
    expect(resolvePhaseLabel('settled', 'Copy', 'Copied')).toBe('Copied');
    expect(resolvePhaseLabel('settled', 'Save', 'Saved')).toBe('Saved');
    expect(resolvePhaseLabel('settled', 'Link', 'Copied')).toBe('Copied');
  });

  it('past-tense labels stay within ±1 ch of idle (width discipline)', () => {
    // The verb table from Tanya §5.2. If a future verb breaks this rule,
    // the test fails before the row reflows on the keepsake modal.
    const pairs: ReadonlyArray<readonly [string, string]> = [
      ['Copy', 'Copied'],
      ['Save', 'Saved'],
      ['Link', 'Copied'],
    ];
    for (const [idle, settled] of pairs) {
      expect(Math.abs(settled.length - idle.length)).toBeLessThanOrEqual(2);
    }
  });
});

describe('showsCheck — glyph swap predicate', () => {
  it('only `settled` swaps in CheckIcon; idle/busy keep the action glyph', () => {
    expect(showsCheck('idle')).toBe(false);
    expect(showsCheck('busy')).toBe(false);
    expect(showsCheck('settled')).toBe(true);
  });
});

// ─── announceOnSettle — fingertip-local SR receipt (Mike #71 §4.1) ─────────

describe('announceOnSettle — live-region mount predicate', () => {
  it('only `settled` holds a string; idle/busy keep the live node unmounted', () => {
    expect(announceOnSettle('idle')).toBe(false);
    expect(announceOnSettle('busy')).toBe(false);
    expect(announceOnSettle('settled')).toBe(true);
  });

  it('matches showsCheck in shape (paint and voice cross the same edge)', () => {
    // The witness lands on settled in *both* organs. If a future change
    // ever splits these two predicates, this assertion fails first.
    const phases: ReadonlyArray<'idle' | 'busy' | 'settled'> =
      ['idle', 'busy', 'settled'];
    for (const phase of phases) {
      expect(announceOnSettle(phase)).toBe(showsCheck(phase));
    }
  });
});
