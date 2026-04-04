/**
 * Share link generation utilities.
 * Creates permalinks with URL fragments for direct highlight linking.
 */

import { generateTextHash } from './highlight-finder';
import { cleanText } from './text-utils';

const HIGHLIGHT_FRAGMENT_KEY = 'highlight';

/**
 * Generate a shareable permalink with highlight fragment.
 *
 * @param baseUrl - Current page URL
 * @param selectedText - Selected text to share
 * @returns Shareable URL with fragment
 */
export function generateShareLink(
  baseUrl: string,
  selectedText: string
): string {
  // Clean and hash the text
  const cleanedText = cleanText(selectedText);
  const textHash = generateTextHash(cleanedText);

  // Encode the text for URL (with fallback for older browsers)
  const encodedText = encodeURIComponent(cleanedText.substring(0, 100)); // First 100 chars

  // Remove existing fragment if present
  const urlWithoutFragment = baseUrl.split('#')[0];

  // Add highlight fragment with both hash and text snippet
  return `${urlWithoutFragment}#${HIGHLIGHT_FRAGMENT_KEY}=${textHash}&text=${encodedText}`;
}

/**
 * Parse highlight text from URL fragment.
 *
 * @param url - URL to parse (defaults to current page)
 * @returns Highlight text or null
 */
export function parseHighlightFragment(url?: string): string | null {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  // Match #highlight=text&text=encoded
  const textMatch = targetUrl.match(/#highlight=[^&]+&text=([^&]+)/);
  if (textMatch) {
    return decodeURIComponent(textMatch[1]);
  }

  return null;
}

/**
 * Check if current page has a highlight fragment.
 *
 * @returns true if highlight fragment exists
 */
export function hasHighlightFragment(): boolean {
  return parseHighlightFragment() !== null;
}

/**
 * Clear highlight fragment from URL (updates browser history).
 * Useful after scrolling to highlight to clean up URL.
 *
 * @param url - Current URL
 */
export function clearHighlightFragment(url?: string): void {
  const targetUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const cleanUrl = targetUrl.split('#')[0];

  if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
    window.history.replaceState({}, '', cleanUrl);
  }
}
