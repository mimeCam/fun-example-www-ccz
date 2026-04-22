/**
 * useThreshold — headless mechanics for a modal-like surface.
 *
 * Owns the invariants every modal on this site needs: focus capture +
 * restore, Tab-trap, ESC (topmost only), scroll-lock with scrollbar-width
 * padding, a `prefers-reduced-motion` flag, and — as of this sprint — a
 * four-state **phase** machine (closed → opening → open → closing → closed)
 * with deferred unmount. The phase is how we get a 150 ms staggered exit
 * without slamming the reader.
 *
 * Design bible:
 *  - Mike K. (report 80, napkin 10): "one primitive, one phase machine."
 *  - Tanya D. (report 2 + UX 20):    "a modal is a threshold, not a window."
 *  - Krystle C. (report 62):         phase states + deferred unmount.
 *  - Elon M. (report 75/99):         dismiss latency > cadence metaphor.
 *  - AGENTS.md: zero new deps, shared code, functions ≤ 10 lines.
 */

'use client';

import {
  useCallback, useEffect, useReducer, useRef, useState,
  type AnimationEventHandler,
} from 'react';
import { useIsomorphicLayoutEffect } from '@/lib/utils/use-isomorphic-layout-effect';
import {
  captureOpener, restoreFocus, getFocusableElements, trapTab,
} from '@/lib/utils/focus-utils';
import { lockScroll, unlockScroll } from '@/lib/utils/scroll-lock';
import {
  type Phase, EXIT_SETTLE_BUDGET_MS,
} from '@/lib/utils/animation-phase';

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
  /** Phase is the render authority. `closed` ⇒ caller should unmount. */
  phase: Phase;
  /** Wire onto the chamber surface; advances `opening→open` / `closing→closed`. */
  onChamberAnimationEnd: AnimationEventHandler<HTMLElement>;
}

// ─── Phase reducer — pure, trivially testable ──────────────────────────────

export type PhaseAction =
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'ANIMATION_END' }
  | { type: 'FORCE_CLOSED' };

/** Pure state transition. Cancels mid-flight close on re-open (no ghost). */
export function phaseReducer(phase: Phase, action: PhaseAction): Phase {
  if (action.type === 'FORCE_CLOSED') return 'closed';
  if (action.type === 'OPEN') return openFrom(phase);
  if (action.type === 'CLOSE') return closeFrom(phase);
  if (action.type === 'ANIMATION_END') return settleFrom(phase);
  return phase;
}

function openFrom(phase: Phase): Phase {
  if (phase === 'closed' || phase === 'closing') return 'opening';
  return phase;
}

function closeFrom(phase: Phase): Phase {
  if (phase === 'opening' || phase === 'open') return 'closing';
  return phase;
}

