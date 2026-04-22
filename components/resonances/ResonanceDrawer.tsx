'use client';

import { useState, useCallback, useEffect } from 'react';
import { createResonanceAction } from '@/app/actions/resonances';
import { useThermal } from '@/components/thermal/ThermalProvider';
import { GemIcon } from '@/components/shared/GemIcon';
import { ResonanceShimmer } from '@/components/resonances/ResonanceShimmer';
import { useResonanceCeremony, CEREMONY_TIMING } from '@/lib/hooks/useResonanceCeremony';
import { loadHistory, saveHistory, addResonance } from '@/lib/thermal/thermal-history';
import { KeepsakeLauncher } from '@/components/reading/KeepsakeLauncher';
import { Threshold } from '@/components/shared/Threshold';

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
 * The "Pressed Flower" moment: deliberate, ceremonial, never interrupting.
 * On save, fires a gold shimmer ceremony before choreographed auto-close.
 */
export function ResonanceDrawer({
  isOpen, onClose, articleId, articleTitle, quote,
}: ResonanceDrawerProps) {
  const { state: thermalState, refresh: thermalRefresh } = useThermal();
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [usedSlots, setUsedSlots] = useState(0);

  const { phase, intensity } = useResonanceCeremony(thermalState, success);

  useEffect(() => { setUsedSlots(loadUsedSlots()); }, []);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setNote('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen]);

  // ESC + backdrop dismiss are owned by <Threshold>; we just gate them
  // during the ceremony via dismissOnEscape/dismissOnBackdrop props.

  // Auto-close after ceremony completes — extended pause (2.6s, was 2.0s)
  useEffect(() => {
    if (!success) return;
    const closeTimer = setTimeout(onClose, CEREMONY_TIMING.T_CLOSE);
    return () => clearTimeout(closeTimer);
  }, [success, onClose]);

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
        saveHistory(addResonance(loadHistory()));
        thermalRefresh();
        setSuccess(true);
        // Auto-close handled by ceremony effect above
      } else {
        setError(result.error || 'Failed to save resonance');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [note, quote, articleId, usedSlots, thermalRefresh]);

  const slotsAvailable = usedSlots < SLOT_COUNT;
  const showShimmer = success && (phase === 'shimmering' || phase === 'settled');

  return (
    <Threshold
      isOpen={isOpen}
      onClose={onClose}
      variant="drawer-right"
      labelledBy="resonance-drawer-title"
      dismissOnBackdrop={!success}
      dismissOnEscape={!success}
    >
      <DrawerHeader onClose={onClose} articleTitle={articleTitle} />
      <div className="mx-sys-6 border-t border-fog/20" />

      <div className="flex-1 p-sys-6 pt-sys-5">
        <SlotIndicator used={usedSlots} total={SLOT_COUNT} pulsing={success} />

        {success ? (
          <CeremonyContent
            quote={quote}
            shimmerIntensity={intensity}
            showShimmer={showShimmer}
            shimmerSettled={phase === 'settled'}
            articleId={articleId}
            articleTitle={articleTitle}
          />
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
    </Threshold>
  );
}

/* ─── Sub-components ─────────────────────────────── */

function DrawerHeader({
  onClose, articleTitle,
}: { onClose: () => void; articleTitle: string }) {
  return (
    <div className="flex items-center justify-between p-sys-6 pb-sys-4">
      <div>
        <h3 id="resonance-drawer-title"
          className="text-sys-lg font-display font-sys-display text-foreground">
          Save Resonance
        </h3>
        <p className="text-mist text-sys-caption mt-sys-1">
          Why does <span className="sr-only">{articleTitle} </span>this matter to you?
        </p>
      </div>
      <button
        onClick={onClose}
        className="p-sys-3 -mr-sys-3 text-mist hover:text-foreground
                   transition-colors rounded-sys-medium hover:bg-fog/20
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-primary focus-visible:ring-offset-2
                   focus-visible:ring-offset-surface"
        aria-label="Close"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function SlotIndicator({ used, total, pulsing }: {
  used: number; total: number; pulsing: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-sys-2 mb-sys-6">
      <div className="flex gap-sys-3">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`slot-dot ${
              i < used ? 'slot-dot--filled' : ''
            } ${
              pulsing && i === used - 1 ? 'slot-dot--pulse' : ''
            }`}
          />
        ))}
      </div>
      <span className="text-mist text-sys-micro">{used} of {total} resonances</span>
    </div>
  );
}

