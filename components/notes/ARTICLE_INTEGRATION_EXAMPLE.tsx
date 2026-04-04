/**
 * EXAMPLE: How to integrate Margin Notes into Article Page
 *
 * This file demonstrates how to add margin notes functionality
 * to your article pages.
 *
 * STEP 1: Import the MarginNotes component
 * STEP 2: Wrap your article content with MarginNotes
 * STEP 3: Pass the article ID as postId prop
 */

'use client';

// Original imports from your article page
import { useState } from 'react';
import { ContinueReadingBanner } from '@/components/ContinueReadingBanner';
import { NewsletterWidget } from '@/components/newsletter/NewsletterWidget';
import { useReadingPosition } from '@/lib/hooks/useReadingPosition';

// NEW: Import Margin Notes
import { MarginNotes } from '@/components/notes/MarginNotes';

export default function ArticlePageWithNotes({ params }: { params: { id: string } }) {
  const [showContinueBanner, setShowContinueBanner] = useState(false);
  const { progress, hasStoredPosition, clearPosition } = useReadingPosition(params.id);

  // Show banner if there's a stored position
  // ... (your existing banner logic)

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
          />
        </div>
      )}

      {/* NEW: Wrap article content with MarginNotes */}
      <MarginNotes postId={params.id}>
        <article className="min-h-screen p-8">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content area */}
            <div className="lg:col-span-2">
              <header className="mb-8">
                <h1 className="text-4xl font-bold mb-4 text-primary">
                  The Art of Challenging Ideas
                </h1>
                <p className="text-gray-400">By Author Name • April 4, 2026</p>
              </header>

              {/* Article content */}
              <div className="prose prose-invert max-w-none mb-12">
                <p className="text-lg leading-relaxed mb-6">
                  This is a sample article that demonstrates the Margin Notes feature.
                  Try selecting any text to create a highlight and add your private notes.
                </p>

                <p className="text-lg leading-relaxed mb-6">
                  When we encounter ideas that resonate with us, we should also be
                  willing to question them. This is how we strengthen our understanding
                  and avoid falling into echo chambers.
                </p>

                {/* More article content... */}
              </div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <NewsletterWidget postType="technical" />
            </aside>
          </div>
        </article>
      </MarginNotes>
      {/* END MarginNotes wrapper */}
    </>
  );
}

/**
 * THAT'S IT!
 *
 * Now your readers can:
 * 1. Select text to create highlights
 * 2. Add private margin notes
 * 3. View all notes in the side panel
 * 4. Export notes as Markdown
 *
 * All notes are stored locally in the browser - completely private.
 *
 * For a complete implementation, also update your layout.tsx
 * to add the "Library" link to navigation:
 *
 *   <Link href="/library">Library</Link>
 */

// TODO: Create /library page to display all notes from all articles
// TODO: Add notes search functionality
// TODO: Add notes filter by article
