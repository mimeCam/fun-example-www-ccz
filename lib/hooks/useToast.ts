/**
 * useToast — React binding for the 6th primitive's reply.
 *
 * Hooks read the active archetype from `useThermal()` so the lexicon's
 * tone bucket is the room's voice without callers thinking about it.
 * For pure-TS callers (`clipboard-utils`, `quote-cards/export-utils`)
 * the module-level `toastShow(...)` from `@/lib/sharing/toast-store`
 * is the entry point — same store, no archetype awareness.
 *
 * Two convenience methods (`confirm`, `warn`) take a `ReplyKind` and
 * resolve the curated phrase via the lexicon. `show` is the escape
 * hatch — pass any pre-tinted message string.
 *
 * No state of its own. The store is the source of truth; this hook is
 * a stable adaptor (`useCallback` + `useMemo` so call sites do not
 * re-render needlessly).
 *
 * Credits: Mike K. (napkin §5 — public API sketch + the hook/module
 * dual entry), Tanya D. (UX §8.2 — the `confirm` / `warn` verbs that
 * keep callers ignorant of tone derivation).
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useThermal } from '@/components/thermal/ThermalProvider';
import {
  toastShow, type ToastInput, type ToastHandle,
} from '@/lib/sharing/toast-store';
import {
  archetypeToTone, phraseFor, type ReplyKind,
} from '@/lib/sharing/reply-lexicon';

/** The hook's surface — three verbs, every one returns a `ToastHandle`. */
export interface ToastApi {
  /** Free-form: caller owns the message string. */
  show:    (input: ToastInput) => ToastHandle;
  /** Curated confirm phrase resolved via active archetype's tone. */
  confirm: (kind: ReplyKind) => ToastHandle;
  /** Curated warn phrase (same surface, same dwell budget for warn). */
  warn:    (kind: ReplyKind) => ToastHandle;
}

export function useToast(): ToastApi {
  const { archetype } = useThermal();
  const tone = archetypeToTone(archetype);
  const show = useCallback((input: ToastInput) => toastShow(input), []);
  const confirm = useCallback(
    (kind: ReplyKind) => toastShow({ message: phraseFor(kind, tone), intent: 'confirm' }),
    [tone],
  );
  const warn = useCallback(
    (kind: ReplyKind) => toastShow({ message: phraseFor(kind, tone), intent: 'warn' }),
    [tone],
  );
  return useMemo<ToastApi>(() => ({ show, confirm, warn }), [show, confirm, warn]);
}
