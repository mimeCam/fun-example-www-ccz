'use client';

import { useState, useEffect, useCallback } from 'react';
import { createResonanceAction } from '@/app/actions/resonances';
import { useTextSelection } from '@/lib/hooks/useTextSelection';

interface ResonanceButtonProps {
  articleId: string;
  articleTitle: string;
}

const SLOT_COUNT = 5;
const STORAGE_KEY = 'resonance-slot-cache';

/** Get or create an anonymous user identifier */
function getAnonId(): string {
  if (typeof window === 'undefined') return '';
  const key = 'anon-reader-id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function loadUsedSlots(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return cache.used ?? 0;
  } catch { return 0; }
}

function saveUsedSlots(count: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ used: count, ts: Date.now() }));
  } catch { /* non-critical */ }
}

/** Slot indicator — filled/empty diamonds */
function SlotIndicator({ used, total }: { used: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 mb-5">
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`text-sm ${i < used ? 'text-gold' : 'text-fog'}`}>◆</span>
        ))}
      </div>
      <span className="text-mist text-xs">{used} of {total} resonances</span>
    </div>
  );
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
 * ResonanceButton — Resonance-First Bookmarking with quote capture.
 *
 * Wires useTextSelection so the highlighted passage is saved as
 * the `quote` field alongside the reader's resonance note.
 */
export function ResonanceButton({ articleId, articleTitle }: ResonanceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState('');
  const [quote, setQuote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [usedSlots, setUsedSlots] = useState(0);

  const { selection, clearSelection } = useTextSelection();

  useEffect(() => { setUsedSlots(loadUsedSlots()); }, []);

  const openModal = useCallback(() => {
    const selectedQuote = selection?.text ?? '';
    setQuote(selectedQuote);
    setIsOpen(true);
  }, [selection]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setNote('');
    setQuote('');
    setError(null);
    setSuccess(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!note.trim()) {
      setError('Please explain why this resonates with you');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const id = getAnonId();
      const result = await createResonanceAction(
        id, articleId, note.trim(), quote || undefined
      );
      if (result.success) {
        const next = usedSlots + 1;
        setUsedSlots(next);
        saveUsedSlots(next);
        setSuccess(true);
        clearSelection();
        setTimeout(closeModal, 2000);
      } else {
        setError(result.error || 'Failed to save resonance');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [note, quote, articleId, usedSlots, clearSelection, closeModal]);

  const slotsAvailable = usedSlots < SLOT_COUNT;

  return (
    <>
      <button
        onClick={() => slotsAvailable ? openModal() : null}
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

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-surface border border-fog/40 rounded-lg max-w-lg w-full p-6 shadow-float animate-fade-in">
            <button onClick={closeModal}
              className="absolute top-4 right-4 text-mist hover:text-foreground transition-colors"
              aria-label="Close">
              <CloseIcon />
            </button>
            <h3 className="text-xl font-semibold text-foreground mb-1">Save Resonance</h3>
            <p className="text-mist text-sm mb-5">Why does this matter to you?</p>
            <SlotIndicator used={usedSlots} total={SLOT_COUNT} />
            {success ? (
              <SuccessMessage />
            ) : (
              <ResonanceForm
                note={note}
                setNote={setNote}
                quote={quote}
                error={error}
                isLoading={isLoading}
                onSubmit={handleSubmit}
                onCancel={closeModal}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Sub-components ─────────────────────────────── */

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function SuccessMessage() {
  return (
    <div className="py-6 text-center">
      <div className="inline-block animate-bounce-subtle">
        <GemIcon className="text-gold mx-auto mb-3" />
      </div>
      <p className="text-gold text-lg font-medium">Saved.</p>
      <p className="text-mist text-sm mt-2 italic">
        It&apos;s alive for 30 days. Come back to keep it breathing.
      </p>
    </div>
  );
}

interface FormProps {
  note: string;
  setNote: (v: string) => void;
  quote: string;
  error: string | null;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

function ResonanceForm({ note, setNote, quote, error, isLoading, onSubmit, onCancel }: FormProps) {
  const charCount = note.length;
  const charColor = charCount > 250 ? 'text-gold' : 'text-mist';

  return (
    <>
      {quote && <QuotePreview quote={quote} />}
      <div className="mb-4">
        <label htmlFor="resonanceNote"
          className="block text-sm font-medium text-foreground/80 mb-2">
          Your resonance note <span className="text-primary">*</span>
        </label>
        <textarea
          id="resonanceNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What truth did this reveal to you?"
          className="w-full px-4 py-3 bg-background border border-fog rounded-lg text-foreground placeholder-mist/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          rows={4}
          maxLength={280}
          disabled={isLoading}
        />
        <div className="flex justify-between mt-1">
          <span className={`text-xs ${charColor}`}>{charCount}/280</span>
        </div>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-background text-mist rounded-lg hover:bg-fog transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onSubmit}
          disabled={isLoading || !note.trim()}
          className="flex-1 px-4 py-2.5 bg-primary text-foreground rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium">
          {isLoading ? 'Saving...' : 'Save Resonance'}
        </button>
      </div>
    </>
  );
}

function QuotePreview({ quote }: { quote: string }) {
  return (
    <div className="mb-4 bg-background/60 border-l-2 border-rose/40 rounded-lg p-3">
      <p className="text-foreground/70 italic text-sm leading-relaxed">
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg">
      <p className="text-red-400 text-sm">{message}</p>
    </div>
  );
}
