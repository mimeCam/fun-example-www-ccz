/**
 * MirrorWhisper — post-article "The Mirror sees you" prompt.
 *
 * Bridges the gap between reading and self-discovery.
 * Appears after scroll depth ≥ 90%, only if reader has a detected archetype.
 * Links to /mirror with a gentle gold call-to-action.
 *
 * Tanya's spec: mist/60 text-sm italic, gold link, 300ms fade-in, no transform.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import type { ArchetypeKey } from '@/types/content';

const LABELS: Record<ArchetypeKey, string> = {
  'deep-diver': 'Deep Diver',
  'explorer': 'Explorer',
  'faithful': 'Faithful Reader',
  'resonator': 'Resonator',
  'collector': 'Collector',
};

const BEHAVIORAL: Record<ArchetypeKey, string> = {
  'deep-diver': 'You go deeper than most.',
  'explorer': 'You never stay on the path.',
  'faithful': 'You always come back.',
  'resonator': 'Something in here echoes in you.',
  'collector': 'You keep what matters.',
};

function loadArchetype(): ArchetypeKey | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('quick-mirror-result');
    if (!raw) return null;
    return JSON.parse(raw)?.archetype ?? null;
  } catch {
    return null;
  }
}

interface MirrorWhisperProps {
  /** Override archetype (e.g. from quickMirror.result) */
  archetype?: ArchetypeKey | null;
}

export default function MirrorWhisper({ archetype: propArchetype }: MirrorWhisperProps) {
  const { depth } = useScrollDepth();
  const [archetype] = useState(propArchetype ?? loadArchetype);
  const [show, setShow] = useState(false);
  const [fadedIn, setFadedIn] = useState(false);

  useEffect(() => {
    if (depth >= 90 && archetype && !show) {
      setShow(true);
      const t = setTimeout(() => setFadedIn(true), 10);
      return () => clearTimeout(t);
    }
  }, [depth, archetype, show]);

  if (!show || !archetype) return null;

  const label = LABELS[archetype] ?? archetype;
  const behavioral = BEHAVIORAL[archetype] ?? 'You were here.';

  return (
    <div
      className={`my-10 text-center transition-opacity duration-enter ease-out ${fadedIn ? 'opacity-100' : 'opacity-0'}`}
      role="complementary"
      aria-label="Mirror archetype prompt"
    >
      <p className="text-mist/60 text-sm italic">
        {behavioral}
      </p>
      <Link
        href="/mirror"
        className="inline-block mt-2 text-gold text-sm
          hover:text-gold/80 transition-colors duration-hover"
      >
        See your full reflection →
      </Link>
    </div>
  );
}
