'use client';

import { useState, useEffect } from 'react';
import { ChallengeModal } from '@/components/ChallengeModal';
import { ChallengeList } from '@/components/ChallengeList';
import { ContinueReadingBanner } from '@/components/ContinueReadingBanner';
import { NewsletterWidget } from '@/components/newsletter/NewsletterWidget';
import { ShareToolbar } from '@/components/sharing/ShareToolbar';
import { TableOfContents } from '@/components/TableOfContents';
import { TrustedFilterSection } from '@/components/trusted-filter/TrustedFilterSection';
import { DepthBar } from '@/components/reading/DepthBar';
import { useReadingPosition } from '@/lib/hooks/useReadingPosition';
import { useShareToolbar } from '@/lib/hooks/useShareToolbar';
import { useSharedHighlight } from '@/lib/hooks/useSharedHighlight';
import { useChallengeStatus } from '@/lib/hooks/useChallengeStatus';
import { useTimeInvestment } from '@/lib/hooks/useTimeInvestment';
// TODO: Import useCompletionDetection when implementing celebration UI
// import { useCompletionDetection } from '@/lib/hooks/useCompletionDetection';
import { TrustedFilterData } from '@/types/trusted-filter';
import { findRelatedArticles } from '@/lib/content/ContentTagger';
import { getAllArticles } from '@/lib/content/articleData';
import { NextRead, generateRecommendationContext } from '@/components/reading/NextRead';
import { ExportNotesButton } from '@/components/notes/ExportNotesButton';
import { NotesProvider } from '@/components/notes/NotesProvider';
import { QuickStats } from '@/components/content/QuickStats';
import { ReadingCount } from '@/components/reading/ReadingCount';
import { BookmarkButton } from '@/components/reading/BookmarkButton';
import { CommentForm } from '@/components/CommentForm';
import { CommentList } from '@/components/CommentList';
import { ThisDayInHistory } from '@/components/ThisDayInHistory';

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

// TODO: Get trusted filter data from article metadata
const ARTICLE_TRUSTED_FILTER: TrustedFilterData = {
  context: {
    targetAudience: 'Developers and technical leaders who want to improve their critical thinking skills',
    valuePromise: 'A practical framework for challenging ideas constructively and fostering intellectual growth in teams',
    timeCommitment: '5 min read',
  },
  perspectives: [
    {
      url: 'https://www.paulgraham.com/essay.html',
      title: 'How to Do Great Work',
      description: 'Paul Graham explores how curiosity and questioning assumptions lead to breakthrough discoveries.',
      author: 'Paul Graham',
      type: 'foundational',
    },
    {
      url: 'https://m.signalvnoise.com/strengthen-your-soft-skills/',
      title: 'Strengthen Your Soft Skills',
      description: 'Jason Fried discusses why communication and empathy are crucial for technical excellence.',
      author: 'Jason Fried',
      type: 'complementary',
    },
    {
      url: 'https://www.cs.princeton.edu/~watson/',
      title: 'The Value of Contrarian Thinking',
      description: 'David Watson argues why unpopular opinions often drive innovation and progress.',
      author: 'David Watson',
      type: 'contrarian',
    },
  ],
};

export default function ArticlePage({ params }: { params: { id: string } }) {
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [showContinueBanner, setShowContinueBanner] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentKey, setCommentKey] = useState(0);

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
    <NotesProvider postId={params.id}>
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

      {/* Depth Bar - Minimal, opinionated reading progress indicator */}
      <DepthBar articleId={params.id} />

      <article className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area - 2/3 width */}
          <div className="lg:col-span-2">
            <header className="mb-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
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

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Bookmark Button - One-Click "Read Later" */}
                  <BookmarkButton
                    articleId={params.id}
                    articleTitle={ARTICLE_TITLE}
                  />

                  {/* Export Notes Button - Only shows when notes exist */}
                  <ExportNotesButton
                    postId={params.id}
                    articleTitle={ARTICLE_TITLE}
                    articleUrl={articleUrl}
                    articleDate="2026-04-04"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span>By Author Name • April 4, 2026</span>
                  {challengeCount > 0 && (
                    <span>• {challengeCount} challenge{challengeCount > 1 ? 's' : ''}</span>
                  )}
                  <span className={isOverEstimate ? 'text-primary font-medium' : ''}>
                    {formattedTime} spent · Est. {estimatedReadTime} min read
                  </span>
                </div>
                <ReadingCount articleId={params.id} />
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

            {/* TODO: THE SUBTLE NOD - Celebration UI for genuine readers */}
            {/* When useCompletionDetection detects genuine reading completion:
                - Show subtle celebration animation (confetti, pulse, etc.)
                - Display "Thank you for reading this thoughtfully" message
                - Optional: Writer's personalized message
                - Should be non-intrusive and respectful
                - Only show once per session (use localStorage)
                - Integrate useCompletionDetection hook here
            */}

            {/* Trusted Filter Section */}
            <TrustedFilterSection data={ARTICLE_TRUSTED_FILTER} />

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

            {/* Thoughtful Conversations - Comments Section */}
            <div className="mt-12 pt-8 border-t border-gray-700">
              <h2 className="text-3xl font-bold mb-6 text-primary">Thoughtful Conversations</h2>
              <p className="text-gray-400 mb-6">
                Join the discussion. Share your perspective (minimum 100 words).
              </p>

              {!showCommentForm ? (
                <button
                  onClick={() => setShowCommentForm(true)}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-opacity font-medium"
                >
                  Write a Comment
                </button>
              ) : (
                <CommentForm
                  articleId={params.id}
                  onSubmitSuccess={() => {
                    setShowCommentForm(false);
                    setCommentKey(prev => prev + 1); // Force refresh of comment list
                  }}
                  onCancel={() => setShowCommentForm(false)}
                />
              )}

              <div className="mt-8">
                <CommentList key={commentKey} articleId={params.id} />
              </div>
            </div>

            {/* Context-Aware "Next Read" - ONE intelligent recommendation */}
            {(() => {
              const currentArticle = {
                id: params.id,
                title: ARTICLE_TITLE,
                content: ARTICLE_SECTIONS.map(s => s.title).join(' '),
                tags: ['critical-thinking', 'innovation'], // TODO: Get from article metadata
              };
              const relatedArticles = findRelatedArticles(currentArticle, getAllArticles());
              const topRecommendation = relatedArticles[0]?.article;

              if (!topRecommendation) return null;

              const context = generateRecommendationContext(currentArticle, topRecommendation);

              return (
                <NextRead
                  article={topRecommendation}
                  context={context}
                />
              );
            })()}
          </div>

          {/* Sidebar - 1/3 width */}
          <aside className="lg:col-span-1">
            <QuickStats
              articleId={params.id}
              timeInvested={formattedTime}
              estimatedTime={estimatedReadTime}
              hasChallenged={hasSubmittedChallenge}
              challengeCount={challengeCount}
            />
            <NewsletterWidget postType={ARTICLE_POST_TYPE} />
            <TableOfContents sections={ARTICLE_SECTIONS} />

            {/* This Day in History - Historical posts widget */}
            <div className="mb-8">
              <ThisDayInHistory />
            </div>

            {/* TODO: Add more sidebar widgets */}
            {/* TODO: Author bio */}
          </aside>
        </div>
      </article>
    </NotesProvider>
  );
}

// TODO: Add metadata for SEO
// TODO: Extract postType from article frontmatter or database
