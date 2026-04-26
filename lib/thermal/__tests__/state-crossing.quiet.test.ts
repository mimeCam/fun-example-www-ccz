/**
 * state-crossing.quiet — subscription-side gate during the gifting phase.
 *
 * Locks down Mike's §6.3 cut: the bus continues to dispatch crossing events
 * (the gradient/thermal pipeline is load-bearing for the GoldenThread CSS),
 * but the listener wrapper installed by `onCrossing()` drops the payload
 * while `getCeremonyQuiet()` is `true`. No subscriber sees a crossing
 * during the keepsake reveal — by construction, not by per-call-site
 * `if (phase === 'gifting') return null` checks (that was the bug class
 * Tanya §2 surfaced).
 *
 * Mirrors the existing event-bus tests in `state-crossing.test.ts` — same
 * mock-window pattern, same describe shape — but pins the quiet-zone
 * behavior in its own file so the assertion surface is unambiguous and
 * a future contributor cannot remove it without a failing test.
 *
 * Credits: Mike K. (napkin §6.3 — subscription-side drop, gradient still
 * computes), Tanya D. (UX §4 — nothing else moves during gifting),
 * Elon M. (suppression by construction).
 */

import {
  emitCrossing,
  onCrossing,
  STATE_CROSSING_EVENT,
  type ThermalStateCrossing,
} from '../state-crossing';
import {
  setCeremonyQuiet,
  __resetCeremonyQuietForTest,
} from '@/lib/ceremony/quiet-store';

// ─── Window mock — same pattern as state-crossing.test.ts ──────────────────

interface MockWindow {
  dispatchEvent: (e: Event) => boolean;
  addEventListener: (type: string, fn: EventListener) => void;
  removeEventListener: (type: string, fn: EventListener) => void;
  __listeners: Map<string, Set<EventListener>>;
}

function installMockWindow(): MockWindow {
  const listeners = new Map<string, Set<EventListener>>();
  const get = (t: string): Set<EventListener> => {
    let s = listeners.get(t);
    if (!s) { s = new Set(); listeners.set(t, s); }
    return s;
  };
  const win: MockWindow = {
    dispatchEvent: (e) => { get(e.type).forEach((fn) => fn(e)); return true; },
    addEventListener:    (type, fn) => { get(type).add(fn); },
    removeEventListener: (type, fn) => { get(type).delete(fn); },
    __listeners: listeners,
  };
  (global as Record<string, unknown>).window = win;
  return win;
}

beforeEach(() => {
  __resetCeremonyQuietForTest();
  installMockWindow();
});

afterEach(() => {
  __resetCeremonyQuietForTest();
  delete (global as Record<string, unknown>).window;
});

// ─── Quiet-zone subscription drop ──────────────────────────────────────────

describe('onCrossing — drops payload while quiet', () => {
  it('handler does NOT fire when getCeremonyQuiet() is true at dispatch', () => {
    const handler = jest.fn();
    onCrossing(handler);
    setCeremonyQuiet(true);
    emitCrossing('dormant', 'stirring');
    expect(handler).not.toHaveBeenCalled();
  });

  it('handler fires when quiet flips back to false (room re-opens)', () => {
    const handler = jest.fn();
    onCrossing(handler);
    setCeremonyQuiet(true);
    emitCrossing('dormant', 'stirring'); // dropped
    setCeremonyQuiet(false);
    emitCrossing('stirring', 'warm');    // delivered
    expect(handler).toHaveBeenCalledTimes(1);
    const c = handler.mock.calls[0][0] as ThermalStateCrossing;
    expect(c.from).toBe('stirring');
    expect(c.to).toBe('warm');
  });

  it('drop is per-listener — every subscriber observes the same gate', () => {
    const a = jest.fn();
    const b = jest.fn();
    onCrossing(a);
    onCrossing(b);
    setCeremonyQuiet(true);
    emitCrossing('warm', 'luminous');
    expect(a).not.toHaveBeenCalled();
    expect(b).not.toHaveBeenCalled();
  });
});

// ─── Bus continuity — events still dispatch ────────────────────────────────

describe('state-crossing bus — continues to dispatch during quiet', () => {
  it('the window event still fires (gradient pipeline preserved)', () => {
    const raw = jest.fn();
    const win = (global as unknown as { window: MockWindow }).window;
    win.addEventListener(STATE_CROSSING_EVENT, raw as EventListener);
    setCeremonyQuiet(true);
    emitCrossing('dormant', 'stirring');
    // Raw window listener (bypassing onCrossing wrapper) still gets the
    // event; only `onCrossing()` subscribers are gated. This is the
    // "engine computes, only display defers" cut from Mike §6.3.
    expect(raw).toHaveBeenCalledTimes(1);
  });
});
