/**
 * Quote Card Export Utilities
 * Handles downloading and clipboard operations for quote cards.
 *
 * Features:
 * - Download as PNG
 * - Copy to clipboard
 * - File naming with timestamps
 * - Error handling with user feedback
 */

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
 * Show success feedback toast
 */
export function showExportFeedback(
  method: 'download' | 'clipboard',
  onSuccess?: () => void
): void {
  const message = method === 'download'
    ? 'Quote card downloaded!'
    : 'Copied to clipboard!';

  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn';
  toast.textContent = message;

  document.body.appendChild(toast);

  // Remove after delay
  setTimeout(() => {
    toast.classList.add('animate-fadeOut');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 2000);

  if (onSuccess) {
    onSuccess();
  }
}

/**
 * Show error feedback toast
 */
export function showExportError(
  method: 'download' | 'clipboard'
): void {
  const message = method === 'download'
    ? 'Failed to download quote card'
    : 'Failed to copy to clipboard';

  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn';
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('animate-fadeOut');
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
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
