/**
 * ToastHost — the single mount point for the 6th primitive.
 *
 * One per app, mounted in `<ThermalLayout>` next to the children. Subscribes
 * to the toast-store via `useSyncExternalStore`, owns the ARIA live region,
 * and renders `<Toast>` (or nothing) into a `document.body` portal. When a
 * new toast replaces the current one, React unmounts the old `<Toast>` and
 * mounts a fresh one (key on id) — the cleanest replacement path, no stale
 * timers, no in-component crossfade machine (Mike §6.2).
 *
 * ARIA contract (Tanya §9):
 *   - role="status"   (assertive-light; announces but does not interrupt)
 *   - aria-live="polite"
 *   - aria-atomic="true"  (every replacement is re-announced as a whole)
 *
 * Credits: Mike K. (single-host portal pattern, `useSyncExternalStore`),
 * Tanya D. (UX §9 — ARIA non-negotiables and the no-focus-steal rule).
 */

'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import {
  subscribeToast, getCurrentToast,
  toastDismiss, type ToastMsg,
} from '@/lib/sharing/toast-store';
import { Toast } from './Toast';

/** Empty server snapshot — store is null until the first client write. */
function getServerSnapshot(): ToastMsg | null { return null; }

/** Lazy-resolve the portal target (no SSR `document` access). */
function usePortalTarget(): Element | null {
  const [target, setTarget] = useState<Element | null>(null);
  useEffect(() => setTarget(document.body), []);
  return target;
}

/**
 * The `<ToastHost>` is mounted exactly once. Multiple mounts would create
 * duplicate live regions; the store would still be single-slot, but ARIA
 * would announce twice. The dev-time guard makes the misuse audible.
 */
let mountCount = 0;

function useSingletonGuard(): void {
  useEffect(() => {
    mountCount += 1;
    if (mountCount > 1 && process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('<ToastHost/> mounted more than once. Mount it once in ThermalLayout.');
    }
    return () => { mountCount -= 1; };
  }, []);
}

export function ToastHost(): JSX.Element | null {
  useSingletonGuard();
  const target = usePortalTarget();
  const current = useSyncExternalStore(subscribeToast, getCurrentToast, getServerSnapshot);
  if (!target) return null;
  return createPortal(<HostTree current={current} />, target);
}

interface TreeProps { current: ToastMsg | null }

/**
 * Live region is always present (empty when no toast). Tanya §9: the host
 * carries the ARIA contract — child text changes announce themselves.
 */
function HostTree({ current }: TreeProps): JSX.Element {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" data-testid="toast-host">
      {current === null ? null : (
        <Toast key={current.id} msg={current} onDismissed={() => toastDismiss(current.id)} />
      )}
    </div>
  );
}
