'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface JourneyArticle {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  current: boolean;
  estimatedTime: string;
}

interface JourneyOverviewProps {
  journeyId: string;
  journeyTitle: string;
  articles: JourneyArticle[];
}

/**
 * Journey Overview Component
 *
 * A visual milestone map showing the learning path.
 *
 * Design Philosophy (from Tanya):
 * - Visual milestone map with clear progress
 * - Soft shadows and rounded corners (12-16px)
 * - Muted color palette with brand accent for current
 * - ONE primary action: "Continue" button
 * - Clear visual hierarchy
 */
export function JourneyOverview({
  journeyId,
  journeyTitle,
  articles,
}: JourneyOverviewProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const completed = articles.filter(a => a.completed).length;
    setCompletedCount(completed);

    const current = articles.findIndex(a => a.current);
    if (current !== -1) {
      setCurrentIndex(current);
    }
  }, [articles]);

  const progressPercentage = (completedCount / articles.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface/50 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
          >
            ← Back to Articles
          </Link>

          <h1 className="text-4xl font-bold text-primary mb-2">
            {journeyTitle}
          </h1>
          <p className="text-gray-400">
            Your learning path through {articles.length} articles
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Overview */}
        <div className="bg-surface rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {completedCount} of {articles.length} Completed
              </h2>
              <p className="text-gray-400">
                {Math.round(progressPercentage)}% through the journey
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {progressPercentage.toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Milestone Map */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Your Journey</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
              <MilestoneCard
                key={article.id}
                article={article}
                index={index}
                isCurrent={article.current}
                isCompleted={article.completed}
                isLocked={index > currentIndex && !article.completed}
              />
            ))}
          </div>
        </div>

        {/* Continue Reading Button */}
        {currentIndex < articles.length && (
          <div className="bg-surface rounded-lg p-6 text-center">
            <h3 className="text-xl font-bold mb-2">
              Continue Learning
            </h3>
            <p className="text-gray-400 mb-4">
              Up next: {articles[currentIndex]?.title}
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href={`/article/${articles[currentIndex]?.id}`}
                className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-semibold transition-colors"
              >
                📖 Continue Reading
              </Link>
              <Link
                href={`/journey/${journeyId}/player`}
                className="px-8 py-3 bg-surface hover:bg-surface/80 border border-gray-700 rounded-lg font-semibold transition-colors"
              >
                🎧 Listen
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

interface MilestoneCardProps {
  article: JourneyArticle;
  index: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isLocked: boolean;
}

function MilestoneCard({
  article,
  index,
  isCurrent,
  isCompleted,
  isLocked,
}: MilestoneCardProps) {
  return (
    <div
      className={`
        relative bg-surface rounded-lg p-6 transition-all
        ${isCurrent ? 'ring-2 ring-primary shadow-lg' : ''}
        ${isLocked ? 'opacity-50' : ''}
        ${isCompleted ? 'opacity-75' : ''}
      `}
    >
      {/* Status Icon */}
      <div className="absolute top-4 right-4">
        {isCompleted ? (
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : isCurrent ? (
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center animate-pulse">
            <div className="w-3 h-3 bg-white rounded-full" />
          </div>
        ) : isLocked ? (
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
          </div>
        )}
      </div>

      {/* Step Number */}
      <div className="text-sm text-gray-400 mb-2">
        Step {index + 1}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold mb-2 pr-8">
        {article.title}
      </h3>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 line-clamp-2">
        {article.description}
      </p>

      {/* Meta Info */}
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <span>{article.estimatedTime}</span>
        {isCompleted && (
          <span className="text-green-600">✓ Completed</span>
        )}
        {isCurrent && (
          <span className="text-primary font-medium">In Progress</span>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-4">
        {isLocked ? (
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-700 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
          >
            Locked
          </button>
        ) : isCompleted ? (
          <Link
            href={`/article/${article.id}`}
            className="block w-full px-4 py-2 bg-surface hover:bg-surface/80 border border-gray-700 rounded-lg text-sm font-medium text-center transition-colors"
          >
            Review
          </Link>
        ) : (
          <Link
            href={`/article/${article.id}`}
            className="block w-full px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-sm font-medium text-center transition-colors"
          >
            {isCurrent ? 'Continue' : 'Start'}
          </Link>
        )}
      </div>
    </div>
  );
}
