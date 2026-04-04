'use client';

import { useState, useEffect } from 'react';
import { ChallengeModal } from '@/components/ChallengeModal';
import { ContinueReadingBanner } from '@/components/ContinueReadingBanner';
import { NewsletterWidget } from '@/components/newsletter/NewsletterWidget';
import { useReadingPosition } from '@/lib/hooks/useReadingPosition';

// TODO: Fetch article data from database or CMS
// For now, using a static postType. In production, this would come from article frontmatter
const ARTICLE_POST_TYPE: 'technical' | 'design' | 'personal' | 'business' | 'general' = 'technical';

export default function ArticlePage({ params }: { params: { id: string } }) {
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [showContinueBanner, setShowContinueBanner] = useState(false);

  // Track reading position
  const { progress, hasStoredPosition, clearPosition } = useReadingPosition(params.id);

  // Show banner if there's a stored position (only on first visit)
  useEffect(() => {
    if (hasStoredPosition && !showContinueBanner) {
      setShowContinueBanner(true);
    }
  }, [hasStoredPosition]);

  return (
    <>
      {/* Continue reading banner */}
      {showContinueBanner && (
        <ContinueReadingBanner
          articleId={params.id}
          onDismiss={() => {
            setShowContinueBanner(false);
            clearPosition();
          }}
        />
      )}

      {/* Progress indicator */}
      {progress > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-label={`Reading progress: ${progress}%`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          />
        </div>
      )}

      <article className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area - 2/3 width */}
          <div className="lg:col-span-2">
            <header className="mb-8">
              <h1 className="text-4xl font-bold mb-4 text-primary">
                The Art of Challenging Ideas
              </h1>
              <p className="text-gray-400">By Author Name • April 4, 2026</p>
            </header>

            <div className="prose prose-invert max-w-none mb-12">
              <p className="text-lg leading-relaxed mb-6">
                This is a sample article that demonstrates the Challenge feature.
                The ability to challenge ideas is fundamental to intellectual growth
                and the pursuit of truth.
              </p>

              <p className="text-lg leading-relaxed mb-6">
                When we encounter ideas that resonate with us, we should also be
                willing to question them. This is how we strengthen our understanding
                and avoid falling into echo chambers.
              </p>

              {/* TODO: Add full article content */}
            </div>

            <ChallengeModal
              articleId={params.id}
              isOpen={isChallengeModalOpen}
              onClose={() => setIsChallengeModalOpen(false)}
            />

            <div className="flex justify-end">
              <button
                onClick={() => setIsChallengeModalOpen(true)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium"
              >
                Challenge This Post
              </button>
            </div>

            {/* TODO: Display existing challenges */}
            {/* TODO: Add related articles section */}
          </div>

          {/* Sidebar - 1/3 width */}
          <aside className="lg:col-span-1">
            <NewsletterWidget postType={ARTICLE_POST_TYPE} />

            {/* TODO: Add more sidebar widgets */}
            {/* TODO: Table of contents */}
            {/* TODO: Author bio */}
          </aside>
        </div>
      </article>
    </>
  );
}

// TODO: Add metadata for SEO
// TODO: Extract postType from article frontmatter or database
