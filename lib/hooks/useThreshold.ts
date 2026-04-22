/**
 * useThreshold — headless mechanics for a modal-like surface.
 *
 * Owns the invariants every modal on this site needs: focus capture +
 * restore, Tab-trap, ESC (topmost only), scroll-lock with scrollbar-width
 * padding, and a `prefers-reduced-motion` flag. Caller owns chrome.
 *
 * Design bible:
 *  - Mike K. (report 80): "one headless primitive, flag props, composition."
 *  - Tanya D. (report 2):  "a modal isn't a window here. it's a threshold."
 *  - AGENTS.md: zero new deps, shared code, functions ≤ 10 lines.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/utils/use-isomorphic-layout-effect';
import {
  captureOpener, restoreFocus, getFocusableElements, trapTab,
} from '@/lib/utils/focus-utils';
import { lockScroll, unlockScroll } from '@/lib/utils/scroll-lock';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ThresholdOptions {
  isOpen: boolean;
  onClose: () => void;
  /** Default: true. Set false for ceremonial surfaces that must not dismiss. */
  dismissOnBackdrop?: boolean;
  /** Default: true. Set false only if caller owns its own ESC handling. */
  dismissOnEscape?: boolean;
  /** Element to focus on open. Default: first focusable inside container. */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

export interface ThresholdAPI {
  containerRef: React.RefObject<HTMLDivElement>;
  backdropProps: { onClick: () => void; 'aria-hidden': true };
  prefersReducedMotion: boolean;
}

// ─── Module-level topmost stack ────────────────────────────────────────────

const stack: symbol[] = [];

function pushStack(id: symbol): void {
  stack.push(id);
  warnIfStacked();
}

function popStack(id: symbol): void {
  const idx = stack.lastIndexOf(id);
  if (idx !== -1) stack.splice(idx, 1);
}

function isTopmost(id: symbol): boolean {
  return stack[stack.length - 1] === id;
}

function warnIfStacked(): void {
  if (stack.length > 1 && process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.warn('[Threshold] nested instance detected — one-at-a-time contract violated.');
  }
}

/** Test-only — lets specs reset between runs. */
export function __resetThresholdStackForTests(): void {
  stack.length = 0;
}

// ─── Event bus — dismiss popovers when Threshold opens ─────────────────────

/** Dispatched on window when a Threshold opens. Selection popovers listen. */
export const THRESHOLD_OPENING_EVENT = 'threshold:opening';

function dispatchOpening(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(THRESHOLD_OPENING_EVENT));
}

// ─── Reduced-motion probe ──────────────────────────────────────────────────

function readPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useReducedMotionFlag(): boolean {
  const [flag, setFlag] = useState(false);
  useIsomorphicLayoutEffect(() => {
    setFlag(readPrefersReducedMotion());
    return subscribeReducedMotion(setFlag);
  }, []);
  return flag;
}

function subscribeReducedMotion(cb: (v: boolean) => void): () => void {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => cb(e.matches);
  mq.addEventListener('change', handler);
  return () => mq.removeEventListener('change', handler);
}

// ─── Focus choreography ────────────────────────────────────────────────────

function useFocusChoreography(
  isOpen: boolean,
  containerRef: React.RefObject<HTMLDivElement>,
  initialFocusRef?: React.RefObject<HTMLElement>,
): void {
  const openerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    openerRef.current = captureOpener();
    focusInitial(containerRef.current, initialFocusRef?.current ?? null);
    return () => restoreFocus(openerRef.current);
  }, [isOpen, containerRef, initialFocusRef]);
}

function focusInitial(
  container: HTMLElement | null,
  preferred: HTMLElement | null,
): void {
  const target = preferred ?? getFocusableElements(container)[0] ?? container;
  if (target) queueMicrotask(() => target.focus?.({ preventScroll: true }));
}

// ─── ESC + Tab-trap keyboard choreography ──────────────────────────────────

interface KeyboardDeps {
  isOpen: boolean;
  id: symbol;
  onClose: () => void;
  dismissOnEscape: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

function useKeyboardChoreography(deps: KeyboardDeps): void {
  useEffect(() => {
    if (!deps.isOpen) return;
    const handler = (e: KeyboardEvent) => dispatchKey(e, deps);
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [deps]);
}

function dispatchKey(event: KeyboardEvent, deps: KeyboardDeps): void {
  if (trapTab(deps.containerRef.current, event)) return;
  if (event.key === 'Escape') tryCloseOnEscape(event, deps);
}

function tryCloseOnEscape(event: KeyboardEvent, deps: KeyboardDeps): void {
  if (!deps.dismissOnEscape) return;
  if (!isTopmost(deps.id)) return;
  event.stopPropagation();
  deps.onClose();
}

// ─── Stack lifecycle ───────────────────────────────────────────────────────

function useStackLifecycle(isOpen: boolean): symbol {
  const idRef = useRef<symbol>(Symbol('threshold'));
  useEffect(() => {
    if (!isOpen) return;
    pushStack(idRef.current);
    dispatchOpening();
    return () => popStack(idRef.current);
  }, [isOpen]);
  return idRef.current;
}

// ─── Scroll lock lifecycle ─────────────────────────────────────────────────

function useScrollLockLifecycle(isOpen: boolean): void {
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) return;
    lockScroll();
    return () => unlockScroll();
  }, [isOpen]);
}

// ─── Public hook ───────────────────────────────────────────────────────────

/**
 * Ceremony-aware modal primitive. ARIA role: dialog.
 * Returns ref + backdrop handlers + reduced-motion flag; nothing else.
 */
export function useThreshold(options: ThresholdOptions): ThresholdAPI {
  const {
    isOpen, onClose,
    dismissOnBackdrop = true,
    dismissOnEscape = true,
    initialFocusRef,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotionFlag();
  const id = useStackLifecycle(isOpen);

  useFocusChoreography(isOpen, containerRef, initialFocusRef);
  useScrollLockLifecycle(isOpen);
  useKeyboardChoreography({ isOpen, id, onClose, dismissOnEscape, containerRef });

  const onBackdrop = useBackdropHandler(dismissOnBackdrop, onClose);
  return {
    containerRef,
    backdropProps: { onClick: onBackdrop, 'aria-hidden': true },
    prefersReducedMotion,
  };
}

function useBackdropHandler(
  enabled: boolean,
  onClose: () => void,
): () => void {
  return useCallback(() => { if (enabled) onClose(); }, [enabled, onClose]);
}
