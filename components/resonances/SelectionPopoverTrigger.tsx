'use client';

import { GemIcon } from '@/components/shared/GemIcon';
import { Pressable } from '@/components/shared/Pressable';
import { cssVarOf } from '@/lib/design/elevation';

interface TriggerProps {
  isFull: boolean;
  onMouseDown: () => void;
  onClick: () => void;
}

function ariaLabel(isFull: boolean): string {
  return isFull ? 'All resonance slots filled' : 'Save this passage as a resonance';
}

/* Floating layer = depth (`float`) + accent halo. The two-layer composition
   is Tanya §3.1's call: depth (black) for honest lift, accent halo for the
   thermal personality. Both shadows resolve through the elevation ledger;
   the accent layer mirrors `whisper` shape but pulls the active accent
   instead of gold (popover slot is thermal-aware per §1). */
const ACCENT_HALO = '0 0 12px color-mix(in srgb, var(--token-accent) 20%, transparent)';

const FLOAT_STYLE = {
  background: 'var(--token-surface)',
  boxShadow: `${cssVarOf('float')}, ${ACCENT_HALO}`,
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
