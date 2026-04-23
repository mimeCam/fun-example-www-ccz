/**
 * Clipboard utilities for copy-to-clipboard functionality.
 * Cross-browser compatible with fallback support.
 */

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
 * Show a brief toast notification after copy.
 * Provides visual feedback that text was copied.
 *
 * @param message - Message to display
 * @param duration - Duration in milliseconds (default 2000)
 */
export function showCopyFeedback(message: string = 'Copied to clipboard!', duration = 2000): void {
  // Remove existing toast if present
  const existing = document.getElementById('copy-feedback-toast');
  if (existing) {
    existing.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'copy-feedback-toast';
  toast.textContent = message;
  toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-surface text-white px-4 py-2 rounded-xl z-50 animate-fade-in';
  // elevation-ledger:exempt — toast is a JS-injected float over body chrome,
  // appears before React/Tailwind CSS may have processed --sys-elev-* vars
  // for unmounted state. Inline shadow is the safe default. See
  // ELEVATION_LEDGER_EXEMPT_TOKEN in lib/design/elevation.ts.
  // (Elon §4.3 fix: previously a legacy `float` Tailwind alias contradicted
  // the exempt comment; the cssText below is the single source of shadow.)
  // spacing-ledger:exempt — same rationale for padding: the toast is minted
  // outside React/Tailwind, so `px-4 py-2` + inline `padding: 0.5rem 1rem`
  // are the honest literal that survives an unmounted ThermalProvider.
  // See SPACING_LEDGER_EXEMPT_TOKEN in lib/design/spacing.ts.
  // radius-ledger:exempt — foreign-DOM toast: `var(--sys-radius-*)` does
  // not resolve on a DOM node appended before React/Tailwind process the
  // custom-property cascade. The inline `border-radius: 0.5rem` literal
  // mirrors `--sys-radius-medium` (held, the confirmation-scale rung).
  // See RADIUS_LEDGER_EXEMPT_TOKEN in lib/design/radius.ts (Tanya §5.1).
  toast.style.cssText = `
    position: fixed;
    bottom: 1rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: #1f2937;
    color: white;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 50;
    animation: fadeIn 0.2s ease-out;
  `;

  document.body.appendChild(toast);

  // Remove after duration
  setTimeout(() => {
    toast.style.transition = 'opacity 0.2s ease-out';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

/**
 * Copy with automatic feedback toast.
 * Combines copy and user feedback in one call.
 *
 * @param text - Text to copy
 * @param successMessage - Custom success message
 * @returns Promise that resolves to true if successful
 */
export async function copyWithFeedback(
  text: string,
  successMessage?: string
): Promise<boolean> {
  const success = await copyToClipboard(text);

  if (success) {
    showCopyFeedback(successMessage || 'Copied to clipboard!');
  } else {
    showCopyFeedback('Failed to copy. Please try again.');
  }

  return success;
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
