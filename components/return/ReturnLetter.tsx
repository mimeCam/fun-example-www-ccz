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
import { Pressable } from '@/components/shared/Pressable';
import { MOTION, MOTION_REDUCED_MS } from '@/lib/design/motion';

// ─── Timing — sourced from motion tokens ───────────────────

/** Seed delay so approach → settle fires one frame after mount. */
const RETURN_LETTER_SEED_MS = MOTION_REDUCED_MS * 5; // 50ms
/** Settle dwell — `linger` beat plus one `hover` breath. */
const RETURN_LETTER_SETTLE_MS = MOTION.linger + MOTION.hover; // 1200ms
/** Copy toast dwell — two `linger` beats, long enough to read. */
const COPY_TOAST_MS = MOTION.linger * 2; // 2000ms

// ─── Phase animation ─────────────────────────────────────

type Phase = 'approach' | 'settle' | 'rest';

function phaseStyles(phase: Phase, settled: boolean): string {
  if (phase === 'approach') {
    return 'opacity-0 translate-y-enter-sm'; // alpha-ledger:exempt — motion fade endpoint
  }
  if (phase === 'settle') {
    // Tanya §2.1: bloom halo arrives with the copy — flat warmth, not lift.
    // alpha-ledger:exempt — motion fade endpoint (transition target at full presence)
    return `opacity-100 translate-y-0 transition-all duration-reveal ease-out
            border-accent/20 shadow-sys-bloom`;
  }
  // At rest: settled letters keep the bloom (warmth stays); un-settled
  // drop to `sys-rest` (the letter keeps its seat; the warmth leaves).
  return `opacity-100 translate-y-0 ${settled ? 'border-accent/20 shadow-sys-bloom' : 'border-accent/10 shadow-sys-rest'}`; // alpha-ledger:exempt — motion fade endpoint
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
    <p className="text-mist/60 text-sys-md max-w-prose-ch mx-auto mt-sys-2 font-display italic">
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
      setTimeout(() => setCopied(false), COPY_TOAST_MS);
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
    <div className={`relative max-w-[32rem] mx-auto my-sys-10 p-sys-8 md:p-sys-9
      max-h-[40vh] overflow-y-auto
      bg-gradient-to-b from-surface to-background
      rounded-sys-medium thermal-radius border transition-all duration-reveal
      ${phaseStyles(phase, settled)}`}>
      {/* Dismiss — typography-ledger:exempt — icon glyph (&times;), no reading
          rhythm; leading-none collapses the line-box around a single char. */}
      {visible && (
        <Pressable
          variant="icon"
          size="sm"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="absolute top-sys-4 right-sys-4 text-sys-lg leading-none"
        >
          &times;
        </Pressable>
      )}
      {/* Label */}
      <p className="text-sys-micro uppercase tracking-sys-caption text-accent/60 text-center">
        Because you came back&hellip;
      </p>
      {/* Salutation */}
      <p className="text-accent text-sys-lg font-display font-sys-heading mt-sys-5 text-center">
        {letter.salutation}
      </p>
      {/* Opening */}
      <p className="text-foreground/90 text-sys-md thermal-typography mt-sys-5 text-center">
        {letter.opening}
      </p>
      {/* Body */}
      {letter.body.map((para, i) => (
        <p key={i} className="text-foreground/90 text-sys-md thermal-typography mt-sys-5 text-center">
          {para}
        </p>
      ))}
      {/* Divider */}
      <div className="my-sys-7 flex justify-center">
        <div className={`h-px max-w-divider bg-accent/20 transition-transform duration-fade ${dividerScale}`} />
      </div>
      {/* Closing */}
      <p className="text-foreground/80 text-sys-md italic text-center">{letter.closing}</p>
      {/* Sign-off */}
      <p className="text-mist text-sys-caption italic text-center mt-sys-4">{letter.signOff}</p>
      {/* Actions */}
      {visible && (
        <div className="mt-sys-7 flex justify-center gap-sys-4">
          <Pressable variant="ghost" size="md" onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy & Share'}
          </Pressable>
          <Pressable variant="ghost" size="md" onClick={handleImage}>
            Save as Image
          </Pressable>
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
  // Seed a frame later than reduced-motion floor, settle on `linger + hover`.
  useEffect(() => {
    if (!showLetter || !letter) return;
    const t1 = setTimeout(() => setPhase('settle'), RETURN_LETTER_SEED_MS);
    const t2 = setTimeout(() => { setPhase('rest'); setSettled(true); }, RETURN_LETTER_SETTLE_MS);
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
