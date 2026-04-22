/**
 * scroll-lock — body scroll-lock with zero layout shift.
 *
 * Pads <html> by the compensated scrollbar width, then sets overflow:hidden.
 * Restores previous inline values on release so we never stomp callers who
 * already styled the root. Ref-counted so nested calls can't unlock early
 * (belt-and-suspenders — Threshold itself forbids stacking, but the helper
 * stays honest).
 */

interface LockState {
  count: number;
  prevOverflow: string;
  prevPaddingRight: string;
}

const state: LockState = {
  count: 0,
  prevOverflow: '',
  prevPaddingRight: '',
};

function getScrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth;
}

export function lockScroll(): void {
  if (typeof document === 'undefined') return;
  state.count += 1;
  if (state.count > 1) return;
  capturePrevStyles();
  applyLockStyles();
}

function capturePrevStyles(): void {
  const html = document.documentElement;
  state.prevOverflow = html.style.overflow;
  state.prevPaddingRight = html.style.paddingRight;
}

function applyLockStyles(): void {
  const html = document.documentElement;
  const sbw = getScrollbarWidth();
  if (sbw > 0) html.style.paddingRight = `${sbw}px`;
  html.style.overflow = 'hidden';
}

export function unlockScroll(): void {
  if (typeof document === 'undefined') return;
  state.count = Math.max(0, state.count - 1);
  if (state.count > 0) return;
  restorePrevStyles();
}

function restorePrevStyles(): void {
  const html = document.documentElement;
  html.style.overflow = state.prevOverflow;
  html.style.paddingRight = state.prevPaddingRight;
}

/** Test-only reset — do not call from product code. */
export function __resetScrollLockForTests(): void {
  state.count = 0;
  state.prevOverflow = '';
  state.prevPaddingRight = '';
}
