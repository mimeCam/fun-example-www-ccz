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

/** Accent text when available; thermal-aware disabled tint handles "full". */
const AVAILABLE_TINT = 'text-[var(--token-accent)] !rounded-sys-full';

/**
 * The gem icon button that floats inside the selection popover. Press
 * choreography comes from <Pressable>; the popover surface (depth +
 * accent halo) is owned by `SelectionPopoverShell`, not by this button —
 * so a sibling action (e.g. the share button) does not double-paint the
 * bloom (Mike #39 §3 — one shell, many actions).
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
    >
      <GemIcon size="sm" />
    </Pressable>
  );
}
