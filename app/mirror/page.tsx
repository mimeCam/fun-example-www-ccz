/**
 * Mirror Page — Your full reflection.
 *
 * Three states: full mirror data, quick-mirror only, no data (empty state).
 * Enriched with reading identity stats and archetype description
 * to make /mirror a destination, not just a card viewer.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMirror } from '@/lib/hooks/useMirror';
import { GemHome } from '@/components/navigation/GemHome';
import MirrorRevealCard from '@/components/mirror/MirrorRevealCard';
import ShareOverlay from '@/components/mirror/ShareOverlay';
import WhisperFooter from '@/components/shared/WhisperFooter';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
import type { ArchetypeKey } from '@/types/content';

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
    const parsed = JSON.parse(raw);
    return parsed?.detectedAt ?? null;
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
      <div className="max-w-2xl mx-auto pt-8">
        {mirror ? <MirrorRevealCard mirror={mirror} /> : null}
        {quickMirror && !mirror ? (
          <QuickMirrorCardInline result={quickMirror} />
        ) : null}
        <IdentityStats
          articlesRead={articlesRead}
          firstDetected={firstDetected}
          confidence={data === quickMirror ? quickMirror.confidence : undefined}
        />
        <ArchetypeDescription archetype={(data.archetype as ArchetypeKey)} />
        <BrowseArticlesLink />
        <WhisperFooter />
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <GemHome />
      <div className="mirror-pulse w-80 h-96 rounded-3xl bg-gradient-to-b from-primary/20 to-secondary/10 border border-primary/20" />
    </div>
  );

  return (
    <div className="min-h-screen p-8">
      <GemHome />
      <div className="max-w-md mx-auto pt-20 text-center">
        <GemOutline />
        <h1 className="text-2xl font-display font-bold text-white mb-3">
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

/* ─── Sub-components (each ≤ 10 lines) ──────────────────── */

function QuickMirrorCardInline({ result }: { result: QuickMirrorResult }) {
  return (
    <div className="bg-surface border border-fog/40 rounded-2xl p-8 shadow-gold max-w-md mx-auto">
      <p className="text-xs uppercase tracking-widest text-mist mb-3">
        Based on how you read…
      </p>
      <h1 className="text-3xl font-display font-bold text-gold">
        {result.archetypeLabel}
      </h1>
      <p className="mt-4 text-sm text-white/80 italic leading-relaxed max-w-[320px] mx-auto">
        &ldquo;{result.whisper}&rdquo;
      </p>
      <div className="my-6 h-px max-w-[200px] mx-auto bg-gold/40" />
      <ShareOverlay result={result} />
    </div>
  );
}

function IdentityStats({ articlesRead, firstDetected, confidence }: {
  articlesRead: number; firstDetected: string | null; confidence?: number;
}) {
  return (
    <div className="mt-10 pt-6 border-t border-fog/30 text-center">
      <h3 className="text-xs uppercase tracking-widest text-mist/60 mb-4">
        Your Reading Identity
      </h3>
      <div className="flex justify-center gap-8 text-sm text-mist">
        <Stat label="Articles read" value={String(articlesRead)} />
        {firstDetected && <Stat label="First detected" value={formatDate(firstDetected)} />}
        {confidence != null && <Stat label="Confidence" value={`${confidence}%`} />}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white font-medium">{value}</div>
      <div className="text-xs text-mist/50 mt-0.5">{label}</div>
    </div>
  );
}

function ArchetypeDescription({ archetype }: { archetype: ArchetypeKey }) {
  const desc = ARCHETYPE_DESCRIPTIONS[archetype];
  if (!desc) return null;
  return (
    <div className="mt-8 text-center">
      <h3 className="text-xs uppercase tracking-widest text-mist/60 mb-3">
        What This Means
      </h3>
      <p className="text-sm text-mist leading-relaxed max-w-md mx-auto">{desc}</p>
    </div>
  );
}

function BrowseArticlesLink() {
  return (
    <div className="mt-8 text-center">
      <Link href="/articles"
        className="text-primary hover:text-secondary text-sm transition-colors">
        Browse Articles →
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

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return iso; }
}

/* ─── Archetype descriptions ─────────────────────────────── */

const ARCHETYPE_DESCRIPTIONS: Record<ArchetypeKey, string> = {
  'deep-diver': 'Deep Divers read slowly and re-read passages that resonate. You value depth over breadth — one article, fully absorbed, beats ten skimmed. Your archetype emerges from sustained attention and a willingness to sit with complexity.',
  'explorer': 'Explorers range freely across topics and never met a subject they didn\'t want to sample. Your curiosity is boundless and your reading patterns reveal a mind that connects dots across disciplines.',
  'faithful': 'The Faithful reader shows up consistently, building a quiet library of understanding over time. Your steady engagement is your superpower — depth grows from repeated visits and patient attention.',
  'resonator': 'Resonators don\'t just read — they feel. You save passages, mark moments, and carry ideas with you. Your reading is an emotional experience, and the words that stay with you shape your inner world.',
  'collector': 'Collectors have an appetite for ideas that borders on insatiable. You browse widely, sample often, and build a personal library of concepts that you\'ll connect when the moment is right.',
};
