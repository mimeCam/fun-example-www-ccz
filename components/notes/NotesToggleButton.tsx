'use client';

interface NotesToggleButtonProps {
  noteCount: number;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Toggle button for the notes panel.
 * Shows note count badge and indicates open/closed state.
 */
export function NotesToggleButton({ noteCount, isOpen, onToggle }: NotesToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className="relative p-2 text-gray-400 hover:text-gray-200 hover:bg-surface rounded-lg transition-colors"
      aria-label={isOpen ? 'Close notes panel' : 'Open notes panel'}
      aria-expanded={isOpen}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>

      {noteCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-semibold rounded-full flex items-center justify-center">
          {noteCount > 9 ? '9+' : noteCount}
        </span>
      )}
    </button>
  );
}

// TODO: Add subtle animation when new note is added
// TODO: Add keyboard shortcut (Cmd+Shift+N)
