'use client';

import { useState, useEffect } from 'react';
import type { Note } from '@/types/note';
import { exportNotesAsMarkdown } from '@/lib/notes/storage';
import { NoteItem } from './NoteItem';

interface NotesPanelProps {
  postId: string;
  notes: Note[];
  activeNoteId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNote: (noteId: string, note: string) => void;
  onDeleteNote: (noteId: string) => void;
  onActivateNote: (noteId: string) => void;
}

/**
 * Notes panel sidebar with glassmorphism effect.
 * Displays all margin notes with edit/delete/export functionality.
 */
export function NotesPanel({
  postId,
  notes,
  activeNoteId,
  isOpen,
  onClose,
  onUpdateNote,
  onDeleteNote,
  onActivateNote,
}: NotesPanelProps) {
  const [showPrivacyMessage, setShowPrivacyMessage] = useState(false);

  // Show privacy message on first open
  useEffect(() => {
    if (isOpen && !localStorage.getItem('margin_notes_privacy_acknowledged')) {
      setShowPrivacyMessage(true);
    }
  }, [isOpen]);

  const handleExportNotes = () => {
    const markdown = exportNotesAsMarkdown(postId);

    // Create download link
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `margin-notes-${postId}-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDismissPrivacyMessage = () => {
    setShowPrivacyMessage(false);
    localStorage.setItem('margin_notes_privacy_acknowledged', 'true');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Privacy modal */}
      {showPrivacyMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-slideDown">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2">
                  Your Notes Are Private
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  All margin notes are saved to your browser only. We never see them, store them, or track them.
                  They stay completely private to you.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissPrivacyMessage}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-surface/95 backdrop-blur-md border-l border-border shadow-2xl z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold text-gray-200">Margin Notes</h2>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Private. Local only.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-surface rounded-lg transition-colors"
            aria-label="Close notes panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <p className="text-gray-400 mb-2">No notes yet</p>
              <p className="text-sm text-gray-500">
                Select text in the article to create your first margin note
              </p>
            </div>
          ) : (
            notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                isActive={note.id === activeNoteId}
                onEdit={onUpdateNote}
                onDelete={onDeleteNote}
                onActivate={onActivateNote}
              />
            ))
          )}
        </div>

        {/* Footer with export */}
        {notes.length > 0 && (
          <div className="p-4 border-t border-border">
            <button
              onClick={handleExportNotes}
              className="w-full px-4 py-2 bg-surface border border-border text-gray-300 rounded-lg hover:bg-surface hover:border-primary/30 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export as Markdown
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// TODO: Add search/filter functionality
// TODO: Add note categories/tags
// TODO: Add keyboard shortcuts (Esc to close)
