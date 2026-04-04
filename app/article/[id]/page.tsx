'use client';

import { useState, useEffect } from 'react';
import { ChallengeModal } from '@/components/ChallengeModal';
import { ChallengeList } from '@/components/ChallengeList';
import { ContinueReadingBanner } from '@/components/ContinueReadingBanner';
import { NewsletterWidget } from '@/components/newsletter/NewsletterWidget';
import { ShareButton } from '@/components/sharing/ShareButton';
import { TableOfContents } from '@/components/TableOfContents';
import { TrustedFilterSection } from '@/components/trusted-filter/TrustedFilterSection';
import { DepthBar } from '@/components/reading/DepthBar';
import { MilestoneToast } from '@/components/reading/MilestoneToast';
import { useReadingPosition } from '@/lib/hooks/useReadingPosition';
import { useShareButton } from '@/lib/hooks/useShareButton';
import { useSharedHighlight } from '@/lib/hooks/useSharedHighlight';
import { useChallengeStatus } from '@/lib/hooks/useChallengeStatus';
import { useTimeInvestment } from '@/lib/hooks/useTimeInvestment';
import { useMilestones } from '@/lib/hooks/useMilestones';
import { useExitIntent } from '@/lib/hooks/useExitIntent';
import { ExitFeedbackModal } from '@/components/feedback/ExitFeedbackModal';
// TODO: Import useCompletionDetection when implementing celebration UI
// import { useCompletionDetection } from '@/lib/hooks/useCompletionDetection';
import { TrustedFilterData } from '@/types/trusted-filter';
import { findRelatedArticles } from '@/lib/content/ContentTagger';
import { getAllArticles } from '@/lib/content/articleData';
import { NextRead, generateRecommendationContext } from '@/components/reading/NextRead';
import { RelatedPosts } from '@/components/content/RelatedPosts';
import { RelatedPostWithSource } from '@/lib/content/related-posts';
import { ExportNotesButton } from '@/components/notes/ExportNotesButton';
import { NotesProvider } from '@/components/notes/NotesProvider';
import { QuickStats } from '@/components/content/QuickStats';
import { ReadingCount } from '@/components/reading/ReadingCount';
import { BookmarkButton } from '@/components/reading/BookmarkButton';
import { JumpToPositionButton } from '@/components/reading/JumpToPositionButton';
import { CommentForm } from '@/components/CommentForm';
import { CommentList } from '@/components/CommentList';
import { ThisDayInHistory } from '@/components/ThisDayInHistory';
import { ArticleMeta } from '@/components/ArticleMeta';
import { getReadingTimeDisplay } from '@/lib/utils/reading-time';
import { CategoryBadges } from '@/components/content/CategoryBadges';
import { MoreInCategory } from '@/components/content/MoreInCategory';
import { Category } from '@/types/category';
import { JourneyContextBar } from '@/components/journey/JourneyContextBadge';
import { calculateJourneyContext } from '@/lib/content/JourneyContext';
import type { JourneyContext } from '@/types/journey-context';
import { AudioButton } from '@/components/audio/AudioButton';

// TODO: Fetch article data from database or CMS
// For now, using a static postType. In production, this would come from article frontmatter
const ARTICLE_POST_TYPE: 'technical' | 'design' | 'personal' | 'business' | 'general' = 'technical';

// TODO: Get article metadata from database
const ARTICLE_TITLE = 'The Art of Challenging Ideas';
const AUTHOR_NAME = 'Author Name';

// TODO: Get custom reading time from article metadata
// Example of custom reading time: "8 min to transform your workflow ⚡"
const ARTICLE_CUSTOM_READING_TIME: string | undefined = undefined;

/**
 * Get article content as text for reading time calculation
 * In production, this would come from the article body
 */
