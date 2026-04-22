/**
 * Thermal error boundary — the room doesn't break, it just shifts.
 *
 * Next.js error.tsx convention. Client component.
 * Inherits thermal tokens from :root (set by the blocking script),
 * so the error page feels like the same warm room, not a cold ejection.
 *
 * Same voice as the 404 page. Same atmospheric palette.
 */

'use client';

import { GemHome } from '@/components/navigation/GemHome';
import { GemIcon } from '@/components/shared/GemIcon';
import { Pressable } from '@/components/shared/Pressable';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen flex flex-col bg-background">
      <GemHome />
      <div className="flex-1 flex flex-col items-center justify-center px-sys-6">
        <GemIcon size="lg" className="text-mist/20 mb-sys-8" />
        <h1 className="font-display text-sys-h2 font-sys-display text-foreground text-center">
          Something came undone.
        </h1>
        <p className="text-mist/60 text-sys-body text-center mt-sys-3 max-w-sm leading-relaxed">
          The room is still here. Try going back.
        </p>
        <div className="mt-sys-8 flex flex-col items-center gap-sys-4">
          <Pressable variant="ghost" size="md" onClick={reset}>
            Try again →
          </Pressable>
          <a href="/"
            className="text-mist/50 text-sys-caption hover:text-mist transition-colors">
            Return to the Threshold
          </a>
        </div>
      </div>
    </main>
  );
}
