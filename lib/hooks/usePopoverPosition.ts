'use client';

// Popover geometry constants (px)
const POPOVER_W = 120;
const POPOVER_H = 44;
const GAP = 8;        // gap between selection edge and popover edge
const PADDING = 12;   // minimum distance from viewport edge

export type Placement = 'above' | 'below';

export interface PopoverPosition {
  x: number;       // fixed left (px)
  y: number;       // fixed top  (px)
  placement: Placement;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

function centeredX(rect: DOMRect): number {
  return clamp(
    rect.left + rect.width / 2 - POPOVER_W / 2,
    PADDING,
    window.innerWidth - POPOVER_W - PADDING,
  );
}

function hasRoomAbove(rect: DOMRect): boolean {
  return rect.top - POPOVER_H - GAP >= PADDING;
}

/**
 * Computes the `position: fixed` coordinates for the SelectionPopover
 * relative to a DOMRect returned by `getBoundingClientRect()`.
 *
 * Prefers above the selection; flips below when near the top viewport edge.
 * Horizontal position is clamped so the popover never clips outside the viewport.
 */
export function computePopoverPosition(rect: DOMRect): PopoverPosition {
  const above = hasRoomAbove(rect);
  return {
    x: centeredX(rect),
    y: above ? rect.top - POPOVER_H - GAP : rect.bottom + GAP,
    placement: above ? 'above' : 'below',
  };
}
