'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';

/**
 * DepthBar - A minimal, opinionated reading progress indicator
 *
 * Design principles:
 * - "The best UI disappears" - guides without demanding attention
 * - Fixed at bottom edge, never intrudes on content
 * - Simple line with endpoints (start ○ ... finish ○)
 * - Fades when done - no celebration, just completion
 * - Mobile-optimized: thinner on small screens
 *
 * Based on team recommendations:
 * - Michael Koch: Performance-first, Intersection Observer API
 * - Tanya Donskaia: Minimal tasteful design, calm technology
 *
 * TODO: Add milestone messages for delightful micro-interactions
 * - Show subtle messages at 25%, 50%, 75%, 90% progress
 * - Only display if user is engaged (reading > 30 seconds)
 * - Examples: "👀 Just getting started...", "🔥 Halfway there!", etc.
 * - Should be non-intrusive and fade out automatically
 * - Reference: Michael Koch's "Reading Progress & Smart Bookmarks" spec
 */
export function DepthBar({ articleId }: { articleId: string }) {
  const { depth, isReading, isFinished } = useScrollDepth({ articleId });
  const [isVisible, setIsVisible] = useState(false);

  // Only show after user starts scrolling
  useEffect(() => {
    if (isReading && !isFinished) {
      setIsVisible(true);
    } else if (isFinished) {
      // Fade out smoothly when finished
      const timer = setTimeout(() => setIsVisible(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isReading, isFinished]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 px-4 sm:px-8 pb-4 pointer-events-none"
      role="progressbar"
      aria-label={`Reading progress: ${Math.round(depth)}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(depth)}
    >
      <div className="max-w-4xl mx-auto">
        {/* Depth Bar Container */}
        <div className="relative h-3 flex items-center">
          {/* Start endpoint */}
          <div className="absolute left-0 w-3 h-3 rounded-full bg-primary/80 flex-shrink-0" />

          {/* Progress line with subtle texture */}
          <div className="absolute left-3 right-3 h-0.5 sm:h-1 bg-gray-700/50 overflow-hidden">
            {/* Subtle dot pattern texture */}
            <div
              className="h-full bg-primary/60 transition-all duration-300 ease-out"
              style={{
                width: `${depth}%`,
                // Subtle dot pattern using radial gradient
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '4px 4px',
              }}
            />
          </div>

          {/* Finish endpoint */}
          <div className="absolute right-0 w-3 h-3 rounded-full bg-primary/80 flex-shrink-0" />
        </div>

        {/* Optional: subtle percentage indicator (only on larger screens) */}
        {depth > 10 && (
          <div className="text-right">
            <span className="text-xs text-primary/60 font-medium tabular-nums">
              {Math.round(depth)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