function settleFrom(phase: Phase): Phase {
  if (phase === 'opening') return 'open';
  if (phase === 'closing') return 'closed';
  return phase;
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

// ─── Phase orchestration — drives the reducer from `isOpen` + effects ──────

interface PhaseState {
  phase: Phase;
  dispatch: React.Dispatch<PhaseAction>;
}

function usePhaseOrchestration(isOpen: boolean, reduced: boolean): PhaseState {
  const [phase, dispatch] = useReducer(phaseReducer, 'closed');
  useSyncPhaseToOpen(isOpen, dispatch);
  useCollapsePhaseForReducedMotion(phase, reduced, dispatch);
  useExitSafetyNet(phase, dispatch);
  return { phase, dispatch };
}

function useSyncPhaseToOpen(
  isOpen: boolean,
  dispatch: React.Dispatch<PhaseAction>,
): void {
  useEffect(() => {
    dispatch({ type: isOpen ? 'OPEN' : 'CLOSE' });
  }, [isOpen, dispatch]);
}

/** Reduced motion: skip ceremony, settle synchronously each side. */
function useCollapsePhaseForReducedMotion(
  phase: Phase,
  reduced: boolean,
  dispatch: React.Dispatch<PhaseAction>,
): void {
  useEffect(() => {
    if (!reduced) return;
    if (phase === 'opening' || phase === 'closing') {
      dispatch({ type: 'ANIMATION_END' });
    }
  }, [phase, reduced, dispatch]);
}

/** Safety net: if onAnimationEnd never fires, force-settle within budget. */
function useExitSafetyNet(
  phase: Phase,
  dispatch: React.Dispatch<PhaseAction>,
): void {
  useEffect(() => {
    if (phase !== 'closing') return;
    const id = setTimeout(() => dispatch({ type: 'ANIMATION_END' }),
      EXIT_SETTLE_BUDGET_MS);
    return () => clearTimeout(id);
  }, [phase, dispatch]);
}

// ─── Focus choreography — capture on opening, restore on settle ────────────

function useFocusChoreography(
  phase: Phase,
  containerRef: React.RefObject<HTMLDivElement>,
  initialFocusRef?: React.RefObject<HTMLElement>,
): void {
  const openerRef = useRef<HTMLElement | null>(null);
  useCapturePreOpenFocus(phase, openerRef, containerRef, initialFocusRef);
  useRestoreFocusAfterSettle(phase, openerRef);
}

function useCapturePreOpenFocus(
  phase: Phase,
  openerRef: React.MutableRefObject<HTMLElement | null>,
  containerRef: React.RefObject<HTMLDivElement>,
  initialFocusRef?: React.RefObject<HTMLElement>,
): void {
  useEffect(() => {
    if (phase !== 'opening') return;
    openerRef.current = captureOpener();
    focusInitial(containerRef.current, initialFocusRef?.current ?? null);
  }, [phase, containerRef, initialFocusRef, openerRef]);
}

function useRestoreFocusAfterSettle(
  phase: Phase,
  openerRef: React.MutableRefObject<HTMLElement | null>,
): void {
  const prev = useRef<Phase>('closed');
  useEffect(() => {
    if (prev.current === 'closing' && phase === 'closed') {
      restoreFocus(openerRef.current);
    }
    prev.current = phase;
  }, [phase, openerRef]);
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
  phase: Phase;
  id: symbol;
  onClose: () => void;
  dismissOnEscape: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
}

function useKeyboardChoreography(deps: KeyboardDeps): void {
  useEffect(() => {
    if (deps.phase === 'closed') return;
    const handler = (e: KeyboardEvent) => dispatchKey(e, deps);
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [deps]);
}

function dispatchKey(event: KeyboardEvent, deps: KeyboardDeps): void {
  if (deps.phase === 'closing') { blockFurtherInput(event); return; }
  if (trapTab(deps.containerRef.current, event)) return;
  if (event.key === 'Escape') tryCloseOnEscape(event, deps);
}

function blockFurtherInput(event: KeyboardEvent): void {
  if (event.key === 'Escape' || event.key === 'Tab') event.preventDefault();
}

function tryCloseOnEscape(event: KeyboardEvent, deps: KeyboardDeps): void {
  if (!deps.dismissOnEscape) return;
  if (!isTopmost(deps.id)) return;
  event.stopPropagation();
  deps.onClose();
}

// ─── Stack lifecycle — push while non-closed, pop on settle / teardown ─────

function useStackLifecycle(phase: Phase): symbol {
  const idRef = useRef<symbol>(Symbol('threshold'));
  const inStack = useRef(false);
  useStackEdges(phase, idRef, inStack);
  useEffect(() => teardownStack(idRef, inStack), [idRef]);
  return idRef.current;
}

function useStackEdges(
  phase: Phase,
  idRef: React.MutableRefObject<symbol>,
  inStack: React.MutableRefObject<boolean>,
): void {
  useEffect(() => {
    if (phase !== 'closed' && !inStack.current) enterStack(idRef, inStack);
    if (phase === 'closed' && inStack.current) leaveStack(idRef, inStack);
  }, [phase, idRef, inStack]);
}

function enterStack(
  idRef: React.MutableRefObject<symbol>,
  inStack: React.MutableRefObject<boolean>,
): void {
  pushStack(idRef.current);
  dispatchOpening();
  inStack.current = true;
}

function leaveStack(
  idRef: React.MutableRefObject<symbol>,
  inStack: React.MutableRefObject<boolean>,
): void {
  popStack(idRef.current);
  inStack.current = false;
}

function teardownStack(
  idRef: React.MutableRefObject<symbol>,
  inStack: React.MutableRefObject<boolean>,
): () => void {
  return () => { if (inStack.current) leaveStack(idRef, inStack); };
}

// ─── Scroll-lock lifecycle — locked on opening, released on settle ─────────

function useScrollLockLifecycle(phase: Phase): void {
  const locked = useRef(false);
  useIsomorphicLayoutEffect(() => {
    if (phase !== 'closed' && !locked.current) { lockScroll(); locked.current = true; }
    if (phase === 'closed' && locked.current) { unlockScroll(); locked.current = false; }
  }, [phase]);
  useEffect(() => releaseScrollLockOnTeardown(locked), []);
}

function releaseScrollLockOnTeardown(
  locked: React.MutableRefObject<boolean>,
): () => void {
  return () => { if (locked.current) { unlockScroll(); locked.current = false; } };
}

// ─── Public hook ───────────────────────────────────────────────────────────

/**
 * Ceremony-aware modal primitive. ARIA role: dialog.
 * Returns phase + ref + backdrop handlers + reduced-motion flag.
 */
export function useThreshold(options: ThresholdOptions): ThresholdAPI {
  const prefersReducedMotion = useReducedMotionFlag();
  const { phase, dispatch } = usePhaseOrchestration(
    options.isOpen, prefersReducedMotion,
  );
  return useThresholdAPI(options, phase, dispatch, prefersReducedMotion);
}

function useThresholdAPI(
  options: ThresholdOptions,
  phase: Phase,
  dispatch: React.Dispatch<PhaseAction>,
  prefersReducedMotion: boolean,
): ThresholdAPI {
  const containerRef = useRef<HTMLDivElement>(null);
  const id = useStackLifecycle(phase);
  useLifecycleSideEffects(options, phase, id, containerRef);
  const onBackdrop = useBackdropHandler(options, phase);
  const onChamberAnimationEnd = useAnimationEndHandler(phase, dispatch);
  return {
    containerRef, prefersReducedMotion, phase, onChamberAnimationEnd,
    backdropProps: { onClick: onBackdrop, 'aria-hidden': true },
  };
}

function useLifecycleSideEffects(
  options: ThresholdOptions,
  phase: Phase,
  id: symbol,
  containerRef: React.RefObject<HTMLDivElement>,
): void {
  useFocusChoreography(phase, containerRef, options.initialFocusRef);
  useScrollLockLifecycle(phase);
  useKeyboardChoreography({
    phase, id, onClose: options.onClose,
    dismissOnEscape: options.dismissOnEscape ?? true,
    containerRef,
  });
}

function useBackdropHandler(
  options: ThresholdOptions,
  phase: Phase,
): () => void {
  const enabled = options.dismissOnBackdrop ?? true;
  const { onClose } = options;
  return useCallback(() => {
    if (!enabled || phase !== 'open') return;
    onClose();
  }, [enabled, phase, onClose]);
}

function useAnimationEndHandler(
  phase: Phase,
  dispatch: React.Dispatch<PhaseAction>,
): AnimationEventHandler<HTMLElement> {
  return useCallback((event) => {
    if (event.currentTarget !== event.target) return;
    if (phase !== 'opening' && phase !== 'closing') return;
    dispatch({ type: 'ANIMATION_END' });
  }, [phase, dispatch]);
}
