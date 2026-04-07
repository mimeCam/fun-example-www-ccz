/**
 * ReturnLetter — adaptive homepage greeting for returning readers.
 *
 * Three states:
 *   Stranger  → null (hero unchanged)
 *   Returning (3+ days, has archetype) → full letter card with animation
 *   Known / short absence → compact greeting line
 *
 * Client-only (reads localStorage). SSR-safe via dynamic import.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Letter, LetterContext } from '@/types/book-narration';
import type { ArchetypeKey } from '@/types/content';
import { useReturnRecognition } from '@/lib/hooks/useReturnRecognition';
import { getSeason } from '@/lib/mirror/season-engine';
import { composeLetter } from '@/lib/mirror/letter-engine';
import { generateLetterCard } from '@/lib/mirror/letter-card-generator';

// ─── Phase animation ─────────────────────────────────────

type Phase = 'approach' | 'settle' | 'rest';

function phaseStyles(phase: Phase, settled: boolean): string {
  if (phase === 'approach') {
    return 'opacity-0 translate-y-2';
  }
  if (phase === 'settle') {
    return `opacity-100 translate-y-0 transition-all duration-700 ease-out
            border-gold/20 shadow-gold`;
  }
  return `opacity-100 translate-y-0 ${settled ? 'border-gold/20 shadow-gold' : 'border-gold/10 shadow-none'}`;
}

// ─── Compact greeting (known readers, < 3 days) ──────────

const GREETINGS: Record<ArchetypeKey, string> = {
  'deep-diver': 'Still diving deep? See what\u2019s new beneath the surface.',
  'explorer': 'Still exploring? New trails await.',
  'faithful': 'Back again. The consistent ones find the deepest ideas.',
  'resonator': 'Something resonated before. There\u2019s more to echo.',
  'collector': 'Your library grows. New ideas await.',
};

function CompactGreeting({ archetype }: { archetype: ArchetypeKey }) {
  return (
    <p className="text-mist/60 text-base max-w-2xl mx-auto mt-2 font-display italic">
      {GREETINGS[archetype] ?? GREETINGS['explorer']}
    </p>
  );
}

// ─── Context builder ─────────────────────────────────────

const LABELS: Record<ArchetypeKey, string> = {
  'deep-diver': 'Deep Diver',
  'explorer': 'Explorer',
  'faithful': 'Faithful Reader',
  'resonator': 'Resonator',
  'collector': 'Collector',
};

function readResonanceCount(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem('resonances');
    return raw ? JSON.parse(raw).length : 0;
  } catch { return 0; }
}

function readRecentTopics(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('reading_memory');
    return raw ? Object.keys(JSON.parse(raw)).slice(0, 5) : [];
  } catch { return []; }
}

function readEvolution(archetype: ArchetypeKey): {
  hasEvolution: boolean;
  trajectory?: 'rising' | 'stable' | 'declining';
  previous?: ArchetypeKey;
} {
  if (typeof window === 'undefined') return { hasEvolution: false };
  try {
    const raw = localStorage.getItem('mirror_snapshots');
    const snaps = raw ? JSON.parse(raw) : [];
    if (snaps.length < 2) return { hasEvolution: false };
    const prev = snaps[0].archetype as ArchetypeKey;
    const hasEvolution = prev !== archetype;
    return {
      hasEvolution,
      previous: prev,
      trajectory: hasEvolution ? 'rising' : 'stable',
    };
  } catch { return { hasEvolution: false }; }
}

function buildContext(rec: ReturnType<typeof useReturnRecognition>): LetterContext | null {
  if (!rec.archetype || rec.daysSinceLastVisit === null) return null;
  const evo = readEvolution(rec.archetype);
  return {
    archetype: rec.archetype,
    archetypeLabel: LABELS[rec.archetype],
    daysSinceLastVisit: rec.daysSinceLastVisit,
    visitCount: rec.visitCount,
    season: getSeason(new Date()),
    resonanceCount: readResonanceCount(),
    recentTopics: readRecentTopics(),
    ...evo,
  };
}

// ─── Letter dismissal ────────────────────────────────────

function isDismissed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const ts = localStorage.getItem('letter-dismissed-at');
    if (!ts) return false;
    // Dismiss lasts 7 days — next qualifying return (3+ days) after that shows a fresh letter
    return Date.now() - parseInt(ts, 10) < 7 * 86400000;
  } catch { return false; }
}

function persistDismiss(): void {
  try { localStorage.setItem('letter-dismissed-at', String(Date.now())); } catch { /* noop */ }
}

