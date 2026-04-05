/**
 * SubtleNod - Honest celebration for genuine reading completion
 *
 * A calm, respectful acknowledgment that the reader truly engaged with content.
 * Inspired by a writer's quiet nod across a room — not applause, just recognition.
 *
 * Design principles (from Tanya Donska's UIX spec):
 * - Warm golden glow (#F5A623 at 10-20% saturation)
 * - Soft shadow (0 8px 32px rgba(245,166,35,0.15))
 * - 4px corner radius (consistent with system)
 * - Gentle pulse animation, not flashy confetti
 * - Auto-dismiss after 6 seconds
 * - Only fires once per article per session
 *
 * Uses existing CompletionDetector confidence data.
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { DetectionResult } from '@/lib/detection/completion-detector';

interface SubtleNodProps {
  articleId: string;
  result: DetectionResult | null;
}

const STORAGE_PREFIX = 'subtle-nod-seen-';

export function SubtleNod({ articleId, result }: SubtleNodProps) {
  const [isVisible, setIsVisible] = useState(false);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    try { sessionStorage.setItem(STORAGE_PREFIX + articleId, '1'); } catch {}
  }, [articleId]);

  useEffect(() => {
    if (!result?.isGenuineRead) return;
    try {
      if (sessionStorage.getItem(STORAGE_PREFIX + articleId)) return;
    } catch {}
    setIsVisible(true);
    const timer = setTimeout(dismiss, 6000);
    return () => clearTimeout(timer);
  }, [result, articleId, dismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={`my-12 transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className="relative rounded p-6 text-center border"
        style={{
          background: 'rgba(245,166,35,0.06)',
          borderColor: 'rgba(245,166,35,0.15)',
          boxShadow: '0 8px 32px rgba(245,166,35,0.12)',
        }}
      >
        <p className="text-lg text-gray-200 font-medium mb-1">
          Thanks for truly reading this.
        </p>
        <p className="text-sm text-gray-400">
          You spent the time it deserves. That matters.
        </p>
        {result && result.confidence > 85 && (
          <p className="text-xs text-gray-500 mt-2 italic">
            A thoughtful {result.confidence}% engagement.
          </p>
        )}
      </div>
    </div>
  );
}
