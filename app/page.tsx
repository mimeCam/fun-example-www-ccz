/**
 * The Threshold — Homepage as a single-article immersive entry.
 *
 * Replaces the old worldview card grid with a cinematic doorway:
 * one featured article, one "Begin Reading" CTA, zero decisions.
 *
 * The path to the magic moment is now:
 *   Homepage → Click one button → Read to 70% → Archetype Reveal
 *
 * ReturnLetter renders client-side via dynamic import (reads localStorage).
 * PortalHero + ReadingInvitation are server components (static article data).
 */

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { getDefaultFeaturedArticle } from '@/lib/content/featured';
import PortalHero from '@/components/home/PortalHero';
import ReadingInvitation from '@/components/home/ReadingInvitation';

// Client-only: reads localStorage for return recognition
const ReturningPortal = dynamic(
  () => import('@/components/home/ReturningPortal'),
  { ssr: false }
);

export default function Home() {
  const article = getDefaultFeaturedArticle();

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-3xl
        mx-auto px-4 md:px-6 py-16 md:py-24">

        {/* Return recognition — invisible for strangers */}
        <ReturningPortal />

        {/* The article doorway */}
        <PortalHero article={article} />

        {/* Single call-to-action */}
        <ReadingInvitation articleId={article.id} />

      </div>

      {/* Footer whisper — three words, muted, consistent */}
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
          <Link href="/categories"
            className="text-mist/50 hover:text-mist transition-colors">
            Explore
          </Link>
          <span className="text-mist/20">&middot;</span>
          <Link href="/resonances"
            className="text-rose/50 hover:text-rose transition-colors">
            Resonances
          </Link>
        </div>
      </footer>
    </main>
  );
}
