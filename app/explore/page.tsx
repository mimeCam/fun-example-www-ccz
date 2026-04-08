import dynamic from 'next/dynamic';
import { getAllArticles } from '@/lib/content/articleData';
import { getAllTrails } from '@/lib/content/trail-data';
import { getAllQuestions, getRandomQuestions } from '@/lib/content/questionUtils';
import WhisperFooter from '@/components/shared/WhisperFooter';

const ExploreClient = dynamic(
  () => import('@/components/explore/ExploreClient'),
  { ssr: false }
);

export default function ExplorePage() {
  const articles = getAllArticles();
  const trails = getAllTrails();
  const allQuestions = getAllQuestions(articles);
  const questions = getRandomQuestions(allQuestions, 5);

  return (
    <main className="min-h-screen bg-gradient-to-r from-background via-background to-surface/10">
      <div className="max-w-6xl mx-auto px-6 pt-8">
        <a
          href="/"
          className="text-mist hover:text-foreground transition-colors text-sm inline-flex items-center gap-1"
        >
          ← Back
        </a>
      </div>

      <ExploreClient
        articles={articles}
        trails={trails}
        questions={questions}
      />

      <WhisperFooter />
    </main>
  );
}
