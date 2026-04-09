'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMirror } from '@/lib/hooks/useMirror';
import MirrorRevealCard from '@/components/mirror/MirrorRevealCard';
import ShareOverlay from '@/components/mirror/ShareOverlay';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';

/**
 * Mirror Page — Your reflection (no email gate, client-side only)
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
  const { mirror, loading } = useMirror();
  const [quickMirror, setQuickMirror] = useState<QuickMirrorResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setQuickMirror(loadQuickMirror());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (mirror) return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto pt-8">
        <MirrorRevealCard mirror={mirror} />
        <MirrorFooter />
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="mirror-pulse w-80 h-96 rounded-3xl bg-gradient-to-b from-primary/20 to-secondary/10 border border-primary/20" />
    </div>
  );

  if (quickMirror) return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto pt-20 text-center">
        <QuickMirrorCardInline result={quickMirror} />
        <MirrorFooter />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-md mx-auto pt-20 text-center">
        <GemOutline />
        <h1 className="text-2xl font-display font-bold text-[#f0f0f5] mb-3">
          Your reflection hasn&apos;t formed yet.
        </h1>
        <p className="text-mist text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          Read an article to the end and the Mirror will find you.
        </p>
        <Link href="/"
          className="inline-block px-6 py-3 bg-primary hover:bg-secondary text-white font-semibold rounded-xl transition-colors">
          Browse Articles →
        </Link>
      </div>
    </div>
  );
}

function QuickMirrorCardInline({ result }: { result: QuickMirrorResult }) {
  return (
    <div className="bg-surface border border-fog/40 rounded-2xl p-8 shadow-gold max-w-md mx-auto">
      <p className="text-xs uppercase tracking-widest text-mist mb-3">
        Based on how you read…
      </p>
      <h1 className="text-3xl font-display font-bold text-gold">
        {result.archetypeLabel}
      </h1>
      <p className="mt-4 text-sm text-[#f0f0f5]/80 italic leading-relaxed max-w-[320px] mx-auto">
        &ldquo;{result.whisper}&rdquo;
      </p>
      <div className="my-6 h-px max-w-[200px] mx-auto bg-gold/40" />
      <ShareOverlay result={result} />
    </div>
  );
}

function MirrorFooter() {
  return (
    <div className="text-center mt-8 space-y-3">
      <p className="text-mist text-xs">
        Your archetype is shaped by how deeply you read,
        how often you return, and what ideas stay with you.
      </p>
      <Link href="/" className="text-primary hover:text-accent transition-colors text-sm">
        &larr; Back to Articles
      </Link>
    </div>
  );
}

function GemOutline() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"
      viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"
      className="mx-auto text-mist/30 mb-8">
      <path d="M6 3h12l4 6-10 13L2 9z" />
      <path d="M12 3l4 6-4 13-4-13z" />
    </svg>
  );
}
