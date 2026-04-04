'use client';

import { useState, useEffect } from 'react';
import { ChallengeModal } from '@/components/ChallengeModal';
import { ChallengeList } from '@/components/ChallengeList';
import { ContinueReadingBanner } from '@/components/ContinueReadingBanner';
import { NewsletterWidget } from '@/components/newsletter/NewsletterWidget';
import { ShareToolbar } from '@/components/sharing/ShareToolbar';
import { TableOfContents } from '@/components/TableOfContents';
import { useReadingPosition } from '@/lib/hooks/useReadingPosition';
import { useShareToolbar } from '@/lib/hooks/useShareToolbar';
import { useSharedHighlight } from '@/lib/hooks/useSharedHighlight';
import { useChallengeStatus } from '@/lib/hooks/useChallengeStatus';
import { useTimeInvestment } from '@/lib/hooks/useTimeInvestment';

// TODO: Fetch article data from database or CMS
// For now, using a static postType. In production, this would come from article frontmatter
const ARTICLE_POST_TYPE: 'technical' | 'design' | 'personal' | 'business' | 'general' = 'technical';

// TODO: Get article metadata from database
const ARTICLE_TITLE = 'The Art of Challenging Ideas';
const AUTHOR_NAME = 'Author Name';

// TODO: Get sections from article frontmatter or database
const ARTICLE_SECTIONS = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'why-challenge', title: 'Why Challenge Ideas?' },
  { id: 'how-to-challenge', title: 'How to Challenge Effectively' },
  { id: 'conclusion', title: 'Conclusion' },
];

export default function ArticlePage({ params }: { params: { id: string } }) {
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [showContinueBanner, setShowContinueBanner] = useState(false);

  // Track reading position
  const { progress, hasStoredPosition, clearPosition } = useReadingPosition(params.id);

  // Track challenge status
  const { hasSubmittedChallenge, challengeCount, markChallengeSubmitted } = useChallengeStatus({ articleId: params.id });

  // Track time investment
  const { formattedTime, estimatedReadTime, isFirstVisit, isOverEstimate } = useTimeInvestment({
    articleId: params.id,
    estimatedReadTime: 5, // TODO: Get from article metadata
  });

  // Share toolbar functionality
  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';
  const {
    isShareToolbarVisible,
    shareToolbarPosition,
    selectedTextForShare,
    closeShareToolbar,
  } = useShareToolbar({
    articleId: params.id,
    articleTitle: ARTICLE_TITLE,
    articleUrl,
    authorName: AUTHOR_NAME,
  });

  // Handle shared highlight links
  useSharedHighlight();

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

      {/* Share toolbar */}
      <ShareToolbar
        isVisible={isShareToolbarVisible}
        position={shareToolbarPosition}
        selectedText={selectedTextForShare}
        articleTitle={ARTICLE_TITLE}
        articleUrl={articleUrl}
        authorName={AUTHOR_NAME}
        onClose={closeShareToolbar}
      />

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
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-4xl font-bold text-primary">
                  The Art of Challenging Ideas
                </h1>
                {hasSubmittedChallenge && (
                  <span
                    className="px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full flex items-center gap-1"
                    title="You've submitted a challenge to this article"
                  >
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>By Author Name • April 4, 2026</span>
                {challengeCount > 0 && (
                  <span>• {challengeCount} challenge{challengeCount > 1 ? 's' : ''}</span>
                )}
                <span className={isOverEstimate ? 'text-primary font-medium' : ''}>
                  {formattedTime} spent · Est. {estimatedReadTime} min read
                </span>
              </div>
              {isFirstVisit && (
                <p className="text-sm text-gray-500 mt-2">
                  Welcome! This article takes about {estimatedReadTime} minutes.
                </p>
              )}
            </header>

            <div className="prose prose-invert max-w-none mb-12">
              <section id="introduction" className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-primary">Introduction</h2>
                <p className="text-lg leading-relaxed mb-6">
                  This is a sample article that demonstrates the Challenge feature.
                  The ability to challenge ideas is fundamental to intellectual growth
                  and the pursuit of truth.
                </p>
              </section>

              <section id="why-challenge" className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-primary">Why Challenge Ideas?</h2>
                <p className="text-lg leading-relaxed mb-6">
                  When we encounter ideas that resonate with us, we should also be
                  willing to question them. This is how we strengthen our understanding
                  and avoid falling into echo chambers.
                </p>
              </section>

              <section id="how-to-challenge" className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-primary">How to Challenge Effectively</h2>
                <p className="text-lg leading-relaxed mb-6">
                  Challenging ideas effectively requires more than just disagreement.
                  It involves understanding the context, asking thoughtful questions,
                  and providing evidence or alternative perspectives.
                </p>
              </section>

              <section id="conclusion" className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-primary">Conclusion</h2>
                <p className="text-lg leading-relaxed mb-6">
                  The art of challenging ideas is a lifelong skill that serves both
                  personal growth and collective progress. Embrace it with humility
                  and curiosity.
                </p>
              </section>

              {/* TODO: Add full article content */}
            </div>

            <ChallengeModal
              articleId={params.id}
              isOpen={isChallengeModalOpen}
              onClose={() => {
                setIsChallengeModalOpen(false);
                markChallengeSubmitted();
              }}
            />

            <div className="flex justify-end">
              <button
                onClick={() => setIsChallengeModalOpen(true)}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium"
              >
                Challenge This Post
              </button>
            </div>

            <ChallengeList articleId={params.id} />

            {/* TODO: Add related articles section */}
          </div>

          {/* Sidebar - 1/3 width */}
          <aside className="lg:col-span-1">
            <NewsletterWidget postType={ARTICLE_POST_TYPE} />
            <TableOfContents sections={ARTICLE_SECTIONS} />

            {/* TODO: Add more sidebar widgets */}
            {/* TODO: Author bio */}
          </aside>
        </div>
      </article>
    </>
  );
}

// TODO: Add metadata for SEO
// TODO: Extract postType from article frontmatter or database
