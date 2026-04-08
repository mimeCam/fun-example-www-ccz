/**
 * The Threshold — Homepage as a single-article immersive entry.
 *
 * Replaces the old worldview card grid with a cinematic doorway:
 * one featured article, one "Begin Reading" CTA, zero decisions.
 *
 * The path to the magic moment is now:
 *   Homepage → Click one button → Read to 70% → Archetype Reveal
 *
 * Deep link support: ?via=ARCHETYPE&a=ARTICLE_ID
 * When a friend clicks a shared link, ViaWhisper shows
 * "A Deep Diver sent you here" before the article doorway.
 */

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getDefaultFeaturedArticle } from '@/lib/content/featured';
import PortalHero from '@/components/home/PortalHero';
import ReadingInvitation from '@/components/home/ReadingInvitation';
import { decodeDeepLink } from '@/lib/sharing/deep-link';

// Client-only components (read localStorage / URL state)
const ReturningPortal = dynamic(
  () => import('@/components/home/ReturningPortal'),
  { ssr: false },
);

const ViaWhisper = dynamic(
  () => import('@/components/home/ViaWhisper'),
  { ssr: false },
);

export default function Home({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const article = getDefaultFeaturedArticle();
  const { via } = decodeDeepLink(searchParams);

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-3xl
        mx-auto px-4 md:px-6 py-16 md:py-24">

        {/* Return recognition — invisible for strangers */}
        <ReturningPortal />

        {/* Friend whisper — "A Deep Diver sent you here" */}
        {via && <ViaWhisper via={via} />}

        {/* The article doorway */}
        <PortalHero article={article} />

        {/* Single call-to-action */}
        <ReadingInvitation articleId={article.id} />

      </div>

      {/* Footer whisper — consistent across pages */}
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
