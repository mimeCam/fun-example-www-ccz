/**
 * NextRead — Archetype-Aware "Next Read" Recommendation
 *
 * Whisper, not billboard — gentle suggestion at the article's end.
 * Ceremony-aware: defers visibility to the CeremonySequencer.
 * Shows ONE recommendation with context about WHY.
 */

'use client';

import { useState, useEffect } from 'react';
import { Article } from '@/lib/content/ContentTagger';
import type { ArchetypeKey } from '@/types/content';
import { useCeremony } from './CeremonySequencer';
import { TextLink } from '@/components/shared/TextLink';

/** Archetype accent colors — matches content-layers extension borders. */
const ARCHETYPE_ACCENT: Record<ArchetypeKey, string> = {
  'deep-diver': 'border-cyan/30 text-cyan',
  'explorer': 'border-accent/30 text-accent',
  'faithful': 'border-secondary/30 text-secondary',
  'resonator': 'border-rose/30 text-rose',
  'collector': 'border-amber/30 text-amber',
};

/** Human-readable archetype labels for the "For the ..." badge. */
const ARCHETYPE_LABEL: Record<ArchetypeKey, string> = {
  'deep-diver': 'Deep Diver',
  'explorer': 'Explorer',
  'faithful': 'Faithful Reader',
  'resonator': 'Resonator',
  'collector': 'Collector',
};

interface NextReadProps {
  article: Article;
  context: string;
  archetype?: ArchetypeKey | null;
}

export function NextRead({ article, context, archetype }: NextReadProps) {
  if (!article) return null;

  const { phase } = useCeremony();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (phase === 'gifting' || phase === 'settled') {
      setVisible(true);
    }
  }, [phase]);

  if (!visible) return null;

  const label = archetype ? ARCHETYPE_LABEL[archetype] : '';

  return (
    <div className="py-sys-7 animate-fade-in">
      {/* "UP NEXT" label + archetype badge */}
      <div className="mb-sys-4 flex items-center gap-sys-4">
        <span className="text-sys-micro tracking-widest uppercase text-mist/50 font-sys-accent">
          Up Next
        </span>
        {label && (
          <span className={`text-sys-micro tracking-wide font-sys-accent border rounded-sys-full px-sys-3 py-sys-1 ${ARCHETYPE_ACCENT[archetype!]}`}>
            For the {label}
          </span>
        )}
      </div>

      {/* Article title */}
      <h3 className="text-sys-xl font-sys-heading text-foreground mb-sys-2 leading-tight">
        {article.title}
      </h3>

      {/* Context — WHY this article was recommended */}
      <p className="text-sys-caption text-mist/60 mb-sys-4 leading-relaxed">
        {context}
      </p>

      {/* CTA — the showcase `passage` moment: reader hovers → feels
          the destination room's temperature before the click. */}
      <TextLink
        variant="passage"
        href={`/article/${article.id}`}
        className="text-sys-caption font-sys-accent"
      >
        Read this next →
      </TextLink>
    </div>
  );
}
