'use client';

import { useState, useCallback, useEffect } from 'react';
import { useTextSelection } from './useTextSelection';
import { isShareableText, cleanText } from '@/lib/sharing/text-utils';

interface UseShareToolbarOptions {
  articleId: string;
  articleTitle: string;
  articleUrl: string;
  authorName?: string;
  enabled?: boolean;
}

interface UseShareToolbarReturn {
  isShareToolbarVisible: boolean;
  shareToolbarPosition: { x: number; y: number };
  selectedTextForShare: string;
  closeShareToolbar: () => void;
}

/**
 * Hook for managing the share toolbar on text selection.
 * Extends useTextSelection to show share options when users select text.
 *
 * @param options - Article and configuration options
 * @returns Share toolbar state and controls
 */
export function useShareToolbar({
  articleId,
  articleTitle,
  articleUrl,
  authorName = 'Author Name',
  enabled = true,
}: UseShareToolbarOptions): UseShareToolbarReturn {
  const [isShareToolbarVisible, setIsShareToolbarVisible] = useState(false);
  const [shareToolbarPosition, setShareToolbarPosition] = useState({ x: 0, y: 0 });
  const [selectedTextForShare, setSelectedTextForShare] = useState('');

  // Use existing text selection hook
  const { selection, hasSelection, clearSelection } = useTextSelection({
    enabled,
    debounceMs: 300,
    minLength: 10, // Minimum 10 characters for sharing
    maxLength: 500,
  });

  // Show share toolbar when valid text is selected
  useEffect(() => {
    if (!hasSelection || !selection) {
      setIsShareToolbarVisible(false);
      return;
    }

    const cleanedText = cleanText(selection.text);

    // Validate that text is shareable
    if (!isShareableText(cleanedText)) {
      return;
    }

    // Calculate toolbar position (centered above selection)
    const x = selection.rect.left + selection.rect.width / 2;
    const y = selection.rect.top - 10; // 10px above selection

    setShareToolbarPosition({ x, y });
    setSelectedTextForShare(cleanedText);
    setIsShareToolbarVisible(true);
  }, [hasSelection, selection]);

  // Close toolbar handler
  const closeShareToolbar = useCallback(() => {
    setIsShareToolbarVisible(false);
    clearSelection();
  }, [clearSelection]);

  // Close toolbar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isShareToolbarVisible) {
        closeShareToolbar();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isShareToolbarVisible, closeShareToolbar]);

  return {
    isShareToolbarVisible,
    shareToolbarPosition,
    selectedTextForShare,
    closeShareToolbar,
  };
}
