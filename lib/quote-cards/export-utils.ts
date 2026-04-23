/**
 * Quote Card Export Utilities
 * Handles downloading and clipboard operations for quote cards.
 *
 * Features:
 * - Download as PNG
 * - Copy to clipboard
 * - File naming with timestamps
 * - Error handling via the shared toast primitive
 *
 * Toast feedback: routed through `@/lib/sharing/toast-store` (the 6th
 * primitive's pub/sub singleton). Three `:exempt` comments removed —
 * the surface paints inside React's tree now (Mike §1, Tanya §0).
 *
 * Voice parity: phrases flow through `replyPhrase(kind)` — the pure-TS
 * tone resolver. Reflective readers saving a card see "Saved."; kinetic
 * readers see "Downloaded." The under-tinting discipline (Tanya §7.2)
 * lives in the lexicon, not here.
 */

import { toastShow } from '@/lib/sharing/toast-store';
import { replyPhrase } from '@/lib/sharing/reply-resolve';

export interface ExportOptions {
  filename?: string;
  quality?: number;
}

/**
 * Download quote card as PNG file
 */
export async function downloadQuoteCard(
  dataUrl: string,
  options: ExportOptions = {}
): Promise<boolean> {
  const {
    filename = `quote-card-${Date.now()}.png`,
    quality = 1.0,
  } = options;

  try {
    // Create download link
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return true;
  } catch (error) {
    console.error('Failed to download quote card:', error);
    return false;
  }
}

/**
 * Copy quote card to clipboard
 */
export async function copyQuoteCardToClipboard(
  dataUrl: string
): Promise<boolean> {
  try {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Generate filename for quote card
 */
export function generateFilename(
  quote: string,
  author: string,
  maxLength: number = 50
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const sanitizedQuote = quote
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, maxLength);

  const sanitizedAuthor = author
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `${sanitizedQuote}-${sanitizedAuthor}-${timestamp}.png`;
}

/**
 * Surface a success confirmation through the shared toast primitive.
 * Phrase is resolved via the lexicon using the reader's stored archetype
 * (null → `DEFAULT_TONE`). Reflective readers get "Saved." / "Card copied.";
 * kinetic & analytical readers get the neutral defaults.
 */
export function showExportFeedback(
  method: 'download' | 'clipboard',
  onSuccess?: () => void
): void {
  toastShow({
    message: replyPhrase(method === 'download' ? 'download' : 'copy-image'),
    intent: 'confirm',
  });
  if (onSuccess) onSuccess();
}

/**
 * Surface a failure through the shared toast (warn intent, same surface).
 * Phrase is resolved via the lexicon — the reflective "Didn't land — try
 * again." only reaches reflective readers; others see the neutral failure.
 */
export function showExportError(method: 'download' | 'clipboard'): void {
  toastShow({
    message: replyPhrase(method === 'download' ? 'download-failed' : 'copy-failed'),
    intent: 'warn',
  });
}

/**
 * Export quote card with automatic retry
 */
export async function exportQuoteCard(
  dataUrl: string,
  method: 'download' | 'clipboard' = 'download',
  options: ExportOptions = {},
  maxRetries: number = 2
): Promise<boolean> {
  let attempts = 0;

  while (attempts <= maxRetries) {
    try {
      const success = method === 'download'
        ? await downloadQuoteCard(dataUrl, options)
        : await copyQuoteCardToClipboard(dataUrl);

      if (success) {
        showExportFeedback(method);
        return true;
      }
    } catch (error) {
      console.error(`Export attempt ${attempts + 1} failed:`, error);
    }

    attempts++;
    if (attempts <= maxRetries) {
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  showExportError(method);
  return false;
}

/**
 * Batch export multiple cards
 */
export async function batchExportQuoteCards(
  cards: Map<string, string>,
  method: 'download' | 'clipboard' = 'download'
): Promise<{ successful: number; failed: number }> {
  let successful = 0;
  let failed = 0;

  for (const [templateId, dataUrl] of cards) {
    try {
      const success = method === 'download'
        ? await downloadQuoteCard(dataUrl, {
            filename: `quote-card-${templateId}-${Date.now()}.png`,
          })
        : await copyQuoteCardToClipboard(dataUrl);

      if (success) {
        successful++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`Failed to export ${templateId}:`, error);
      failed++;
    }

    // Small delay between exports
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  return { successful, failed };
}
