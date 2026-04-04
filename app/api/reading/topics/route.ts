import { NextRequest, NextResponse } from 'next/server';
import {
  getReadingHistory,
  createEmailFingerprint,
} from '@/lib/reading-memory';
import { getArticleById } from '@/lib/content/articleData';

/**
 * GET /api/reading/topics
 * Returns breakdown of topics user has read about
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email') ||
                  request.nextUrl.searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const emailFingerprint = createEmailFingerprint(email);
    const history = getReadingHistory(emailFingerprint);

    // Aggregate by topic using article tags
    const topicMap = new Map<string, { count: number; lastRead: number }>();

    for (const entry of history) {
      const article = getArticleById(entry.articleId);

      if (article?.tags) {
        // Use the first tag as the primary topic
        const primaryTag = article.tags[0];

        if (primaryTag) {
          const existing = topicMap.get(primaryTag);
          const lastRead = Math.max(existing?.lastRead || 0, entry.lastReadAt);

          topicMap.set(primaryTag, {
            count: (existing?.count || 0) + 1,
            lastRead,
          });
        }
      }
    }

    // Convert to array and calculate percentages
    const totalReads = Array.from(topicMap.values()).reduce((sum, t) => sum + t.count, 0);

    const topics = Array.from(topicMap.entries())
      .map(([topic, data]) => ({
        topic,
        count: data.count,
        lastRead: new Date(data.lastRead),
        percentage: totalReads > 0 ? (data.count / totalReads) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({ topics });
  } catch (error: any) {
    console.error('Failed to get topic breakdown:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
