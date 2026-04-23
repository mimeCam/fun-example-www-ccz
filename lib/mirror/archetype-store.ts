/**
 * archetype-store — pure-TS access to the Mirror archetype snapshot.
 *
 * Lifted out of `ThermalProvider` so pure-TS callers (clipboard + quote-card
 * exports) can resolve the reader's tone without reaching into React. No
 * hook, no state, no subscription-by-default — just a read. SSR-safe: if
 * `window` is undefined, the reader returns `null` and the lexicon folds to
 * the neutral `DEFAULT_TONE`.
 *
 * Single source of truth for the localStorage key the Mirror writes to. If
 * you need to change it, you change it here, not in three places.
 *
 * Credits: Mike K. (napkin §4 — "lift the reader, keep the mount"), Tanya D.
 * (§2.3 — unscored visitor folds to DEFAULT_TONE honestly), Elon M. (§3
 * minimum-viable: the only non-zero edit is this lift), project vision
 * (stateless first, grow later).
 */

import type { ArchetypeKey } from '@/types/content';

/** localStorage key the Mirror writes archetype results to. */
export const MIRROR_STORAGE_KEY = 'quick-mirror-result';

/** Shape the Mirror persists. Only the `archetype` field is load-bearing. */
interface StoredMirrorResult {
  archetype?: ArchetypeKey;
}

/**
 * Pure read of the stored archetype. SSR-safe — returns `null` on server.
 * Corrupt JSON or a missing key returns `null` (no throw).
 */
export function readStoredArchetype(): ArchetypeKey | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MIRROR_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredMirrorResult;
    return parsed?.archetype ?? null;
  } catch {
    return null;
  }
}

/** Callback shape for storage-driven archetype updates (cross-tab sync). */
export type ArchetypeListener = (archetype: ArchetypeKey | null) => void;

/**
 * Subscribe to cross-tab Mirror updates. Fires only when the Mirror key
 * changes — other `localStorage` writes are ignored. Returns an unsubscribe
 * fn. SSR-safe: on the server, returns a no-op.
 */
export function subscribeArchetype(listener: ArchetypeListener): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === MIRROR_STORAGE_KEY) listener(readStoredArchetype());
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
