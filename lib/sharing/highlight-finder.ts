/**
 * Highlight finder utilities.
 * Locates text in the DOM for shared links using content matching.
 *
 * The temporary-highlight pulse primitive (`pulseElementGold`,
 * `HIGHLIGHT_TINT`, keyframes) graduated to `./highlight-pulse.ts` so the
 * sender side of the share gesture rides the same atom (Mike #92 §"compose,
 * don't migrate"). `createTemporaryHighlight` stays as a thin passthrough
 * for the recipient call-site so the orphan-graduates fence and the
 * `scrollToSharedHighlight` contract remain byte-identical.
 */

import { simpleHash } from './text-utils';
import { pulseElementGold, PULSE_DWELL_MS } from './highlight-pulse';

/**
 * Generate a highlight ID from text content only.
 * Simpler than position-based approach - no storage needed.
 *
 * @param text - Selected text
 * @returns Unique highlight ID
 */
export function generateTextHash(text: string): string {
  // Hash the full text for uniqueness
  return simpleHash(text);
}

/**
 * Find text in the DOM and return the element.
 * Searches for exact text match within paragraph-like elements.
 *
 * @param searchText - Text to find
 * @returns Element containing the text or null
 */
export function findTextInDocument(searchText: string): HTMLElement | null {
  // Text nodes to search within
  const searchSelectors = [
    'p',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'blockquote',
    'li',
    'article',
  ];

  // Normalize search text
  const normalizedSearch = searchText.trim().toLowerCase();

  // Search in all text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip script, style, and other non-content elements
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;

        const tagName = parent.tagName.toLowerCase();
        if (
          tagName === 'script' ||
          tagName === 'style' ||
          tagName === 'noscript' ||
          parent.closest('[data-highlight-finder-ignore]')
        ) {
          return NodeFilter.FILTER_REJECT;
        }

        // Only check if text is long enough to be worth searching
        if (node.textContent && node.textContent.length >= 10) {
          return NodeFilter.FILTER_ACCEPT;
        }

        return NodeFilter.FILTER_REJECT;
      },
    }
  );

  let node: Node | null;
  let bestMatch: HTMLElement | null = null;
  let bestMatchScore = 0;

  while ((node = walker.nextNode())) {
    const text = node.textContent || '';
    const normalizedText = text.trim().toLowerCase();

    // Check if search text is contained in this node
    if (normalizedText.includes(normalizedSearch)) {
      // Calculate match score (prefer exact matches and longer contexts)
      const score = normalizedSearch.length / normalizedText.length;

      if (score > bestMatchScore) {
        const parent = node.parentElement;
        if (parent) {
          bestMatch = parent;
          bestMatchScore = score;
        }
      }
    }
  }

  return bestMatch;
}

/**
 * Create a temporary highlight on an element. Thin passthrough to the
 * shared `pulseElementGold` primitive in `./highlight-pulse.ts`.
 *
 * Kept for the orphan-graduates contract (`scrollToSharedHighlight` is
 * the canonical recipient call-site and imports this symbol). The
 * sender-side caller imports `pulseElementGold` directly so the symmetry
 * fence can pin two distinct call-sites resolving to the same atom.
 *
 * @param element - Element to highlight
 * @param reduced - Honor `prefers-reduced-motion`: skip the scale pulse
 * @returns Cleanup function to remove highlight
 */
export function createTemporaryHighlight(
  element: HTMLElement,
  reduced = false,
): () => void {
  return pulseElementGold(element, reduced);
}

/** Reduced-motion-honoring scroll affordance — instant if reduced. */
function scrollToElement(el: HTMLElement, reduced: boolean): void {
  el.scrollIntoView({
    behavior: reduced ? 'auto' : 'smooth',
    block: 'center',
  });
}

/**
 * Scroll to and highlight text from a shared link.
 *
 * @param searchText - Text to find and highlight
 * @param reduced - Honor `prefers-reduced-motion`
 * @returns true if found and scrolled
 */
export function scrollToSharedHighlight(
  searchText: string,
  reduced = false,
): boolean {
  const element = findTextInDocument(searchText);
  if (!element) {
    console.warn('Could not find highlighted text in document');
    return false;
  }
  scrollToElement(element, reduced);
  const cleanup = createTemporaryHighlight(element, reduced);
  setTimeout(cleanup, PULSE_DWELL_MS);
  return true;
}
