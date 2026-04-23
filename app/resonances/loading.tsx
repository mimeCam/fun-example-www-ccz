/**
 * Loading skeleton for /resonances — "The Book of You" structure.
 *
 * Shows the Book layout: title placeholder, entry placeholders, slot
 * indicator. Uses the shared `<Skeleton>` primitive so the breath
 * cadence matches the rest of the site. Thermal tokens from the
 * blocking script warm the skeleton for returning readers.
 */

import { Skeleton } from '@/components/shared/Skeleton';

export default function ResonancesLoading() {
  return (
    <main className="min-h-screen px-sys-4 md:px-sys-6 py-sys-8">
      <div className="max-w-2xl mx-auto">
        <TitleSkeleton />
        <Entries />
      </div>
    </main>
  );
}

function TitleSkeleton() {
  return (
    <div className="mb-sys-8">
      <Skeleton variant="line" className="h-7 w-48 mb-sys-3" />
      <Skeleton variant="line" className="h-3 w-32" />
    </div>
  );
}

function Entries() {
  return (
    <div className="space-y-sys-5">
      {Array.from({ length: 3 }, (_, i) => <EntrySkeleton key={i} />)}
      <SlotSkeleton />
    </div>
  );
}

function EntrySkeleton() {
  return (
    <Skeleton variant="card" className="p-sys-5">
      <Skeleton variant="line" className="h-3 w-2/3 mb-sys-3" />
      <Skeleton variant="line" className="h-4 w-full mb-sys-2" />
      <Skeleton variant="line" className="h-3 w-1/4" />
    </Skeleton>
  );
}

function SlotSkeleton() {
  return <Skeleton variant="line" className="h-4 w-24 mt-sys-6" />;
}
