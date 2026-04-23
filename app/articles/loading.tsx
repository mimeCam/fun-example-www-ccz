/**
 * Loading skeleton for /articles — thermal-aware card placeholders.
 *
 * Uses CSS custom properties set by the inline blocking script,
 * so returning readers see warm-toned skeletons from the first frame.
 */

import { GemHome } from '@/components/navigation/GemHome';

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
  return (
    <div className="h-sys-7 w-32 rounded-sys-medium bg-surface/30 animate-pulse mb-sys-8" />
  );
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
    <div className="rounded-sys-medium thermal-radius bg-surface/30 p-sys-6 animate-pulse">
      <div className="h-4 w-3/4 rounded-sys-soft bg-surface/50 mb-sys-3" />
      <div className="h-3 w-full rounded-sys-soft bg-surface/40 mb-sys-2" />
      <div className="h-3 w-5/6 rounded-sys-soft bg-surface/40 mb-sys-4" />
      <div className="h-3 w-1/3 rounded-sys-soft bg-surface/30" />
    </div>
  );
}
