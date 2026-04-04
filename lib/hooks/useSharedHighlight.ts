'use client';

import { useEffect } from 'react';
import { parseHighlightFragment } from '@/lib/sharing/share-links';
import { scrollToSharedHighlight } from '@/lib/sharing/highlight-finder';

/**
 * Hook for handling shared highlight links on page load.
 * Checks URL for highlight fragment and scrolls to the text.
 *
 * @param enabled - Whether to check for shared highlights (default true)
 */
export function useSharedHighlight(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const highlightText = parseHighlightFragment();

      if (highlightText) {
        console.log('Found shared highlight, scrolling to text...');
        const success = scrollToSharedHighlight(highlightText);

        if (!success) {
          console.warn('Could not find shared highlight text:', highlightText);
        }
      }
    }, 500); // Wait 500ms for content to load

    return () => clearTimeout(timer);
  }, [enabled]);
}
