/**
 * Loading skeleton for /resonances — "The Book of You" structure.
 *
 * Shows the Book layout: title placeholder, entry placeholders, slot indicator.
 * Thermal tokens from the blocking script warm the skeleton for returning readers.
 */

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
      <div className="h-7 w-48 rounded bg-surface/30 animate-pulse mb-sys-3" />
      <div className="h-3 w-32 rounded bg-surface/20 animate-pulse" />
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
    <div className="rounded-sys-medium thermal-radius bg-surface/20 p-sys-5 animate-pulse">
      <div className="h-3 w-2/3 rounded bg-surface/40 mb-sys-3" />
      <div className="h-4 w-full rounded bg-surface/30 mb-sys-2" />
      <div className="h-3 w-1/4 rounded bg-surface/20" />
    </div>
  );
}

function SlotSkeleton() {
  return (
    <div className="h-4 w-24 rounded bg-surface/20 animate-pulse mt-sys-6" />
  );
}
