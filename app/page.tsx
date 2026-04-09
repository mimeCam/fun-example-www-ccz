/**
 * The Threshold — Homepage as a single-article immersive entry.
 *
 * One featured article, one "Begin Reading" CTA, zero decisions.
 * Returning readers see an unread article instead of the seed.
 *
 * Deep link support: ?via=ARCHETYPE&a=ARTICLE_ID
 */

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getDefaultFeaturedArticle, selectFeaturedArticle, readArticleIdsFromMemory } from '@/lib/content/featured';
import { GemHome } from '@/components/navigation/GemHome';
import { decodeDeepLink } from '@/lib/sharing/deep-link';

const ReturningPortal = dynamic(
  () => import('@/components/home/ReturningPortal'),
  { ssr: false },
);

const ViaWhisper = dynamic(
  () => import('@/components/home/ViaWhisper'),
  { ssr: false },
);

const FeaturedArticle = dynamic(
  () => import('@/components/home/FeaturedArticle'),
  { ssr: false },
);

export default function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const defaultArticle = getDefaultFeaturedArticle();
  const { via } = decodeDeepLink(searchParams);

  return (
    <main className="min-h-screen flex flex-col">
      <GemHome />
      <div className="flex-1 flex flex-col justify-center max-w-3xl
        mx-auto px-4 md:px-6 py-16 md:py-24">

        <ReturningPortal />
        {via && <ViaWhisper via={via} />}

        {/* Server fallback — replaced client-side if returning reader */}
        <FeaturedArticle defaultArticle={defaultArticle} />

      </div>

      <footer className="text-center pb-8 space-y-2">
        <p className="text-mist/40 text-sm">
          No algorithms. No feeds.
        </p>
        <div className="flex justify-center gap-4 text-xs">
          <Link href="/mirror"
            className="text-gold/50 hover:text-gold transition-colors">
            Mirror
          </Link>
          <span className="text-mist/20">&middot;</span>
          <Link href="/explore"
            className="text-mist/50 hover:text-mist transition-colors">
            Explore
          </Link>
        </div>
      </footer>
    </main>
  );
}
