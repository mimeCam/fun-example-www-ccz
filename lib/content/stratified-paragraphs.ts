/**
 * Stratified Paragraphs — resolves per-paragraph archetype variants.
 *
 * Pure function: core text + variants + archetype → ResolvedParagraph[].
 * No React, no hooks, no DB — just logic.
 */

import type { ArchetypeKey, ParagraphVariantMap, ResolvedParagraph } from '@/types/content';

/**
 * Resolve each paragraph slot to the best available text.
 *
 * Rules:
 *   1. Split core on \n\n → paragraph slots
 *   2. If archetype exists AND variant[slot][archetype] exists → pick variant
 *   3. Else → pick default text from core
 *   4. Extra slots beyond variants range render as default
 */
export function resolveStratifiedParagraphs(
  core: string,
  variants: ParagraphVariantMap | undefined,
  archetype: ArchetypeKey | null,
): ResolvedParagraph[] {
  const slots = core.split(/\n\n+/).filter(p => p.trim().length > 0);

  if (!archetype || !variants) {
    return slots.map((text, i) => ({ slotIndex: i, text, source: null }));
  }

  return slots.map((defaultText, i) => {
    const variant = variants[i]?.[archetype];
    return {
      slotIndex: i,
      text: variant ?? defaultText,
      source: variant ? archetype : null,
    };
  });
}
