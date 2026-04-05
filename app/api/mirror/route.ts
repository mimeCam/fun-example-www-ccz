/**
 * GET /api/mirror — Reading Mirror synthesis endpoint
 * Gathers all reader data and returns a synthesized reader identity.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createEmailFingerprint,
  getReadingHistory,
  getReadingStats,
} from '@/lib/reading-memory';
import { getUserResonances } from '@/lib/resonances';
import { getUserInsights } from '@/lib/insights';
import { getArticleById } from '@/lib/content/articleData';
import { synthesize } from '@/lib/mirror/synthesizer';
import type { MirrorInput } from '@/types/mirror';

export const dynamic = 'force-dynamic';

function extractTopics(
  history: { articleId: string }[]
): { topic: string; count: number }[] {
  const map = new Map<string, number>();
  history.forEach(h => {
    const tag = getArticleById(h.articleId)?.tags?.[0];
    if (tag) map.set(tag, (map.get(tag) || 0) + 1);
  });
  return Array.from(map.entries()).map(([topic, count]) => ({ topic, count }));
}

function gatherRawData(fp: string) {
  return {
    history: getReadingHistory(fp),
    stats: getReadingStats(fp),
    resonances: getUserResonances(fp),
    insights: getUserInsights(fp),
  };
}

function avgCompletion(history: { completionRate: number }[]): number {
  return history.length > 0
    ? history.reduce((s, h) => s + h.completionRate, 0) / history.length
    : 0;
}

function buildInput(fp: string): MirrorInput {
  const { history, stats, resonances, insights } = gatherRawData(fp);
  const topics = extractTopics(history);
  return {
    totalArticles: stats.totalArticles,
    totalReadingTime: stats.totalReadingTime,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    avgCompletion: avgCompletion(history),
    topicCount: new Set(topics.map(t => t.topic)).size,
    resonanceCount: resonances.length,
    insightCount: insights.length,
    resonanceNotes: resonances.map(r => r.resonanceNote),
    topics,
  };
}

export async function GET(req: NextRequest) {
  try {
    const email = req.headers.get('x-user-email')
      || req.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    return NextResponse.json(synthesize(buildInput(createEmailFingerprint(email))));
  } catch (e) {
    console.error('Mirror synthesis failed:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
