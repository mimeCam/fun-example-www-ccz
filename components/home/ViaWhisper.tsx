/**
 * ViaWhisper — "A Deep Diver sent you here" arrival whisper.
 *
 * Renders when a friend clicks a shared archetype deep link.
 * Fades in over 1s, stays for 6s, then fades to 30% opacity.
 * Uses gold tokens — this is a discovery moment.
 */
'use client';

import { useState, useEffect } from 'react';
import type { ArchetypeKey } from '@/types/content';
import { friendWhisperText } from '@/lib/sharing/deep-link';

interface Props {
  via: ArchetypeKey;
}

export default function ViaWhisper({ via }: Props) {
  const [dimmed, setDimmed] = useState(false);
  const text = friendWhisperText(via);

  useEffect(() => {
    const id = setTimeout(() => setDimmed(true), 6000);
    return () => clearTimeout(id);
  }, []);

  return (
    <p className={`text-center text-sm transition-opacity duration-1000 mb-4
      ${dimmed ? 'opacity-30' : 'opacity-100'}`}>
      <span className="text-gold/80 italic">{text}</span>
    </p>
  );
}
