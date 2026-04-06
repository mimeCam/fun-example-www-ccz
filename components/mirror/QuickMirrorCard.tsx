'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { QuickMirrorResult } from '@/lib/mirror/quick-synthesize';
import { generateQuickMirrorCard } from '@/lib/mirror/quick-mirror-card-generator';

// ── Phase timing (ms) ──
const T_EMERGE  = 0;
const T_SHIMMER = 600;
const T_REVEAL  = 1800;
const T_REST    = 3500;

type Phase = 'hidden' | 'emergence' | 'shimmer' | 'reveal' | 'rest';

interface Props {
  result: QuickMirrorResult;
  articleUrl?: string;
}

/* ─── Component ─────────────────────────────────────────── */

export default function QuickMirrorCard({ result, articleUrl }: Props) {
  const [phase, setPhase]     = useState<Phase>('hidden');
  const [copied, setCopied]   = useState(false);
  const cardRef               = useRef<HTMLDivElement>(null);

  // Drive the 4-phase animation sequence
  useEffect(() => {
    const ids = [
      setTimeout(() => setPhase('emergence'), T_EMERGE),
      setTimeout(() => setPhase('shimmer'),   T_SHIMMER),
      setTimeout(() => setPhase('reveal'),    T_REVEAL),
      setTimeout(() => setPhase('rest'),      T_REST),
    ];
    return () => ids.forEach(clearTimeout);
  }, []);

  // Scroll the card into view during shimmer so the reader sees the reveal
  useEffect(() => {
    if (phase === 'shimmer')
      cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [phase]);

  const handleCopy = useCopyShareText(result.archetypeLabel, articleUrl, setCopied);
  const handleSaveImage = useCallback(() => {
    const dataUrl = generateQuickMirrorCard(result);
    const a = document.createElement('a');
    a.download = `reading-identity-${result.archetype}.png`;
    a.href = dataUrl;
    a.click();
  }, [result]);
  const showContent = phase === 'reveal' || phase === 'rest';
  const showActions = phase === 'rest';

  return (
    <div ref={cardRef} className={`${cardBase()} ${phaseClass(phase)}`}>
      {/* Label */}
      <p
        className={contentFade(showContent)}
        style={{ transitionDelay: phase === 'reveal' ? '0ms' : undefined }}
      >
        Based on how you read…
      </p>

      {/* Archetype name */}
      <h2
        className={`mt-3 text-3xl font-display font-bold text-white ${contentFade(showContent)}`}
        style={{ transitionDelay: phase === 'reveal' ? '200ms' : undefined }}
      >
        {result.archetypeLabel}
      </h2>

      {/* Whisper quote */}
      <p
        className={`mt-3 text-sm text-[#f0f0f5]/80 italic max-w-[320px] mx-auto leading-relaxed ${contentFade(showContent)}`}
        style={{ transitionDelay: phase === 'reveal' ? '400ms' : undefined }}
      >
        &ldquo;{result.whisper}&rdquo;
      </p>

      {/* Gold divider */}
      <div
        className={`my-6 h-px max-w-[200px] mx-auto bg-[#f0c674]/40 transition-transform duration-500 ${showContent ? 'scale-x-100' : 'scale-x-0'}`}
        style={{ transitionDelay: phase === 'reveal' ? '600ms' : undefined }}
      />

      {/* Share actions */}
      <div
        className={`flex flex-col items-center gap-2 ${contentFade(showActions)}`}
        style={{ transitionDelay: phase === 'reveal' ? '800ms' : undefined }}
      >
        <button onClick={handleCopy} className={shareBtnClass(copied)}>
          {copied ? '✓ Copied!' : 'Copy & Share →'}
        </button>
        <button onClick={handleSaveImage} className="px-6 py-2 rounded-lg text-mist hover:text-[#f0f0f5]/80 text-sm transition-colors duration-200">
          Save as Image
        </button>
      </div>
    </div>
  );
}

/* ─── Style helpers (pure, 1–5 lines each) ──────────────── */

function cardBase(): string {
  return [
    'my-20 mx-auto max-w-[400px] p-8 text-center',
    'rounded-3xl border',
    'bg-gradient-to-b from-[#16213e] to-[#1a1a2e]',
    'transition-all duration-700 ease-out',
  ].join(' ');
}

function phaseClass(p: Phase): string {
  const map: Record<Phase, string> = {
    hidden:    'opacity-0 translate-y-4 border-transparent',
    emergence: 'opacity-100 translate-y-0 border-[rgba(240,198,116,0.15)]',
    shimmer:   'opacity-100 translate-y-0 border-[rgba(240,198,116,0.25)] quick-mirror-glow',
    reveal:    'opacity-100 translate-y-0 border-[rgba(240,198,116,0.25)] shadow-gold',
    rest:      'opacity-100 translate-y-0 border-[rgba(240,198,116,0.2)] shadow-gold',
  };
  return map[p];
}

function contentFade(visible: boolean): string {
  const base = 'text-xs uppercase tracking-widest text-mist transition-all duration-500';
  return visible ? `${base} opacity-100 translate-y-0` : `${base} opacity-0 translate-y-2`;
}

function shareBtnClass(copied: boolean): string {
  const base = 'px-6 py-2 rounded-lg border text-sm transition-all duration-200';
  if (copied) return `${base} border-[rgba(240,198,116,0.4)] bg-[rgba(240,198,116,0.1)] text-[#f0c674]`;
  return `${base} border-[rgba(240,198,116,0.4)] bg-transparent text-[#f0c674] hover:bg-[rgba(240,198,116,0.08)]`;
}

/* ─── Clipboard hook ────────────────────────────────────── */

function shareText(label: string, url?: string): string {
  const base = `I'm ${label}. What's your reading identity?`;
  return url ? `${base}\nFind out → ${url}` : base;
}

function useCopyShareText(
  label: string,
  url: string | undefined,
  setCopied: (v: boolean) => void,
) {
  return useCallback(async () => {
    await navigator.clipboard.writeText(shareText(label, url));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [label, url, setCopied]);
}
