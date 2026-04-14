/**
 * Highlight finder utilities.
 * Locates text in the DOM for shared links using content matching.
 */

import { simpleHash } from './text-utils';

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
 * Create a temporary highlight on an element.
 * Adds a visual indicator that scrolls with the element.
 *
 * @param element - Element to highlight
 * @returns Cleanup function to remove highlight
 */
export function createTemporaryHighlight(element: HTMLElement): () => void {
  // Save original styles
  const originalTransition = element.style.transition;
  const originalBackgroundColor = element.style.backgroundColor;

  // Apply highlight styles
  element.style.transition = 'background-color 0.3s ease, transform 0.3s ease';
  element.style.backgroundColor = 'rgba(240, 198, 116, 0.15)';

  // Add a subtle pulse animation
  element.style.animation = 'pulse-highlight 1s ease-in-out 2';

  // Inject keyframes if not already present
  if (!document.getElementById('highlight-keyframes')) {
    const style = document.createElement('style');
    style.id = 'highlight-keyframes';
    style.textContent = `
      @keyframes pulse-highlight {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.01); }
      }
    `;
    document.head.appendChild(style);
  }

  // Return cleanup function
  return () => {
    element.style.transition = originalTransition;
    element.style.backgroundColor = originalBackgroundColor;
    element.style.animation = '';
  };
}

/**
 * Scroll to and highlight text from a shared link.
 *
 * @param searchText - Text to find and highlight
 * @returns true if found and scrolled
 */
export function scrollToSharedHighlight(searchText: string): boolean {
  const element = findTextInDocument(searchText);

  if (!element) {
    console.warn('Could not find highlighted text in document');
    return false;
  }

  // Scroll to element
  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });

  // Create temporary highlight
  const cleanup = createTemporaryHighlight(element);

  // Remove highlight after animation
  setTimeout(() => {
    cleanup();
  }, 3000);

  return true;
}
