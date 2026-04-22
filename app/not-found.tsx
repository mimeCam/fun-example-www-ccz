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
import { Pressable } from '@/components/shared/Pressable';
import { TextLink } from '@/components/shared/TextLink';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <GemHome />

      <div className="flex-1 flex flex-col items-center justify-center px-sys-6">
        <GemIcon size="lg" className="text-mist/20 mb-sys-8" />
        <Title />
        <Subtitle />
        <div className="mt-sys-8 flex flex-col items-center gap-sys-4">
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
    <h1 className="font-display text-sys-h2 font-sys-display text-foreground text-center">
      This page hasn&apos;t formed yet.
    </h1>
  );
}

function Subtitle() {
  return (
    <p className="text-mist/60 text-sys-body text-center mt-sys-3 max-w-sm typo-body">
      The Threshold doesn&apos;t have a page here.
      But the right page is waiting for you.
    </p>
  );
}

function ThresholdLink() {
  return (
    <Pressable asChild variant="ghost" size="md">
      <Link href="/">Return to the Threshold →</Link>
    </Pressable>
  );
}

function ArticlesLink() {
  return (
    <TextLink variant="inline" href="/articles" className="text-sys-caption">
      Or browse articles →
    </TextLink>
  );
}
