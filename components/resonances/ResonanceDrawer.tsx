'use client';

import { useState, useCallback, useEffect } from 'react';
import { createResonanceAction } from '@/app/actions/resonances';
import { useThermal } from '@/components/thermal/ThermalProvider';
import { GemIcon } from '@/components/shared/GemIcon';
import { ResonanceShimmer } from '@/components/resonances/ResonanceShimmer';
import { useResonanceCeremony, CEREMONY_TIMING } from '@/lib/hooks/useResonanceCeremony';
import { loadHistory, saveHistory, addResonance } from '@/lib/thermal/thermal-history';
import { Threshold } from '@/components/shared/Threshold';
import { Pressable } from '@/components/shared/Pressable';
import { OverlayHeader } from '@/components/shared/OverlayHeader';
import { Field } from '@/components/shared/Field';
import { TextLink } from '@/components/shared/TextLink';
import { alphaClassOf } from '@/lib/design/alpha';
// Doorway is air, not ink — the body's `pt-sys-5` exhale carries the seam,
// matching the keepsake siblings' `mb-sys-5` from the body side. Pinned by
// Axis F of `overlay-header-fence`. (Tanya UIX #33 §5; Mike #4 §"Decision".)

const SLOT_COUNT = 5;
const STORAGE_KEY = 'resonance-slot-cache';
const MAX_CHARS = 280;

/* ─── Echo Frame chassis (Tanya UX #12 §1.1) ────────────────────────── */
/**
 * The "Echo Frame" — the rose-ribbon quoted-line rectangle that paints
 * twice in this file (form preview + ceremony). One register, never
 * staggered (Tanya UX #62 §2). Hoisted here so both call sites paint
 * byte-identical chrome — the Form → Ceremony transition reads as a
 * state change *on the same object*, not a swap of two objects.
 *
 * Alpha bits route through `alphaClassOf` (Mike napkin #30 §"Path A"):
 *   • surface  — `bg-background/50`  (recede; floats on the page)
 *   • ribbon   — `border-rose/30`    (muted; the reader's voice marker)
 *   • body     — `text-foreground/70` (quiet; cited, not authored here)
 *
 * Two callers in one file is a `const`, not a kernel (Mike #30 PoI #1).
 * When a third caller arrives (e.g. Threshold quote register), THEN lift
 * to `lib/design/`.
 */
const QUOTE_FRAME_SURFACE = alphaClassOf('background', 'recede', 'bg');
const QUOTE_FRAME_RIBBON  = alphaClassOf('rose', 'muted', 'border');
const QUOTE_FRAME_BODY    = alphaClassOf('foreground', 'quiet', 'text');

const QUOTE_FRAME_CLASS = [
  'mb-sys-5',
  QUOTE_FRAME_SURFACE,
  'border-l-2',
  QUOTE_FRAME_RIBBON,
  'rounded-sys-medium',
  'p-sys-4',
].join(' ');

const QUOTE_BODY_CLASS = `${QUOTE_FRAME_BODY} italic text-sys-caption typo-caption`;

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
      <OverlayHeader
        title="Save Resonance"
        titleId="resonance-drawer-title"
        blurbId="resonance-drawer-blurb"
        blurb={<>Why does <span className="sr-only">{articleTitle} </span>this matter to you?</>}
        onClose={onClose}
      />

      <div className="flex-1 p-sys-6 pt-sys-5">
        <SlotIndicator used={usedSlots} total={SLOT_COUNT} pulsing={success} />

        {success ? (
          <CeremonyContent
            quote={quote}
            shimmerIntensity={intensity}
            showShimmer={showShimmer}
            shimmerSettled={phase === 'settled'}
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
  quote, shimmerIntensity, showShimmer, shimmerSettled,
}: {
  quote: string;
  shimmerIntensity: 'subtle' | 'warm' | 'rich';
  showShimmer: boolean;
  shimmerSettled: boolean;
}) {
  const settledClass = shimmerSettled ? 'resonance-shimmer--settled' : '';

  // Note: the keepsake CTA used to mount HERE (only for note-writers).
  // It now lives inline at the article Coda as `<KeepsakePlate/>` so
  // every reader who finishes earns the artifact, not only those who
  // wrote a resonance note. Tanya UX #74 §1, Mike #41 §0.

  return (
    <div className="resonance-success-enter">
      {quote && (
        <ResonanceShimmer intensity={shimmerIntensity} active={showShimmer}>
          <div className={`${QUOTE_FRAME_CLASS} ${settledClass}`.trim()}>
            <p className={QUOTE_BODY_CLASS}>
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        </ResonanceShimmer>
      )}
      <SuccessMessage />
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
  return (
    <>
      {quote && <QuotePreview quote={quote} />}
      <div className="mb-sys-5">
        <Field
          variant="multiline"
          id="resonanceNote"
          label="Your resonance note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What truth did this reveal to you?"
          rows={4}
          maxLength={MAX_CHARS}
          required
          disabled={isLoading}
          counter
          error={error}
        />
      </div>
      <ActionButtons onSubmit={onSubmit} onCancel={onCancel} isLoading={isLoading} disabled={!note.trim()} />
    </>
  );
}

function QuotePreview({ quote }: { quote: string }) {
  return (
    <div className={QUOTE_FRAME_CLASS}>
      <p className={QUOTE_BODY_CLASS}>
        &ldquo;{quote}&rdquo;
      </p>
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
      <Pressable
        variant="ghost" size="md"
        onClick={onCancel} disabled={isLoading}
        className="flex-1"
      >
        Cancel
      </Pressable>
      <Pressable
        variant="solid" size="md"
        onClick={onSubmit} disabled={isLoading || disabled}
        className="flex-1"
      >
        {isLoading ? 'Saving...' : 'Save Resonance'}
      </Pressable>
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
        Visit <TextLink variant="passage" href="/resonances">The Book of You</TextLink> to revisit your saved resonances.
      </p>
    </div>
  );
}

/* ─── Test handles — Echo Frame chassis (Mike napkin #30 §DoD) ────── */
/**
 * Surfaces the hoisted Echo-Frame tokens to
 * `components/resonances/__tests__/ResonanceDrawer.alpha.test.ts`. The
 * pin asserts each handle resolves to the canonical `alphaClassOf(...)`
 * literal AND to its expected wire-format (e.g. `bg-background/50`),
 * so a future rung-vocabulary swap cannot silently shift the register.
 *
 * Mirror of the `__testing__` shape used by `ResonanceEntry.tsx`,
 * `ThreadKeepsake.tsx`, etc. — readonly, tree-shaken from runtime
 * consumers, exists only for the SSR pin.
 */
export const __testing__ = {
  QUOTE_FRAME_CLASS,
  QUOTE_BODY_CLASS,
  QUOTE_FRAME_SURFACE,
  QUOTE_FRAME_RIBBON,
  QUOTE_FRAME_BODY,
  CeremonyContent,
  QuotePreview,
} as const;
