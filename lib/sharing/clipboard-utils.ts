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
 */

import {
  toastShow, type ToastIntent, type ToastHandle,
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
 * Show a brief toast confirmation. Pure-TS callers route through the
 * single store; the `<ToastHost>` portal mounted in `<ThermalLayout>`
 * paints the surface with full ledger-token resolution.
 *
 * @param message - Final, already-tinted phrase to show; defaults to the
 *                  reader-tinted `'copy-text'` phrase via `replyPhrase`.
 * @param duration - Optional dwell override (defaults to `confirm` budget)
 */
export function showCopyFeedback(message?: string, duration?: number): ToastHandle {
  return toastShow({
    message: message ?? replyPhrase('copy-text'),
    intent: 'confirm',
    durationMs: duration,
  });
}

/**
 * Copy text and surface the result through the shared toast. Defaults
 * flow through the lexicon (reader's tone tints the phrase); callers may
 * pass explicit `successMessage` / `failureMessage` to override.
 *
 * Returns the boolean copy outcome so callers can chain follow-ups.
 */
export async function copyWithFeedback(
  text: string,
  successMessage?: string,
  failureMessage?: string,
  envelope?: EnvelopeInput,
): Promise<boolean> {
  const ok = await copyToClipboard(text, envelope);
  toastShow({
    message: ok
      ? (successMessage ?? replyPhrase('copy-link'))
      : (failureMessage ?? replyPhrase('copy-failed')),
    intent:  ok ? 'confirm' : 'warn',
  });
  return ok;
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
