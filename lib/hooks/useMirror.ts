/**
 * useMirror — fetches the Reader Mirror identity from /api/mirror
 *
 * Reads the stored user email from localStorage, calls the mirror
 * synthesis endpoint, and returns the full ReaderMirror identity.
 *
 * Usage:
 *   const { mirror, loading, error, refresh } = useMirror();
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ReaderMirror } from '@/types/mirror';
import { CHECKPOINTS, emitCheckpoint } from '@/lib/hooks/useLoopFunnel';

interface UseMirrorReturn {
  mirror: ReaderMirror | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

const STORAGE_KEY = 'user-email';

function getStoredEmail(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEY);
}

async function fetchMirror(email: string): Promise<ReaderMirror> {
  const res = await fetch('/api/mirror', {
    headers: { 'x-user-email': email },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Mirror fetch failed (${res.status})`);
  }
  return res.json();
}

export function useMirror(): UseMirrorReturn {
  const [mirror, setMirror] = useState<ReaderMirror | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const email = getStoredEmail();
    if (!email) {
      setLoading(false);
      setMirror(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setMirror(await fetchMirror(email));
    } catch (e: any) {
      setError(e.message || 'Failed to load mirror');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Reader-loop checkpoint #1: archetype resolved. Emitter is a no-op
  // unless `useLoopFunnel(articleId)` is mounted (article surfaces).
  useEffect(() => {
    if (!mirror?.archetype) return;
    emitCheckpoint(CHECKPOINTS.RESOLVED, { archetype: mirror.archetype });
  }, [mirror?.archetype]);

  return { mirror, loading, error, refresh: load };
}
