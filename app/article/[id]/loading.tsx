/**
 * Loading skeleton for /article/[id] — thermal-aware article structure.
 *
 * Matches the article page layout: centered prose column with title, rule,
 * and paragraph placeholders. Uses the shared `<Skeleton>` primitive so
 * the breath cadence stays in sync with the rest of the site. Thermal
 * tokens from the blocking script ensure warm tones for returning readers.
 */

import { Skeleton } from '@/components/shared/Skeleton';

export default function ArticleLoading() {
  return (
    <div className="min-h-screen">
      <div className="max-w-prose mx-auto px-sys-7 py-sys-10">
        <HeaderSkeleton />
        <hr className="border-gold/10 mb-sys-8" />
        <Paragraphs />
      </div>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <header className="mb-sys-8 text-center">
      <Skeleton variant="line" className="h-8 w-3/4 mx-auto mb-sys-3" />
      <Skeleton variant="line" className="h-4 w-20 mx-auto" />
    </header>
  );
}

function Paragraphs() {
  return (
    <div className="space-y-sys-5">
      {Array.from({ length: 4 }, (_, i) => <ParagraphSkeleton key={i} />)}
    </div>
  );
}

function ParagraphSkeleton() {
  return (
    <div className="space-y-sys-2">
      <Skeleton variant="line" className="h-3 w-full" />
      <Skeleton variant="line" className="h-3 w-5/6" />
      <Skeleton variant="line" className="h-3 w-4/5" />
    </div>
  );
}
