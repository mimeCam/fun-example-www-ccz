'use client';

import { GemIcon } from '@/components/shared/GemIcon';

interface TriggerProps {
  isFull: boolean;
  onMouseDown: () => void;
  onClick: () => void;
}

// Pill container — shared structural classes
const BASE = [
  'flex items-center justify-center',
  'px-sys-3 py-sys-2',
  'rounded-sys-full border',
  'transition-all duration-[200ms]',
].join(' ');

// Slot available — invite the reader
const AVAILABLE = [
  'text-[var(--token-accent)] cursor-pointer',
  'border-[color-mix(in_srgb,var(--token-accent)_25%,transparent)]',
  'hover:scale-110 hover:border-[color-mix(in_srgb,var(--token-accent)_40%,transparent)]',
  'active:scale-95',
].join(' ');

// All slots full — warm completion, not an error
const FULL = [
  'text-[var(--gold)] opacity-60 cursor-default pointer-events-none',
  'border-[color-mix(in_srgb,var(--gold)_20%,transparent)]',
].join(' ');

function ariaLabel(isFull: boolean): string {
  return isFull ? 'All resonance slots filled' : 'Save this passage as a resonance';
}

/**
 * The gem pill that floats above (or below) the text selection.
 * Handles both available and full-slot visual states.
 * No slot counter — the popover is intentionally text-free.
 */
export function SelectionPopoverTrigger({ isFull, onMouseDown, onClick }: TriggerProps) {
  return (
    <button
      role="button"
      tabIndex={-1}
      aria-label={ariaLabel(isFull)}
      aria-disabled={isFull || undefined}
      onMouseDown={onMouseDown}
      onClick={isFull ? undefined : onClick}
      className={`${BASE} ${isFull ? FULL : AVAILABLE}`}
      style={{
        background: 'var(--token-surface)',
        boxShadow: [
          '0 4px 16px rgba(0,0,0,0.4)',
          '0 0 12px color-mix(in srgb, var(--token-accent) 20%, transparent)',
        ].join(', '),
      }}
    >
      <GemIcon size="sm" />
    </button>
  );
}
