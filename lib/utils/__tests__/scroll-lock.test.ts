/**
 * scroll-lock tests — ref-counting + prev-style preservation.
 *
 * We fake the minimum of `document.documentElement` / `window` so the
 * helper can be tested without jsdom (matches node-env jest config).
 */

import {
  lockScroll,
  unlockScroll,
  __resetScrollLockForTests,
} from '../scroll-lock';

interface FakeStyle { overflow: string; paddingRight: string; }

function installFakeDom(scrollbarWidth: number) {
  const style: FakeStyle = { overflow: '', paddingRight: '' };
  (global as any).document = { documentElement: { style, clientWidth: 1000 - scrollbarWidth } };
  (global as any).window = { innerWidth: 1000 };
  return style;
}

function tearDownFakeDom() {
  delete (global as any).document;
  delete (global as any).window;
}

describe('scroll-lock', () => {
  afterEach(() => { __resetScrollLockForTests(); tearDownFakeDom(); });

  it('applies overflow:hidden + scrollbar padding on first lock', () => {
    const style = installFakeDom(15);
    lockScroll();
    expect(style.overflow).toBe('hidden');
    expect(style.paddingRight).toBe('15px');
  });

  it('second lock does not stomp the existing padding', () => {
    const style = installFakeDom(15);
    lockScroll();
    style.paddingRight = 'SENTINEL';  // pretend caller retouched it
    lockScroll();                      // ref-count bump, no re-apply
    expect(style.paddingRight).toBe('SENTINEL');
  });

  it('restores prev values only on final unlock', () => {
    const style = installFakeDom(10);
    style.overflow = 'auto';
    style.paddingRight = '4px';
    lockScroll();
    lockScroll();
    unlockScroll();
    expect(style.overflow).toBe('hidden');       // still locked
    unlockScroll();
    expect(style.overflow).toBe('auto');         // now released
    expect(style.paddingRight).toBe('4px');
  });

  it('handles zero scrollbar width (no padding applied)', () => {
    const style = installFakeDom(0);
    lockScroll();
    expect(style.paddingRight).toBe('');
    expect(style.overflow).toBe('hidden');
  });
});
