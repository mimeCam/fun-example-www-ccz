/**
 * Curiosity Trails Discovery Page
 *
 * Discover author-curated semantic trails for guided learning paths
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
      <div className="min-h-screen p-8 bg-gray-900 text-white">
        <p>Loading trails...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Curiosity Trails</h1>
          <p className="text-gray-300 text-lg">
            Author-curated learning paths that guide you through related content with clear connections
          </p>
        </div>

        {trails.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No trails available yet.</p>
            <p className="text-sm text-gray-500">
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

        {/* TODO: Add trail filtering and sorting */}
        {/* TODO: Add trail search functionality */}
        {/* TODO: Add user progress tracking display */}
      </div>
    </div>
  );
}

/**
 * Trail Card Component
 */
function TrailCard({ trail }: { trail: Trail }) {
  return (
    <Link
      href={`/trails/${trail.id}`}
      className="block bg-gradient-to-br from-purple-900/40 to-blue-900/40 rounded-lg p-6 hover:from-purple-900/60 hover:to-blue-900/60 transition-all border border-purple-700/50"
    >
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-xl font-semibold text-purple-100">{trail.name}</h2>
        <DifficultyBadge level={trail.metadata.difficulty} />
      </div>

      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
        {trail.description}
      </p>

      <div className="flex items-center gap-4 text-sm text-gray-400">
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
        <span className="px-2 py-1 bg-purple-800/50 text-purple-200 text-xs rounded">
          {trail.metadata.category}
        </span>
      </div>
    </Link>
  );
}

/**
 * Difficulty Badge Component
 */
function DifficultyBadge({ level }: { level: number }) {
  const colors = {
    1: 'bg-green-900/50 text-green-300 border-green-700',
    2: 'bg-blue-900/50 text-blue-300 border-blue-700',
    3: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    4: 'bg-orange-900/50 text-orange-300 border-orange-700',
    5: 'bg-red-900/50 text-red-300 border-red-700',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${colors[level as keyof typeof colors]}`}>
      Level {level}
    </span>
  );
}
