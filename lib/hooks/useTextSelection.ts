'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { TextSelection } from '@/types/note';

interface UseTextSelectionOptions {
  enabled?: boolean;
  debounceMs?: number;
  minLength?: number;
  maxLength?: number;
}

interface UseTextSelectionReturn {
  selection: TextSelection | null;
  hasSelection: boolean;
  clearSelection: () => void;
}

/**
 * Hook for tracking text selection with debouncing.
 * Enables highlight functionality on text selection.
 *
 * @param options - Configuration options
 * @returns Selection state and controls
 */
export function useTextSelection(
  options: UseTextSelectionOptions = {}
): UseTextSelectionReturn {
  const {
    enabled = true,
    debounceMs = 300,
    minLength = 3,
    maxLength = 500,
  } = options;

  const [selection, setSelection] = useState<TextSelection | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSelectionRef = useRef<string>('');

  // Clear selection state
  const clearSelection = useCallback(() => {
    setSelection(null);
    lastSelectionRef.current = '';
  }, []);

  // Handle mouse up event (text selection)
  const handleMouseUp = useCallback(() => {
    if (!enabled) return;

    // Clear any pending timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce selection detection
    timeoutRef.current = setTimeout(() => {
      const nativeSelection = window.getSelection();

      if (!nativeSelection || nativeSelection.isCollapsed) {
        clearSelection();
        return;
      }

      const selectedText = nativeSelection.toString().trim();

      // Validate selection length
      if (selectedText.length < minLength || selectedText.length > maxLength) {
        clearSelection();
        return;
      }

      // Avoid duplicate triggers for same selection
      if (selectedText === lastSelectionRef.current) {
        return;
      }

      const range = nativeSelection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelection({
        text: selectedText,
        range,
        rect,
      });

      lastSelectionRef.current = selectedText;
    }, debounceMs);
  }, [enabled, debounceMs, minLength, maxLength, clearSelection]);

  // Set up event listeners
  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, handleMouseUp]);

  // Clear selection when clicking elsewhere
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Check if click is outside any highlight
      const target = e.target as HTMLElement;
      if (!target.closest('mark[data-highlight-id]')) {
        clearSelection();
      }
    };

    if (enabled) {
      document.addEventListener('mousedown', handleMouseDown);
      return () => document.removeEventListener('mousedown', handleMouseDown);
    }
  }, [enabled, clearSelection]);

  return {
    selection,
    hasSelection: selection !== null,
    clearSelection,
  };
}

