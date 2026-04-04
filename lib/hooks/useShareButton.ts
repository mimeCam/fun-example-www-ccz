'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTextSelection } from './useTextSelection';
import { isShareableText, cleanText } from '@/lib/sharing/text-utils';

interface UseShareButtonOptions {
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  authorName?: string;
  enabled?: boolean;
}

interface UseShareButtonReturn {
  isShareButtonVisible: boolean;
  shareButtonPosition: { x: number; y: number };
  selectedTextForShare: string;
  closeShareButton: () => void;
}

/**
 * Simplified hook for share button on text selection.
 * Shows single floating icon (not toolbar) when users select text.
 *
 * Per UIX principles:
 * - Zero friction: appears automatically on selection
 * - Single action: one tap to share
 * - Auto-dismisses: after 3s or on scroll
 *
 * @param options - Article and configuration options
 * @returns Share button state and controls
 */
export function useShareButton({
  articleId,
  articleTitle,
  articleUrl,
  authorName = 'Author Name',
  enabled = true,
}: UseShareButtonOptions): UseShareButtonReturn {
  const [isShareButtonVisible, setIsShareButtonVisible] = useState(false);
  const [shareButtonPosition, setShareButtonPosition] = useState({ x: 0, y: 0 });
  const [selectedTextForShare, setSelectedTextForShare] = useState('');

  // Use existing text selection hook
  const { selection, hasSelection, clearSelection } = useTextSelection({
    enabled,
    debounceMs: 200, // Faster response for better UX
    minLength: 10,
    maxLength: 500,
  });

  // Show share button when valid text is selected
  useEffect(() => {
    if (!hasSelection || !selection) {
      setIsShareButtonVisible(false);
      return;
    }

    const cleanedText = cleanText(selection.text);

    // Validate that text is shareable
    if (!isShareableText(cleanedText)) {
      return;
    }

    // Position button above selection (centered)
    const x = selection.rect.left + selection.rect.width / 2;
    const y = selection.rect.top - 20; // Slightly above selection

    setShareButtonPosition({ x, y });
    setSelectedTextForShare(cleanedText);
    setIsShareButtonVisible(true);
  }, [hasSelection, selection]);

  // Close button handler
  const closeShareButton = useCallback(() => {
    setIsShareButtonVisible(false);
    clearSelection();
  }, [clearSelection]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isShareButtonVisible) {
        closeShareButton();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isShareButtonVisible, closeShareButton]);

  return {
    isShareButtonVisible,
    shareButtonPosition,
    selectedTextForShare,
    closeShareButton,
  };
}

// TODO: Add touch support for mobile devices
// TODO: Add keyboard shortcut (S for share when text selected)
// TODO: Track share analytics for engagement metrics
