'use client';

import { useState, useCallback, useEffect } from 'react';
import type { Note, NotesState } from '@/types/note';
import { generateId } from '@/lib/utils/id';
import {
  loadNotesForPost,
  addNote as addNoteToStorage,
  updateNote as updateNoteInStorage,
  deleteNote as deleteNoteFromStorage,
} from '@/lib/notes/storage';

interface UseNotesOptions {
  enabled?: boolean;
}

interface UseNotesReturn {
  notes: Note[];
  activeNoteId: string | null;
  isPanelOpen: boolean;
  addNote: (text: string, note: string, position: Note['position']) => string | null;
  updateNote: (noteId: string, updates: Partial<Omit<Note, 'id' | 'postId'>>) => boolean;
  deleteNote: (noteId: string) => boolean;
  setActiveNote: (noteId: string | null) => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

/**
 * Hook for managing margin notes state.
 * Provides CRUD operations with localStorage persistence.
 *
 * @param postId - The article/post ID
 * @param options - Configuration options
 * @returns Notes state and operations
 */
export function useNotes(
  postId: string,
  options: UseNotesOptions = {}
): UseNotesReturn {
  const { enabled = true } = options;

  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Load notes on mount
  useEffect(() => {
    if (!enabled) return;

    const loadedNotes = loadNotesForPost(postId);
    setNotes(loadedNotes);
  }, [postId, enabled]);

  // Add a new note
  const addNote = useCallback(
    (text: string, note: string, position: Note['position']): string | null => {
      const newNote: Note = {
        id: generateId(),
        postId,
        highlightId: generateId(),
        text,
        note,
        timestamp: Date.now(),
        position,
      };

      const success = addNoteToStorage(newNote);
      if (success) {
        setNotes(prev => [...prev, newNote]);
        return newNote.id;
      }
      return null;
    },
    [postId]
  );

  // Update an existing note
  const updateNote = useCallback(
    (noteId: string, updates: Partial<Omit<Note, 'id' | 'postId'>>): boolean => {
      const success = updateNoteInStorage(postId, noteId, updates);
      if (success) {
        setNotes(prev =>
          prev.map(note => (note.id === noteId ? { ...note, ...updates } : note))
        );
        return true;
      }
      return false;
    },
    [postId]
  );

  // Delete a note
  const deleteNote = useCallback((noteId: string): boolean => {
    const success = deleteNoteFromStorage(postId, noteId);
    if (success) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
      if (activeNoteId === noteId) {
        setActiveNoteId(null);
      }
      return true;
    }
    return false;
  }, [postId, activeNoteId]);

  // Toggle panel visibility
  const togglePanel = useCallback(() => {
    setIsPanelOpen(prev => !prev);
  }, []);

  const openPanel = useCallback(() => {
    setIsPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsPanelOpen(false);
  }, []);

  return {
    notes,
    activeNoteId,
    isPanelOpen,
    addNote,
    updateNote,
    deleteNote,
    setActiveNote: setActiveNoteId,
    togglePanel,
    openPanel,
    closePanel,
  };
}

// TODO: Add undo/redo functionality
// TODO: Add search/filter notes
// TODO: Add note categories/tags
