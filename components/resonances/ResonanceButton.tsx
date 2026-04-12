'use client';

import { useState, useCallback } from 'react';
import { useTextSelection } from '@/lib/hooks/useTextSelection';
import { ResonanceDrawer } from './ResonanceDrawer';

const SLOT_COUNT = 5;
const STORAGE_KEY = 'resonance-slot-cache';

function loadUsedSlots(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return cache.used ?? 0;
  } catch { return 0; }
}

function GemIcon({ className = '' }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M12 3l4 6-4 13-4-13z" />
    </svg>
  );
}

/**
 * ResonanceButton — trigger button for the ResonanceDrawer.
 *
 * Captures highlighted text at click time (before drawer renders),
 * then opens the slide-in side panel. All form logic lives in ResonanceDrawer.
 */
export function ResonanceButton({ articleId, articleTitle }: {
  articleId: string;
  articleTitle: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [capturedQuote, setCapturedQuote] = useState('');
  const [usedSlots, setUsedSlots] = useState(() => loadUsedSlots());

  const { selection } = useTextSelection();

  const handleOpen = useCallback(() => {
    const selectedQuote = selection?.text ?? '';
    setCapturedQuote(selectedQuote);
    setIsOpen(true);
  }, [selection]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCapturedQuote('');
    // Re-sync slot count from localStorage (drawer may have saved one)
    setUsedSlots(loadUsedSlots());
  }, []);

  const slotsAvailable = usedSlots < SLOT_COUNT;

  return (
    <>
      <button
        onClick={slotsAvailable ? handleOpen : undefined}
        className={`relative p-2 rounded-lg transition-colors ${
          slotsAvailable
            ? 'text-mist hover:text-primary hover:bg-surface'
            : 'text-fog cursor-default'
        }`}
        aria-label="Save resonance"
        title={!slotsAvailable ? 'Resonance slots full' : 'Save resonance'}
      >
        <GemIcon />
        {slotsAvailable && (
          <span className="absolute -top-0.5 -right-0.5 text-[9px] text-gold/70 font-mono">
            {usedSlots}/{SLOT_COUNT}
          </span>
        )}
      </button>

      <ResonanceDrawer
        isOpen={isOpen}
        onClose={handleClose}
        articleId={articleId}
        articleTitle={articleTitle}
        quote={capturedQuote}
      />
    </>
  );
}