// ─── Letter Card ─────────────────────────────────────────

function LetterCard({
  letter, phase, settled, onDismiss,
}: {
  letter: Letter;
  phase: Phase;
  settled: boolean;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const text = [letter.salutation, '', letter.opening, ...letter.body, '', letter.closing, '', letter.signOff].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => { /* noop */ });
  }, [letter]);

  const handleImage = useCallback(() => {
    const url = generateLetterCard(letter);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'return-letter.png';
    a.click();
  }, [letter]);

  const visible = phase === 'rest';
  const dividerScale = phase === 'approach' ? 'scaleX(0)' : 'scaleX(1)';

  return (
    <div className={`relative max-w-lg mx-auto my-12 p-8 md:p-10
      bg-gradient-to-b from-[#16213e] to-[#1a1a2e]
      rounded-2xl border transition-all duration-700
      ${phaseStyles(phase, settled)}`}>
      {/* Dismiss */}
      {visible && (
        <button onClick={onDismiss}
          className="absolute top-3 right-3 text-mist/40 hover:text-mist/70 transition-opacity text-lg leading-none"
          aria-label="Dismiss">&times;</button>
      )}
      {/* Label */}
      <p className="text-xs uppercase tracking-widest text-gold/60 text-center">
        Based on how you read&hellip;
      </p>
      {/* Salutation */}
      <p className="text-gold text-lg font-display font-semibold mt-4 text-center">
        {letter.salutation}
      </p>
      {/* Opening */}
      <p className="text-[#f0f0f5]/90 text-base leading-[1.9] mt-4 text-center">
        {letter.opening}
      </p>
      {/* Body */}
      {letter.body.map((para, i) => (
        <p key={i} className="text-[#f0f0f5]/90 text-base leading-[1.9] mt-4 text-center">
          {para}
        </p>
      ))}
      {/* Divider */}
      <div className="my-6 flex justify-center">
        <div className={`h-px max-w-[120px] bg-gold/30 transition-transform duration-500 ${dividerScale}`} />
      </div>
      {/* Closing */}
      <p className="text-[#f0f0f5]/80 text-base italic text-center">{letter.closing}</p>
      {/* Sign-off */}
      <p className="text-mist text-sm italic text-center mt-3">{letter.signOff}</p>
      {/* Actions */}
      {visible && (
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={handleCopy}
            className="px-5 py-2 rounded-lg border border-gold/40 text-gold text-sm hover:bg-gold/10 transition-colors">
            {copied ? 'Copied!' : 'Copy & Share'}
          </button>
          <button onClick={handleImage}
            className="px-5 py-2 rounded-lg text-mist text-sm hover:text-[#f0f0f5]/80 transition-colors">
            Save as Image
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────

export function ReturnLetter() {
  const rec = useReturnRecognition();
  const [phase, setPhase] = useState<Phase>('approach');
  const [settled, setSettled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Build letter context + compose
  const showLetter = rec.isReturning && rec.archetype !== null
    && rec.daysSinceLastVisit !== null && rec.daysSinceLastVisit >= 3
    && !dismissed && !isDismissed();

  const showCompact = rec.isReturning && rec.archetype !== null
    && !showLetter;

  const letterCtx = showLetter ? buildContext(rec) : null;
  const letter = letterCtx ? composeLetter(letterCtx) : null;

  // Animation timeline (approach → settle → rest)
  useEffect(() => {
    if (!showLetter || !letter) return;
    const t1 = setTimeout(() => setPhase('settle'), 50);
    const t2 = setTimeout(() => { setPhase('rest'); setSettled(true); }, 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [showLetter, letter]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    persistDismiss();
  }, []);

  // Stranger → show nothing
  if (!showLetter && !showCompact) return null;

  // Compact greeting for known readers with short absence
  if (showCompact && rec.archetype) {
    return <CompactGreeting archetype={rec.archetype} />;
  }

  // Full letter card
  if (!letter) return null;
  return (
    <LetterCard
      letter={letter}
      phase={phase}
      settled={settled}
      onDismiss={handleDismiss}
    />
  );
}