function getArticleContent(): string {
  return `
    The ability to challenge ideas is fundamental to intellectual growth.
    When we encounter ideas that resonate with us, we should also be willing to question them.
    This is how we strengthen our understanding and avoid falling into echo chambers.
    Challenging ideas effectively requires more than just disagreement.
    It involves understanding the context, asking thoughtful questions,
    and providing evidence or alternative perspectives.
    In our increasingly distracted world, the ability to perform deep work
    is becoming both rare and valuable. Deep work is the ability to focus without
    distraction on a cognitively demanding task. It's a skill that allows you to
    quickly master complicated information and produce better results in less time.
    To cultivate deep work, you must eliminate distractions and create routines
    that support sustained attention.
    Systems thinking is a holistic approach to analysis that focuses on
    the way that a system's constituent parts interrelate and how systems work
    over time and within the context of larger systems. Rather than breaking
    problems down into smaller parts, systems thinking looks at problems as
    interconnected wholes. This approach helps us understand complex issues
    and find leverage points for meaningful change.
    Technical excellence alone is not enough for leadership success.
    Effective communication is the bridge between technical expertise and
    organizational impact. Great technical leaders communicate complex ideas
    clearly, listen actively to diverse perspectives, and adapt their message
    to their audience. They understand that communication is not just about
    transmitting information, but about building understanding and trust.
    The most successful people are lifelong learners. They cultivate
    curiosity and embrace continuous growth. Effective learning strategies include
    deliberate practice, spaced repetition, interleaving topics, and teaching
    others what you've learned. The key is to move beyond passive consumption
    to active engagement with new knowledge. Learning is not a destination but
    a journey of constant discovery and refinement.
    Great developer tools share common design principles: they respect
    the user's intelligence, provide clear feedback, and minimize cognitive load.
    Good design disappears, allowing developers to focus on their work rather
    than the tool itself. The best tools are opinionated about their domain but
    flexible in their application. They understand that developers are not just
    users but collaborators in the tool's evolution.
  `;
}

// Calculate reading time at build time (ideal) or runtime (fallback)
const articleContent = getArticleContent();
const readingTimeData = getReadingTimeDisplay(articleContent, ARTICLE_CUSTOM_READING_TIME);
const ARTICLE_READING_TIME = readingTimeData.display;
const ARTICLE_IS_CUSTOM_READING_TIME = readingTimeData.isCustom;
const ARTICLE_READING_MINUTES = readingTimeData.minutes;

