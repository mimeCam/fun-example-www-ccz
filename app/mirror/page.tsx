/**
 * Mirror Page — Your full reflection.
 *
 * Two states: has data (full mirror or quick-mirror), empty (no archetype yet).
 * The card IS the page — no separate stats/description sections.
 * Metadata collapsed into a single whisper line below the card.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMirror } from '@/lib/hooks/useMirror';
import { GemHome } from '@/components/navigation/GemHome';
import MirrorRevealCard from '@/components/mirror/MirrorRevealCard';
import WhisperFooter from '@/components/shared/WhisperFooter';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
import type { ReaderMirror } from '@/types/mirror';

const QUICK_MIRROR_KEY = 'quick-mirror-result';

function loadQuickMirror(): QuickMirrorResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(QUICK_MIRROR_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadReadingMemoryCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem('reading_memory');
    return raw ? Object.keys(JSON.parse(raw)).length : 0;
  } catch { return 0; }
}

function loadFirstDetectedDate(): string | null {
  try {
    const raw = localStorage.getItem('quick-mirror-result');
    if (!raw) return null;
    return JSON.parse(raw)?.detectedAt ?? null;
  } catch { return null; }
}

export default function MirrorPage() {
  const { mirror, loading } = useMirror();
  const [quickMirror, setQuickMirror] = useState<QuickMirrorResult | null>(null);
  const [mounted, setMounted] = useState(false);
  const [articlesRead, setArticlesRead] = useState(0);
  const [firstDetected, setFirstDetected] = useState<string | null>(null);

  useEffect(() => {
    setQuickMirror(loadQuickMirror());
    setArticlesRead(loadReadingMemoryCount());
    setFirstDetected(loadFirstDetectedDate());
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const data = mirror ?? quickMirror;
  if (data) return (
    <div className="min-h-screen p-8">
      <GemHome />
      <div className="flex flex-col items-center justify-center min-h-[85vh]">
        {mirror
          ? <MirrorRevealCard mirror={mirror} />
          : <QuickMirrorAsReveal result={quickMirror!} />}
        <MetaLine
          articlesRead={articlesRead}
          firstDetected={firstDetected}
        />
      </div>
      <WhisperFooter />
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <GemHome />
      <div className="animate-mirror-pulse w-80 h-96 rounded-lg bg-gradient-to-b from-primary/20 to-secondary/10 border border-primary/20" />
    </div>
  );

  return (
    <div className="min-h-screen p-8">
      <GemHome />
      <div className="max-w-md mx-auto pt-20 text-center">
        <GemOutline />
        <h1 className="text-2xl font-display font-bold text-foreground mb-3">
          Your reflection hasn&apos;t formed yet.
        </h1>
        <p className="text-mist text-sm mb-8 max-w-sm mx-auto leading-relaxed">
          Read an article to the end and the Mirror will find you.
        </p>
        <Link href="/articles"
          className="inline-block px-6 py-3 border border-gold/40 text-gold hover:bg-gold/10 font-semibold rounded-lg transition-colors">
          Browse Articles →
        </Link>
      </div>
    </div>
  );
}

/* ─── Sub-components (each ≤ 10 lines) ──────────────────── */

/** Quick-mirror result rendered in the same card style as MirrorRevealCard. */
function QuickMirrorAsReveal({ result }: { result: QuickMirrorResult }) {
  const fakeMirror: ReaderMirror = {
    archetype: result.archetype,
    archetypeLabel: result.archetypeLabel,
    whisper: result.whisper,
    topicDNA: [],
    scores: result.scores ?? { depth: 80, breadth: 60, consistency: 70 },
    resonanceThemes: [],
  };
  return <MirrorRevealCard mirror={fakeMirror} />;
}

/** Single whisper line: "5 articles · detected Apr 4" */
function MetaLine({ articlesRead, firstDetected }: {
  articlesRead: number; firstDetected: string | null;
}) {
  if (!articlesRead) return null;
  const parts = [`${articlesRead} article${articlesRead !== 1 ? 's' : ''}`];
  if (firstDetected) parts.push(`since ${formatDate(firstDetected)}`);
  return (
    <p className="text-xs text-mist/40 text-center mt-8">
      {parts.join(' · ')}
    </p>
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return iso; }
}
