import dynamic from 'next/dynamic';
import { getAllArticles } from '@/lib/content/articleData';
import { getAllTrails } from '@/lib/content/trail-data';
import { GemHome } from '@/components/navigation/GemHome';
import WhisperFooter from '@/components/shared/WhisperFooter';

const ExploreClient = dynamic(
  () => import('@/components/explore/ExploreClient'),
  { ssr: false }
);

export default function ExplorePage() {
  const articles = getAllArticles();
  const trails = getAllTrails();

  return (
    <main className="min-h-screen bg-gradient-to-r from-background via-background to-surface/10">
      <GemHome />
      <ExploreClient
        articles={articles}
        trails={trails}
      />
      <WhisperFooter />
    </main>
  );
}
