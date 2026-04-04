/**
 * Highlight rendering utilities.
 * Handles DOM manipulation to apply and remove text highlights.
 */

import type { Note } from '@/types/note';

const HIGHLIGHT_DATA_ATTR = 'data-highlight-id';
const HIGHLIGHT_CLASS = 'margin-note-highlight';

/**
 * Apply a highlight to the DOM using a Range.
 * Wraps selected text in a <mark> element with proper attributes.
 *
 * @param range - The Range to highlight
 * @param highlightId - Unique ID for this highlight
 * @returns true if successful
 */
export function applyHighlightToDOM(range: Range, highlightId: string): boolean {
  try {
    // Check if range is valid
    if (range.collapsed || range.toString().trim().length === 0) {
      return false;
    }

    // Create mark element
    const mark = document.createElement('mark');
    mark.setAttribute(HIGHLIGHT_DATA_ATTR, highlightId);
    mark.className = HIGHLIGHT_CLASS;

    // Apply inline styles for Tanya's design spec
    mark.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
    mark.style.borderBottom = '2px solid rgba(245, 158, 11, 0.4)';
    mark.style.borderRadius = '2px';
    mark.style.padding = '1px 2px';
    mark.style.cursor = 'pointer';
    mark.style.transition = 'background-color 0.2s ease';

    // Hover effect
    mark.addEventListener('mouseenter', () => {
      mark.style.backgroundColor = 'rgba(245, 158, 11, 0.3)';
    });
    mark.addEventListener('mouseleave', () => {
      mark.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
    });

    // Extract content and wrap in mark
    range.surroundContents(mark);

    return true;
  } catch (error) {
    // Range.surroundContents() fails if the range splits a non-text node
    // This happens with selections across multiple elements
    console.warn('Failed to apply highlight (complex selection):', error);

    // TODO: Handle complex selections with alternative approach
    // For now, we'll skip highlighting complex selections
    return false;
  }
}

/**
 * Remove a highlight from the DOM.
 * Unwraps the <mark> element, keeping the text content.
 *
 * @param highlightId - The highlight ID to remove
 * @returns true if found and removed
 */
export function removeHighlightFromDOM(highlightId: string): boolean {
  const mark = document.querySelector(`mark[${HIGHLIGHT_DATA_ATTR}="${highlightId}"]`);

  if (!mark) return false;

  // Get parent and text content
  const parent = mark.parentNode;
  if (!parent) return false;

  // Create text node with content
  const textNode = document.createTextNode(mark.textContent || '');

  // Replace mark with text node
  parent.replaceChild(textNode, mark);

  // Normalize parent to merge adjacent text nodes
  parent.normalize();

  return true;
}

/**
 * Find highlight element by ID.
 *
 * @param highlightId - The highlight ID to find
 * @returns The mark element or null
 */
export function findHighlightElement(highlightId: string): HTMLElement | null {
  return document.querySelector(`mark[${HIGHLIGHT_DATA_ATTR}="${highlightId}"]`);
}

/**
 * Scroll to a highlight element.
 *
 * @param highlightId - The highlight ID to scroll to
 * @returns true if found and scrolled
 */
export function scrollToHighlight(highlightId: string): boolean {
  const element = findHighlightElement(highlightId);

  if (!element) return false;

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
  });

  // Flash animation to draw attention
  element.style.transition = 'background-color 0.3s ease';
  element.style.backgroundColor = 'rgba(245, 158, 11, 0.6)';

  setTimeout(() => {
    element.style.backgroundColor = 'rgba(245, 158, 11, 0.2)';
  }, 1000);

  return true;
}

/**
 * Clear all highlights from the DOM.
 * Useful for cleanup or when restoring highlights.
 *
 * @returns Number of highlights removed
 */
export function clearAllHighlights(): number {
  const marks = document.querySelectorAll(`mark[${HIGHLIGHT_DATA_ATTR}]`);
  let removed = 0;

  marks.forEach(mark => {
    const highlightId = mark.getAttribute(HIGHLIGHT_DATA_ATTR);
    if (highlightId && removeHighlightFromDOM(highlightId)) {
      removed++;
    }
  });

  return removed;
}

/**
 * Restore highlights from saved notes.
 * Attempts to find and highlight text from note data.
 *
 * @param notes - Array of notes to restore highlights for
 * @returns Number of highlights restored
 */
export function restoreHighlights(notes: Note[]): number {
  let restored = 0;

  notes.forEach(note => {
    // TODO: Implement fuzzy text matching to find highlight position
    // This is complex because content may have changed
    // For now, we'll skip auto-restoration on page load
    // Users will need to re-select text to create new highlights
  });

  return restored;
}

// TODO: Handle complex multi-element selections
// TODO: Implement fuzzy text matching for highlight restoration
// TODO: Add highlight color variations (if requested)
// TODO: Handle content changes that break highlight positions
