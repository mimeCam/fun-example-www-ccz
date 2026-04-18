'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'resonance-slot-cache';
const SLOT_COUNT = 5;

export interface SlotStatus {
  usedSlots: number;
  isFull: boolean;
  refresh: () => void;
}

function readUsedSlots(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return JSON.parse(raw || '{}').used ?? 0;
  } catch { return 0; }
}

/**
 * Reads the resonance slot count from localStorage and stays in sync
 * across tabs via the `storage` event.
 *
 * Call `refresh()` after any local write (e.g., drawer close) to pull
 * the latest count without waiting for a storage event.
 */
export function useSlotStatus(): SlotStatus {
  const [usedSlots, setUsedSlots] = useState(0);

  const refresh = useCallback(() => setUsedSlots(readUsedSlots()), []);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) refresh(); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  return { usedSlots, isFull: usedSlots >= SLOT_COUNT, refresh };
}
