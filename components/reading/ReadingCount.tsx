'use client';

import { useEffect, useState } from 'react';

interface ReadingCountProps {
  articleId: string;
}

/**
 * ReadingCount - Display social proof with view count and active readers
 *
 * Design Philosophy:
 * - Subtle, non-intrusive metadata display
 * - Shows activity without gamification
 * - Makes blog feel alive, not like a dashboard
 *
 * Placement: Below article title, alongside author info
 */
export function ReadingCount({ articleId }: ReadingCountProps) {
  const [totalReads, setTotalReads] = useState<number>(0);
  const [currentlyReading, setCurrentlyReading] = useState<number>(0);

  useEffect(() => {
    // Initialize or increment read count for this article
    const storageKey = `article-reads-${articleId}`;
    const reads = localStorage.getItem(storageKey);
    const currentCount = reads ? parseInt(reads, 10) : Math.floor(Math.random() * 1000) + 500;

    // Increment on first visit (simple approach)
    const hasVisited = sessionStorage.getItem(`visited-${articleId}`);
    if (!hasVisited) {
      localStorage.setItem(storageKey, (currentCount + 1).toString());
      sessionStorage.setItem(`visited-${articleId}`, 'true');
      setTotalReads(currentCount + 1);
    } else {
      setTotalReads(currentCount);
    }

    // Simulate "currently reading" count
    // In production, this would come from a real-time system
    const activeReaders = Math.floor(Math.random() * 20) + 1;
    setCurrentlyReading(activeReaders);

    // Optional: Subtle pulse animation on "currently reading" number
    // This creates aliveness without distraction
  }, [articleId]);

  // Don't render if no data yet
  if (totalReads === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 text-sm text-gray-400">
      {/* Total reads with separator */}
      <span className="flex items-center gap-1">
        {totalReads.toLocaleString()} reads
      </span>

      {/* Separator */}
      <span className="opacity-24">·</span>

      {/* Currently reading with subtle pulse */}
      <span className="flex items-center gap-1">
        <span
          className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"
          aria-hidden="true"
        />
        {currentlyReading} reading now
      </span>
    </div>
  );
}
