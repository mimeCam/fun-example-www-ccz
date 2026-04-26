/**
 * useCeremonyQuiet — the canonical phase-gating predicate.
 *
 * Returns `true` while the ceremony is in its `gifting` phase — the ~700ms
 * window during which the KeepsakePlate fades up and every other output
 * surface should defer its own claim on the eye (Tanya §3 — singular focus,
 * Mike §1 — gate at the host, not the call site).
 *
 * Reads from `lib/ceremony/quiet-store.ts` (a `Set<Listener>` singleton),
 * NOT from `useCeremony()` context. Reason: `<ToastHost>` mounts inside
 * `ThermalLayout`, *above* `<CeremonySequencer>` — a context-only hook
 * would always see `'idle'` from there. The pub/sub mirrors how the same
 * host already reads its toast slot via `useSyncExternalStore`. One pattern,
 * one mental model (Mike §3).
 *
 * Rule (AGENTS.md): During `useCeremonyQuiet()` (gifting phase) output
 * surfaces defer. Gate at the host, not at the call site. Input-side
 * surfaces (popovers opening from a new gesture) may guard per-instance.
 *
 * Greppable from the symptom (`ceremony quiet`) AND from the literal
 * (`gifting`, in the sequencer's writer line) — one substring away from
 * each other. Consumers must never reach into `useCeremony().phase`
 * directly to test for `'gifting'`; import this hook instead.
 *
 * Credits: Mike K. (napkin §3 — `useSyncExternalStore` reuse, §6.2 — host
 * gate as the lever), Tanya D. (UX §5 — output vs input distinction, §7 —
 * naming mediation), Elon M. (suppression by construction, not convention),
 * Paul K. (the "keepsake lands in silence" outcome the predicate protects),
 * Jason F. (silence-as-primitive framing).
 */

'use client';

import { useSyncExternalStore } from 'react';
import {
  subscribeCeremonyQuiet,
  getCeremonyQuiet,
  getCeremonyQuietServerSnapshot,
} from '@/lib/ceremony/quiet-store';

/**
 * `true` while the ceremony's `gifting` phase is active.
 * One predicate. One import. Compose at the host, not the call site.
 */
export function useCeremonyQuiet(): boolean {
  return useSyncExternalStore(
    subscribeCeremonyQuiet,
    getCeremonyQuiet,
    getCeremonyQuietServerSnapshot,
  );
}
