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
 * The temporary-highlight tint — gold @ 10% via the design-system mixer so
 * the wash warms with the thermal engine. Replaces the pre-graduation
 * `rgba(240,198,116,0.15)` literal that earned this file a grandfather
 * entry in `COLOR_GRANDFATHERED_PATHS`. One literal, one home; the
 * color-adoption guard greps the file clean.
 *
 * Mike #117 §3 (color-ledger graduation), Tanya UIX #87 §3.1 (the gold
 * arrives via the engine, not via raw rgba). Pulse multiplier sits at
 * `1.005` (sub-pixel scale): smaller than the 1.01 pre-snap so the wash
 * does not nudge surrounding flow on the warmest readers' rigs.
 */
const HIGHLIGHT_TINT =
  'color-mix(in srgb, var(--gold) 10%, transparent)';
const HIGHLIGHT_TRANSITION =
  'background-color 0.3s ease, transform 0.3s ease';
const HIGHLIGHT_KEYFRAMES_ID = 'pulse-highlight-keyframes';

/** Inject the `pulse-highlight` keyframes once per document. Idempotent. */
function ensurePulseKeyframes(): void {
  if (document.getElementById(HIGHLIGHT_KEYFRAMES_ID)) return;
  const style = document.createElement('style');
  style.id = HIGHLIGHT_KEYFRAMES_ID;
  style.textContent =
    '@keyframes pulse-highlight {' +
    '0%,100% { transform: scale(1); }' +
    '50% { transform: scale(1.005); }' +
    '}';
  document.head.appendChild(style);
}

/**
 * Apply the temporary highlight inline styles. Returns a snapshot of the
 * pre-existing values so the caller can restore them on cleanup.
 */
function paintTemporaryHighlight(el: HTMLElement, reduced: boolean): {
  transition: string; backgroundColor: string;
} {
  const snap = {
    transition: el.style.transition,
    backgroundColor: el.style.backgroundColor,
  };
  el.style.transition = HIGHLIGHT_TRANSITION;
  el.style.backgroundColor = HIGHLIGHT_TINT;
  if (!reduced) el.style.animation = 'pulse-highlight 1s ease-in-out 2';
  return snap;
}

/**
 * Create a temporary highlight on an element.
 * Adds a visual indicator that scrolls with the element.
 *
 * @param element - Element to highlight
 * @param reduced - Honor `prefers-reduced-motion`: skip the scale pulse
 * @returns Cleanup function to remove highlight
 */
export function createTemporaryHighlight(
  element: HTMLElement,
  reduced = false,
): () => void {
  ensurePulseKeyframes();
  const snap = paintTemporaryHighlight(element, reduced);
  return () => {
    element.style.transition = snap.transition;
    element.style.backgroundColor = snap.backgroundColor;
    element.style.animation = '';
  };
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
  setTimeout(cleanup, 3000);
  return true;
}
