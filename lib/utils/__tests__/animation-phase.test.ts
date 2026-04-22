/**
 * animation-phase tests — the one numeric invariant that matters.
 *
 * Per Elon (report 99): the only novel guarantee worth encoding is that
 * the backdrop starts later than the chamber and both finish together.
 * Everything else is a pure variant → className map.
 */

import {
  BACKDROP_EXIT_DELAY_MS,
  BACKDROP_EXIT_MS,
  CHAMBER_EXIT_MS,
  EXIT_SETTLE_BUDGET_MS,
  resolveBackdropAnimationClass,
  resolveBackdropStyle,
  resolveChamberAnimationClass,
  resolveChamberExitStyle,
  resolveEntranceClass,
  resolveExitClass,
  staggerInvariantHolds,
} from '../animation-phase';

describe('stagger invariant', () => {
  it('backdrop delay is positive and strictly less than chamber duration', () => {
    expect(BACKDROP_EXIT_DELAY_MS).toBeGreaterThan(0);
    expect(BACKDROP_EXIT_DELAY_MS).toBeLessThan(CHAMBER_EXIT_MS);
  });

  it('backdrop delay + fade fills exactly the chamber budget', () => {
    expect(BACKDROP_EXIT_DELAY_MS + BACKDROP_EXIT_MS).toBe(CHAMBER_EXIT_MS);
  });

  it('staggerInvariantHolds() returns true', () => {
    expect(staggerInvariantHolds()).toBe(true);
  });

  it('exit settle budget is at least the chamber duration + one frame', () => {
    expect(EXIT_SETTLE_BUDGET_MS).toBeGreaterThanOrEqual(CHAMBER_EXIT_MS + 16);
  });
});

describe('entrance class resolution', () => {
  it('drawer-right gets the slide-in keyframe when motion allowed', () => {
    expect(resolveEntranceClass('drawer-right', false)).toBe('animate-slide-in-right');
  });

  it('center gets the fade-in keyframe when motion allowed', () => {
    expect(resolveEntranceClass('center', false)).toBe('animate-fade-in');
  });

  it('reduced motion collapses entrance to a motion-safe class', () => {
    expect(resolveEntranceClass('drawer-right', true)).toBe('motion-safe:animate-fade-in');
    expect(resolveEntranceClass('center', true)).toBe('motion-safe:animate-fade-in');
  });
});

describe('exit class resolution', () => {
  it('drawer-right uses the existing slide-out keyframe', () => {
    expect(resolveExitClass('drawer-right', false)).toBe('animate-slide-out-right');
  });

  it('center uses the existing fade-out keyframe', () => {
    expect(resolveExitClass('center', false)).toBe('animate-fade-out');
  });

  it('reduced motion yields no class — unmount is instant', () => {
    expect(resolveExitClass('center', true)).toBe('');
    expect(resolveExitClass('drawer-right', true)).toBe('');
  });
});

describe('resolveChamberAnimationClass — phase router', () => {
  it('opening → entrance class', () => {
    expect(resolveChamberAnimationClass('opening', 'center', false))
      .toBe('animate-fade-in');
  });

  it('closing → exit class', () => {
    expect(resolveChamberAnimationClass('closing', 'drawer-right', false))
      .toBe('animate-slide-out-right');
  });

  it('open / closed → no animation', () => {
    expect(resolveChamberAnimationClass('open', 'center', false)).toBe('');
    expect(resolveChamberAnimationClass('closed', 'drawer-right', false)).toBe('');
  });
});

describe('resolveBackdropAnimationClass', () => {
  it('opening fades in', () => {
    expect(resolveBackdropAnimationClass('opening', false)).toBe('animate-fade-in');
  });

  it('closing fades out + pins to opacity-0 so no flicker at animation end', () => {
    expect(resolveBackdropAnimationClass('closing', false)).toContain('animate-fade-out');
    expect(resolveBackdropAnimationClass('closing', false)).toContain('opacity-0');
  });

  it('reduced motion pins opacity-100 — no fade, no stagger', () => {
    expect(resolveBackdropAnimationClass('opening', true)).toBe('motion-reduce:opacity-100');
  });
});

describe('resolveBackdropStyle — the stagger lives here', () => {
  it('applies animationDelay only during closing phase', () => {
    expect(resolveBackdropStyle('opening', false)).toBeUndefined();
    expect(resolveBackdropStyle('open', false)).toBeUndefined();
    expect(resolveBackdropStyle('closed', false)).toBeUndefined();
    const style = resolveBackdropStyle('closing', false);
    expect(style?.animationDelay).toBe(`${BACKDROP_EXIT_DELAY_MS}ms`);
    expect(style?.animationDuration).toBe(`${BACKDROP_EXIT_MS}ms`);
    expect(style?.animationFillMode).toBe('forwards');
  });

  it('reduced motion skips the inline style entirely', () => {
    expect(resolveBackdropStyle('closing', true)).toBeUndefined();
  });
});

describe('resolveChamberExitStyle — normalise duration + lead border fade', () => {
  it('only populated during closing, only if motion allowed', () => {
    expect(resolveChamberExitStyle('closing', true)).toBeUndefined();
    expect(resolveChamberExitStyle('open', false)).toBeUndefined();
    expect(resolveChamberExitStyle('opening', false)).toBeUndefined();
    expect(resolveChamberExitStyle('closed', false)).toBeUndefined();
  });

  it('normalises animationDuration to CHAMBER_EXIT_MS (so center fades in 150ms)', () => {
    const style = resolveChamberExitStyle('closing', false);
    expect(style?.animationDuration).toBe(`${CHAMBER_EXIT_MS}ms`);
  });

  it('dissolves the border to transparent with a short linear transition', () => {
    const style = resolveChamberExitStyle('closing', false);
    expect(style?.borderColor).toBe('transparent');
    expect(style?.transition).toMatch(/border-color\s+\d+ms/);
  });
});
