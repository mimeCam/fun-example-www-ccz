/**
 * Clipboard utilities for copy-to-clipboard functionality.
 * Cross-browser compatible with fallback support.
 *
 * Toast feedback: routed through `@/lib/sharing/toast-store` (the 6th
 * primitive's pub/sub singleton). The previous implementation minted a
 * foreign-DOM `<div>` with inline cssText — a mount outside React, which
 * broke `var(--sys-*)` resolution and required three `:exempt` comments.
 * Those comments are gone because the *mount* is fixed (Mike §1, Tanya §0).
 *
 * Voice parity: default phrases now flow through `replyPhrase(kind)` —
 * the pure-TS tone resolver reading the Mirror archetype off `localStorage`.
 * Explicit `successMessage` / `failureMessage` overrides still win (callers
 * like `ThreadKeepsake` pass poetic one-offs). Only the *default* path
 * consults the lexicon.
 *
 * Direct-gesture asymmetry (Mike #21 / Tanya #10 — the Quiet Keepsake):
 *   `copyWithFeedback` and `showCopyFeedback` are **quiet-on-success** by
 *   default. The witness lives at the fingertip (the caller's
 *   `ActionPressable.pulse(ok)` glow + sr-only `<PhaseAnnouncement>`). The
 *   room (toast) only speaks when the caller has no fingertip witness OR
 *   when the operation fails — failure escalates one level because the
 *   reader needs to know.
 *
 *   Opt in to the room voice via `announce: 'room'`. Today the only
 *   legitimate site is `runShare`'s `navigator.share`-unsupported failover
 *   (no `ActionPressable` wraps the primary CTA — Krystle's primary-button
 *   exclusion). The third independent site that needs this asymmetry will
 *   earn the 9th ledger; until then it lives as a default + a paragraph in
 *   AGENTS.md (rule of three; doctrine: Mike #70 §A — "no ninth ledger").
 */

import {
  toastShow, type ToastHandle,
} from '@/lib/sharing/toast-store';
import { replyPhrase } from '@/lib/sharing/reply-resolve';
import {
  buildClipboardPayload, isMultiMimeSupported,
  type EnvelopeInput,
} from '@/lib/sharing/clipboard-envelope';
import { CHECKPOINTS, emitCheckpoint } from '@/lib/hooks/useLoopFunnel';

/**
 * Try the multi-MIME (`ClipboardItem`) path. Returns `true` on success,
 * `false` when the env lacks the constructor or `write()` rejects.
 * Plain-text MIME is byte-identical to `writeText(text)`.
 */
async function writeMultiMime(text: string, env: EnvelopeInput): Promise<boolean> {
  if (!isMultiMimeSupported()) return false;
  try {
    const { plain, html } = buildClipboardPayload(text, env);
    const Item = (globalThis as { ClipboardItem: typeof ClipboardItem }).ClipboardItem;
    await navigator.clipboard.write([new Item({
      'text/plain': new Blob([plain], { type: 'text/plain' }),
      'text/html':  new Blob([html],  { type: 'text/html'  }),
    })]);
    return true;
  } catch { return false; }
}

/** Plain `writeText` path — the pre-envelope behaviour. */
async function writePlain(text: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) return fallbackCopy(text);
  try { await navigator.clipboard.writeText(text); return true; }
  catch (error) {
    console.warn('Clipboard API failed, falling back to legacy method:', error);
    return fallbackCopy(text);
  }
}

/**
 * Copy text to clipboard. When `envelope` is supplied AND the runtime
 * supports `ClipboardItem`, we ship both `text/plain` (byte-identical) and
 * `text/html` (a semantic `<blockquote cite>`). Otherwise we fall through
 * to the existing `writeText` path — no regression, no new failure toast.
 *
 * @param text - Text to copy
 * @param envelope - Optional citation metadata — see `clipboard-envelope.ts`
 * @returns Promise that resolves with success
 */
export async function copyToClipboard(
  text: string,
  envelope?: EnvelopeInput,
): Promise<boolean> {
  const ok = (envelope && (await writeMultiMime(text, envelope)))
    || (await writePlain(text));
  // Reader-loop checkpoint #4: shared (clipboard write succeeded). No-op
  // off-article surfaces — `useLoopFunnel(articleId)` gates the emit.
  if (ok) emitCheckpoint(CHECKPOINTS.SHARED);
  return ok;
}

/**
 * Legacy copy-to-clipboard using document.execCommand.
 * Works in older browsers that don't support Clipboard API.
 *
 * @param text - Text to copy
 * @returns true if successful
 */
function fallbackCopy(text: string): boolean {
  try {
    // Create a temporary textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);

    // Select and copy
    textarea.focus();
    textarea.select();

    const successful = document.execCommand('copy');

    // Cleanup
    document.body.removeChild(textarea);

    return successful;
  } catch (error) {
    console.error('Fallback copy failed:', error);
    return false;
  }
}

/**
 * Check if clipboard API is available.
 *
 * @returns true if supported
 */
