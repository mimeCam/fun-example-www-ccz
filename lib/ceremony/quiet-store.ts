/**
 * quiet-store — pub/sub singleton for the ceremony-quiet predicate.
 *
 * Why a module-level store and not just `useContext`?
 *
 * `<CeremonySequencer>` is mounted inside the article-page subtree, but
 * the surfaces that have to *defer* during the keepsake reveal are not
 * all inside that subtree:
 *   - `<ToastHost>` lives in `ThermalLayout` (a layer above) so its
 *     React context for `CeremonyContext` is the default `'idle'`.
 *   - `emitCrossing()` runs from `useStateCrossing()` which is called
 *     OUTSIDE the sequencer (page-level effect, see article/[id]/page.tsx).
 *
 * Mirroring `lib/sharing/toast-store.ts` (a 40-LOC `Set<Listener>` pub/sub)
 * keeps everything load-bearing: one slot, one writer (the sequencer),
 * many readers (`useCeremonyQuiet`, `emitCrossing`). No new dependency,
 * no Redux/Zustand, SSR-safe (snapshot defaults to `false`).
 *
 * Per Mike §3 ("`useSyncExternalStore` — already how `ToastHost` reads its
 * slot. The quiet gate composes cleanly here; no new state library.") and
 * §6.2 (subscription-side drop, not render-time `return null`).
 *
 * Credits: Mike K. (napkin §3 + §6.2 — store pattern), Tanya D. (UX §5 —
 * gate at the host vs the call site), Elon M. (subscription-side drop).
 */

// ─── Module-level slot + listeners (singleton) ─────────────────────────────

let quietSlot = false;
const listeners = new Set<() => void>();

// ─── Public API — one writer, many readers ─────────────────────────────────

/**
 * Set the current quiet state. Idempotent — only fans out on real change.
 * Called by `<CeremonySequencer>` when phase enters / leaves `'gifting'`.
 */
export function setCeremonyQuiet(next: boolean): void {
  if (next === quietSlot) return;
  quietSlot = next;
  for (const l of Array.from(listeners)) l();
}

/** Subscribe to quiet-state changes. Returns an unsubscribe fn. */
export function subscribeCeremonyQuiet(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Synchronous read of the current quiet state. SSR-safe. */
export function getCeremonyQuiet(): boolean {
  return quietSlot;
}

/** Server snapshot — surfaces never render quiet during SSR. */
export function getCeremonyQuietServerSnapshot(): boolean {
  return false;
}

// ─── Test-only reset (not exported in any barrel) ──────────────────────────

/** Reset the singleton. Tests only — never call from app code. */
export function __resetCeremonyQuietForTest(): void {
  quietSlot = false;
  listeners.clear();
}
