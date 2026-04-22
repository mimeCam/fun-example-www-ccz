/**
 * focus-utils — tiny pure helpers for focus management.
 *
 * Extracted so the Threshold primitive (and future modal-like surfaces)
 * share one implementation of "find the focusables" and "safely restore
 * focus on a previously-focused element." Pure functions only — no React,
 * no side-effects beyond the explicit focus() call.
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Returns every tabbable descendant of `root`, in DOM order. */
export function getFocusableElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  const nodes = root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
  return Array.from(nodes).filter(isVisible);
}

/** Element is currently rendered + not aria-hidden. Cheap, not perfect. */
function isVisible(el: HTMLElement): boolean {
  if (el.hidden) return false;
  if (el.getAttribute('aria-hidden') === 'true') return false;
  return el.offsetParent !== null || el.getClientRects().length > 0;
}

/** Capture the currently-focused element so we can restore to it later. */
export function captureOpener(): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const active = document.activeElement;
  return active instanceof HTMLElement ? active : null;
}

/**
 * Return focus to `opener`. Deferred via microtask so React unmounts first.
 * If the opener detached from the DOM, dev-warn — that's a design smell.
 */
export function restoreFocus(opener: HTMLElement | null): void {
  queueMicrotask(() => safeFocus(opener));
}

function safeFocus(opener: HTMLElement | null): void {
  if (!opener || !document.contains(opener)) {
    warnMissingOpener();
    return;
  }
  try { opener.focus({ preventScroll: true }); } catch { /* jsdom edge */ }
}

function warnMissingOpener(): void {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[Threshold] opener element detached before close — focus lost.');
  }
}

/**
 * Given a container + a Tab keyboard event, cycle focus within the container.
 * Returns true if the event was handled (caller should preventDefault).
 */
export function trapTab(
  container: HTMLElement | null,
  event: KeyboardEvent,
): boolean {
  if (!container || event.key !== 'Tab') return false;
  const items = getFocusableElements(container);
  if (items.length === 0) return false;
  return cycleFocus(items, event);
}

function cycleFocus(items: HTMLElement[], event: KeyboardEvent): boolean {
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (event.shiftKey && active === first) return jumpTo(last, event);
  if (!event.shiftKey && active === last) return jumpTo(first, event);
  return false;
}

function jumpTo(target: HTMLElement, event: KeyboardEvent): boolean {
  event.preventDefault();
  target.focus();
  return true;
}
