/**
 * The Threshold — Homepage as a single-article immersive entry.
 *
 * One featured article, one "Begin Reading" CTA, zero decisions.
 * Returning readers see an unread article instead of the seed.
 *
 * Deep link support: ?via=ARCHETYPE&a=ARTICLE_ID
 */

import dynamic from 'next/dynamic';
import { getDefaultFeaturedArticle } from '@/lib/content/featured';
import { GemHome } from '@/components/navigation/GemHome';
import WhisperFooter from '@/components/shared/WhisperFooter';
import { Skeleton } from '@/components/shared/Skeleton';
import { SuspenseFade } from '@/components/shared/SuspenseFade';
import { decodeDeepLink } from '@/lib/sharing/deep-link';
import { CHASSIS_SEAM_TOP_CLASS } from '@/lib/design/spacing';

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
    <main id="main-content" className="min-h-screen flex flex-col">
      <GemHome />
      {/* T1 chassis seam — Mike #4 napkin / Tanya UIX #4. The top pad is
          the chrome→content bridge: rung 9, mirror-equal across `/`,
          `/articles`, `/article/[id]`. Bottom seam (T3) is collapsed
          into footer-owned spacing — `WhisperFooter` carries the rung
          on its top edge for every reader-facing route ("not both" is
          the rule; footer is universal so it wins T3). The previous
          `py-sys-11 md:py-sys-12` step-up was the per-route theatrics
          we are removing — cross-route consistency > per-route. */}
      <div className={`flex-1 flex flex-col justify-center max-w-3xl
        mx-auto px-sys-4 md:px-sys-6 ${CHASSIS_SEAM_TOP_CLASS}`}>

        {/* Finding A (Tanya §3.2): a `?via=` reader gets the whisper
            INSTEAD of the returning-letter — never both.  Rendering the
            ReturningPortal SuspenseFade in the via-case would reserve
            an h-40 vertical slot of paint-time silence even though the
            client component will return null on hydrate.  Skip it. */}
        {!via && (
          <SuspenseFade fallback={<Skeleton variant="block" className="h-40 max-w-3xl mb-sys-6" />}>
            <ReturningPortal />
          </SuspenseFade>
        )}

        {via && (
          <SuspenseFade fallback={<Skeleton variant="block" className="h-8 max-w-xl mb-sys-4" />}>
            <ViaWhisper via={via} />
          </SuspenseFade>
        )}

        {/* Server fallback — replaced client-side if returning reader */}
        <SuspenseFade fallback={<Skeleton variant="block" className="h-64 max-w-3xl" />}>
          <FeaturedArticle defaultArticle={defaultArticle} />
        </SuspenseFade>

      </div>

      <WhisperFooter />
    </main>
  );
}
