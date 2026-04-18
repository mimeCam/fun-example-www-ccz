'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTextSelection } from '@/lib/hooks/useTextSelection';
import { useSlotStatus } from '@/lib/hooks/useSlotStatus';
import { computePopoverPosition } from '@/lib/hooks/usePopoverPosition';
import type { PopoverPosition } from '@/lib/hooks/usePopoverPosition';
import { SelectionPopoverTrigger } from './SelectionPopoverTrigger';
import { ResonanceDrawer } from './ResonanceDrawer';

// ─── Types ─────────────────────────────────────────────────────────────────

type Phase = 'entering' | 'idle' | 'exiting' | 'gone';

interface Props {
  articleId: string;
  articleTitle: string;
}

interface PortalProps {
  position: PopoverPosition;
  phase: Phase;
  isFull: boolean;
  onMouseDown: () => void;
  onClick: () => void;
}

// ─── Utilities ──────────────────────────────────────────────────────────────

function isPointerDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;
}

function phaseClass(phase: Phase): string {
  if (phase === 'entering') return 'animate-popover-enter';
  if (phase === 'exiting')  return 'animate-popover-exit';
  return '';
}

function originStyle(placement: PopoverPosition['placement']): string {
  return placement === 'above' ? 'center bottom' : 'center top';
}

// ─── Hooks ──────────────────────────────────────────────────────────────────

function usePointerCheck(): boolean {
  const [isPointer, setIsPointer] = useState(false);
  useEffect(() => { setIsPointer(isPointerDevice()); }, []);
  return isPointer;
}

/**
 * Drives the enter/idle/exit/gone lifecycle so the portal can animate
 * both entry (180ms spring) and exit (120ms ease-in) without a library.
 */
function usePopoverPhase(show: boolean): Phase {
  const [phase, setPhase] = useState<Phase>('gone');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (show) {
      setPhase('entering');
      timerRef.current = setTimeout(() => setPhase('idle'), 200);
    } else {
      setPhase(p => (p === 'gone' ? 'gone' : 'exiting'));
      timerRef.current = setTimeout(() => setPhase('gone'), 130);
    }
    return () => clearTimeout(timerRef.current);
  }, [show]);

  return phase;
}

function useDrawerState() {
  const [isOpen, setIsOpen] = useState(false);
  return {
    isOpen,
    open:  useCallback(() => setIsOpen(true),  []),
    close: useCallback(() => setIsOpen(false), []),
  };
}

// ─── Portal Sub-component ───────────────────────────────────────────────────

function PopoverPortal({ position, phase, isFull, onMouseDown, onClick }: PortalProps) {
  const style: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    transformOrigin: originStyle(position.placement),
  };

  return createPortal(
    <div style={style} className={`z-sys-popover ${phaseClass(phase)}`}>
      <SelectionPopoverTrigger
        isFull={isFull}
        onMouseDown={onMouseDown}
        onClick={onClick}
      />
    </div>,
    document.body,
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

/**
 * SelectionPopover — gem pill that blooms above the reader's text selection.
 *
 * Pointer-only (desktop / trackpad). Mobile readers use the TopBar ResonanceButton.
 *
 * Race-condition fix: the quote is captured into `capturedQuoteRef` on mousedown
 * — before `useTextSelection` clears state — and passed to ResonanceDrawer on click.
 */
export function SelectionPopover({ articleId, articleTitle }: Props) {
  const isPointer = usePointerCheck();
  const { selection } = useTextSelection({ enabled: isPointer });
  const { isFull, refresh } = useSlotStatus();
  const { isOpen, open, close } = useDrawerState();

  const capturedQuoteRef = useRef('');
  const lastPositionRef  = useRef<PopoverPosition | null>(null);

  // Show popover only when text is selected AND drawer isn't already open
  const showPopover = !!selection && !isOpen;
  const phase = usePopoverPhase(showPopover);

  // Cache the last known position so exit animation can play after selection clears
  if (selection) lastPositionRef.current = computePopoverPosition(selection.rect);

  // ── Event handlers ──────────────────────────────────────────────────────
  // Capture quote text BEFORE useTextSelection clears on mousedown (race-condition fix)
  const handleMouseDown = useCallback(() => {
    capturedQuoteRef.current = selection?.text ?? '';
  }, [selection]);

  const handleClose = useCallback(() => { close(); refresh(); }, [close, refresh]);

  // ── Render ──────────────────────────────────────────────────────────────
  // Non-pointer device: render nothing — TopBar ResonanceButton owns this flow
  if (!isPointer) return null;

  return (
    <>
      {phase !== 'gone' && lastPositionRef.current && (
        <PopoverPortal
          position={lastPositionRef.current}
          phase={phase}
          isFull={isFull}
          onMouseDown={handleMouseDown}
          onClick={open}
        />
      )}
      <ResonanceDrawer
        isOpen={isOpen}
        onClose={handleClose}
        articleId={articleId}
        articleTitle={articleTitle}
        quote={capturedQuoteRef.current}
      />
    </>
  );
}
