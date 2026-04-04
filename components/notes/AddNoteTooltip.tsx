'use client';

import { useEffect, useRef } from 'react';

interface AddNoteTooltipProps {
  isVisible: boolean;
  position: { x: number; y: number };
  onAddNote: () => void;
  onCancel: () => void;
}

/**
 * Tooltip that appears near text selection.
 * Offers to add a note with a subtle, non-intrusive UI.
 */
export function AddNoteTooltip({ isVisible, position, onAddNote, onCancel }: AddNoteTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Close tooltip on click outside
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        onCancel();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onCancel]);

  if (!isVisible) return null;

  return (
    <div
      ref={tooltipRef}
      className="fixed z-50 animate-fadeIn"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translateX(-50%) translateY(-100%)',
      }}
    >
      <div className="bg-surface border border-amber-500/40 rounded-lg shadow-lg px-3 py-2 mb-2 flex items-center gap-2">
        <span className="text-sm text-gray-300">Add a note?</span>
        <div className="flex gap-2">
          <button
            onClick={onAddNote}
            className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs font-medium rounded hover:bg-amber-500/30 transition-colors border border-amber-500/40"
          >
            Add Note
          </button>
          <button
            onClick={onCancel}
            className="px-2 py-1 text-gray-400 text-xs rounded hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
      {/* Arrow */}
      <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-amber-500/40 mx-auto" />
    </div>
  );
}

// TODO: Add keyboard shortcut hint (e.g., "Press N to add note")
// TODO: Animate in from selection position
