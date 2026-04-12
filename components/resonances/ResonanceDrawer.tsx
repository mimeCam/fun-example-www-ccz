'use client';

import { useState, useCallback, useEffect } from 'react';
import { createResonanceAction } from '@/app/actions/resonances';
import { useThermal } from '@/components/thermal/ThermalProvider';

const SLOT_COUNT = 5;
const STORAGE_KEY = 'resonance-slot-cache';
const MAX_CHARS = 280;

interface ResonanceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
  articleTitle: string;
  quote: string;
}

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

/**
 * ResonanceDrawer — slide-in side panel for resonance capture.
 *
 * Replaces the old modal. Article remains visible underneath.
 * The "Pressed Flower" moment: deliberate, ceremonial, never interrupting.
 */
export function ResonanceDrawer({
  isOpen, onClose, articleId, articleTitle, quote,
}: ResonanceDrawerProps) {
  const { state: thermalState } = useThermal();
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [usedSlots, setUsedSlots] = useState(0);

  useEffect(() => { setUsedSlots(loadUsedSlots()); }, []);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setNote('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  // Escape key closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

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
        setTimeout(onClose, 2000);
      } else {
        setError(result.error || 'Failed to save resonance');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [note, quote, articleId, usedSlots, onClose]);

  if (!isOpen) return null;

  const slotsAvailable = usedSlots < SLOT_COUNT;

  return (
    <>
      {/* Backdrop — dims article area, no blur (reader keeps visual anchor) */}
      <div
        className="fixed inset-0 z-[39] bg-black/30 transition-opacity duration-enter"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — slides in from right */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Save resonance for ${articleTitle}`}
        className="fixed top-0 right-0 bottom-0 z-40 w-full max-w-sm
                   bg-surface/95 backdrop-blur-sm
                   border-l border-fog/20 shadow-float
                   animate-slide-in-right
                   flex flex-col overflow-y-auto"
        style={{
          // Thermal-aware left border accent
          borderLeftColor: 'var(--token-accent-opacity)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h3 className="text-lg font-display font-bold text-foreground">
              Save Resonance
            </h3>
            <p className="text-mist text-sm mt-0.5">Why does this matter to you?</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-mist hover:text-foreground
                       transition-colors rounded-lg hover:bg-fog/20"
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-fog/20" />

        {/* Body */}
        <div className="flex-1 p-5 pt-4">
          <SlotIndicator used={usedSlots} total={SLOT_COUNT} />

          {success ? (
            <SuccessMessage />
          ) : slotsAvailable ? (
            <DrawerForm
              note={note}
              setNote={setNote}
              quote={quote}
              error={error}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          ) : (
            <SlotsFullMessage />
          )}
        </div>
      </aside>
    </>
  );
}

/* ─── Sub-components ─────────────────────────────── */

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function SlotIndicator({ used, total }: { used: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 mb-5">
      <div className="flex gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`text-sm ${i < used ? 'text-gold' : 'text-fog'}`}>
            ◆
          </span>
        ))}
      </div>
      <span className="text-mist text-xs">{used} of {total} resonances</span>
    </div>
  );
}

interface DrawerFormProps {
  note: string;
  setNote: (v: string) => void;
  quote: string;
  error: string | null;
  isLoading: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

function DrawerForm({
  note, setNote, quote, error, isLoading, onSubmit, onCancel,
}: DrawerFormProps) {
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
          className="w-full px-3 py-2.5 bg-background border border-fog rounded-lg
                     text-foreground placeholder-mist/50 text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary
                     focus:border-transparent resize-none"
          rows={4}
          maxLength={MAX_CHARS}
          disabled={isLoading}
        />
        <div className="flex justify-end mt-1">
          <span className={`text-xs ${charColor}`}>{charCount}/{MAX_CHARS}</span>
        </div>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="flex gap-3 mt-2">
        <button onClick={onCancel} disabled={isLoading}
          className="flex-1 px-3 py-2 bg-background text-mist rounded-lg
                     text-sm hover:bg-fog transition-colors disabled:opacity-50">
          Cancel
        </button>
        <button onClick={onSubmit}
          disabled={isLoading || !note.trim()}
          className="flex-1 px-3 py-2 bg-primary text-foreground rounded-lg
                     text-sm font-medium hover:bg-secondary transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed">
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
    <div className="mb-4 p-3 bg-rose/10 border border-rose/30 rounded-lg">
      <p className="text-rose text-sm">{message}</p>
    </div>
  );
}

function SuccessMessage() {
  return (
    <div className="py-6 text-center">
      <div className="inline-block animate-bounce-subtle">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
          className="text-gold mx-auto mb-3">
          <path d="M6 3h12l4 6-10 13L2 9z" />
          <path d="M12 3l4 6-4 13-4-13z" />
        </svg>
      </div>
      <p className="text-gold text-lg font-display font-bold">Saved.</p>
      <p className="text-mist text-sm mt-2 italic">
        It&apos;s alive for 30 days. Come back to keep it breathing.
      </p>
    </div>
  );
}

function SlotsFullMessage() {
  return (
    <div className="py-6 text-center">
      <p className="text-mist text-sm">
        All resonance slots are filled.
      </p>
      <p className="text-mist text-xs mt-2 italic">
        Visit <a href="/resonances" className="text-gold hover:underline">The Book of You</a> to revisit your saved resonances.
      </p>
    </div>
  );
}
