'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useNotes } from '@/lib/hooks/useNotes';
import { useTextSelection } from '@/lib/hooks/useTextSelection';
import { applyHighlightToDOM, removeHighlightFromDOM } from '@/lib/notes/highlights';
import type { Note } from '@/types/note';

interface NotesContextValue {
  notes: Note[];
  activeNoteId: string | null;
  isPanelOpen: boolean;
  showAddNoteTooltip: boolean;
  tooltipPosition: { x: number; y: number };
  selectedText: string;
  togglePanel: () => void;
  closePanel: () => void;
  handleAddNote: (noteText: string) => void;
  handleCancelNote: () => void;
  handleUpdateNote: (noteId: string, note: string) => void;
  handleDeleteNote: (noteId: string) => void;
  handleActivateNote: (noteId: string) => void;
}

const NotesContext = createContext<NotesContextValue | undefined>(undefined);

interface NotesProviderProps {
  postId: string;
  children: React.ReactNode;
}

/**
 * Provider that enables margin notes functionality.
 * Wraps article content to provide highlighting and note-taking.
 */
export function NotesProvider({ postId, children }: NotesProviderProps) {
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    activeNoteId,
    setActiveNote,
    isPanelOpen,
    togglePanel,
    openPanel,
    closePanel,
  } = useNotes(postId);

  const { selection, hasSelection, clearSelection } = useTextSelection({
    enabled: true,
    debounceMs: 300,
    minLength: 3,
    maxLength: 500,
  });

  const [showAddNoteTooltip, setShowAddNoteTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');

  // Show tooltip when text is selected
  const handleSelection = useCallback(() => {
    if (hasSelection && selection) {
      // Calculate tooltip position (above selection)
      const x = selection.rect.left + selection.rect.width / 2;
      const y = selection.rect.top - 10;

      setTooltipPosition({ x, y });
      setSelectedText(selection.text);
      setShowAddNoteTooltip(true);
    }
  }, [hasSelection, selection]);

  // Monitor for selection changes
  useEffect(() => {
    if (hasSelection && !showAddNoteTooltip) {
      handleSelection();
    } else if (!hasSelection && showAddNoteTooltip) {
      setShowAddNoteTooltip(false);
    }
  }, [hasSelection, showAddNoteTooltip, handleSelection]);

  // Add a new note from selection
  const handleAddNote = useCallback(
    (noteText: string) => {
      if (!selection) return;

      // Apply highlight to DOM
      const highlightId = `highlight-${Date.now()}`;
      const highlightSuccess = applyHighlightToDOM(selection.range, highlightId);

      if (highlightSuccess) {
        // Store position data
        const range = selection.range;
        const position = {
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          elementId: range.commonAncestorContainer.parentElement?.id,
        };

        // Create note
        const noteId = addNote(selectedText, noteText, position);

        if (noteId) {
          setActiveNote(noteId);
          clearSelection();
          setShowAddNoteTooltip(false);
          openPanel();
        }
      } else {
        // If highlighting failed (complex selection), just create note without highlight
        console.warn('Could not highlight complex selection. Creating note without highlight.');
        const position = { startOffset: 0, endOffset: selectedText.length };
        const noteId = addNote(selectedText, noteText, position);

        if (noteId) {
          setActiveNote(noteId);
          clearSelection();
          setShowAddNoteTooltip(false);
          openPanel();
        }
      }
    },
    [selection, selectedText, addNote, setActiveNote, clearSelection]
  );

  // Cancel note creation
  const handleCancelNote = useCallback(() => {
    clearSelection();
    setShowAddNoteTooltip(false);
  }, [clearSelection]);

  // Update existing note
  const handleUpdateNote = useCallback(
    (noteId: string, note: string) => {
      updateNote(noteId, { note });
    },
    [updateNote]
  );

  // Delete note
  const handleDeleteNote = useCallback(
    (noteId: string) => {
      const noteToDelete = notes.find(n => n.id === noteId);
      if (noteToDelete) {
        removeHighlightFromDOM(noteToDelete.highlightId);
      }
      deleteNote(noteId);
    },
    [notes, deleteNote]
  );

  // Activate note (scroll to highlight)
  const handleActivateNote = useCallback(
    (noteId: string) => {
      setActiveNote(noteId);
    },
    [setActiveNote]
  );

  const contextValue: NotesContextValue = {
    notes,
    activeNoteId,
    isPanelOpen,
    showAddNoteTooltip,
    tooltipPosition,
    selectedText,
    togglePanel,
    closePanel,
    handleAddNote,
    handleCancelNote,
    handleUpdateNote,
    handleDeleteNote,
    handleActivateNote,
  };

  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
}

/**
 * Hook to access notes context.
 * Must be used within a NotesProvider.
 */
export function useNotesContext() {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotesContext must be used within a NotesProvider');
  }
  return context;
}

// TODO: Fix the useState usage above (should be useEffect)
// TODO: Implement openPanel in useNotes hook
// TODO: Handle complex multi-element selections better
// TODO: Add keyboard shortcuts
