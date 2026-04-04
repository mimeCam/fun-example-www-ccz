/**
 * Journey Context Badge - Ambient article metadata display
 *
 * Shows depth indicator and content DNA in a subtle, non-intrusive way.
 * Designed as environmental cues - noticeable but not competing with content.
 *
 * Follows Tanya's design principles:
 * - Desaturated colors (20-40% saturation)
 * - Subtle elevation through shadows
 * - Consistent 4px corner radius system
 * - Never floats above content
 */

import type { JourneyContext } from '@/types/journey-context';
import { depthToIndicator } from '@/lib/content/JourneyContext';

interface JourneyContextBadgeProps {
  /** Journey context data */
  context: JourneyContext;

  /** Display mode */
  mode?: 'minimal' | 'full';

  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Minimal badge for article cards
 *
 * Shows depth indicator + single DNA tag
 * // TODO: Add hover state to reveal outcome
 * // TODO: Add color coding by depth level
 */
export function JourneyContextBadge({
  context,
  mode = 'minimal',
  size = 'sm',
}: JourneyContextBadgeProps) {
  const depthIndicator = depthToIndicator(context.depth);
  const primaryTag = context.dnaTags[0] || 'general';

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2',
  };

  if (mode === 'minimal') {
    return (
      <div
        className={`
          inline-flex items-center rounded-md
          bg-gray-800/50 text-gray-400
          border border-gray-700/50
          shadow-sm
          ${sizeClasses[size]}
        `}
        title={`Depth: ${context.depth} · Topic: ${primaryTag}`}
      >
        <span className="font-mono tracking-wider" aria-label="Depth indicator">
          {depthIndicator}
        </span>
        <span className="text-gray-500">·</span>
        <span className="capitalize">{primaryTag}</span>
      </div>
    );
  }

  return (
    <div
      className={`
        inline-flex flex-col rounded-lg
        bg-gray-800/30 text-gray-400
        border border-gray-700/30
        shadow-sm p-3 gap-2
      `}
    >
      {/* Depth with all tags */}
      <div className="flex items-center gap-2">
        <span className="font-mono tracking-wider" aria-label="Depth indicator">
          {depthIndicator}
        </span>
        <span className="text-gray-500">·</span>
        <div className="flex gap-1">
          {context.dnaTags.map(tag => (
            <span key={tag} className="capitalize text-xs">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Outcome promise */}
      <p className="text-xs text-gray-500 italic border-t border-gray-700/30 pt-2">
        💡 {context.outcome}
      </p>
    </div>
  );
}

/**
 * Journey Context Bar - Full context for article detail page
 *
 * Displays above title as ambient information layer.
 * // TODO: Add collapse/expand behavior
 * // TODO: Add visual depth gradient by level
 */
export function JourneyContextBar({ context }: { context: JourneyContext }) {
  const depthIndicator = depthToIndicator(context.depth);

  return (
    <div className="mb-6 pb-4 border-b border-gray-800">
      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
        {/* Depth indicator */}
        <div className="flex items-center gap-2">
          <span className="font-mono tracking-wider text-gray-500">
            {depthIndicator}
          </span>
          <span className="capitalize text-gray-600">
            {context.depth}
          </span>
        </div>

        <span className="text-gray-700">·</span>

        {/* Content DNA tags */}
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs uppercase tracking-wider">
            DNA
          </span>
          {context.dnaTags.map(tag => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded bg-gray-800/50 capitalize text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        <span className="text-gray-700">·</span>

        {/* Outcome promise */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-500">
            You'll learn:
          </span>
          <span className="text-gray-400">
            {context.outcome}
          </span>
        </div>
      </div>
    </div>
  );
}
