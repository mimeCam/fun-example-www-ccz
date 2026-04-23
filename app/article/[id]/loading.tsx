/**
 * Loading skeleton for /article/[id] — thermal-aware article structure.
 *
 * Matches the article page layout: centered prose column with
 * title, rule, and paragraph placeholders.
 * Thermal tokens from the blocking script ensure warm tones for returning readers.
 */

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
      <div className="h-8 w-3/4 mx-auto rounded-sys-soft bg-surface/30 animate-pulse mb-sys-3" />
      <div className="h-4 w-20 mx-auto rounded-sys-soft bg-surface/20 animate-pulse" />
    </header>
  );
}

function Paragraphs() {
  return (
    <div className="space-y-sys-5">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-sys-2 animate-pulse">
          <Line width="full" />
          <Line width="5/6" />
          <Line width="4/5" />
        </div>
      ))}
    </div>
  );
}

function Line({ width }: { width: string }) {
  const w = width === 'full' ? 'w-full' : `w-${width}`;
  return <div className={`h-3 ${w} rounded-sys-soft bg-surface/30`} />;
}
