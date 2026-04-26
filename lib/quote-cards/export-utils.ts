/**
 * Quote Card Export Utilities
 *
 * Pure-TS export helpers for the quote-card surface. These do the work
 * (download / copy-to-clipboard / batch) and return a boolean. They DO
 * NOT speak success — the witness lives at the fingertip on the host
 * (`<QuoteKeepsake>`'s `<ActionPressable>` row), not in the room.
 *
 * Direct-gesture asymmetry (Mike #81 / Tanya #75 — quote-card host #2):
 *   • Success → silent. The caller's `pulse(ok)` glyph swap + sr-only
 *     `<PhaseAnnouncement>` is the receipt.
 *   • Failure → `showExportError(method)` toasts with `intent: 'warn'`.
 *     The asymmetry holds in both directions — failure escalates.
 *
 * The previous `showExportFeedback(method)` helper has been retired:
 * the success surface is no longer a toast. The failure helper stays.
 *
 * Voice parity: failure phrases flow through `replyPhrase('copy-failed')`
 * / `replyPhrase('download-failed')` — same lexicon every other surface
 * uses. No archetype threading; SSR-safe via `readStoredArchetype()`.
 *
 * Credits: Mike K. (#81 napkin — strip the success toast, return a
 * boolean, keep the failure path), Tanya D. (#75 §4.1 — the migration
 * diff: lines retired, lines kept, why), Sid (this lift).
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
 * Surface a failure through the shared toast (warn intent, same surface).
 * Phrase is resolved via the lexicon — the reflective "Didn't land — try
 * again." only reaches reflective readers; others see the neutral failure.
 *
 * This is the SOLE legitimate `toastShow` call site in this file: the
 * asymmetry rule is "failure escalates one level" because the reader
 * needs to know when the contract breaks (Mike #81 §8.3, Tanya #75 §4.1).
 */
export function showExportError(method: 'download' | 'clipboard'): void {
  toastShow({
    message: replyPhrase(method === 'download' ? 'download-failed' : 'copy-failed'),
    intent: 'warn',
  });
}

/**
 * Attempt one export pass — pure orchestration over the two atoms.
 * Pulled out so `exportQuoteCard` stays under 10 lines (Sid lab rule).
 */
async function attemptExport(
  dataUrl: string,
  method: 'download' | 'clipboard',
  options: ExportOptions,
): Promise<boolean> {
  return method === 'download'
    ? downloadQuoteCard(dataUrl, options)
    : copyQuoteCardToClipboard(dataUrl);
}

/**
 * Export quote card with automatic retry. **Quiet on success** — the
 * caller owns the witness (an `<ActionPressable>.pulse(ok)` at the
 * fingertip). Failure (after all retries exhausted) escalates to the
 * room via `showExportError`. Returns the boolean outcome so the host
 * can pulse(ok) and emit checkpoints (Mike #81 §4.1).
 */
export async function exportQuoteCard(
  dataUrl: string,
  method: 'download' | 'clipboard' = 'download',
  options: ExportOptions = {},
  maxRetries: number = 2,
): Promise<boolean> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (await attemptExport(dataUrl, method, options)) return true;
    } catch (error) {
      console.error(`Export attempt ${attempt + 1} failed:`, error);
    }
    if (attempt < maxRetries) await new Promise(r => setTimeout(r, 500));
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
