/**
 * Clipboard utilities for copy-to-clipboard functionality.
 * Cross-browser compatible with fallback support.
 *
 * Toast feedback: routed through `@/lib/sharing/toast-store` (the 6th
 * primitive's pub/sub singleton). The previous implementation minted a
 * foreign-DOM `<div>` with inline cssText — a mount outside React, which
 * broke `var(--sys-*)` resolution and required three `:exempt` comments.
 * Those comments are gone because the *mount* is fixed (Mike §1, Tanya §0).
 */

import {
  toastShow, type ToastIntent, type ToastHandle,
} from '@/lib/sharing/toast-store';

/**
 * Copy text to clipboard using modern Clipboard API.
 *
 * @param text - Text to copy
 * @returns Promise that resolves if successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn('Clipboard API failed, falling back to legacy method:', error);
      return fallbackCopy(text);
    }
  }

  // Fallback for older browsers
  return fallbackCopy(text);
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
 * @param message - Final, already-tinted phrase to show
 * @param duration - Optional dwell override (defaults to `confirm` budget)
 */
export function showCopyFeedback(message = 'Copied.', duration?: number): ToastHandle {
  return toastShow({ message, intent: 'confirm', durationMs: duration });
}

/**
 * Copy text and surface the result through the shared toast.
 *
 * Returns the boolean copy outcome so callers can chain follow-ups.
 */
export async function copyWithFeedback(
  text: string,
  successMessage: string = 'Copied.',
  failureMessage: string = "Didn't land — try again.",
): Promise<boolean> {
  const ok = await copyToClipboard(text);
  toastShow({
    message: ok ? successMessage : failureMessage,
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
