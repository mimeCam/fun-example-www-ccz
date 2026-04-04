'use client';

import { useEffect, useState } from 'react';
import type { FilterAnalytics } from '@/types/filter';

const STORAGE_KEY = 'filter-analytics';

export function useFilterAnalytics(articleId: string) {
  const [analytics, setAnalytics] = useState<FilterAnalytics | null>(null);

  useEffect(() => {
    // Load existing analytics or create new
    const stored = localStorage.getItem(`${STORAGE_KEY}-${articleId}`);
    if (stored) {
      setAnalytics(JSON.parse(stored));
    }
  }, [articleId]);

  const updateAnalytics = (updates: Partial<FilterAnalytics>) => {
    const newAnalytics: FilterAnalytics = {
      articleId,
      filterShown: analytics?.filterShown ?? false,
      filterAccepted: analytics?.filterAccepted ?? false,
      filterRejected: analytics?.filterRejected ?? false,
      articleCompleted: analytics?.articleCompleted ?? false,
      timestamp: Date.now(),
      ...updates,
    };

    setAnalytics(newAnalytics);
    localStorage.setItem(`${STORAGE_KEY}-${articleId}`, JSON.stringify(newAnalytics));
  };

  return {
    analytics,
    trackFilterShown: () => updateAnalytics({ filterShown: true }),
    trackFilterAccepted: () => updateAnalytics({ filterAccepted: true }),
    trackFilterRejected: () => updateAnalytics({ filterRejected: true }),
    trackArticleCompleted: () => updateAnalytics({ articleCompleted: true }),
  };
}
