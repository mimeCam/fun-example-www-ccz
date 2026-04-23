/**
 * toast-store — pub/sub + single-slot semantics.
 *
 * What this test pins down:
 *  - publish-then-read: `toastShow` writes the slot synchronously
 *  - replacement: a second `toastShow` evicts the first (n=1, no queue)
 *  - monotone ids: each show gets a fresh id; no recycling
 *  - dismiss-by-id: a stale handle's `dismiss()` cannot evict a replacement
 *  - subscription fan-out: every listener receives every change
 *  - default durations: 2000 confirm / 3000 warn
 *  - SSR-safe initial state: `getCurrentToast()` returns null on cold module
 */

import {
  toastShow, toastDismiss, subscribeToast, getCurrentToast,
  __resetToastStoreForTest, DEFAULT_DURATIONS,
} from '@/lib/sharing/toast-store';

beforeEach(() => __resetToastStoreForTest());

describe('toast-store — single slot, pub/sub', () => {
  it('starts empty (SSR-safe initial state)', () => {
    expect(getCurrentToast()).toBeNull();
  });

  it('toastShow writes the slot synchronously', () => {
    const handle = toastShow({ message: 'Copied.' });
    const slot = getCurrentToast();
    expect(slot?.id).toBe(handle.id);
    expect(slot?.message).toBe('Copied.');
    expect(slot?.intent).toBe('confirm');
  });

  it('replacement: a second toastShow evicts the first (no queue)', () => {
    toastShow({ message: 'A' });
    const second = toastShow({ message: 'B' });
    const slot = getCurrentToast();
    expect(slot?.id).toBe(second.id);
    expect(slot?.message).toBe('B');
  });

  it('monotone ids — each show gets a fresh id', () => {
    const a = toastShow({ message: 'A' });
    const b = toastShow({ message: 'B' });
    expect(b.id).toBeGreaterThan(a.id);
  });
});

describe('toast-store — defaults + dismiss', () => {
  it('default duration is 2000ms for confirm, 3000ms for warn', () => {
    expect(DEFAULT_DURATIONS.confirm).toBe(2000);
    expect(DEFAULT_DURATIONS.warn).toBe(3000);
  });

  it('explicit durationMs is preserved on the slot', () => {
    toastShow({ message: 'x', durationMs: 5000 });
    expect(getCurrentToast()?.durationMs).toBe(5000);
  });

  it('toastDismiss(id) clears only when id matches current slot', () => {
    const a = toastShow({ message: 'A' });
    toastDismiss(a.id + 999); // stale id
    expect(getCurrentToast()?.id).toBe(a.id);
    toastDismiss(a.id);
    expect(getCurrentToast()).toBeNull();
  });

  it('a stale handle cannot evict its replacement', () => {
    const first = toastShow({ message: 'A' });
    toastShow({ message: 'B' });
    first.dismiss(); // stale
    expect(getCurrentToast()?.message).toBe('B');
  });

  it('toastDismiss() with no id clears whatever is current', () => {
    toastShow({ message: 'A' });
    toastDismiss();
    expect(getCurrentToast()).toBeNull();
  });
});

describe('toast-store — listeners', () => {
  it('subscribers receive every slot change (set + clear)', () => {
    const log: (string | null)[] = [];
    const off = subscribeToast((slot) => log.push(slot?.message ?? null));
    toastShow({ message: 'A' });
    toastShow({ message: 'B' });
    toastDismiss();
    off();
    expect(log).toEqual(['A', 'B', null]);
  });

  it('unsubscribed listeners stop receiving updates', () => {
    let count = 0;
    const off = subscribeToast(() => { count += 1; });
    off();
    toastShow({ message: 'X' });
    expect(count).toBe(0);
  });

  it('a listener that unsubscribes during fan-out does not cause a throw', () => {
    let off: (() => void) | undefined;
    let receivedB = false;
    off = subscribeToast(() => { off?.(); });
    subscribeToast((slot) => { if (slot?.message === 'A') receivedB = true; });
    expect(() => toastShow({ message: 'A' })).not.toThrow();
    expect(receivedB).toBe(true);
  });
});
