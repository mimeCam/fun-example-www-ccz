/**
 * Text utilities for sharing highlighted quotes.
 * Formats text with attribution for copy/paste and social media.
 */

export interface ShareFormat {
  text: string;
  attribution: string;
  url?: string;
}

/**
 * Format a highlighted text as a blockquote with attribution.
 * Perfect for pasting into emails, documents, or social media.
 *
 * @param text - The highlighted text
 * @param attribution - Author/article attribution
 * @param url - Optional URL to include
 * @returns Formatted quote string
 */
export function formatBlockquote(share: ShareFormat): string {
  const lines: string[] = [];

  // Add the quote
  lines.push(`> ${share.text}`);

  // Add attribution
  if (share.attribution) {
    lines.push(``);
    lines.push(`— ${share.attribution}`);
  }

  // Add URL if provided
  if (share.url) {
    lines.push(``);
    lines.push(share.url);
  }

  return lines.join('\n');
}

/**
 * Format a highlight for Twitter/X with character limit.
 *
 * @param share - The share data
 * @param maxLength - Twitter's 280 character limit
 * @returns Tweet-ready string
 */
export function formatForTwitter(share: ShareFormat, maxLength = 280): string {
  const citation = share.attribution ? `\n\n— ${share.attribution}` : '';
  const url = share.url ? `\n\n${share.url}` : '';

  // Calculate available space for quote
  const citationLength = citation.length + url.length;
  const maxQuoteLength = maxLength - citationLength - 2; // -2 for "📦" emoji prefix

  let quote = share.text;
  if (quote.length > maxQuoteLength) {
    quote = quote.substring(0, maxQuoteLength - 3) + '...';
  }

  return `📦 "${quote}"${citation}${url}`;
}

/**
 * Extract context around a highlighted text.
 * Returns the surrounding paragraph for additional context.
 *
 * @param element - DOM element containing the highlight
 * @param contextChars - Number of characters before/after to include
 * @returns Context string or null
 */
export function extractContext(element: HTMLElement, contextChars = 100): string | null {
  // Find the parent paragraph or heading
  const parent = element.closest('p, h1, h2, h3, h4, h5, h6, blockquote, li');
  if (!parent) return null;

  const fullText = parent.textContent || '';
  const selectedText = element.textContent || '';

  // Find position of selected text
  const startIndex = fullText.indexOf(selectedText);
  if (startIndex === -1) return fullText; // Fallback to full text

  // Extract context
  const contextStart = Math.max(0, startIndex - contextChars);
  const contextEnd = Math.min(fullText.length, startIndex + selectedText.length + contextChars);

  let context = fullText.substring(contextStart, contextEnd);

  // Add ellipsis if truncated
  if (contextStart > 0) context = '...' + context;
  if (contextEnd < fullText.length) context = context + '...';

  return context;
}

/**
 * Generate a simple hash from text for URL fragment identifier.
 * This is an in-house solution - no external dependencies.
 *
 * @param text - Text to hash
 * @returns Short hash string
 */
export function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a unique highlight ID from article and position.
 * Used for creating shareable permalinks.
 *
 * @param articleId - Article identifier
 * @param position - Character position in article
 * @param text - Selected text (for hash uniqueness)
 * @returns Unique highlight ID
 */
export function generateHighlightId(
  articleId: string,
  position: number,
  text: string
): string {
  const textHash = simpleHash(text.substring(0, 50)); // Hash first 50 chars
  return `${articleId}-${position}-${textHash}`;
}

/**
 * Clean and normalize text for sharing.
 * Removes extra whitespace, fixes quotes, etc.
 *
 * @param text - Raw text from selection
 * @returns Cleaned text
 */
export function cleanText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[""]/g, '"') // Normalize quotes
    .replace(/['']/g, "'"); // Normalize apostrophes
}

/**
 * Validate if text is suitable for sharing.
 *
 * @param text - Text to validate
 * @param minLength - Minimum character count (default 10)
 * @param maxLength - Maximum character count (default 500)
 * @returns true if valid
 */
export function isShareableText(
  text: string,
  minLength = 10,
  maxLength = 500
): boolean {
  const trimmed = text.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}
