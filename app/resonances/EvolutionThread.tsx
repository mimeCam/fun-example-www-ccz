/**
 * EvolutionThread — narrator whisper between resonance entries.
 *
 * Now data-driven: accepts BookNarrationContext and delegates to
 * book-whisper-engine for trigger/template matching.
 * Falls back gracefully if no context is provided (backward compat).
 */
'use client';

import { useState, useEffect } from 'react';
import type { BookNarrationContext } from '@/types/book-narration';
import { synthesizeBookWhisper } from '@/lib/mirror/book-whisper-engine';

interface Props {
  /** Data-driven context from resonance signals. */
  context?: BookNarrationContext;
  /** Legacy fallback: position + total for static whispers. */
  position?: number;
  total?: number;
}

export default function EvolutionThread({ context, position = 0, total = 1 }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const whisper = context
    ? synthesizeBookWhisper(context)
    : legacyWhisper(position, total);

  return (
    <div className={`mx-sys-5 my-sys-5 pl-sys-5 pr-sys-5 py-sys-4 border-l-2 border-gold/20 bg-gold/8
      rounded-r-sys-medium transition-opacity duration-reveal
      ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <p className="text-gold/70 italic text-sys-caption leading-relaxed">
        {whisper}
      </p>
    </div>
  );
}

/** Fallback whisper when no context is available. */
function legacyWhisper(position: number, total: number): string {
  const pool = [
    'After your first resonance, you started reading differently. Slower.',
    'Your reading deepened. You started seeing connections others miss.',
    'By now, you have a reading identity. It has a shape.',
  ];
  const key = position === 0 ? 0 : position >= total - 1 ? 2 : 1;
  return pool[key];
}
