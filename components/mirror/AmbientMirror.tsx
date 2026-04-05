/**
 * AmbientMirror — subtle sidebar strip showing reader archetype.
 * Only renders when mirror data exists (user has reading history).
 * Links to /mirror for the full cinematic reveal.
 */
'use client';

import { useMirror } from '@/lib/hooks/useMirror';
import Link from 'next/link';

export default function AmbientMirror() {
  const { mirror, loading } = useMirror();

  if (loading || !mirror) return null;

  const topTopic = mirror.topicDNA[0];

  return (
    <div className="mb-8">
      <Link href="/mirror" className="block group">
        <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-surface/60 to-background/80 p-4
          transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-lg group-hover:shadow-accent/10">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1">Your Reflection</p>
          <p className="text-sm font-display font-bold text-accent">{mirror.archetypeLabel}</p>
          <p className="text-xs text-gray-400 italic mt-1 line-clamp-2">&ldquo;{mirror.whisper}&rdquo;</p>

          {topTopic && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-accent rounded-full">
                {topTopic.topic} {topTopic.weight}%
              </span>
              <span className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors">
                View mirror →
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
}
