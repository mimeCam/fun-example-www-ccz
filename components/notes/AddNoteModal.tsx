'use client';

import { useState, useEffect, useRef } from 'react';

interface AddNoteModalProps {
  isOpen: boolean;
  selectedText: string;
  onSubmit: (note: string) => void;
  onCancel: () => void;
}

/**
 * Modal for adding a margin note.
 * Appears when user selects text and chooses to add a note.
 */
export function AddNoteModal({ isOpen, selectedText, onSubmit, onCancel }: AddNoteModalProps) {
  const [note, setNote] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset and focus on open
  useEffect(() => {
    if (isOpen) {
      setNote('');
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, note, onCancel]);

  const handleSubmit = () => {
    if (note.trim()) {
      onSubmit(note.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-surface border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 animate-slideDown">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-200 mb-2">Add Margin Note</h3>
          <div className="bg-amber-500/10 border-l-2 border-amber-500/60 pl-3 py-2 rounded-r">
            <p className="text-sm text-gray-400 italic">&ldquo;{selectedText}&rdquo;</p>
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="note-input" className="block text-sm font-medium text-gray-300 mb-2">
            Your Note
          </label>
          <textarea
            ref={textareaRef}
            id="note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What are your thoughts on this passage?"
            className="w-full p-3 bg-background border border-border rounded-lg text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            rows={5}
          />
          <p className="text-xs text-gray-500 mt-2">
            Tip: Press Ctrl+Enter to save
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-transparent border border-border text-gray-300 rounded-lg hover:bg-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!note.trim()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Note
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your note will be saved privately in your browser
          </div>
        </div>
      </div>
    </div>
  );
}

// TODO: Add markdown preview mode
// TODO: Add character limit indicator
