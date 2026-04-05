/**
 * useStratifiedContent — tracks which content layers a reader has seen.
 *
 * Resolves visible blocks for the reader's archetype + readCount,
 * compares against localStorage seen-state, and flags new discoveries.
 * After a 2-second delay (so the shimmer plays), marks them as seen.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ArchetypeKey, LayeredArticleContent } from '@/types/content';
import { resolveVisibleContent, type ContentBlock } from '@/lib/content/content-layers';

const STORAGE_KEY = 'seen_layers';

interface SeenState { [articleId: string]: string[] }

function loadSeen(): SeenState {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function saveSeen(state: SeenState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

export function useStratifiedContent(
  articleId: string,
  content: LayeredArticleContent | null,
  archetype: ArchetypeKey | null,
  readCount: number
): ContentBlock[] {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);

  const resolve = useCallback(() => {
    if (!content) return [];
    const { blocks: resolved } = resolveVisibleContent(content, archetype, readCount);
    const seen = loadSeen();
    const seenLayers = seen[articleId] ?? [];
    return resolved.map(block => ({
      ...block,
      isNew: !seenLayers.includes(block.layer) && block.layer !== 'core',
    }));
  }, [content, archetype, readCount, articleId]);

  useEffect(() => {
    const resolved = resolve();
    setBlocks(resolved);

    if (!resolved.some(b => b.isNew)) return;

    const timer = setTimeout(() => {
      const seen = loadSeen();
      const updated = [...(seen[articleId] ?? [])];
      resolved.forEach(b => { if (b.isNew && !updated.includes(b.layer)) updated.push(b.layer); });
      saveSeen({ ...seen, [articleId]: updated });
      setBlocks(prev => prev.map(b => ({ ...b, isNew: false })));
    }, 2000);

    return () => clearTimeout(timer);
  }, [resolve, articleId]);

  return blocks;
}
