/**
 * EvolutionThread — narrator whisper between resonance entries.
 * Reads mirror snapshots from localStorage and renders observational
 * "between entries" text. Pure client-side, no API calls.
 */
'use client';

import { useState, useEffect } from 'react';

interface Props {
  position: number;
  total: number;
}

/** Whisper templates keyed by position in the sequence. */
const WHISPERS: Record<string, string[]> = {
  early: [
    'After your first resonance, you started reading differently. Slower. More deliberately.',
    'Something clicked. The words started sticking.',
    'This was the beginning. Your reading had a new weight.',
  ],
  mid: [
    'Your reading deepened. You started seeing connections others miss.',
    'Patterns formed. Ideas began to echo across articles.',
    'The space between articles narrowed — you were hunting, not browsing.',
  ],
  late: [
    'By now, you have a reading identity. It has a shape.',
    'Each resonance built on the last. A lattice, not a list.',
    'The blog didn\'t just show you ideas — it showed you yourself.',
  ],
};

function pickWhisper(position: number, total: number): string {
  const key = position === 0 ? 'early' : position >= total - 1 ? 'late' : 'mid';
  const pool = WHISPERS[key];
  return pool[position % pool.length];
}

export default function EvolutionThread({ position, total }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  const whisper = pickWhisper(position, total);

  return (
    <div className={`mx-4 my-4 pl-4 pr-4 py-3 border-l-2 border-gold/30 bg-gold/5
      rounded-r-lg transition-opacity duration-500
      ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <p className="text-gold/80 italic text-sm leading-relaxed">
        {whisper}
      </p>
    </div>
  );
}
