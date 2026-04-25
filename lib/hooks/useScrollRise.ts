/**
 * useScrollRise — scroll-triggered card entrance hook.
 *
 * Lifts each article card into view with a staggered translateY(12px)→0
 * + opacity fade when the IntersectionObserver reports ≥15% visibility.
 * Completes the missing *browsing* interaction scale: the environment now
 * notices the reader at every layer — word, session, visual, sharing,
 * and browsing.
 *
 * Architecture:
 *   - One module-level IntersectionObserver singleton (O(1) per scroll frame)
 *   - One-shot: unobserves immediately on trigger — no repeated animations
 *   - Stagger: Math.min(index × 50ms, 300ms) via `--rise-delay` CSS var
 *   - Pre-enter: `data-sys-rise="pre"` hides card until observer fires
 *   - Entered: removes pre attr, sets `data-sys-enter="rise"` + delay
 *   - 50ms mount guard: lets the SuspenseFade crossfade settle first
 *   - SSR-safe: observer created only after mount (typeof window guard)
 *   - Reduced-motion: the existing globals.css block collapses to 0.01ms
 *
 * CSS contract: globals.css owns `[data-sys-rise="pre"]` and
 * `[data-sys-enter="rise"]`. The TS hook only touches data attributes and
 * the `--rise-delay` inline CSS var — no class manipulation.
 *
 * Credits: Mike K. (napkin 7 — singleton pattern, one-shot semantics,
 * stagger formula), Tanya D. (UX 100 — 0.15 threshold, mount guard, 300ms
 * cap, data-attr contract), Elon M. (fill-mode: both invariant note).
 */

'use client';

import { useEffect, useRef, type RefObject } from 'react';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UseScrollRiseOptions {
  /** Position in the card's section — drives stagger delay. */
  index: number;
  /** Skip observer entirely (e.g. reduced-motion fallback at component level). */
  disabled?: boolean;
}

export interface UseScrollRiseReturn {
  ref: RefObject<HTMLElement>;
}

// ─── Stagger formula ──────────────────────────────────────────────────────────

/** Caps the stagger wave at 300ms regardless of card count. */
export const SCROLL_RISE_STAGGER_STEP_MS = 50;
export const SCROLL_RISE_STAGGER_CAP_MS  = 300;

export function riseDelay(index: number): number {
  return Math.min(index * SCROLL_RISE_STAGGER_STEP_MS, SCROLL_RISE_STAGGER_CAP_MS);
}

// ─── Singleton observer ───────────────────────────────────────────────────────

/** Module-level observer — one instance for the entire card list. */
let sharedObserver: IntersectionObserver | null = null;
const entryCallbacks = new Map<Element, () => void>();

function getObserver(): IntersectionObserver | null {
  if (typeof window === 'undefined') return null;
  if (sharedObserver) return sharedObserver;

  sharedObserver = new IntersectionObserver(handleEntries, { threshold: 0.15 });
  return sharedObserver;
}

function handleEntries(entries: IntersectionObserverEntry[]): void {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const cb = entryCallbacks.get(entry.target);
    if (!cb) continue;
    cb();
    sharedObserver?.unobserve(entry.target);
    entryCallbacks.delete(entry.target);
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Attach to the card's outermost element (`<Link>` / `<a>`) via `ref`.
 * The hook hides the card immediately on mount, then reveals it with a
 * rise animation when the reader's eye finds it.
 */
export function useScrollRise({
  index,
  disabled = false,
}: UseScrollRiseOptions): UseScrollRiseReturn {
  const ref = useRef<HTMLElement>(null);
  const delay = riseDelay(index);

  useEffect(() => {
    const el = ref.current;
    if (!el || disabled) return;

    el.setAttribute('data-sys-rise', 'pre');

    // 50ms guard — let the SuspenseFade / mount handoff settle.
    const mountTimer = setTimeout(() => scheduleObservation(el, delay), 50);

    return () => teardown(mountTimer, el);
  }, [delay, disabled]);

  return { ref };
}

// ─── Internals ────────────────────────────────────────────────────────────────

function scheduleObservation(el: HTMLElement, delay: number): void {
  const obs = getObserver();
  if (!obs) return;

  entryCallbacks.set(el, () => applyRise(el, delay));
  obs.observe(el);
}

function applyRise(el: HTMLElement, delay: number): void {
  el.removeAttribute('data-sys-rise');
  el.style.setProperty('--rise-delay', `${delay}ms`);
  el.setAttribute('data-sys-enter', 'rise');
}

function teardown(mountTimer: ReturnType<typeof setTimeout>, el: HTMLElement): void {
  clearTimeout(mountTimer);
  entryCallbacks.delete(el);
  sharedObserver?.unobserve(el);
}
