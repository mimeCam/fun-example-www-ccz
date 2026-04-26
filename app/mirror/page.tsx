/**
 * Mirror Page — Your full reflection.
 *
 * Two states: has data (full mirror or quick-mirror), empty (no archetype yet).
 * The card IS the page — no separate stats/description sections.
 * Metadata collapsed into a single whisper line below the card.
 */

'use client';

import { useState, useEffect } from 'react';
import { useMirror } from '@/lib/hooks/useMirror';
import { GemHome } from '@/components/navigation/GemHome';
import MirrorRevealCard from '@/components/mirror/MirrorRevealCard';
import MirrorLoadingSurface from '@/components/mirror/MirrorLoadingSurface';
import WhisperFooter from '@/components/shared/WhisperFooter';
import { EmptySurface } from '@/components/shared/EmptySurface';
import { CaptionMetric } from '@/components/shared/CaptionMetric';
import { emptyPhrase } from '@/lib/sharing/empty-phrase';
import { formatReaderShortDate } from '@/lib/utils/reader-locale';
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
    <div id="main-content" className="min-h-screen p-sys-8">
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
    <div id="main-content" className="min-h-screen p-sys-8">
      <GemHome />
      {/* Loading surface — routed through <Skeleton variant="card"> with
          geometry pinned to MirrorRevealCard (max-w-md, ceremony posture
          via thermalRadiusClassByPosture, p-sys-8). Cadence flows through
          `.sys-skeleton` (MOTION.linger); reduced-motion floor lands at
          ALPHA.muted (Tanya UX #47 §3.1). No archetype pre-promise:
          surface is `bg-surface`, no border, no shadow, no gradient —
          the reveal earns those when it arrives. */}
      <div className="flex flex-col items-center justify-center min-h-[85vh]">
        <MirrorLoadingSurface />
      </div>
    </div>
  );

  return <EmptyMirror />;
}

/** Empty branch — no archetype yet. Delegates frame + voice to EmptySurface. */
function EmptyMirror() {
  const { headline, whisper } = emptyPhrase('empty-mirror');
  return (
    <EmptySurface
      kind="empty-mirror"
      headline={headline}
      whisper={whisper}
      primary={{ kind: 'link', href: '/articles', label: 'Browse Articles →' }}
      secondary={{ href: '/', label: 'Take the Quick Mirror' }}
      tint="gold"
    />
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

/**
 * Single whisper line: "5 articles · since Apr 4" (en-US) /
 * "5 articles · since 4 Apr" (en-GB).
 *
 * The MetaLine is pinned to `formatReaderShortDate` forever (Tanya
 * UIX #2 §3.2 Finding 1): the whisper line resists the urge to grow
 * a year. "since 4 Apr" reads warm; "since April 4, 2026" reads
 * bureaucratic — and would lengthen the line past the card's
 * centerline, breaking the visual rhyme of card + caption. One
 * metric, one date, one whisper line.
 *
 * Wears the standard caption-metric face via `<CaptionMetric>` — the
 * `quiet` rung, `tracking-sys-caption`, `tabular-nums` (digits do not
 * waltz when the count rolls 9 → 10). Tanya UX §3.1 — *stillness is
 * the feature*.
 */
function MetaLine({ articlesRead, firstDetected }: {
  articlesRead: number; firstDetected: string | null;
}) {
  if (!articlesRead) return null;
  const parts = [`${articlesRead} article${articlesRead !== 1 ? 's' : ''}`];
  const since = firstDetected ? formatReaderShortDate(firstDetected) : '';
  if (since) parts.push(`since ${since}`);
  return (
    <CaptionMetric className="text-center mt-sys-8">
      {parts.join(' · ')}
    </CaptionMetric>
  );
}