function CeremonyContent({
  quote, shimmerIntensity, showShimmer, shimmerSettled, articleId, articleTitle,
}: {
  quote: string;
  shimmerIntensity: 'subtle' | 'warm' | 'rich';
  showShimmer: boolean;
  shimmerSettled: boolean;
  articleId: string;
  articleTitle: string;
}) {
  const settledClass = shimmerSettled ? 'resonance-shimmer--settled' : '';

  return (
    <div className="resonance-success-enter">
      {quote && (
        <ResonanceShimmer intensity={shimmerIntensity} active={showShimmer}>
          <div className={`mb-sys-5 bg-background/60 border-l-2 border-rose/40 rounded-sys-medium p-sys-4 ${settledClass}`}>
            <p className="text-foreground/70 italic text-sys-caption leading-relaxed">
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        </ResonanceShimmer>
      )}
      <SuccessMessage />
      {/* CTA mounts only once the ceremony settles — defers mirror fetch + keepsake code until earned. */}
      {shimmerSettled && <KeepsakeLauncher articleId={articleId} articleTitle={articleTitle} />}
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
      <div className="mb-sys-5">
        <label htmlFor="resonanceNote"
          className="block text-sys-caption font-sys-accent text-foreground/80 mb-sys-3">
          Your resonance note <span className="text-primary">*</span>
        </label>
        <textarea
          id="resonanceNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What truth did this reveal to you?"
          className="w-full px-sys-4 py-sys-3 bg-background border border-fog rounded-sys-medium
                     text-foreground placeholder-mist/50 text-sys-caption
                     focus:outline-none focus:ring-2 focus:ring-primary
                     focus:border-transparent resize-none"
          rows={4}
          maxLength={MAX_CHARS}
          disabled={isLoading}
        />
        <div className="flex justify-end mt-sys-1">
          <span className={`text-sys-micro ${charColor}`}>{charCount}/{MAX_CHARS}</span>
        </div>
      </div>
      {error && <ErrorBanner message={error} />}
      <ActionButtons onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} disabled={!note.trim()} />
    </>
  );
}

function QuotePreview({ quote }: { quote: string }) {
  return (
    <div className="mb-sys-5 bg-background/60 border-l-2 border-rose/40 rounded-sys-medium p-sys-4">
      <p className="text-foreground/70 italic text-sys-caption leading-relaxed">
        &ldquo;{quote}&rdquo;
      </p>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-sys-5 p-sys-4 bg-rose/10 border border-rose/30 rounded-sys-medium">
      <p className="text-rose text-sys-caption">{message}</p>
    </div>
  );
}

function SuccessMessage() {
  return (
    <div className="py-sys-7 text-center">
      <GemIcon className="text-gold mx-auto mb-sys-4" size="lg" />
      <p className="text-gold text-sys-lg font-display font-sys-display">
        The room remembers this.
      </p>
      <p className="text-mist text-sys-caption mt-sys-3 italic">
        It&apos;s alive for 30 days. Come back to keep it breathing.
      </p>
    </div>
  );
}

function ActionButtons({ onSubmit, onCancel, isLoading, disabled }: {
  onSubmit: () => void; onCancel: () => void; isLoading: boolean; disabled: boolean;
}) {
  return (
    <div className="flex gap-sys-4 mt-sys-3">
      <button onClick={onCancel} disabled={isLoading}
        className="flex-1 px-sys-4 py-sys-3 bg-background text-mist rounded-sys-medium
                   text-sys-caption hover:bg-fog transition-colors disabled:opacity-50">
        Cancel
      </button>
      <button onClick={onSubmit}
        disabled={isLoading || disabled}
        className="flex-1 px-sys-4 py-sys-3 bg-primary text-foreground rounded-sys-medium
                   text-sys-caption font-sys-accent hover:bg-secondary transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed">
        {isLoading ? 'Saving...' : 'Save Resonance'}
      </button>
    </div>
  );
}

function SlotsFullMessage() {
  return (
    <div className="py-sys-7 text-center">
      <p className="text-mist text-sys-caption">
        All resonance slots are filled.
      </p>
      <p className="text-mist text-sys-micro mt-sys-3 italic">
        Visit <a href="/resonances" className="text-gold hover:underline">The Book of You</a> to revisit your saved resonances.
      </p>
    </div>
  );
}
