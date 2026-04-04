'use client';

import { useState } from 'react';
import type { Note } from '@/types/note';
import { scrollToHighlight } from '@/lib/notes/highlights';

interface NoteItemProps {
  note: Note;
  isActive: boolean;
  onEdit: (noteId: string, note: string) => void;
  onDelete: (noteId: string) => void;
  onActivate: (noteId: string) => void;
}

/**
 * Individual note item in the notes panel.
 * Displays highlighted text and user's note with edit/delete actions.
 */
export function NoteItem({ note, isActive, onEdit, onDelete, onActivate }: NoteItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState(note.note);

  const handleSave = () => {
    onEdit(note.id, editedNote);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedNote(note.note);
    setIsEditing(false);
  };

  const handleScrollToHighlight = () => {
    scrollToHighlight(note.highlightId);
    onActivate(note.id);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-200 ${
        isActive
          ? 'bg-primary/10 border-primary/30 shadow-md'
          : 'bg-surface border-border hover:border-primary/20'
      }`}
    >
      {/* Highlighted text quote */}
      <div className="mb-3">
        <p className="text-sm text-gray-400 italic border-l-2 border-amber-500/60 pl-3 py-1 bg-amber-500/5 rounded-r">
          &ldquo;{note.text}&rdquo;
        </p>
      </div>

      {/* User's note */}
      {isEditing ? (
        <div className="mb-3">
          <textarea
            value={editedNote}
            onChange={(e) => setEditedNote(e.target.value)}
            className="w-full p-3 bg-background border border-border rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={4}
            placeholder="Add your note..."
            autoFocus
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-opacity-90 transition-opacity"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 bg-transparent border border-border text-gray-300 text-sm rounded-lg hover:bg-surface transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <p className="text-gray-200 text-sm leading-relaxed">{note.note}</p>
          <p className="text-xs text-gray-500 mt-2">{formatDate(note.timestamp)}</p>
        </div>
      )}

      {/* Actions */}
      {!isEditing && (
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={handleScrollToHighlight}
            className="text-xs text-primary hover:text-secondary transition-colors flex items-center gap-1"
            aria-label="Scroll to highlight"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View in text
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Edit note"
            >
              Edit
            </button>
            <span className="text-gray-600">•</span>
            <button
              onClick={() => onDelete(note.id)}
              className="text-xs text-red-400 hover:text-red-300 transition-colors"
              aria-label="Delete note"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// TODO: Add keyboard shortcuts for actions
// TODO: Add note sharing (future feature)
