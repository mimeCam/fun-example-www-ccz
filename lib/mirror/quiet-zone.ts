/**
 * Quiet Zone — prevents the mirror from firing on every article.
 *
 * After a reveal, the mirror goes silent for N articles AND T minutes.
 * After 4 hours idle, the zone resets — fresh experience for returning readers.
 *
 * Pure functions only. Takes storage as parameter for testability.
 * Fail-open: corrupted state → "allowed" (never permanently silence the mirror).
 */

import { z } from 'zod';
import type { QuietZoneState, QuietZoneConfig } from '@/types/mirror';
import { QUIET_ZONE_CONFIG } from '@/lib/thermal/dwell-gate';

const STORAGE_KEY = 'mirror-quiet-zone';

const QuietZoneSchema = z.object({
  lastArticleId: z.string(),
  lastRevealAt: z.number(),
  articlesSince: z.number(),
});

/** Read quiet zone state. Returns null if missing, expired, or corrupted. */
export function readQuietZone(
  getItem: (key: string) => string | null = defaultGetItem,
  now: number = Date.now(),
  config: QuietZoneConfig = QUIET_ZONE_CONFIG,
): QuietZoneState | null {
  const raw = getItem(STORAGE_KEY);
  if (!raw) return null;

  let data: unknown;
  try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { return null; } // corrupted JSON → fail-open

  const parsed = QuietZoneSchema.safeParse(data);
  if (!parsed.success) return null;

  // Expired session → treat as null (quiet zone fully reset)
  if (now - parsed.data.lastRevealAt > config.sessionTtlMs) return null;

  return parsed.data;
}

/** Should the mirror be allowed to reveal on this article? */
export function shouldAllowReveal(
  articleId: string,
  getItem: (key: string) => string | null = defaultGetItem,
  now: number = Date.now(),
  config: QuietZoneConfig = QUIET_ZONE_CONFIG,
): boolean {
  const zone = readQuietZone(getItem, now, config);
  if (!zone) return true;

  // Same article → never re-fire (refresh guard)
  if (zone.lastArticleId === articleId) return false;

  // Either cooldown expiring is sufficient to allow reveal
  const articleCooled = zone.articlesSince >= config.articleCooldown;
  const timeCooled = now - zone.lastRevealAt >= config.timeCooldownMs;

  return articleCooled || timeCooled;
}

/** Write quiet zone state after a successful mirror reveal. */
export function enterQuietZone(
  articleId: string,
  setItem: (key: string, value: string) => void = defaultSetItem,
  now: number = Date.now(),
): void {
  const state: QuietZoneState = {
    lastArticleId: articleId,
    lastRevealAt: now,
    articlesSince: 0,
  };
  try { setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { /* fail-open: if storage is full, just don't persist */ }
}

/** Increment the articles-since counter for a new article visit. */
export function trackArticleVisit(
  articleId: string,
  getItem: (key: string) => string | null = defaultGetItem,
  setItem: (key: string, value: string) => void = defaultSetItem,
  now: number = Date.now(),
  config: QuietZoneConfig = QUIET_ZONE_CONFIG,
): void {
  const zone = readQuietZone(getItem, now, config);
  if (!zone) return;

  // Same article (refresh) → don't increment
  if (zone.lastArticleId === articleId) return;

  const updated: QuietZoneState = {
    ...zone,
    articlesSince: zone.articlesSince + 1,
  };
  try { setItem(STORAGE_KEY, JSON.stringify(updated)); }
  catch { /* ignore storage errors */ }
}

/** Clear quiet zone — used for testing or explicit reset. */
export function clearQuietZone(
  removeItem: (key: string) => void = defaultRemoveItem,
): void {
  try { removeItem(STORAGE_KEY); }
  catch { /* ignore */ }
}

// --- Default storage bindings (swap in tests) ---

function defaultGetItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function defaultSetItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, value);
}

function defaultRemoveItem(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}
