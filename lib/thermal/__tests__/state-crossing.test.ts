/**
 * State Crossing Test — crossing logic + CSS opacity sync guard.
 *
 * Two layers of coverage:
 *   1. Pure logic: crossingIntensity() returns the right tier per state pair.
 *   2. CSS sync: --crossing-peak-opacity-{subtle,present,radiant} in globals.css
 *      must match CROSSING_PEAK_OPACITY in state-crossing.ts.
 *
 * Same strategy as motion-sync.test.ts — plain regex read at test time.
 *
 * Credits: Mike K. (adoption guard spec — §5 in the napkin), Tanya D.
 * (UIX §3 intensity specs per crossing pair).
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  crossingIntensity,
  CROSSING_PEAK_OPACITY,
  STATE_CROSSING_EVENT,
  emitCrossing,
  onCrossing,
  type CrossingIntensity,
  type ThermalStateCrossing,
} from '../state-crossing';

const CSS = readFileSync(resolve(__dirname, '../../../app/globals.css'), 'utf-8');

// ─── CSS parser ─────────────────────────────────────────────────────────────

function readOpacityToken(tier: string): number | undefined {
  const rx = new RegExp(`--crossing-peak-opacity-${tier}:\\s*([\\d.]+)`);
  const m  = CSS.match(rx);
  return m ? Number(m[1]) : undefined;
}

// ─── Pure logic tests ────────────────────────────────────────────────────────

describe('crossingIntensity — forward crossing pairs', () => {
  it('dormant → stirring yields subtle', () => {
    expect(crossingIntensity('dormant', 'stirring')).toBe('subtle');
  });

  it('stirring → warm yields present', () => {
    expect(crossingIntensity('stirring', 'warm')).toBe('present');
  });

  it('warm → luminous yields radiant', () => {
    expect(crossingIntensity('warm', 'luminous')).toBe('radiant');
  });
});

describe('crossingIntensity — non-forward pairs return null', () => {
  it('reverse crossing: luminous → warm', () => {
    expect(crossingIntensity('luminous', 'warm')).toBeNull();
  });

  it('no-op: same state both sides', () => {
    expect(crossingIntensity('dormant', 'dormant')).toBeNull();
  });

  it('skip-level: dormant → warm (no direct crossing key)', () => {
    expect(crossingIntensity('dormant', 'warm')).toBeNull();
  });
});

// ─── CSS sync guard ──────────────────────────────────────────────────────────

describe('CROSSING_PEAK_OPACITY ↔ globals.css --crossing-peak-opacity-* sync', () => {
  (Object.keys(CROSSING_PEAK_OPACITY) as CrossingIntensity[]).forEach((tier) => {
    it(`CROSSING_PEAK_OPACITY.${tier} matches --crossing-peak-opacity-${tier}`, () => {
      expect(readOpacityToken(tier)).toBe(CROSSING_PEAK_OPACITY[tier]);
    });
  });

  it('every intensity tier has a CSS counterpart', () => {
    const tiers: CrossingIntensity[] = ['subtle', 'present', 'radiant'];
    tiers.forEach((t) => expect(readOpacityToken(t)).toBeDefined());
  });
});

// ─── Event bus ───────────────────────────────────────────────────────────────
// Node test environment has no window — install a minimal mock per test.

describe('emitCrossing + onCrossing event bus', () => {
  let events: Event[] = [];
  let mockWindow: {
    dispatchEvent: (e: Event) => boolean;
    addEventListener: jest.Mock;
    removeEventListener: jest.Mock;
  };

  beforeEach(() => {
    events = [];
    mockWindow = {
      dispatchEvent:      (e: Event) => { events.push(e); return true; },
      addEventListener:    jest.fn(),
      removeEventListener: jest.fn(),
    };
    // Install mock window so emitCrossing / onCrossing see a defined window.
    (global as Record<string, unknown>).window = mockWindow;
  });

  afterEach(() => {
    delete (global as Record<string, unknown>).window;
  });

  it('emits a CustomEvent with correct detail for a forward crossing', () => {
    emitCrossing('dormant', 'stirring');
    expect(events).toHaveLength(1);
    const e = events[0] as CustomEvent<ThermalStateCrossing>;
    expect(e.type).toBe(STATE_CROSSING_EVENT);
    expect(e.detail.from).toBe('dormant');
    expect(e.detail.to).toBe('stirring');
    expect(e.detail.intensity).toBe('subtle');
  });

  it('does not emit for a reverse crossing', () => {
    emitCrossing('warm', 'stirring');
    expect(events).toHaveLength(0);
  });

  it('onCrossing registers and returns a cleanup fn', () => {
    const handler = jest.fn();
    const off = onCrossing(handler);
    expect(mockWindow.addEventListener).toHaveBeenCalledWith(
      STATE_CROSSING_EVENT,
      expect.any(Function),
    );
    off();
    expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
      STATE_CROSSING_EVENT,
      expect.any(Function),
    );
  });
});

// ─── CROSSING_PEAK_OPACITY structural invariants ─────────────────────────────

describe('CROSSING_PEAK_OPACITY structural invariants', () => {
  it('all values are between 0 and 1', () => {
    Object.values(CROSSING_PEAK_OPACITY).forEach((v) => {
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });

  it('intensities are strictly ascending (subtle < present < radiant)', () => {
    const { subtle, present, radiant } = CROSSING_PEAK_OPACITY;
    expect(subtle).toBeLessThan(present);
    expect(present).toBeLessThan(radiant);
  });
});
