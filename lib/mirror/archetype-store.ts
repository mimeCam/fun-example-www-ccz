/**
 * archetype-store — pure-TS access to the reader's tone, layered read.
 *
 * Three read paths, one return type, one source of truth for each layer:
 *   • `readStoredArchetype()`     — Mirror snapshot (`localStorage`). The
 *                                   only durable, reader-confirmed source.
 *   • `readProvisionalArchetype()` — first-paint cookie (`__pt`). A hint
 *                                   the middleware writes from request-
 *                                   level signals. Short TTL, never durable.
 *   • `readEffectiveArchetype()`   — `Mirror ?? Provisional`. The single
 *                                   verb every consumer migrates to. One
 *                                   line change per call site (Mike §1).
 *
 * The Mirror always wins. The provisional cookie fills `null` silence for
 * first-time visitors so the killer feature ("words that move on the
 * immovable stage") fires on visit one, not on visit ten. Returners get
 * the real swap; first-painters get the provisional one; nobody gets both
 * (Mike §7 trust clause).
 *
 * SSR-safe: `readStoredArchetype` returns `null` on the server (no
 * `window.localStorage`); `readProvisionalArchetype` reads `document.cookie`
 * and also returns `null` when undefined. `readEffectiveArchetype` is the
 * composition of the two — naturally SSR-safe by construction.
 *
 * Credits: Mike K. (`from-michael-koch-project-architect-76.md` §1, §3, §6
 * — the layered-read sketch, the "Mirror ?? Provisional ?? null" composition,
 * the cookie name as single source of truth, the migration discipline that
 * keeps the contract stable while the answer rate climbs), Tanya D. (UX §3.3
 * — "the room registered you" felt-sense the Provisional layer delivers),
 * Elon M. (the first-paint guess prescription this module makes addressable),
 * Paul K. (Tier S4 — the swap is felt, not flagged; the consumers do not
 * need to know which layer answered).
 */

import type { ArchetypeKey } from '@/types/content';
import {
  decodeProvisionalCookie,
  PROVISIONAL_COOKIE,
  type ProvisionalTone,
} from '@/lib/detection/first-paint-archetype';

/** localStorage key the Mirror writes archetype results to. */
export const MIRROR_STORAGE_KEY = 'quick-mirror-result';

/** Shape the Mirror persists. Only the `archetype` field is load-bearing. */
interface StoredMirrorResult {
  archetype?: ArchetypeKey;
}

// ─── Layer #1 · Mirror snapshot — durable, reader-confirmed ────────────────

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

// ─── Layer #2 · Provisional cookie — first-paint hint, ephemeral ───────────

/**
 * Read a single cookie value by name. Pure, SSR-safe, ≤ 10 LOC. The browser's
 * `document.cookie` is a long semicolon-joined string; we split, trim, and
 * key-match. No regex on cookie names — they may contain quotes the parser
 * would have to unescape, and the kernel only ever asks for `__pt` today.
 */
function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie || '';
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    if (k === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return null;
}

/**
 * Read the first-paint provisional tone from the `__pt` cookie. SSR-safe —
 * returns `null` when `document` is undefined or the cookie is missing /
 * malformed. Decoding failures (unknown archetype, NaN confidence) fold to
 * `null` without throwing — see `decodeProvisionalCookie`.
 */
export function readProvisionalTone(): ProvisionalTone | null {
  return decodeProvisionalCookie(readCookie(PROVISIONAL_COOKIE));
}

/**
 * Convenience: just the archetype, dropping the confidence/source. Most
 * consumers (`voice-ledger`, `clipboard-envelope`, `RecognitionWhisper`)
 * only need the key — keep their call sites a one-liner.
 */
export function readProvisionalArchetype(): ArchetypeKey | null {
  return readProvisionalTone()?.archetype ?? null;
}

// ─── Layer #3 · Effective — the verb every consumer migrates to ────────────

/**
 * The single read every consumer should call. Composes Mirror ?? Provisional;
 * returns `null` when neither layer answers. Pure, ≤ 10 LOC, SSR-safe.
 *
 * **Mirror always wins.** The provisional cookie is shadowed the moment a
 * real Mirror result exists — even if the cookie says `explorer` and the
 * Mirror says `deep-diver`, the consumer sees `deep-diver`. This is the
 * trust clause: a reader who has answered once is never re-guessed.
 */
export function readEffectiveArchetype(): ArchetypeKey | null {
  return readStoredArchetype() ?? readProvisionalArchetype();
}

// ─── Cross-tab subscription — Mirror only (provisional is request-scope) ──

/** Callback shape for storage-driven archetype updates (cross-tab sync). */
export type ArchetypeListener = (archetype: ArchetypeKey | null) => void;

/**
 * Subscribe to cross-tab Mirror updates. Fires only when the Mirror key
 * changes — other `localStorage` writes are ignored. Returns an unsubscribe
 * fn. SSR-safe: on the server, returns a no-op.
 *
 * NOTE: provisional-cookie updates are NOT broadcast — cookies do not raise
 * `storage` events, and the cookie is shadow-state for the request anyway.
 * Consumers who care about provisional updates can re-read on focus.
 * (Mike §7 — the cookie has a 1h TTL; we don't subscribe to it.)
 */
export function subscribeArchetype(listener: ArchetypeListener): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === MIRROR_STORAGE_KEY) listener(readEffectiveArchetype());
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}
