/**
 * Loading skeleton for /articles — thermal-aware card placeholders.
 *
 * Uses the shared `<Skeleton>` primitive so the breath cadence stays
 * in sync with every other loading surface on the site. The `bg-surface`
 * class reads from CSS custom properties set by the inline blocking
 * script at `app/layout.tsx`, so returning readers see warm-toned
 * skeletons from the first frame.
 */

import { GemHome } from '@/components/navigation/GemHome';
import { Skeleton } from '@/components/shared/Skeleton';

export default function ArticlesLoading() {
  return (
    <main className="min-h-screen bg-background">
      <GemHome />
      <div className="max-w-2xl mx-auto px-sys-6 py-sys-10">
        <TitleBar />
        <Grid />
      </div>
    </main>
  );
}

function TitleBar() {
  return <Skeleton variant="block" className="h-sys-7 w-32 mb-sys-8" />;
}

function Grid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-sys-6">
      {Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

function CardSkeleton() {
  return (
    <Skeleton variant="card" className="p-sys-6">
      <Skeleton variant="line" className="h-4 w-3/4 mb-sys-3" />
      <Skeleton variant="line" className="h-3 w-full mb-sys-2" />
      <Skeleton variant="line" className="h-3 w-5/6 mb-sys-4" />
      <Skeleton variant="line" className="h-3 w-1/3" />
    </Skeleton>
  );
}
