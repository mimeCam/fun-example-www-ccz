/**
 * useResonanceMarginalia — fetches a reader's resonances for the
 * current article and matches each quote back to a paragraph index.
 *
 * Returns ContentBlock[] with layer='resonance-marginalia' that can
 * be merged into the stratified block array for inline rendering.
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { getResonancesForArticleAction } from '@/app/actions/resonances';
import type { ContentBlock } from '@/lib/content/content-layers';

interface ResonanceData {
  id: string;
  quote: string;
  resonanceNote: string;
  createdAt: string;
}

/** Get the anonymous reader ID from localStorage */
function getAnonId(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('anon-reader-id') ?? '';
}

/** Find which paragraph contains the given quote text */
function matchQuoteToParagraph(
  quote: string,
  paragraphs: string[]
): number {
  for (let i = 0; i < paragraphs.length; i++) {
    if (paragraphs[i].includes(quote)) return i;
  }
  return paragraphs.length - 1; // fallback: end of article
}

/** Relative time string like "3 days ago" */
function relativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/**
 * Hook: fetch resonances for the current article and produce
 * ContentBlock[] with layer='resonance-marginalia'.
 *
 * @param articleId     — current article ID
 * @param coreParagraphs — flat array of core paragraph strings
 */
export function useResonanceMarginalia(
  articleId: string,
  coreParagraphs: string[]
): ContentBlock[] {
  const [resonances, setResonances] = useState<ResonanceData[]>([]);

  useEffect(() => {
    const id = getAnonId();
    if (!id || !articleId) return;

    let cancelled = false;
    getResonancesForArticleAction(id, articleId).then(result => {
      if (!cancelled && result.success && result.resonances) {
        setResonances(result.resonances);
      }
    });

    return () => { cancelled = true; };
  }, [articleId]);

  return useMemo(() => {
    if (!resonances.length || !coreParagraphs.length) return [];

    return resonances.map(r => {
      const _idx = matchQuoteToParagraph(r.quote, coreParagraphs);
      return {
        layer: 'resonance-marginalia' as const,
        paragraphs: [],
        isNew: true,
        resonance: {
          id: r.id,
          quote: r.quote,
          note: r.resonanceNote,
          createdAt: relativeTime(r.createdAt),
        },
      };
    });
  }, [resonances, coreParagraphs]);
}

/** Extract flat core paragraph strings from a ContentBlock[] */
export function extractCoreParagraphs(blocks: ContentBlock[]): string[] {
  const result: string[] = [];
  for (const b of blocks) {
    if (b.layer === 'core') result.push(...b.paragraphs);
  }
  return result;
}
