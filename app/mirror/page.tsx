'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMirror } from '@/lib/hooks/useMirror';
import MirrorRevealCard from '@/components/mirror/MirrorRevealCard';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';

/**
 * Mirror Page — Your reflection (no email gate, client-side only)
 *
 * If the reader has Mirror data in localStorage, show the cinematic reveal.
 * If they have a quick-mirror result, show that.
 * If nothing, show a gentle empty state with a nudge to go read.
 */

const QUICK_MIRROR_KEY = 'quick-mirror-result';

function loadQuickMirror(): QuickMirrorResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(QUICK_MIRROR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function MirrorPage() {
  const { mirror, loading, error } = useMirror();
  const [quickMirror, setQuickMirror] = useState<QuickMirrorResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setQuickMirror(loadQuickMirror());
    setMounted(true);
  }, []);

  // Wait for mount to avoid hydration mismatch
  if (!mounted) return null;

  // Full server-side mirror available (email-based)
  if (mirror) return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto pt-8">
        <MirrorRevealCard mirror={mirror} />
        <div className="text-center mt-8 space-y-3">
          <p className="text-mist text-xs">
            Your archetype is shaped by how deeply you read,
            how often you return, and what ideas stay with you.
          </p>
          <Link href="/" className="text-primary hover:text-accent transition-colors text-sm">
            &larr; Back to Articles
          </Link>
        </div>
      </div>
    </div>
  );

  // Loading state (email exists, fetching)
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="mirror-pulse w-80 h-96 rounded-3xl bg-gradient-to-b from-primary/20 to-secondary/10 border border-primary/20" />
    </div>
  );

  // Client-side quick mirror available (no email needed)
  if (quickMirror) return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto pt-20 text-center">
        {/* Archetype card */}
        <div className="bg-surface border border-fog/40 rounded-3xl p-8 shadow-float max-w-md mx-auto">
          <p className="text-xs uppercase tracking-widest text-mist mb-3">
            Based on how you read…
          </p>
          <h1 className="text-3xl font-display font-bold text-gold">
            {quickMirror.archetypeLabel}
          </h1>
          <p className="mt-4 text-sm text-[#f0f0f5]/80 italic leading-relaxed max-w-[320px] mx-auto">
            &ldquo;{quickMirror.whisper}&rdquo;
          </p>
          <div className="my-6 h-px max-w-[200px] mx-auto bg-gold/40" />
          <p className="text-mist text-xs">
            Read more articles to deepen your reflection.
          </p>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-primary hover:text-accent transition-colors text-sm">
            &larr; Back to Articles
          </Link>
        </div>
      </div>
    </div>
  );

  // Empty state — no mirror data at all
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto pt-20 text-center">
        {/* Large gem outline */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64" height="64"
          viewBox="0 0 24 24"
          fill="none" stroke="currentColor"
          strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
          className="mx-auto text-mist/30 mb-8"
        >
          <path d="M6 3h12l4 6-10 13L2 9z" />
          <path d="M12 3l4 6-4 13-4-13z" />
        </svg>

        <h1 className="text-2xl font-display font-bold text-[#f0f0f5] mb-3">
          Your reflection hasn&apos;t formed yet.
        </h1>
        <p className="text-mist text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          Read an article to the end and the Mirror will find you.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-colors"
        >
          Browse Articles →
        </Link>
      </div>
    </div>
  );
}
