'use client';

import { useState, useEffect } from 'react';

interface ReadingStats {
  totalArticles: number;
  totalReadingTime: number;
  currentStreak: number;
  longestStreak: number;
}

interface ReadingMemoryEntry {
  articleId: string;
  firstReadAt: string;
  lastReadAt: string;
  readCount: number;
  totalReadingTime: number;
  completionRate: number;
}

interface ReadingMemoryResponse {
  stats: ReadingStats;
  history: ReadingMemoryEntry[];
}

interface TopicData {
  topic: string;
  count: number;
  lastRead: string;
  percentage: number;
}

/**
 * ReadingDashboard Component
 *
 * Main container for the Reading Journey page.
 * Fetches data from API and displays stats, timeline, and topics.
 */
export default function ReadingDashboard({ userEmail }: { userEmail: string }) {
  const [memory, setMemory] = useState<ReadingMemoryResponse | null>(null);
  const [topics, setTopics] = useState<TopicData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReadingData();
  }, [userEmail]);

  const fetchReadingData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch reading memory
      const memoryRes = await fetch('/api/reading/memory', {
        headers: {
          'x-user-email': userEmail,
        },
      });

      if (!memoryRes.ok) {
        throw new Error('Failed to fetch reading memory');
      }

      const memoryData: ReadingMemoryResponse = await memoryRes.json();
      setMemory(memoryData);

      // Fetch topics
      const topicsRes = await fetch('/api/reading/topics', {
        headers: {
          'x-user-email': userEmail,
        },
      });

      if (topicsRes.ok) {
        const topicsData: { topics: TopicData[] } = await topicsRes.json();
        setTopics(topicsData.topics);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load reading data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-400">Loading your journey...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">Error: {error}</p>
        <button
          onClick={fetchReadingData}
          className="px-6 py-2 bg-primary hover:bg-secondary rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!memory) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">
          No reading history yet. Start reading articles to build your journey!
        </p>
        <a
          href="/"
          className="px-6 py-2 bg-primary hover:bg-secondary rounded-lg transition-colors inline-block"
        >
          Browse Articles
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="📚"
          label="Articles Read"
          value={memory.stats.totalArticles.toString()}
        />
        <StatCard
          icon="⏱️"
          label="Total Time"
          value={formatTime(memory.stats.totalReadingTime)}
        />
        <StatCard
          icon="⚡"
          label="Current Streak"
          value={`${memory.stats.currentStreak} days`}
        />
        <StatCard
          icon="🏆"
          label="Longest Streak"
          value={`${memory.stats.longestStreak} days`}
        />
      </div>

      {/* Recent Reads */}
      <section className="bg-surface rounded-lg p-6">
        <h2 className="text-2xl font-bold text-primary mb-4">Recent Reads</h2>
        {memory.history.length === 0 ? (
          <p className="text-gray-400">No articles read yet.</p>
        ) : (
          <div className="space-y-3">
            {memory.history.slice(0, 10).map((entry) => (
              <div
                key={entry.articleId}
                className="flex items-center justify-between p-4 bg-background rounded-lg hover:bg-surface/80 transition-colors"
              >
                <div className="flex-1">
                  <a
                    href={`/article/${entry.articleId}`}
                    className="text-lg font-semibold text-primary hover:text-secondary transition-colors"
                  >
                    Article: {entry.articleId}
                  </a>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatDate(entry.lastReadAt)} • Read {entry.readCount} time{entry.readCount > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">
                    {formatTime(entry.totalReadingTime)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round(entry.completionRate * 100)}% complete
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Topics Breakdown */}
      {topics.length > 0 && (
        <section className="bg-surface rounded-lg p-6">
          <h2 className="text-2xl font-bold text-primary mb-4">Topics Explored</h2>
          <div className="space-y-3">
            {topics.map((topic) => (
              <div key={topic.topic} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300 capitalize">{topic.topic}</span>
                  <span className="text-gray-400">
                    {topic.count} article{topic.count > 1 ? 's' : ''} • {Math.round(topic.percentage)}%
                  </span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${topic.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Simple stat card component
 */
function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-surface rounded-lg p-6">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-primary mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
}