export function isClipboardSupported(): boolean {
  return !!(
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function' &&
    window.isSecureContext
  );
}

/**
 * Where the copy outcome should announce itself.
 *   `'fingertip'` — the caller owns the witness (an `<ActionPressable>`
 *                   pulse, a button label flip, etc.). Nothing toasts on
 *                   success; failure still escalates.
 *   `'room'`      — explicit opt-in for surfaces with no fingertip
 *                   witness. Both success AND failure toast.
 *
 * **Explicit at every call site** (Mike #voice-peer §4 axis A — the
 * regression lint at `lib/sharing/__tests__/voice-call-site-fence.test.ts`).
 * The helper still defaults `announce` to `'fingertip'` if absent so unit
 * tests and helper-internal call paths stay terse, but every reader-
 * facing call site under `app/` and `components/` MUST spell the literal.
 * The default lives in the helper; the *decision* lives at the call site.
 * Voice drift = pause drift (Paul K., "Protect the Pause").
 *
 * Failure ALWAYS toasts regardless of `announce` — the contract is
 * "failure escalates one level" (Tanya §2.1). A failed copy with no
 * witness anywhere is a silent contract break the reader cannot recover
 * from. (Mike #21, Tanya #10 §6 — Fingertip-Receipt Covenant.)
 */
export type CopyAnnounce = 'fingertip' | 'room';

/** Options bag for `copyWithFeedback` — keyword form, default-quiet. */
export interface CopyFeedbackOptions {
  /** Override the success phrase (skips the lexicon for this call). */
  successMessage?: string;
  /** Override the failure phrase (skips the lexicon for this call). */
  failureMessage?: string;
  /** Optional citation envelope — see `clipboard-envelope.ts`. */
  envelope?: EnvelopeInput;
  /** Where the success voice lives. Default: `'fingertip'` (no toast). */
  announce?: CopyAnnounce;
}

/**
 * Show a brief toast confirmation. Pure-TS callers route through the
 * single store; the `<ToastHost>` portal mounted in `<ThermalLayout>`
 * paints the surface with full ledger-token resolution.
 *
 * Quiet-by-default (Mike #21 / Tanya #10): pass `announce: 'room'` to
 * actually emit a confirm toast. Without it, this helper is a no-op on
 * success — the assumption is the caller's fingertip already painted the
 * receipt. The export stays alive for explicit room-voice surfaces.
 *
 * Returns a non-null `ToastHandle` only when a toast was actually shown.
 *
 * @param message - Final, already-tinted phrase to show; defaults to the
 *                  reader-tinted `'copy-text'` phrase via `replyPhrase`.
 * @param announce - Where the voice lives. Default `'fingertip'` (silent).
 * @param duration - Optional dwell override (defaults to `confirm` budget)
 */
export function showCopyFeedback(
  message?: string,
  announce: CopyAnnounce = 'fingertip',
  duration?: number,
): ToastHandle | null {
  if (announce !== 'room') return null;
  return toastShow({
    message: message ?? replyPhrase('copy-text'),
    intent: 'confirm',
    durationMs: duration,
  });
}

/**
 * Copy text. Defaults are quiet-on-success: the caller's fingertip
 * witness owns the receipt; only failures escalate to the room (toast
 * with `warn` intent). Pass `announce: 'room'` to emit a confirm toast on
 * success too — used by surfaces with no fingertip available
 * (`navigator.share` failover, `useToast.confirm(kind)`-style callers).
 *
 * Returns the boolean copy outcome so callers can chain follow-ups
 * (`pulse(ok)`, checkpoint emits, etc.).
 */
export async function copyWithFeedback(
  text: string,
  options: CopyFeedbackOptions = {},
): Promise<boolean> {
  const ok = await copyToClipboard(text, options.envelope);
  if (shouldAnnounce(ok, options.announce)) {
    toastShow({
      message: phraseFor(ok, options),
      intent:  ok ? 'confirm' : 'warn',
    });
  }
  return ok;
}

/**
 * Toast iff the operation failed (always loud) OR the caller explicitly
 * opted into the room voice (e.g. `runShare` failover). Success without
 * an explicit room request stays at the fingertip.
 */
function shouldAnnounce(ok: boolean, announce?: CopyAnnounce): boolean {
  return !ok || announce === 'room';
}

/** Pick the toast phrase: caller override → lexicon default. */
function phraseFor(ok: boolean, options: CopyFeedbackOptions): string {
  if (ok) return options.successMessage ?? replyPhrase('copy-link');
  return options.failureMessage ?? replyPhrase('copy-failed');
}

/**
 * Read text from clipboard (if permitted).
 *
 * @returns Promise with clipboard text or null
 */
export async function readFromClipboard(): Promise<string | null> {
  if (navigator.clipboard && navigator.clipboard.readText) {
    try {
      return await navigator.clipboard.readText();
    } catch (error) {
      // User may have denied permission
      console.warn('Could not read from clipboard:', error);
      return null;
    }
  }

  return null;
}
