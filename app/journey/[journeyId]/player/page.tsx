/**
 * Journey Player Page — Coming Soon.
 *
 * The journey system is under development. This page will provide
 * an audio + read experience once connected to real article data.
 */
import Link from 'next/link';

export default function JourneyPlayerPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-display font-bold text-[#f0f0f5] mb-4">
          Coming Soon
        </h1>
        <p className="text-mist text-sm mb-8 leading-relaxed">
          The journey player is being crafted. Until then, explore the articles
          and let the Mirror find you.
        </p>
        <Link href="/explore"
          className="inline-block px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-colors">
          Explore Articles →
        </Link>
      </div>
    </div>
  );
}
