/**
 * Curiosity Trails Discovery Page
 *
 * Discover author-curated semantic trails for guided learning paths
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GemHome } from '@/components/navigation/GemHome';
import type { Trail } from '@/types/trail';

export default function TrailsPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTrails() {
      try {
        const response = await fetch('/api/trails');
        if (response.ok) {
          const data = await response.json();
          setTrails(data);
        }
      } catch (error) {
        console.error('Error loading trails:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTrails();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-background">
        <GemHome />
        <p className="text-mist">Loading trails...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-background">
      <GemHome />
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-display font-bold mb-4 text-[#f0f0f5]">
            Curiosity Trails
          </h1>
          <p className="text-[#f0f0f5]/80 text-lg">
            Author-curated learning paths that guide you through related content with clear connections
          </p>
        </div>

        {trails.length === 0 ? (
          <div className="bg-surface rounded-xl p-8 text-center shadow-void">
            <p className="text-mist mb-4">No trails available yet.</p>
            <p className="text-sm text-mist/60">
              Trails are curated paths that connect articles for deeper learning.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {trails.map((trail) => (
              <TrailCard key={trail.id} trail={trail} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrailCard({ trail }: { trail: Trail }) {
  return (
    <Link
      href={`/trails/${trail.id}`}
      className="block bg-gradient-to-br from-primary/10 to-cyan/5 rounded-xl p-6
        hover:from-primary/20 hover:to-cyan/10 transition-all
        border border-primary/40 shadow-void hover:shadow-rise"
    >
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-xl font-semibold text-[#f0f0f5]">{trail.name}</h2>
        <DifficultyBadge level={trail.metadata.difficulty} />
      </div>

      <p className="text-[#f0f0f5]/80 text-sm mb-4 line-clamp-2">
        {trail.description}
      </p>

      <div className="flex items-center gap-4 text-sm text-mist">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {trail.estimatedTime}
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {trail.articleIds.length} articles
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span className="px-2 py-1 bg-primary/20 text-[#f0f0f5]/80 text-xs rounded-md">
          {trail.metadata.category}
        </span>
      </div>
    </Link>
  );
}

function DifficultyBadge({ level }: { level: number }) {
  const colors: Record<number, string> = {
    1: 'bg-cyan/10 text-cyan border-cyan/40',
    2: 'bg-cyan/10 text-cyan/80 border-cyan/40',
    3: 'text-gold bg-gold/10 border-gold/40',
    4: 'text-gold bg-gold/10 border-gold/40',
    5: 'text-rose bg-rose/10 border-rose/40',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-md border ${colors[level] || colors[3]}`}>
      Level {level}
    </span>
  );
}
