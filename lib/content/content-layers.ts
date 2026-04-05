/**
 * Content Layers — resolves which article layers a reader can see.
 *
 * The brain of stratified content rendering.
 * Pure functions: archetype in → visible layers out.
 * No React, no hooks, no DB — just logic.
 */

import type { ArchetypeKey, LayeredArticleContent, VisibleLayer } from '@/types/content';

/** Check if a reader counts as "returning" (≥2 articles in their history) */
export function isReturningReader(readCount: number): boolean {
  return readCount >= 2;
}

/**
 * Resolve which content layers are visible to a given reader.
 *
 * Rules (from the architecture spec):
 *   Anonymous      → core only
 *   First-time     → core only (no archetype yet, or first read)
 *   Returning      → core + marginalia
 *   Returning + archetype → core + marginalia + archetype extension
 */
export function resolveVisibleLayers(
  archetype: ArchetypeKey | null,
  readCount: number
): VisibleLayer[] {
  const layers: VisibleLayer[] = ['core'];
  if (!isReturningReader(readCount)) return layers;
  layers.push('marginalia');
  if (archetype) layers.push(archetype);
  return layers;
}

/** Check if a specific layer is in the visible set */
export function isLayerVisible(
  layer: VisibleLayer,
  visible: VisibleLayer[]
): boolean {
  return visible.includes(layer);
}

/** Get the human-readable label for an extension layer */
export function getExtensionLabel(key: ArchetypeKey): string {
  const labels: Record<ArchetypeKey, string> = {
    'deep-diver': 'Deeper Cut',
    'explorer': 'This connects to',
    'faithful': 'Between us',
    'resonator': 'Reflect on this',
    'collector': 'If you liked this',
  };
  return labels[key];
}

/** Get the CSS border color class for an archetype extension */
export function getExtensionBorderColor(key: ArchetypeKey): string {
  const colors: Record<ArchetypeKey, string> = {
    'deep-diver': 'border-l-[#6ec6ca]',   // whisper cyan
    'explorer': 'border-l-[#c77dff]',      // accent purple
    'faithful': 'border-l-[#e8836b]',       // warm coral
    'resonator': 'border-l-[#2e2e50]',      // mist
    'collector': 'border-l-[#7b2cbf]',      // primary purple
  };
  return colors[key];
}

/** Split a content block into paragraphs (on double newline) */
export function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter(p => p.trim().length > 0);
}

/**
 * Resolve the visible content strings for a layered article.
 * Returns the concatenated text blocks the reader is allowed to see.
 */
export function resolveVisibleContent(
  content: LayeredArticleContent,
  archetype: ArchetypeKey | null,
  readCount: number
): { blocks: ContentBlock[] } {
  const visible = resolveVisibleLayers(archetype, readCount);
  const blocks: ContentBlock[] = [];

  // Core is always first
  blocks.push({ layer: 'core', paragraphs: splitParagraphs(content.core) });

  // Marginalia for returning readers
  if (content.marginalia && isLayerVisible('marginalia', visible)) {
    blocks.push({
      layer: 'marginalia',
      paragraphs: splitParagraphs(content.marginalia),
    });
  }

  // Archetype extension
  if (archetype && content.extensions[archetype] && isLayerVisible(archetype, visible)) {
    blocks.push({
      layer: archetype,
      paragraphs: splitParagraphs(content.extensions[archetype]!),
      isNew: true, // TODO: compare against content_views tracking
    });
  }

  return { blocks };
}

/** A resolved content block ready for rendering */
export interface ContentBlock {
  layer: VisibleLayer;
  paragraphs: string[];
  isNew?: boolean; // True if this layer was recently unlocked for the reader
}
