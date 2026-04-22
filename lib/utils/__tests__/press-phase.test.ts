/**
 * press-phase tests — the one numeric invariant + the variant surface map.
 *
 * Mirrors animation-phase.test.ts: lock the math, lock the resolver outputs.
 * Reduced-motion fallback is asserted structurally (no transform, opacity only).
 */

import {
  PRESS_DOWN_MS,
  PRESS_SETTLE_MS,
  PRESS_SETTLE_BUDGET_MS,
  pressInvariantHolds,
  resolvePressScale,
  resolvePressTransform,
  resolvePressStyle,
  resolveReducedPressStyle,
  resolveSizeClass,
  resolveVariantClass,
  composePressableClass,
  PRESSABLE_DISABLED,
} from '../press-phase';

describe('press invariant', () => {
  it('down is positive and strictly less than settle', () => {
    expect(PRESS_DOWN_MS).toBeGreaterThan(0);
    expect(PRESS_DOWN_MS).toBeLessThan(PRESS_SETTLE_MS);
  });

  it('budget leaves at least one frame past settle', () => {
    expect(PRESS_SETTLE_BUDGET_MS).toBeGreaterThanOrEqual(PRESS_SETTLE_MS + 16);
  });

  it('pressInvariantHolds() returns true', () => {
    expect(pressInvariantHolds()).toBe(true);
  });
});

describe('resolvePressScale — icon tightens harder than text', () => {
  it('icon scales deeper than 0.95', () => {
    expect(resolvePressScale('icon')).toBeLessThan(0.95);
  });

  it('solid/ghost share a gentle scale', () => {
    expect(resolvePressScale('solid')).toBe(resolvePressScale('ghost'));
    expect(resolvePressScale('solid')).toBeGreaterThan(0.97);
  });
});

describe('resolvePressTransform — motion vs reduced', () => {
  it('down yields a scale transform in motion mode', () => {
    expect(resolvePressTransform('down', 'solid', false)).toMatch(/scale\(/);
  });

  it('idle / settling yield no transform', () => {
    expect(resolvePressTransform('idle', 'solid', false)).toBeUndefined();
    expect(resolvePressTransform('settling', 'solid', false)).toBeUndefined();
  });

  it('reduced motion suppresses transform entirely', () => {
    expect(resolvePressTransform('down', 'solid', true)).toBeUndefined();
    expect(resolvePressTransform('down', 'icon', true)).toBeUndefined();
  });
});

describe('resolvePressStyle — phase × reduced → inline style', () => {
  it('idle returns no style so the resting element owns its look', () => {
    expect(resolvePressStyle('idle', 'solid', false)).toBeUndefined();
  });

  it('down writes transitionDuration = PRESS_DOWN_MS', () => {
    const s = resolvePressStyle('down', 'solid', false);
    expect(s?.transitionDuration).toBe(`${PRESS_DOWN_MS}ms`);
    expect(s?.transform).toMatch(/scale\(/);
  });

  it('settling writes transitionDuration = PRESS_SETTLE_MS', () => {
    const s = resolvePressStyle('settling', 'solid', false);
    expect(s?.transitionDuration).toBe(`${PRESS_SETTLE_MS}ms`);
  });

  it('reduced motion uses opacity-only branch', () => {
    const s = resolvePressStyle('down', 'solid', true);
    expect(s?.transform).toBeUndefined();
    expect(s?.opacity).toBe(0.85);
    expect(s?.transitionProperty).toBe('opacity');
  });
});

describe('resolveReducedPressStyle — idle has no style', () => {
  it('idle in reduced mode still returns undefined', () => {
    expect(resolveReducedPressStyle('idle')).toBeUndefined();
  });
});

describe('resolveSizeClass — icon is a fixed square', () => {
  it('icon overrides size (40x40)', () => {
    expect(resolveSizeClass('icon', 'md')).toContain('w-[40px]');
    expect(resolveSizeClass('icon', 'sm')).toContain('w-[40px]');
  });

  it('text buttons meet the 44px mobile tap floor at md', () => {
    expect(resolveSizeClass('solid', 'md')).toContain('min-h-[44px]');
  });
});

describe('resolveVariantClass — surface tokens, no per-caller overrides', () => {
  it('solid reads --token-accent for its background', () => {
    expect(resolveVariantClass('solid')).toContain('var(--token-accent)');
  });

  it('ghost has a transparent rest background', () => {
    expect(resolveVariantClass('ghost')).toContain('bg-transparent');
  });

  it('icon has no border chrome at rest', () => {
    expect(resolveVariantClass('icon')).toContain('border-0');
  });
});

describe('composePressableClass — deterministic ordering', () => {
  it('includes base + size + variant + extra in that order', () => {
    const out = composePressableClass({
      variant: 'solid', size: 'md', disabled: false, extra: 'data-custom',
    });
    const iBase = out.indexOf('thermal-radius');
    const iSize = out.indexOf('min-h-[44px]');
    const iVariant = out.indexOf('var(--token-accent)');
    const iExtra = out.indexOf('data-custom');
    expect(iBase).toBeGreaterThanOrEqual(0);
    expect(iSize).toBeGreaterThan(iBase);
    expect(iVariant).toBeGreaterThan(iSize);
    expect(iExtra).toBeGreaterThan(iVariant);
  });

  it('disabled appends the single shared disabled recipe', () => {
    const out = composePressableClass({
      variant: 'solid', size: 'md', disabled: true,
    });
    expect(out).toContain('cursor-not-allowed');
    expect(out).toContain(PRESSABLE_DISABLED.split(' ')[0]);
  });
});
