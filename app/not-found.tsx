/**
 * The Lost Door — Custom 404 page.
 *
 * When a reader wanders off the path, they find a gentle threshold
 * back into the experience. Same atmospheric palette, same voice.
 * No harsh "ERROR 404" — just a quiet redirect.
 */

import Link from 'next/link';
import { GemHome } from '@/components/navigation/GemHome';
import { GemIcon } from '@/components/shared/GemIcon';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <GemHome />

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <GemIcon size="lg" className="text-mist/20 mb-8" />
        <Title />
        <Subtitle />
        <div className="mt-8 flex flex-col items-center gap-4">
          <ThresholdLink />
          <ArticlesLink />
        </div>
      </div>
    </main>
  );
}

/* ─── Sub-components (each ≤ 10 lines) ──────────────────── */

function Title() {
  return (
    <h1 className="font-display text-2xl font-bold text-foreground text-center">
      This page hasn&apos;t formed yet.
    </h1>
  );
}

function Subtitle() {
  return (
    <p className="text-mist/60 text-base text-center mt-3 max-w-sm leading-relaxed">
      The Threshold doesn&apos;t have a page here.
      But the right page is waiting for you.
    </p>
  );
}

function ThresholdLink() {
  return (
    <Link href="/"
      className="px-6 py-3 rounded-lg border border-gold/40 text-gold text-sm
        hover:bg-gold/10 transition-colors duration-hover">
      Return to the Threshold →
    </Link>
  );
}

function ArticlesLink() {
  return (
    <Link href="/articles"
      className="text-mist/50 text-sm hover:text-mist transition-colors">
      Or browse articles →
    </Link>
  );
}
