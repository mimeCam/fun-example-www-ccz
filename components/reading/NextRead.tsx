/**
 * NextRead — Archetype-Aware "Next Read" Recommendation
 *
 * Design Philosophy (from Tanya Donska's UX spec):
 * - Shows ONE recommendation, not a grid
 * - Includes context about WHY this article was recommended
 * - Archetype-specific accent color and label
 * - Clean, focused layout with subtle styling
 * - Non-intrusive, gentle emergence
 *
 * Placement: Bottom of article, after conclusion, before footer
 */

'use client';

import { Article } from '@/lib/content/ContentTagger';
import type { ArchetypeKey } from '@/types/content';
import Link from 'next/link';

interface NextReadProps {
  article: Article;
  context: string;
  archetype?: ArchetypeKey | null;
}

/** Archetype accent colors — matches content-layers extension borders. */
const ARCHETYPE_ACCENT: Record<ArchetypeKey, string> = {
  'deep-diver': 'border-cyan/30 text-cyan',
  'explorer': 'border-accent/30 text-accent',
  'faithful': 'border-secondary/30 text-secondary',
  'resonator': 'border-rose/30 text-rose',
  'collector': 'border-gold/30 text-gold',
};

/** Human-readable archetype labels for the "For the ..." badge. */
const ARCHETYPE_LABEL: Record<ArchetypeKey, string> = {
  'deep-diver': 'Deep Diver',
  'explorer': 'Explorer',
  'faithful': 'Faithful Reader',
  'resonator': 'Resonator',
  'collector': 'Collector',
};

/**
 * Context-Aware "Next Read" Component
 *
 * Shows a single, intelligent recommendation with archetype context.
 */
export function NextRead({ article, context, archetype }: NextReadProps) {
  if (!article) return null;

  const accent = archetype ? ARCHETYPE_ACCENT[archetype] : '';
  const label = archetype ? ARCHETYPE_LABEL[archetype] : '';

  return (
    <div className="my-12 p-8 rounded-lg relative overflow-hidden transition-all duration-enter ease-out animate-fade-in thermal-shadow">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-primary opacity-15" />

      <div className="relative z-10">
        {/* "UP NEXT" label + archetype badge */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-xs tracking-widest uppercase opacity-50 font-medium">
            Up Next
          </span>
          {label && (
            <span className={`text-xs tracking-wide font-medium border rounded-full px-2.5 py-0.5 ${accent}`}>
              For the {label}
            </span>
          )}
        </div>
        <div className={`w-16 h-0.5 ${archetype ? accent.split(' ')[0] : 'bg-primary'} mt-2 mb-5`} />

        {/* Article title */}
        <h3 className="text-2xl font-semibold text-foreground mb-3 leading-tight">
          {article.title}
        </h3>

        {/* Context — WHY this article was recommended */}
        <p className="text-sm text-mist mb-6 leading-relaxed opacity-70">
          {context}
        </p>

        {/* CTA Button */}
        <Link
          href={`/article/${article.id}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all duration-200 font-medium text-sm shadow-rise"
        >
          Read this next
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
