/**
 * Content Layers — resolves which article layers a reader can see.
 *
 * The brain of stratified content rendering.
 * Pure functions: archetype in → visible layers out.
 * No React, no hooks, no DB — just logic.
 */

import type { ArchetypeKey, LayeredArticleContent, ResolvedParagraph, VisibleLayer } from '@/types/content';
import { resolveStratifiedParagraphs } from './stratified-paragraphs';

/** Check if a reader counts as "returning" (≥2 articles in their history) */
export function isReturningReader(readCount: number): boolean {
  return readCount >= 2;
}

/** Resolve recognition tier from archetype, visit count, and snapshot history */
export function resolveRecognitionTier(
  archetype: ArchetypeKey | null,
  visitCount: number,
  hasSnapshots: boolean
): 'stranger' | 'returning' | 'known' {
  if (!archetype && visitCount === 0) return 'stranger';
  if (archetype && hasSnapshots) return 'known';
  if (visitCount >= 2) return 'returning';
  return 'stranger';
}

/** Map recognition tier to a tonal register for content rendering */
export function getTonalRegister(
  tier: 'stranger' | 'returning' | 'known'
): 'formal' | 'warm' {
  return tier === 'stranger' ? 'formal' : 'warm';
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
    'deep-diver': 'border-l-cyan',        // cyan — marginalia, unlocked
    'explorer': 'border-l-accent',        // light violet — connections
    'faithful': 'border-l-secondary',     // violet — intimate
    'resonator': 'border-l-rose',         // rose — reader's voice
    'collector': 'border-l-primary',      // purple — curation
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

  // Core is always first — resolve paragraph variants when available
  const resolved = resolveStratifiedParagraphs(content.core, content.paragraphVariants, archetype);
  const coreParagraphs = resolved.map(r => r.text);
  const hasVariants = resolved.some(r => r.source !== null);

  blocks.push({
    layer: 'core',
    paragraphs: coreParagraphs,
    ...(hasVariants ? { resolvedParagraphs: resolved } : {}),
  });

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
      isNew: false,
    });
  }

  return { blocks };
}

/** Returns layers that exist in content but the reader cannot yet see */
export function resolveLockedLayers(
  content: LayeredArticleContent,
  archetype: ArchetypeKey | null,
  readCount: number
): VisibleLayer[] {
  const visible = resolveVisibleLayers(archetype, readCount);
  const locked: VisibleLayer[] = [];

  if (content.marginalia && !visible.includes('marginalia')) {
    locked.push('marginalia');
  }

  const keys = Object.keys(content.extensions) as ArchetypeKey[];
  keys.forEach(key => { if (!visible.includes(key)) locked.push(key); });

  return locked;
}

/** A resolved content block ready for rendering */
export interface ContentBlock {
  layer: VisibleLayer;
  paragraphs: string[];
  /** When paragraph variants exist, carries per-paragraph resolution data */
  resolvedParagraphs?: ResolvedParagraph[];
  isNew?: boolean;
  /** Resonance data — only present when layer === 'resonance-marginalia' */
  resonance?: {
    id: string;
    quote: string;
    note: string;
    createdAt: string;
  };
}
