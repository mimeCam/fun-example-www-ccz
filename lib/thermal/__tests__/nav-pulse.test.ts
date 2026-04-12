/**
 * Tests for navDotConfig — pure function mapping thermal state to dot layer config.
 *
 * Four states: dormant (core only), stirring (+ring), warm (+aura), luminous (+aura).
 */

import { navDotConfig } from '@/lib/thermal/nav-pulse';

describe('navDotConfig', () => {
  it('hides ring and aura at dormant', () => {
    expect(navDotConfig('dormant')).toEqual({ showRing: false, showAura: false });
  });

  it('shows ring only at stirring', () => {
    expect(navDotConfig('stirring')).toEqual({ showRing: true, showAura: false });
  });

  it('shows ring and aura at warm', () => {
    expect(navDotConfig('warm')).toEqual({ showRing: true, showAura: true });
  });

  it('shows ring and aura at luminous', () => {
    expect(navDotConfig('luminous')).toEqual({ showRing: true, showAura: true });
  });
});
