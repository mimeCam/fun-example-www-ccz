'use client';

import { useEffect, useState } from 'react';
import { useScrollDepth } from '@/lib/hooks/useScrollDepth';
import { useThermal } from '@/components/thermal/ThermalProvider';

/**
 * DepthBar — minimal reading progress indicator.
 *
 * Reads depth from ScrollDepthProvider (shared context).
 * No own observer — single truth source for the whole page.
 *
 * Thermal-aware: continuous color shift from primary→gold via CSS tokens.
 * Design: fixed above AmbientNav (bottom-12), quiet, fades when finished.
 * Per Tanya's spec: rounded-sm endpoints, thermal-glow accent.
 */
export function DepthBar() {
  const { depth, isReading, isFinished } = useScrollDepth();
  const { isWarm } = useThermal();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isReading && !isFinished) setVisible(true);
    else if (isFinished) {
      const t = setTimeout(() => setVisible(false), 800);
      return () => clearTimeout(t);
    }
  }, [isReading, isFinished]);

  if (!visible) return null;

  const barColor = isWarm ? 'bg-gold/60' : 'bg-primary/60';
  const dotColor = isWarm ? 'bg-gold/80' : 'bg-primary/80';
  const textColor = isWarm ? 'text-gold/60' : 'text-primary/60';

  return (
    <div
      className="fixed bottom-12 left-0 right-0 z-10 px-4 sm:px-8 pb-1 pointer-events-none"
      role="progressbar"
      aria-label={`Reading progress: ${Math.round(depth)}%`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(depth)}
    >
      <div className="max-w-4xl mx-auto thermal-glow">
        <div className="relative h-3 flex items-center">
          <div className={`absolute left-0 w-3 h-3 rounded-sm ${dotColor} flex-shrink-0`} />
          <div className="absolute left-3 right-3 h-0.5 sm:h-1 bg-fog/50 overflow-hidden">
            <div
              className={`h-full ${barColor} transition-all duration-300 ease-out`}
              style={{ width: `${depth}%` }}
            />
          </div>
          <div className={`absolute right-0 w-3 h-3 rounded-sm ${dotColor} flex-shrink-0`} />
        </div>
        {depth > 15 && (
          <div className="text-right">
            <span className={`text-xs ${textColor} font-medium tabular-nums`}>
              {Math.round(depth)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
