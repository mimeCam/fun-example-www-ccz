'use client';

import { GemIcon } from '@/components/shared/GemIcon';
import { Pressable } from '@/components/shared/Pressable';

interface TriggerProps {
  isFull: boolean;
  onMouseDown: () => void;
  onClick: () => void;
}

function ariaLabel(isFull: boolean): string {
  return isFull ? 'All resonance slots filled' : 'Save this passage as a resonance';
}

/** Floating layer elevation — stays with the pill, not the press gesture. */
const FLOAT_STYLE = {
  background: 'var(--token-surface)',
  boxShadow: [
    '0 4px 16px rgba(0,0,0,0.4)',
    '0 0 12px color-mix(in srgb, var(--token-accent) 20%, transparent)',
  ].join(', '),
} as const;

/** Accent text when available; thermal-aware disabled tint handles "full". */
const AVAILABLE_TINT = 'text-[var(--token-accent)] !rounded-sys-full';

/**
 * The gem pill that floats above (or below) the text selection.
 * Press choreography comes from <Pressable>; the floating shadow is
 * layer elevation (not press feedback) and stays inline. "Full" maps
 * onto the thermal-aware disabled tint — no ad-hoc cursor hacks.
 */
export function SelectionPopoverTrigger({ isFull, onMouseDown, onClick }: TriggerProps) {
  return (
    <Pressable
      variant="icon"
      size="sm"
      tabIndex={-1}
      disabled={isFull}
      aria-label={ariaLabel(isFull)}
      onMouseDown={onMouseDown}
      onClick={onClick}
      className={AVAILABLE_TINT}
      style={FLOAT_STYLE}
    >
      <GemIcon size="sm" />
    </Pressable>
  );
}
