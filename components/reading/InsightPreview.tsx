'use client';

import { useState } from 'react';

/**
 * InsightPreview Component - Shows readers what they'll gain from the article
 *
 * Design principles:
 * - Time transparency: "In 8 minutes you'll learn..."
 * - Clear value proposition upfront
 * - Translucent design with blur effect
 * - Collapsible to avoid clutter
 * - Gold/amber accent colors for emphasis
 *
 * Based on Tanya Donskaia's UIX spec:
 * - Displays 3-5 bullet points of key takeaways
 * - Reading time context
 * - Rounded corners (12px)
 * - Shadow (8px for UI elements)
 * - Muted time estimates
 *
 * // TODO: Add progressive content revelation (show more on scroll)
 * // TODO: Add topic tags for quick scanning
 * // TODO: Add "key concepts" highlight for technical content
 */

interface InsightPreviewProps {
  readingTime: number;
  takeaways: string[];
  keyConcepts?: string[];
}

export function InsightPreview({
  readingTime,
  takeaways,
  keyConcepts = [],
}: InsightPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!takeaways || takeaways.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="bg-surface/80 backdrop-blur-md rounded-xl border border-primary/20 shadow-lg overflow-hidden">
        {/* Header - clickable to collapse */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-primary/5 transition-colors"
          aria-expanded={isExpanded}
        >
          <div className="flex items-center gap-3">
            <span className="text-amber-400 flex-shrink-0">📖</span>
            <div>
              <p className="text-sm font-medium text-gray-200">
                What you'll learn
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                In {readingTime} minutes
                {takeaways.length > 0 && ` • ${takeaways.length} key takeaways`}
              </p>
            </div>
          </div>
          <span
            className={`text-primary/60 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            👁
          </span>
        </button>

        {/* Content - collapsible */}
        {isExpanded && (
          <div className="px-5 pb-4">
            {/* Key Takeaways */}
            <ul className="space-y-2">
              {takeaways.slice(0, 5).map((takeaway, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-300"
                >
                  <span className="text-amber-400 mt-0.5 flex-shrink-0">•</span>
                  <span>{takeaway}</span>
                </li>
              ))}
            </ul>

            {/* Optional: Key concepts for technical content */}
            {keyConcepts && keyConcepts.length > 0 && (
              <div className="mt-3 pt-3 border-t border-primary/10">
                <p className="text-xs text-gray-400 mb-2">Key concepts</p>
                <div className="flex flex-wrap gap-2">
                  {keyConcepts.slice(0, 4).map((concept, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary/10 rounded-md text-xs text-primary/80"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable function to extract takeaways from article content
// TODO: Add AI-powered takeaways generation from article content
// TODO: Add author-curated takeaways support
export function extractTakeaways(content: string): string[] {
  // This is a placeholder - in production, takeaways would be:
  // 1. Author-provided in article metadata
  // 2. AI-generated from content during build
  // 3. Extracted from article headings

  // For now, return empty array
  return [];
}

// TODO: Add reading streak context ("You're on a 3-day reading streak!")
// TODO: Add personalized difficulty indicator
