/**
 * toast-store — pub/sub singleton, single-slot semantics.
 *
 * The store the room uses to remember its one current reply. Two writers
 * (React-side `useToast`, pure-TS `toastShow`); one slot; one host
 * (`<ToastHost>`) subscribes via `useSyncExternalStore`. No queue, no
 * stack, no history — "the room speaks once, then listens" (Tanya §6,
 * Mike §6.2).
 *
 * Replacement is the only multi-write semantic: a new `toastShow` while
 * a toast is visible swaps `current` in place. The host owns the
 * crossfade choreography (Tanya §6.1) — the store just publishes.
 *
 * Ids are monotone so consumers can detect identity vs replacement
 * without a deep equal. Auto-dismiss is the host's job, not the store's:
 * the store has no clock, no setTimeout, no React. SSR-safe.
 *
 * Credits: Mike K. (napkin §4 — pub/sub + monotone-id + module-level
 * `toastShow` for pure-TS callers; the two-call-paths-one-store pattern),
 * Tanya D. (UX §6 — n=1, replacement semantics, no logbook), Elon M.
 * (no Redux/Zustand — 40 LOC of `Set<Listener>` is honest), Paul K.
 * (anti-notification-center discipline locked in code, not intentions).
 */

// ─── Types ─────────────────────────────────────────────────────────────────

/** Visual posture. Same surface, same shadow — no green/red split. */
export type ToastIntent = 'confirm' | 'warn';

/** Internal shape held in the slot (id is store-assigned, not caller-set). */
export interface ToastMsg {
  /** Monotone id; lets consumers detect replacement vs identity. */
  id: number;
  /** Final, already-tinted message string (semantic-locked). */
  message: string;
  /** Visual intent. */
  intent: ToastIntent;
  /** Auto-dismiss budget in ms. Consumers (host) own the timer. */
  durationMs: number;
}

/** Shape callers pass; store fills in defaults + id. */
export interface ToastInput {
  message: string;
  intent?: ToastIntent;
  durationMs?: number;
}

/** Handle returned by `toastShow` — caller can dismiss its own toast. */
export interface ToastHandle {
  id: number;
  dismiss(): void;
}

/** Subscription callback; receives the current slot value (or null). */
export type ToastListener = (current: ToastMsg | null) => void;

// ─── Defaults — fixed dwell, no warmth/archetype modulation (Tanya §5.2) ───

/** Dwell budget per intent. 2s confirm / 3s error per Mike §6.6 + Tanya §5.2. */
export const DEFAULT_DURATIONS: Readonly<Record<ToastIntent, number>> = {
  confirm: 2000,
  warn:    3000,
};

// ─── Module-level slot + listeners (singleton) ─────────────────────────────

let currentSlot: ToastMsg | null = null;
let nextId = 1;
const listeners = new Set<ToastListener>();

function notifyAll(): void {
  // Snapshot to allow listeners to unsubscribe during fan-out.
  const snapshot = Array.from(listeners);
  for (const l of snapshot) l(currentSlot);
}

// ─── Public API ────────────────────────────────────────────────────────────

/** Replace (or set) the current toast. Returns a handle for targeted dismiss. */
export function toastShow(input: ToastInput): ToastHandle {
  const intent = input.intent ?? 'confirm';
  const durationMs = input.durationMs ?? DEFAULT_DURATIONS[intent];
  const id = nextId++;
  currentSlot = { id, message: input.message, intent, durationMs };
  notifyAll();
  return { id, dismiss: () => toastDismiss(id) };
}

/**
 * Clear the current toast. If `id` is given, only clears when it matches —
 * a stale handle's `dismiss()` cannot evict the toast that replaced it.
 */
export function toastDismiss(id?: number): void {
  if (id !== undefined) {
    if (currentSlot === null || currentSlot.id !== id) return;
  }
  if (currentSlot === null) return;
  currentSlot = null;
  notifyAll();
}

/** Subscribe to slot changes. Returns an unsubscribe fn (Set semantics). */
export function subscribeToast(listener: ToastListener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

/** Synchronous read of the current slot. SSR-safe (returns `null` initially). */
export function getCurrentToast(): ToastMsg | null {
  return currentSlot;
}

// ─── Test-only reset (kept tiny; not exported in barrel) ───────────────────

/** Reset the singleton. Tests only — never call from app code. */
export function __resetToastStoreForTest(): void {
  currentSlot = null;
  nextId = 1;
  listeners.clear();
}
