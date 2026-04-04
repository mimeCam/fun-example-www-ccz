/**
 * DepthLayer - Component for rendering unlocked bonus content
 *
 * Displays content layers that unlock based on reader engagement time.
 * Features fade-in animations and visual distinction from base content.
 *
 * // TODO: Add unlock animation variants (slide, fade, scale)
 * // TODO: Add confetti celebration for final layer
 */

'use client';

import { useEffect, useState } from 'react';
import type { ContentLayer } from '@/types/content';

interface DepthLayerProps {
  layer: ContentLayer;
  onRender?: (layerId: string) => void;
}

/**
 * Render a single unlocked content layer
 *
 * @param layer - The content layer to render
 * @param onRender - Callback when content is rendered
 * @returns Rendered bonus content section
 *
 * // TODO: Add collapse/expand functionality
 * // TODO: Add keyboard shortcut to jump to next layer
 */
export function DepthLayer({ layer, onRender }: DepthLayerProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger fade-in animation after mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Notify parent when content renders
  useEffect(() => {
    if (isVisible && onRender) {
      onRender(layer.id);
    }
  }, [isVisible, layer.id, onRender]);

  return (
    <section
      className={`
        depth-layer
        mt-12 mb-8 p-8 rounded-xl
        border-l-4 border-primary
        bg-gradient-to-r from-gray-800 to-gray-900
        transition-all duration-700 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      data-layer-id={layer.id}
      data-threshold-minutes={layer.thresholdMinutes}
      aria-label={`Bonus content: ${layer.title}`}
    >
      {/* Layer header with unlock indicator */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="text-2xl"
          role="img"
          aria-label="Unlocked content"
        >
          🔓
        </span>
        <h3 className="text-xl font-bold text-primary">
          {layer.title}
        </h3>
        <span
          className="text-sm text-gray-400"
          title={`Unlocked after ${layer.thresholdMinutes} minutes`}
        >
          {layer.thresholdMinutes}+ min read
        </span>
      </div>

      {/* Layer description if provided */}
      {layer.description && (
        <p className="text-sm text-gray-400 mb-4 italic">
          {layer.description}
        </p>
      )}

      {/* Layer content */}
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: layer.content }}
      />

      {/* Optional: Share this insight button */}
      {/* // TODO: Implement share functionality for specific layers */}
    </section>
  );
}

interface DepthLayersProps {
  layers: ContentLayer[];
  onLayerRender?: (layerId: string) => void;
}

/**
 * Render multiple unlocked content layers
 *
 * @param layers - Array of unlocked content layers
 * @param onLayerRender - Callback when each layer renders
 * @returns All unlocked layers in sequence
 *
 * // TODO: Add table of contents for unlocked layers
 * // TODO: Add progress indicator showing remaining locked layers
 */
export function DepthLayers({ layers, onLayerRender }: DepthLayersProps) {
  if (layers.length === 0) {
    return null;
  }

  return (
    <div className="depth-layers-container">
      <div className="border-t border-gray-700 my-8" />
      <h2 className="text-2xl font-bold text-primary mb-6">
        Deeper Insights
      </h2>

      {layers.map((layer) => (
        <DepthLayer
          key={layer.id}
          layer={layer}
          onRender={onLayerRender}
        />
      ))}
    </div>
  );
}

interface LockedLayerTeaserProps {
  layer: ContentLayer;
  timeUntilUnlock: number; // milliseconds
}

/**
 * Show teaser for locked content
 *
 * @param layer - The locked content layer
 * @param timeUntilUnlock - Time remaining until unlock
 * @returns Teaser component showing what's coming
 *
 * // TODO: Add progress bar animation
 * // TODO: Add estimated unlock time
 */
export function LockedLayerTeaser({
  layer,
  timeUntilUnlock,
}: LockedLayerTeaserProps) {
  const minutesUntil = Math.ceil(timeUntilUnlock / 60000);

  return (
    <div
      className="
        locked-layer-teaser
        mt-6 p-6 rounded-lg border border-gray-700
        bg-gray-800/50 opacity-75
        flex items-center gap-4
      "
      aria-label={`Locked content: ${layer.title}`}
    >
      <span className="text-2xl" role="img" aria-label="Locked">
        🔒
      </span>
      <div className="flex-1">
        <p className="text-sm text-gray-400">
          <span className="font-medium text-primary">{layer.title}</span>
          {' '}unlocks in{' '}
          <span className="font-bold">{minutesUntil}m</span>
        </p>
      </div>
    </div>
  );
}
