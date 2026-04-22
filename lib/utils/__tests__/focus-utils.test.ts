/**
 * focus-utils tests — no jsdom, minimal DOM-shape mocks.
 *
 * We verify trapTab's cycling logic + getFocusableElements filter
 * semantics without pulling in a real browser. The point of these
 * helpers is that they're small, pure, and cheap to prove.
 */

import {
  getFocusableElements,
  trapTab,
  captureOpener,
  restoreFocus,
} from '../focus-utils';

// ─── Tiny fake element factory ───────────────────────────────────────────

interface FakeEl {
  hidden: boolean;
  offsetParent: unknown;
  getAttribute(name: string): string | null;
  getClientRects(): unknown[];
  focus(options?: unknown): void;
  _focused?: number;
}

function fakeEl(partial: Partial<FakeEl> = {}): FakeEl {
  const el: FakeEl = {
    hidden: false,
    offsetParent: {},
    getAttribute: () => null,
    getClientRects: () => [{}],
    focus() { this._focused = (this._focused ?? 0) + 1; },
    ...partial,
  };
  return el;
}

function fakeContainer(children: FakeEl[]): HTMLElement {
  return { querySelectorAll: () => children } as unknown as HTMLElement;
}

// ─── getFocusableElements ────────────────────────────────────────────────

describe('getFocusableElements', () => {
  it('returns empty for null root', () => {
    expect(getFocusableElements(null)).toEqual([]);
  });

  it('skips hidden + aria-hidden + zero-rect', () => {
    const visible = fakeEl();
    const hidden = fakeEl({ hidden: true });
    const ariaHidden = fakeEl({ getAttribute: (n) => n === 'aria-hidden' ? 'true' : null });
    const gone = fakeEl({ offsetParent: null, getClientRects: () => [] });
    const list = getFocusableElements(fakeContainer([visible, hidden, ariaHidden, gone] as unknown as FakeEl[]));
    expect(list).toHaveLength(1);
    expect(list[0]).toBe(visible);
  });
});

// ─── trapTab ──────────────────────────────────────────────────────────────

interface FakeKey {
  key: string;
  shiftKey: boolean;
  preventDefault: jest.Mock;
}

function fakeKey(key: string, shift = false): FakeKey {
  return { key, shiftKey: shift, preventDefault: jest.fn() };
}

function withActiveElement(el: FakeEl, fn: () => void): void {
  const prev = (global as any).document;
  (global as any).document = { activeElement: el };
  try { fn(); } finally { (global as any).document = prev; }
}

describe('trapTab', () => {
  const first = fakeEl();
  const last = fakeEl();
  const container = fakeContainer([first, last]);

  it('does nothing for non-Tab key', () => {
    const e = fakeKey('Escape');
    expect(trapTab(container, e as unknown as KeyboardEvent)).toBe(false);
  });

  it('cycles forward: last → first', () => {
    withActiveElement(last, () => {
      const e = fakeKey('Tab');
      expect(trapTab(container, e as unknown as KeyboardEvent)).toBe(true);
      expect(e.preventDefault).toHaveBeenCalled();
      expect(first._focused).toBe(1);
    });
  });

  it('cycles backward: first → last', () => {
    withActiveElement(first, () => {
      const e = fakeKey('Tab', true);
      expect(trapTab(container, e as unknown as KeyboardEvent)).toBe(true);
      expect(last._focused).toBe(1);
    });
  });

  it('returns false when focus is in the middle (native Tab works)', () => {
    const middle = fakeEl();
    const three = fakeContainer([first, middle, last]);
    withActiveElement(middle, () => {
      expect(trapTab(three, fakeKey('Tab') as unknown as KeyboardEvent)).toBe(false);
    });
  });

  it('no-ops if container is empty', () => {
    const empty = fakeContainer([]);
    expect(trapTab(empty, fakeKey('Tab') as unknown as KeyboardEvent)).toBe(false);
  });
});

// ─── captureOpener / restoreFocus ─────────────────────────────────────────

describe('captureOpener', () => {
  it('returns null when document is undefined', () => {
    const prev = (global as any).document;
    delete (global as any).document;
    try { expect(captureOpener()).toBeNull(); }
    finally { (global as any).document = prev; }
  });
});

describe('restoreFocus', () => {
  it('is a no-op on null without throwing', () => {
    expect(() => restoreFocus(null)).not.toThrow();
  });
});
