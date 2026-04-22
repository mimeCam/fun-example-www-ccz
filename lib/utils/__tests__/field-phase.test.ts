/**
 * field-phase tests — lock the numeric invariants and the phase → style map.
 *
 * Mirrors press-phase.test.ts. Pure, no DOM, no React. Every design rule
 * either lives as a constant we assert or a behaviour we assert — nothing
 * survives as prose alone.
 *
 * Credits: Mike K. (rules-as-tests §4.1), Tanya D. (phase/style spec §4),
 * Paul K. (error-held semantics).
 */

import {
  FIELD_BORDER_MS,
  FIELD_ERROR_HOLD_MS,
  FIELD_ERROR_BUDGET_MS,
  fieldInvariantHolds,
  resolveFieldBorderColor,
  resolveFieldStyle,
  resolveFieldSizeClass,
  composeFieldClass,
  FIELD_BASE,
  FIELD_ERROR_CLASS,
} from '../field-phase';
import { PRESSABLE_DISABLED } from '../press-phase';

describe('field invariant', () => {
  it('border is positive and strictly less than error-hold', () => {
    expect(FIELD_BORDER_MS).toBeGreaterThan(0);
    expect(FIELD_BORDER_MS).toBeLessThan(FIELD_ERROR_HOLD_MS);
  });

  it('budget leaves at least one frame past error hold', () => {
    expect(FIELD_ERROR_BUDGET_MS).toBeGreaterThanOrEqual(FIELD_ERROR_HOLD_MS + 16);
  });

  it('fieldInvariantHolds() returns true', () => {
    expect(fieldInvariantHolds()).toBe(true);
  });
});

describe('resolveFieldBorderColor — phase → colour map', () => {
  it('rest reads --fog (the quiet default)', () => {
    expect(resolveFieldBorderColor('rest')).toContain('--fog');
  });

  it('focus mixes --token-accent — lockstep with Pressable focus tint', () => {
    expect(resolveFieldBorderColor('focus')).toContain('--token-accent');
  });

  it('error-held reads --rose — the single error hue', () => {
    expect(resolveFieldBorderColor('error-held')).toContain('--rose');
  });

  it('error-held never reads --token-accent (caret stays thermal, border does not)', () => {
    expect(resolveFieldBorderColor('error-held')).not.toContain('--token-accent');
  });
});

describe('resolveFieldStyle — phase × reduced → inline style', () => {
  it('rest returns no style so the resting element owns its look', () => {
    expect(resolveFieldStyle('rest', false)).toBeUndefined();
    expect(resolveFieldStyle('rest', true)).toBeUndefined();
  });

  it('focus writes transitionDuration = FIELD_BORDER_MS in motion mode', () => {
    const s = resolveFieldStyle('focus', false);
    expect(s?.transitionDuration).toBe(`${FIELD_BORDER_MS}ms`);
    expect(s?.borderColor).toContain('--token-accent');
  });

  it('reduced motion collapses duration but border colour still changes', () => {
    const s = resolveFieldStyle('focus', true);
    expect(s?.transitionDuration).toBe('10ms');
    expect(s?.borderColor).toContain('--token-accent');
  });

  it('error-held writes the rose border', () => {
    const s = resolveFieldStyle('error-held', false);
    expect(s?.borderColor).toContain('--rose');
  });

  it('easing reads the shared sys-ease-out (not a bespoke curve)', () => {
    const s = resolveFieldStyle('focus', false);
    expect(s?.transitionTimingFunction).toBe('var(--sys-ease-out)');
  });
});

describe('resolveFieldSizeClass — multiline uses rows, text uses min-height', () => {
  it('text at md meets the 44px mobile tap floor', () => {
    expect(resolveFieldSizeClass('text', 'md')).toContain('min-h-[44px]');
  });

  it('text at sm tightens to 36px', () => {
    expect(resolveFieldSizeClass('text', 'sm')).toContain('min-h-[36px]');
  });

  it('multiline omits min-height — rows carries the height', () => {
    expect(resolveFieldSizeClass('multiline', 'md')).not.toContain('min-h-');
  });
});

describe('composeFieldClass — deterministic ordering + shared disabled math', () => {
  it('base + size + variant extras + extra in that order', () => {
    const out = composeFieldClass({
      variant: 'multiline', size: 'md', disabled: false, invalid: false,
      extra: 'data-custom',
    });
    const iBase = out.indexOf('rounded-sys-medium');
    const iSize = out.indexOf('px-sys-4');
    const iExtras = out.indexOf('resize-none');
    const iExtra = out.indexOf('data-custom');
    expect(iBase).toBeGreaterThanOrEqual(0);
    expect(iSize).toBeGreaterThan(iBase);
    expect(iExtras).toBeGreaterThan(iSize);
    expect(iExtra).toBeGreaterThan(iExtras);
  });

  it('disabled reuses Pressable\'s exact disabled recipe (one bug-fix, two surfaces)', () => {
    const out = composeFieldClass({
      variant: 'text', size: 'md', disabled: true, invalid: false,
    });
    expect(out).toContain(PRESSABLE_DISABLED.split(' ')[0]);
    expect(out).toContain('cursor-not-allowed');
  });

  it('invalid swaps rest border/hover for the full-outline rose error class', () => {
    const out = composeFieldClass({
      variant: 'text', size: 'md', disabled: false, invalid: true,
    });
    expect(out).toContain(FIELD_ERROR_CLASS.split(' ')[0]);
    expect(out).not.toContain('hover:[border-color:color-mix');
  });

  it('base delegates caret/placeholder/selection to ambient-surfaces.css', () => {
    // Gesture-chrome is cascade-root territory (Jason F. / Tanya §3).
    // Per-field overrides would drift from the thermal band — the
    // adoption guard blocks that on purpose.
    expect(FIELD_BASE).not.toContain('caret-color');
    expect(FIELD_BASE).not.toContain('placeholder-');
    expect(FIELD_BASE).not.toContain('selection:');
  });

  it('multiline disables resize (autogrow is out of v1 scope per Tanya §6)', () => {
    const out = composeFieldClass({
      variant: 'multiline', size: 'md', disabled: false, invalid: false,
    });
    expect(out).toContain('resize-none');
  });
});
