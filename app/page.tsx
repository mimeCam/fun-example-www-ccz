/**
 * The Threshold — Homepage as a single-article immersive entry.
 *
 * One featured article, one "Begin Reading" CTA, zero decisions.
 * Returning readers see an unread article instead of the seed.
 *
 * Deep link support: ?via=ARCHETYPE&a=ARTICLE_ID
 */

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { getDefaultFeaturedArticle } from '@/lib/content/featured';
import { GemHome } from '@/components/navigation/GemHome';
import WhisperFooter from '@/components/shared/WhisperFooter';
import { Skeleton } from '@/components/shared/Skeleton';
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
        mx-auto px-sys-4 md:px-sys-6 py-sys-11 md:py-sys-12">

        <Suspense fallback={<Skeleton variant="block" className="h-40 max-w-3xl mb-sys-6" />}>
          <ReturningPortal suppress={!!via} />
        </Suspense>

        {via && (
          <Suspense fallback={<Skeleton variant="block" className="h-8 max-w-xl mb-sys-4" />}>
            <ViaWhisper via={via} />
          </Suspense>
        )}

        {/* Server fallback — replaced client-side if returning reader */}
        <Suspense fallback={<Skeleton variant="block" className="h-64 max-w-3xl" />}>
          <FeaturedArticle defaultArticle={defaultArticle} />
        </Suspense>

      </div>

      <WhisperFooter />
    </main>
  );
}
