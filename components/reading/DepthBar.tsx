'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';

/**
 * DepthBar — minimal reading progress indicator.
 *
 * Reads depth from ScrollDepthProvider (shared context).
 * No own observer — single truth source for the whole page.
 *
 * Design: fixed bottom, quiet, fades when finished.
 * Per Tanya's spec: rounded-md endpoints, shadow-none.
 */
export function DepthBar() {
  const { depth, isReading, isFinished } = useScrollDepth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isReading && !isFinished) setVisible(true);
    else if (isFinished) {
      const t = setTimeout(() => setVisible(false), 800);
      return () => clearTimeout(t);
    }
  }, [isReading, isFinished]);

  if (!visible) return null;

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
        <div className="relative h-3 flex items-center">
          <div className="absolute left-0 w-3 h-3 rounded-md bg-primary/80 flex-shrink-0" />
          <div className="absolute left-3 right-3 h-0.5 sm:h-1 bg-gray-700/50 overflow-hidden">
            <div
              className="h-full bg-primary/60 transition-all duration-300 ease-out"
              style={{ width: `${depth}%` }}
            />
          </div>
          <div className="absolute right-0 w-3 h-3 rounded-md bg-primary/80 flex-shrink-0" />
        </div>
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
