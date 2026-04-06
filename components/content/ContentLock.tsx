'use client';

import type { VisibleLayer } from '@/types/content';

/** Props for the ContentLock shimmer block */
interface ContentLockProps {
  lockedLayers: VisibleLayer[];
}

/** Human labels for locked content layers */
const LAYER_LABELS: Record<string, { title: string; hint: string }> = {
  marginalia: {
    title: 'Deeper Insight',
    hint: 'Returns unlock this.',
  },
  'deep-diver': {
    title: 'Hidden Layer',
    hint: 'Your reading pattern unlocks this.',
  },
  explorer: {
    title: 'Hidden Layer',
    hint: 'Your reading pattern unlocks this.',
  },
  faithful: {
    title: 'Hidden Layer',
    hint: 'Your reading pattern unlocks this.',
  },
  resonator: {
    title: 'Hidden Layer',
    hint: 'Your reading pattern unlocks this.',
  },
  collector: {
    title: 'Hidden Layer',
    hint: 'Your reading pattern unlocks this.',
  },
};

/** Single shimmer block for one locked layer */
function LockBlock({ layer }: { layer: VisibleLayer }) {
  const label = LAYER_LABELS[layer] ?? { title: 'Hidden Layer', hint: '' };

  return (
    <div className="content-lock rounded-lg bg-surface/40 border border-dashed border-fog p-6 my-8">
      <p className="text-mist text-sm tracking-wide">
        ~ ~ ~ {label.title} ~ ~ ~
      </p>
      {label.hint && (
        <p className="text-mist/60 text-xs italic mt-1">
          {label.hint}
        </p>
      )}
    </div>
  );
}

/**
 * ContentLock — shimmer blocks teasing hidden article layers.
 *
 * Pure CSS animation (3s breathing border color).
 * The vocabulary is intimacy, not commerce.
 */
export function ContentLock({ lockedLayers }: ContentLockProps) {
  if (lockedLayers.length === 0) return null;

  return (
    <div className="my-4">
      {lockedLayers.map(layer => (
        <LockBlock key={layer} layer={layer} />
      ))}
      <p className="text-mist/50 text-xs text-center mt-2">
        Your reading identity determines what you see.
      </p>
    </div>
  );
}
