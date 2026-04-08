/**
 * Deep Link — encode/decode shareable archetype URLs.
 *
 * URL format: /?via=DEEP_DIVER&a=article-slug
 * When a friend clicks, the homepage detects the param and shows
 * "A Deep Diver sent you here" whisper before the article doorway.
 *
 * Pure functions. No side effects.
 */

import type { ArchetypeKey } from '@/types/content';

export interface DeepLinkParams {
  via: ArchetypeKey | null;
  articleId: string | null;
}

const LABELS: Record<ArchetypeKey, string> = {
  'deep-diver': 'Deep Diver',
  explorer: 'Explorer',
  faithful: 'Faithful',
  resonator: 'Resonator',
  collector: 'Collector',
};

/** Encode archetype + article into a shareable URL. */
export function encodeDeepLink(
  archetype: ArchetypeKey,
  articleId?: string,
): string {
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const via = `?via=${archetype.toUpperCase().replace('-', '_')}`;
  const art = articleId ? `&a=${encodeURIComponent(articleId)}` : '';
  return `${base}/${via}${art}`;
}

/** Decode search params into a typed DeepLinkParams. */
export function decodeDeepLink(
  params: Record<string, string | string[] | undefined>,
): DeepLinkParams {
  const raw = params.via;
  if (!raw || Array.isArray(raw)) return { via: null, articleId: null };
  const via = raw.toLowerCase().replace('_', '-') as ArchetypeKey;
  const articleId = typeof params.a === 'string' ? params.a : null;
  return LABELS[via] ? { via, articleId } : { via: null, articleId: null };
}

/** Human-readable archetype name from key. */
export function archetypeDisplayName(key: ArchetypeKey): string {
  return LABELS[key] ?? 'Reader';
}

/** "A Deep Diver sent you here" — the friend arrival whisper. */
export function friendWhisperText(key: ArchetypeKey): string {
  const name = archetypeDisplayName(key);
  return `A ${name} sent you here`;
}
