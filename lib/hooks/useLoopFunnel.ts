/**
 * useLoopFunnel — client-side emitter for the 4 reader-loop checkpoints.
 *
 * Mounted once on a reading surface (e.g. `app/article/[id]/page.tsx`) to
 * register the current `articleId` + `archetype`. Module-level state lets
 * pure-TS callers (clipboard-utils, etc.) emit a checkpoint without
 * threading the article id through every layer.
 *
 * Discipline:
 *  - SSR-safe — every external surface returns silently on the server.
 *  - Idempotent per (article, checkpoint) pair — duplicate emits are dropped.
 *  - Fire-and-forget transport — `navigator.sendBeacon` first, then
 *    `fetch(keepalive: true)` fallback. Never awaited from the caller.
 *  - Flushes on `visibilitychange:hidden` and `pagehide` so checkpoints
 *    fired in the same tick as a navigation still ship.
 *
 * Credits: Mike K. (napkin §3 + §6 — beacon transport, SSR guard, single
 * shared `emitCheckpoint`), Tanya D. (the meter is invisible — no UI),
 * `archetype-store.ts` (`typeof window === 'undefined'` SSR pattern).
 */

'use client';

import { useEffect } from 'react';
import {
  CHECKPOINTS, type CheckpointName,
} from '@/lib/engagement/loop-checkpoints';
import { bucketFor } from '@/lib/engagement/archetype-bucket';

export { CHECKPOINTS, type CheckpointName };

const CHECKPOINT_ENDPOINT = '/api/loop/checkpoint';
const SESSION_STORAGE_KEY = 'loop-funnel-session-id';
const FLUSH_DEBOUNCE_MS = 250;

interface QueuedCheckpoint {
  sessionId: string;
  articleId: string;
  checkpoint: CheckpointName;
  archetype?: string | null;
}

let currentArticleId: string | null = null;
let currentArchetype: string | null = null;
let currentSessionId: string | null = null;
/** Frozen bucket label for this session — `'control'` or the archetype.
 *  Captured once at first emit so all four checkpoints carry the same label
 *  (Mike napkin §6.3 — protect against archetype-store drift mid-session). */
let currentBucket: string | null = null;
const sentForArticle = new Map<string, Set<CheckpointName>>();
let queue: QueuedCheckpoint[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/** Stable session id per browser tab. SSR-safe. Never throws. */
function ensureSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const id = mintSessionId();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, id);
    return id;
  } catch { return null; }
}

/** Prefer crypto.randomUUID, fall back to a timestamp-random hybrid. */
function mintSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** True if the (articleId, name) pair has already been emitted this session. */
function alreadySent(articleId: string, name: CheckpointName): boolean {
  return !!sentForArticle.get(articleId)?.has(name);
}

/** Mark (articleId, name) as emitted so subsequent calls are dropped. */
function markSent(articleId: string, name: CheckpointName): void {
  let set = sentForArticle.get(articleId);
  if (!set) { set = new Set(); sentForArticle.set(articleId, set); }
  set.add(name);
}

/** Try the beacon path first — survives `pagehide`. Returns success. */
function postBeacon(payload: QueuedCheckpoint): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return false;
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    return navigator.sendBeacon(CHECKPOINT_ENDPOINT, blob);
  } catch { return false; }
}

/** `keepalive: true` so the request survives a same-tick navigation. */
function postFetch(payload: QueuedCheckpoint): void {
  if (typeof fetch !== 'function') return;
  void fetch(CHECKPOINT_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => { /* fire-and-forget; the meter is best-effort */ });
}

/** Send one payload via the best available transport. Never throws. */
function send(payload: QueuedCheckpoint): void {
  if (postBeacon(payload)) return;
  postFetch(payload);
}

/** Drain the queue synchronously — call from `pagehide` / `visibilitychange`. */
function drain(): void {
  const pending = queue;
  queue = [];
  pending.forEach(send);
}

/** Coalesce bursts of emits into a single flush ~250 ms later. */
function scheduleFlush(): void {
  if (flushTimer) return;
  flushTimer = setTimeout(() => { flushTimer = null; drain(); }, FLUSH_DEBOUNCE_MS);
}

/** Cancel the pending debounced flush, if any. Safe to call repeatedly. */
function cancelFlushTimer(): void {
  if (!flushTimer) return;
  clearTimeout(flushTimer);
  flushTimer = null;
}

/**
 * Emit a checkpoint for the currently mounted article. SSR-safe + no-op
 * when no `useLoopFunnel(articleId)` is mounted (e.g. on /mirror).
 * Idempotent per (article, checkpoint) pair.
 */
export function emitCheckpoint(
  name: CheckpointName,
  extra?: { archetype?: string | null },
): void {
  if (typeof window === 'undefined') return;
  if (!currentArticleId) return;
  if (alreadySent(currentArticleId, name)) return;
  const sessionId = currentSessionId ?? ensureSessionId();
  if (!sessionId) return;
  currentSessionId = sessionId;
  markSent(currentArticleId, name);
  queue.push(buildPayload(sessionId, name, extra));
  scheduleFlush();
}

/** Compose a payload with the most specific archetype available, then
 *  freeze it through the A/B bucket so the four checkpoints of one session
 *  all carry the same label (`'control'` or the archetype). The freeze is
 *  intentional — see `archetype-bucket.ts` and Mike napkin §6.3. */
function buildPayload(
  sessionId: string,
  name: CheckpointName,
  extra?: { archetype?: string | null },
): QueuedCheckpoint {
  const articleId = currentArticleId as string;
  const raw = extra?.archetype ?? currentArchetype ?? null;
  if (currentBucket === null) currentBucket = bucketFor(sessionId, raw);
  return { sessionId, articleId, checkpoint: name, archetype: currentBucket };
}

/** Attach lifecycle listeners that flush the queue before the page goes away. */
function bindLifecycleFlush(): () => void {
  const flushNow = () => { cancelFlushTimer(); drain(); };
  const onVisibility = () => {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flushNow();
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', flushNow);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', flushNow);
    flushNow();
  };
}

/**
 * Register the current article + archetype for this reading surface.
 * Mount once per page; subsequent `emitCheckpoint` calls (anywhere in the
 * tree, including non-React modules) target this article.
 */
export function useLoopFunnel(articleId: string, archetype?: string | null): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    currentArticleId = articleId;
    currentArchetype = archetype ?? null;
    currentSessionId = ensureSessionId();
    // Bucket is deterministic per sessionId — recompute is a no-op for the
    // same session, but null-on-mount ensures a fresh tab boots cleanly.
    if (currentBucket === null && currentSessionId) {
      currentBucket = bucketFor(currentSessionId, currentArchetype);
    }
    const detach = bindLifecycleFlush();
    return () => {
      detach();
      if (currentArticleId === articleId) currentArticleId = null;
    };
  }, [articleId, archetype]);
}

/** Test-only — reset every piece of module-local state. */
export function __resetLoopFunnelForTests(): void {
  cancelFlushTimer();
  queue = [];
  sentForArticle.clear();
  currentArticleId = null;
  currentArchetype = null;
  currentSessionId = null;
  currentBucket = null;
}

/** Test-only — peek at the queued payloads without flushing. */
export function __peekQueueForTests(): ReadonlyArray<QueuedCheckpoint> {
  return queue;
}

/** Test-only — set the article context without React. */
export function __setArticleContextForTests(
  articleId: string | null, archetype?: string | null,
): void {
  currentArticleId = articleId;
  currentArchetype = archetype ?? null;
  if (articleId) currentSessionId = ensureSessionId();
}