// Calculate journey context from article content
const ARTICLE_JOURNEY_CONTEXT: JourneyContext = calculateJourneyContext(articleContent);

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
    timeCommitment: ARTICLE_READING_TIME,
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
  const [relatedPosts, setRelatedPosts] = useState<RelatedPostWithSource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Track reading position
  const { progress, hasStoredPosition, clearPosition } = useReadingPosition(params.id);

  // Track challenge status
  const { hasSubmittedChallenge, challengeCount, markChallengeSubmitted } = useChallengeStatus({ articleId: params.id });

  // Track time investment
  const { formattedTime, estimatedReadTime, isFirstVisit, isOverEstimate } = useTimeInvestment({
    articleId: params.id,
    estimatedReadTime: ARTICLE_READING_MINUTES, // Use calculated reading time
  });

  // Track reading milestones (50%, 100%)
  const { milestoneState, dismissMilestone } = useMilestones({
    articleId: params.id,
  });

  // Exit-intent feedback system
  const {
    shouldShowFeedback,
    dismissFeedback,
    metrics: feedbackMetrics,
  } = useExitIntent({
    storageKey: `exit-intent-${params.id}`,
    minTimeOnPage: 10000, // 10 seconds
    minScrollDepth: 10, // 10%
  });

  // Simplified share button functionality
  const articleUrl = typeof window !== 'undefined' ? window.location.href : '';
  const {
    isShareButtonVisible,
    shareButtonPosition,
    selectedTextForShare,
    closeShareButton,
  } = useShareButton({
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

  // Fetch related posts (includes editor picks)
  useEffect(() => {
    async function loadRelatedPosts() {
      try {
        const response = await fetch(`/api/related-posts?articleId=${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setRelatedPosts(data);
        }
      } catch (error) {
        console.error('Error loading related posts:', error);
      }
    }
    loadRelatedPosts();
  }, [params.id]);

  // Fetch article categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch(`/api/articles/${params.id}/categories`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    }
    loadCategories();
  }, [params.id]);

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

      {/* Simplified share button - floating icon */}
      <ShareButton
        isVisible={isShareButtonVisible}
        position={shareButtonPosition}
        selectedText={selectedTextForShare}
        articleTitle={ARTICLE_TITLE}
        articleUrl={articleUrl}
        authorName={AUTHOR_NAME}
        onClose={closeShareButton}
      />

      {/* Depth Bar - Minimal, opinionated reading progress indicator */}
      <DepthBar articleId={params.id} />

      {/* Milestone Toast - Reading milestone notifications */}
      <MilestoneToast
        milestone={milestoneState.currentMilestone}
        message={milestoneState.message}
        description={milestoneState.description}
        isVisible={milestoneState.isVisible}
        onDismiss={dismissMilestone}
      />

      {/* Jump to Position Button - Quick navigation to saved position */}
      {hasStoredPosition && (
        <JumpToPositionButton
          articleId={params.id}
          storedProgress={progress}
          isVisible={hasStoredPosition}
          onJump={() => {
            // Optional: Hide the continue reading banner after jumping
            setShowContinueBanner(false);
          }}
        />
      )}

      <article className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area - 2/3 width */}
          <div className="lg:col-span-2">
            <header className="mb-8">
              {/* Journey Context Bar - Ambient metadata above title */}
              <JourneyContextBar context={ARTICLE_JOURNEY_CONTEXT} />

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
                  {/* Audio Button - Listen to article */}
                  <AudioButton
                    articleId={params.id}
                    articleTitle={ARTICLE_TITLE}
                    articleContent={articleContent}
                  />

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
                {/* Article Metadata with Reading Time */}
                <ArticleMeta
                  author={AUTHOR_NAME}
                  publishedAt="2026-04-04"
                  readingTime={ARTICLE_READING_TIME}
                  isCustomReadingTime={ARTICLE_IS_CUSTOM_READING_TIME}
                  challengeCount={challengeCount}
                />

                {/* Time Investment Display */}
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className={isOverEstimate ? 'text-primary font-medium' : ''}>
                    {formattedTime} spent · Est. {ARTICLE_READING_MINUTES} min read
                  </span>
                </div>
                <ReadingCount articleId={params.id} />
              </div>

              {/* Category Badges */}
              {categories.length > 0 && (
                <div className="mt-4">
                  <CategoryBadges categories={categories} size="md" />
                </div>
              )}

              {isFirstVisit && (
                <p className="text-sm text-gray-500 mt-2">
                  Welcome! This article takes about {ARTICLE_READING_MINUTES} minutes.
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

            {/* More in Category - Category-based discovery */}
            {categories.length > 0 && categories.map((category) => (
              <div key={category.id} className="mt-12">
                <MoreInCategory
                  currentArticleId={params.id}
                  category={category}
                  maxArticles={3}
                />
              </div>
            ))}

            {/* Context-Aware "Next Read" - ONE intelligent recommendation */}
            {relatedPosts.length > 0 && (() => {
              const currentArticle = {
                id: params.id,
                title: ARTICLE_TITLE,
                content: ARTICLE_SECTIONS.map(s => s.title).join(' '),
                tags: ['critical-thinking', 'innovation'], // TODO: Get from article metadata
              };

              const topRecommendation = relatedPosts[0];

              if (!topRecommendation) return null;

              const context = topRecommendation.reason ||
                generateRecommendationContext(currentArticle, topRecommendation.article);

              return (
                <NextRead
                  article={topRecommendation.article}
                  context={context}
                />
              );
            })()}

            {/* Related Posts - More recommendations (includes editor picks) */}
            {relatedPosts.length > 0 && (
              <RelatedPosts
                relatedPosts={relatedPosts}
                currentArticleId={params.id}
              />
            )}
          </div>

          {/* Sidebar - 1/3 width */}
          <aside className="lg:col-span-1">
            <QuickStats
              articleId={params.id}
              timeInvested={formattedTime}
              estimatedTime={ARTICLE_READING_MINUTES}
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

      {/* Exit-Intent Feedback Modal */}
      <ExitFeedbackModal
        postId={params.id}
        timeOnPage={feedbackMetrics.timeOnPage}
        scrollDepth={feedbackMetrics.scrollDepth}
        isOpen={shouldShowFeedback}
        onClose={dismissFeedback}
      />
    </NotesProvider>
  );
}

// TODO: Add metadata for SEO
// TODO: Extract postType from article frontmatter or database
