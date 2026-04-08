/**
 * Featured article selector — pure functions, no side effects.
 *
 * Strategy:
 *   Strangers      → seed article (art-of-challenging, strongest Portal title)
 *   Returning      → first unread article from reading_memory
 *   All read       → random article
 */

import { Article } from './ContentTagger';
import { getAllArticles } from './articleData';

/** The seed article — strongest title for the Portal concept */
const SEED_ID = 'art-of-challenging';

/** Default featured article (server-safe, no localStorage) */
export function getDefaultFeaturedArticle(): Article {
  return getAllArticles().find(a => a.id === SEED_ID) ?? getAllArticles()[0];
}

/** Select a featured article based on what the reader has already read */
export function selectFeaturedArticle(readIds: string[]): Article {
  const all = getAllArticles();
  const unread = all.filter(a => !readIds.includes(a.id));
  if (unread.length > 0) return unread[0];
  return all[Math.floor(Math.random() * all.length)];
}

/** Read article IDs from reading_memory localStorage key */
export function readArticleIdsFromMemory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('reading_memory');
    return raw ? Object.keys(JSON.parse(raw)) : [];
  } catch { return []; }
}
